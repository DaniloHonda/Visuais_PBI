"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import { OrgSettings } from "./settings";
import { xpFont } from "./xpTheme";

interface Target { table: string; column: string; }

// Uma linha do dataView = um caminho completo do organograma (N2, N3, N4…).
interface Row { raws: PrimitiveValue[]; count: number; }

interface OrgNode {
    key: string;
    level: number;              // 0 = primeiro nível (N2)
    raw: PrimitiveValue;
    label: string;
    email: string;
    parent: OrgNode | null;
    children: OrgNode[];
    rows: number[];             // todas as linhas da subárvore
    count: number;
}

// Identificadores fixos dos formatos de filtro do Power BI (não são endereços acessados).
const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";
const SCHEMA_TUPLE = "ht" + "tp://powerbi.com/product/schema#tuple";
const ROW_H = 30;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private box: HTMLElement;
    private drop: HTMLElement;
    private input: HTMLInputElement;
    private actions: HTMLElement;
    private list: HTMLElement;
    private footer: HTMLElement;
    private settings: OrgSettings;
    private formattingSettingsService: FormattingSettingsService;

    private targets: Target[] = [];
    private rows: Row[] = [];
    private roots: OrgNode[] = [];
    private nodes: OrgNode[] = [];
    private selected = new Set<number>();
    private expanded = new Set<string>();
    private query = "";
    private open = false;
    private title = "";
    private fmt = new Intl.NumberFormat("pt-BR");

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("div", "xp-org");
        this.box = el("div", "xp-box");
        this.box.tabIndex = 0;
        this.box.setAttribute("role", "button");
        this.box.addEventListener("click", () => this.setOpen(!this.open));
        this.box.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); this.setOpen(true); }
            if (e.key === "Escape") this.setOpen(false);
        });
        this.drop = el("div", "xp-org__drop");
        this.drop.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Escape") { this.setOpen(false); this.box.focus(); } });
        this.input = document.createElement("input");
        this.input.type = "search";
        this.input.className = "xp-org__search";
        this.input.setAttribute("aria-label", "Buscar");
        this.input.addEventListener("input", () => { this.query = this.input.value; this.renderList(); });
        this.input.addEventListener("keydown", (e: KeyboardEvent) => e.stopPropagation());
        this.actions = el("div", "xp-org__actions");
        this.list = el("div", "xp-org__list");
        this.list.setAttribute("role", "tree");
        this.footer = el("div", "xp-org__footer");
        this.drop.append(this.input, this.actions, this.list, this.footer);
        this.root.append(this.box, this.drop);
        // Fecha ao clicar fora: na área transparente do visual ou em qualquer outro lugar do relatório.
        this.root.addEventListener("mousedown", (e: MouseEvent) => { if (this.open && e.target === this.root) this.setOpen(false); });
        window.addEventListener("blur", () => this.setOpen(false));
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(OrgSettings, dataView);
            this.fmt = new Intl.NumberFormat(this.host.locale || "pt-BR");
            this.read(dataView);
            this.restore(options.jsonFilters);
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    // ---------- dados ----------

    private read(dataView: DataView | undefined) {
        this.targets = [];
        this.rows = [];
        this.roots = [];
        this.nodes = [];
        const s = this.settings;
        this.title = (s.cabecalho.titulo.value || "").trim() || "Organograma";
        const cat = dataView && dataView.categorical;
        const cols = (cat && cat.categories) || [];
        if (!cols.length) return;
        this.targets = cols.map(c => toTarget(c.source.queryName || "", c.source.displayName));
        const counts = cat.values && cat.values[0];
        const n = cols[0].values.length;
        for (let i = 0; i < n; i++) {
            const c = counts ? counts.values[i] : null;
            this.rows.push({ raws: cols.map(col => col.values[i]), count: typeof c === "number" && isFinite(c) ? c : 0 });
        }

        // Árvore: o caminho de cada linha vai até o primeiro nível vazio ("-" ou em branco).
        const byKey = new Map<string, OrgNode>();
        const nomeDoEmail = s.comportamento.nomeDoEmail.value;
        this.rows.forEach((row, ri) => {
            let parent: OrgNode | null = null;
            let key = "";
            for (let lv = 0; lv < row.raws.length; lv++) {
                const raw = row.raws[lv];
                const empty = isEmpty(raw);
                if (empty && lv > 0) break;
                key += "\u0001" + (empty ? "\u0000" : String(raw));
                let node = byKey.get(key);
                if (!node) {
                    const text = empty ? "" : String(raw);
                    node = {
                        key, level: lv, raw, parent, children: [], rows: [], count: 0,
                        email: text.indexOf("@") >= 0 ? text : "",
                        label: empty ? "(Sem organograma)" : nomeDoEmail ? nameFromEmail(text) : text
                    };
                    byKey.set(key, node);
                    this.nodes.push(node);
                    if (parent) parent.children.push(node); else this.roots.push(node);
                }
                node.rows.push(ri);
                node.count += row.count;
                parent = node;
                if (empty) break;
            }
        });
        const alfa = String(s.comportamento.ordem.value.value) === "alfabetica";
        const locale = this.host.locale || "pt-BR";
        const sortNodes = (list: OrgNode[]) => {
            list.sort((a, b) => {
                const blank = (isEmpty(a.raw) ? 1 : 0) - (isEmpty(b.raw) ? 1 : 0);
                if (blank) return blank;
                return alfa ? a.label.localeCompare(b.label, locale) : b.count - a.count || a.label.localeCompare(b.label, locale);
            });
            list.forEach(x => sortNodes(x.children));
        };
        sortNodes(this.roots);
    }

    // Recupera a seleção salva (ou vinda de outra página sincronizada).
    private restore(filters: powerbi.IFilter[] | undefined) {
        this.selected.clear();
        const f = (filters || [])[0] as {
            filterType?: number; target?: Target | Target[]; values?: (PrimitiveValue | { value: PrimitiveValue }[])[];
        } | undefined;
        if (!f || !Array.isArray(f.values)) return;
        if (f.filterType === 6 && Array.isArray(f.target)) {
            const cols = f.target.map(t => this.targets.findIndex(x => x.table === t.table && x.column === t.column));
            const wanted = new Set(f.values.map(tuple => (tuple as { value: PrimitiveValue }[]).map((v, i) => cols[i] + "=" + keyOf(v.value)).join("|")));
            this.rows.forEach((r, ri) => {
                const k = cols.map(ci => ci + "=" + keyOf(ci >= 0 ? r.raws[ci] : null)).join("|");
                if (wanted.has(k)) this.selected.add(ri);
            });
        } else if (f.target && !Array.isArray(f.target)) {
            const t = f.target as Target;
            const lv = this.targets.findIndex(x => x.table === t.table && x.column === t.column);
            if (lv < 0) return;
            const wanted = new Set((f.values as PrimitiveValue[]).map(keyOf));
            this.rows.forEach((r, ri) => { if (wanted.has(keyOf(r.raws[lv]))) this.selected.add(ri); });
        }
        // Abre os ramos com seleção parcial, para a pessoa ver onde está marcado.
        for (const n of this.nodes) if (this.state(n) === "part") this.expanded.add(n.key);
    }

    // ---------- seleção e filtro ----------

    private state(n: OrgNode): "on" | "off" | "part" {
        let k = 0;
        for (const r of n.rows) if (this.selected.has(r)) k++;
        return k === 0 ? "off" : k === n.rows.length ? "on" : "part";
    }

    private toggle(n: OrgNode) {
        const on = this.state(n) === "on";
        for (const r of n.rows) { if (on) this.selected.delete(r); else this.selected.add(r); }
        this.applyFilter();
    }

    private clearAll() { this.selected.clear(); this.applyFilter(); }

    // Menor conjunto de nomes que descreve a seleção (um nome marcado já inclui tudo abaixo dele).
    private picked(): OrgNode[] {
        const out: OrgNode[] = [];
        const walk = (list: OrgNode[]) => {
            for (const n of list) {
                const st = this.state(n);
                if (st === "on") out.push(n);
                else if (st === "part") walk(n.children);
            }
        };
        walk(this.roots);
        return out;
    }

    private applyFilter() {
        const all = this.rows.length;
        if (!this.targets.length) return;
        if (this.selected.size === 0 || this.selected.size === all) {
            if (this.selected.size === all) this.selected.clear();
            this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
            this.render();
            return;
        }
        const picked = this.picked();
        const covered = picked.reduce((a, n) => a + n.rows.length, 0);
        const lv = picked.length ? picked[0].level : -1;
        const simple = covered === this.selected.size && picked.every(n => n.level === lv && !isEmpty(n.raw));
        let filter: object;
        if (simple) {
            // Caso comum: nomes do mesmo nível → filtro simples na coluna desse N.
            filter = { $schema: SCHEMA_BASIC, target: this.targets[lv], operator: "In", values: picked.map(n => n.raw), filterType: 1 };
        } else {
            // Níveis misturados → filtro por caminho completo (todas as colunas de N).
            const values = Array.from(this.selected).sort((a, b) => a - b).map(ri => this.rows[ri].raws.map(v => ({ value: v })));
            filter = { $schema: SCHEMA_TUPLE, target: this.targets, operator: "In", values, filterType: 6 };
        }
        this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        this.render();
    }

    // ---------- desenho ----------

    private setOpen(open: boolean) {
        if (open === this.open || (open && !this.nodes.length)) return;
        this.open = open;
        this.render();
        if (open) this.input.focus();
    }

    private levelName(lv: number): string {
        return "N" + (Math.round(this.settings.comportamento.primeiroNivel.value) + lv);
    }

    private render() {
        const s = this.settings;
        this.root.style.fontFamily = xpFont;
        this.root.style.setProperty("--xp-sl-accent", s.cores.destaque.value.value);
        this.root.style.setProperty("--xp-sl-border", s.cores.borda.value.value);
        this.root.style.setProperty("--xp-sl-bg", s.cores.fundo.value.value);
        this.box.style.height = Math.max(32, s.comportamento.alturaCaixa.value) + "px";
        this.box.classList.toggle("xp-box--open", this.open);
        this.box.setAttribute("aria-expanded", String(this.open));
        this.drop.style.display = this.open ? "" : "none";
        this.renderBox();
        if (this.open) this.renderList();
    }

    private renderBox() {
        const s = this.settings;
        clear(this.box);
        const picked = this.selected.size ? this.picked() : [];
        const on = picked.length > 0;
        this.box.classList.toggle("xp-box--on", on);
        if (s.cabecalho.mostrar.value) this.box.appendChild(el("span", "xp-box__label", this.title));
        const value = el("span", "xp-box__value");
        if (!this.nodes.length) value.appendChild(el("span", "xp-box__ph", "Arraste N2, N3, N4… para \"Níveis\""));
        else if (!on) value.appendChild(el("span", "xp-box__ph", s.cabecalho.vazio.value));
        else {
            const first = el("span", "xp-box__text", picked[0].label);
            first.title = picked.map(n => `${this.levelName(n.level)} ${n.label}`).join(", ");
            value.appendChild(first);
            if (picked.length > 1) value.appendChild(el("span", "xp-box__badge", `+${picked.length - 1}`));
        }
        this.box.appendChild(value);
        this.box.setAttribute("aria-label", `${this.title}: ${on ? picked.map(n => n.label).join(", ") : s.cabecalho.vazio.value}. Abrir seleção`);
        if (on) {
            const x = el("button", "xp-box__clear", "✕");
            x.title = "Limpar";
            x.setAttribute("aria-label", `Limpar ${this.title}`);
            x.addEventListener("click", e => { e.stopPropagation(); this.clearAll(); });
            this.box.appendChild(x);
        }
        this.box.appendChild(el("span", "xp-box__caret", this.open ? "▴" : "▾"));
    }

    private renderList() {
        clear(this.actions);
        clear(this.list);
        this.input.placeholder = "Buscar pessoa em qualquer N";
        const q = normalize(this.query);

        if (q) {
            const found = this.nodes.filter(n => normalize(n.label).indexOf(q) >= 0 || normalize(n.email).indexOf(q) >= 0);
            const all = el("button", "xp-org__link", `Selecionar os ${found.length} encontrados`);
            all.toggleAttribute("disabled", !found.length);
            all.addEventListener("click", () => { found.forEach(n => n.rows.forEach(r => this.selected.add(r))); this.applyFilter(); });
            this.actions.appendChild(all);
            this.actions.appendChild(this.clearLink());
            if (!found.length) this.list.appendChild(el("div", "xp-org__empty", `Nada encontrado para "${this.query}".`));
            found.slice(0, 300).forEach(n => this.list.appendChild(this.row(n, 0, q, true)));
        } else {
            const exp = el("button", "xp-org__link", this.expanded.size ? "Recolher tudo" : "Expandir tudo");
            exp.addEventListener("click", () => {
                if (this.expanded.size) this.expanded.clear();
                else this.nodes.forEach(n => { if (n.children.length) this.expanded.add(n.key); });
                this.renderList();
            });
            this.actions.appendChild(exp);
            this.actions.appendChild(this.clearLink());
            const walk = (list: OrgNode[], depth: number) => {
                for (const n of list) {
                    this.list.appendChild(this.row(n, depth, "", false));
                    if (this.expanded.has(n.key)) walk(n.children, depth + 1);
                }
            };
            walk(this.roots, 0);
        }

        const picked = this.selected.size ? this.picked() : [];
        this.footer.textContent = picked.length
            ? `${picked.length} selecionado${picked.length > 1 ? "s" : ""} · incluem tudo abaixo de${picked.length > 1 ? "les" : "le"}`
            : "Nenhum selecionado: mostra todos";
    }

    private clearLink(): HTMLElement {
        const clr = el("button", "xp-org__link xp-org__link--end", "Limpar");
        clr.toggleAttribute("disabled", this.selected.size === 0);
        clr.addEventListener("click", () => this.clearAll());
        return clr;
    }

    private row(n: OrgNode, depth: number, q: string, withPath: boolean): HTMLElement {
        const st = this.state(n);
        const it = el("div", "xp-org__item" + (st === "on" ? " xp-org__item--on" : ""));
        it.setAttribute("role", "treeitem");
        it.setAttribute("aria-checked", st === "part" ? "mixed" : String(st === "on"));
        it.style.paddingLeft = (4 + depth * 18) + "px";
        it.style.minHeight = ROW_H + "px";
        const arrow = el("button", "xp-org__arrow", n.children.length && !withPath ? (this.expanded.has(n.key) ? "▾" : "▸") : "");
        if (n.children.length && !withPath) {
            arrow.setAttribute("aria-label", this.expanded.has(n.key) ? "Recolher" : "Abrir");
            it.setAttribute("aria-expanded", String(this.expanded.has(n.key)));
            arrow.addEventListener("click", e => {
                e.stopPropagation();
                if (this.expanded.has(n.key)) this.expanded.delete(n.key); else this.expanded.add(n.key);
                this.renderList();
            });
        } else arrow.setAttribute("tabindex", "-1");
        it.appendChild(arrow);
        it.appendChild(el("span", "xp-org__check xp-org__check--" + st));
        it.appendChild(el("span", "xp-org__lv", this.levelName(n.level)));
        const label = el("span", "xp-org__label");
        highlight(label, n.label, q);
        if (withPath && n.parent) {
            const names: string[] = [];
            for (let p = n.parent; p; p = p.parent) names.unshift(p.label);
            const path = names.length > 2 ? "… › " + names.slice(-2).join(" › ") : names.join(" › ");
            label.appendChild(el("span", "xp-org__path", " · " + path));
        }
        label.title = n.email ? `${n.label} (${n.email})` : n.label;
        it.appendChild(label);
        it.appendChild(el("span", "xp-org__n", this.fmt.format(n.count)));
        it.addEventListener("click", () => this.toggle(n));
        return it;
    }
}

function isEmpty(v: PrimitiveValue): boolean {
    return v === null || v === undefined || (typeof v === "string" && (v.trim() === "" || v.trim() === "-"));
}

function keyOf(v: PrimitiveValue): string {
    if (v === null || v === undefined) return "null";
    if (v instanceof Date) return "d:" + v.getTime();
    return typeof v + ":" + String(v);
}

// "maria.silva-souza@xp.com.br" → "Maria Silva Souza"
export function nameFromEmail(text: string): string {
    const at = text.indexOf("@");
    if (at < 0) return text;
    const local = text.slice(0, at).replace(/[0-9]+$/, "");
    const words = local.split(/[._-]+/).filter(Boolean);
    if (!words.length) return text;
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// "Tabela.Coluna" → { table, column }. Nomes de tabela com ponto não são suportados.
function toTarget(queryName: string, displayName: string): Target {
    const i = queryName.indexOf(".");
    if (i < 0) return { table: queryName, column: displayName };
    return { table: queryName.slice(0, i), column: queryName.slice(i + 1) };
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }

// Destaca o trecho buscado, ignorando acentos, sem innerHTML.
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.appendChild(document.createTextNode(label)); return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
