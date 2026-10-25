"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import { TabelaSettings } from "./settings";
import { xpFont } from "./xpTheme";

// Tipos de célula vindos de "Esteira | Visão Dados": "@aaaa-mm-dd" = data, "#n" = número, resto = texto.
type Kind = "text" | "date" | "num";
interface Cell { raw: string; kind: Kind; sort: number | string | null; }
interface Row {
    index: number;
    key: string;
    link: string;
    nome: string;
    cells: Record<string, Cell>;
    seg: string;
    jornada: string;
    seguintes: string;
    alertas: string[];
    text: string;
    id: ISelectionId;
}
interface Col { key: string; title: string; kind: Kind; fixed: boolean; }
interface Ctx { visao: string; n: number | null; frase: string; origem: string; segs: string[]; ordem: string; }

const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const NAME_COL = "Candidato";

// Cor do selo por valor (resultado, situação, tipo…). Chave normalizada sem acento.
const PILL: Record<string, string> = {
    "aprovado": "ok", "aprovada": "ok", "em andamento": "now", "rejeitado": "bad", "rejeitada": "bad", "voltou": "back",
    "declinou": "dec", "declinio da offer": "dec", "contratada": "hired", "contratada via outra vaga": "out", "saiu para outra vaga": "out",
    "avaliacao": "bad", "desistencia do candidato": "dec", "administrativo": "off", "sem motivo na base": "off", "a classificar": "off",
    "direto": "ok", "via pool": "out", "dentro do pool": "bad", "ate 45 dias": "now", "parada ha mais de 45 dias": "bad"
};
const PILL_COLS = ["situação", "resultado na etapa", "tipo", "tipo de encerramento", "origem", "faixa"];

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private topEl: HTMLElement;
    private segEl: HTMLElement;
    private head: HTMLElement;
    private wrap: HTMLElement;
    private foot: HTMLElement;
    private menuEl: HTMLElement | null = null;
    private settings: TabelaSettings;
    private fmtService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: Row[] = [];
    private dynCols: Col[] = [];
    private fixedCols: Col[] = [];
    private hasLink = false;
    private hasDados = false;
    private ctx: Ctx = { visao: "", n: null, frase: "", origem: "", segs: [], ordem: "" };
    private lastVisao: string | null = null;
    private seg = "Todas";
    private soExcecoes = false;
    private sort: { key: string; desc: boolean } | null = null;
    private query = "";
    private shown = 0;
    private expanded = new Set<string>();
    private loading = false;
    private complete = true;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.fmtService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-t2");
        this.topEl = el("div", "xp-t2__top");
        this.segEl = el("div", "xp-t2__segs");
        this.head = el("div", "xp-t2__head");
        this.wrap = el("div", "xp-t2__wrap");
        this.foot = el("div", "xp-t2__foot");
        this.root.append(this.topEl, this.segEl, this.head, this.wrap, this.foot);
        options.element.appendChild(this.root);
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        this.root.addEventListener("mousedown", (e: MouseEvent) => {
            if (this.menuEl && !this.menuEl.contains(e.target as Node) && !(e.target as HTMLElement).closest(".xp-t2__colbtn")) this.closeMenu();
        });
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.fmtService.populateFormattingSettingsModel(TabelaSettings, dv);
            this.height = options.viewport.height;
            this.root.style.fontFamily = xpFont;
            this.read(dv);
            this.loading = false;
            this.complete = !(dv && dv.metadata && dv.metadata.segment);
            if (!this.complete && dv.table && dv.table.rows.length < this.settings.comportamento.maxLinhas.value) {
                this.loading = this.host.fetchMoreData(true);
            }
            this.shown = Math.max(this.shown, this.pageSize());
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.fmtService.buildFormattingModel(this.settings);
    }

    private pageSize(): number { return Math.max(10, this.settings.comportamento.linhasIniciais.value); }
    private step(): number { return Math.max(10, this.settings.comportamento.passo.value); }

    // ---------- leitura ----------
    private read(dv: DataView | undefined) {
        this.rows = [];
        this.fixedCols = [];
        this.dynCols = [];
        const table = dv && dv.table;
        if (!table) { this.hasLink = false; this.hasDados = false; return; }
        const idxOf = (role: string) => table.columns.findIndex(c => c.roles && c.roles[role]);
        const all = (role: string) => table.columns.map((c, i) => (c.roles && c.roles[role] ? i : -1)).filter(i => i >= 0);
        const iLink = idxOf("link"), iDados = idxOf("dados"), iJor = idxOf("jornada"), iSeg = idxOf("seguintes"), iAl = idxOf("alertas"), iCtx = idxOf("contexto");
        const nameIdx = all("candidato");
        const fixIdx = all("fixas");
        this.hasLink = iLink >= 0;
        this.hasDados = iDados >= 0;
        if (nameIdx.length) this.fixedCols.push({ key: NAME_COL, title: NAME_COL, kind: "text", fixed: true });
        fixIdx.forEach(i => this.fixedCols.push({ key: "f:" + clean(table.columns[i].displayName), title: clean(table.columns[i].displayName), kind: "text", fixed: true }));

        let ctx = "";
        if (iCtx >= 0) for (const r of table.rows) { const t = asText(r[iCtx]); if (t) { ctx = t; break; } }
        this.readContext(ctx);

        const dynOrder: string[] = [];
        const dynKind: Record<string, Kind> = {};
        table.rows.forEach((r, i) => {
            const packed = iDados >= 0 ? asText(r[iDados]) : "";
            if (iDados >= 0 && !packed) return; // fora da lista da visão
            const cells: Record<string, Cell> = {};
            let seg = "";
            for (const part of packed.split("||")) {
                const p = part.indexOf("=");
                if (p <= 0) continue;
                const k = part.slice(0, p).trim();
                const v = part.slice(p + 1).trim();
                if (k === "seg") { seg = v; continue; }
                const c = toCell(v);
                cells[k] = c;
                if (dynOrder.indexOf(k) < 0) dynOrder.push(k);
                if (c.raw && (!dynKind[k] || dynKind[k] === "text")) dynKind[k] = c.kind;
            }
            const nome = nameIdx.map(j => asText(r[j])).filter(Boolean).join(" ");
            cells[NAME_COL] = { raw: nome, kind: "text", sort: normalize(nome) };
            fixIdx.forEach(j => {
                const t = fmtPrimitive(r[j]);
                cells["f:" + clean(table.columns[j].displayName)] = { raw: t, kind: "text", sort: normalize(t) };
            });
            const link = iLink >= 0 ? asText(r[iLink]) : "";
            const alertas = (iAl >= 0 ? asText(r[iAl]) : "").split(" · ").map(x => x.trim()).filter(Boolean);
            const text = [nome, link, ...Object.keys(cells).map(k => cells[k].raw), ...alertas].join(" ");
            this.rows.push({
                index: i, key: link || nome + "#" + i, link, nome, cells, seg, alertas,
                jornada: iJor >= 0 ? asText(r[iJor]) : "",
                seguintes: iSeg >= 0 ? asText(r[iSeg]) : "",
                text: normalize(text),
                id: this.host.createSelectionIdBuilder().withTable(table, i).createSelectionId()
            });
        });
        this.dynCols = dynOrder.map(k => ({ key: k, title: k, kind: dynKind[k] || "text", fixed: false }));
    }

    // Contexto: "visao=…||n=…||frase=…||origem=…||segs=a;b;c||ordem=Coluna". Ao trocar de visão, limpa busca, aba e ordem.
    private readContext(ctx: string) {
        const c: Ctx = { visao: "", n: null, frase: "", origem: "", segs: [], ordem: "" };
        for (const part of ctx.split("||")) {
            const p = part.indexOf("=");
            if (p <= 0) continue;
            const k = part.slice(0, p).trim(), v = part.slice(p + 1).trim();
            if (k === "visao") c.visao = v;
            else if (k === "n") c.n = num(v);
            else if (k === "frase") c.frase = v;
            else if (k === "origem") c.origem = v;
            else if (k === "segs") c.segs = v.split(";").map(x => x.trim()).filter(Boolean);
            else if (k === "ordem") c.ordem = v;
        }
        this.ctx = c;
        if (this.lastVisao !== c.visao) {
            this.lastVisao = c.visao;
            this.seg = "Todas";
            this.query = "";
            this.sort = null;
            this.soExcecoes = false;
            this.shown = this.pageSize();
            this.expanded.clear();
            this.closeMenu();
        }
    }

    // ---------- colunas ocultas (salvas no relatório, por visão) ----------
    private hiddenMap(): Record<string, string[]> {
        try {
            const o = JSON.parse(this.settings.colunas.ocultas.value || "{}");
            return o && typeof o === "object" ? o as Record<string, string[]> : {};
        } catch { return {}; }
    }
    private hidden(): string[] { return this.hiddenMap()[this.ctx.visao || "_"] || []; }
    private setHidden(keys: string[]) {
        const m = this.hiddenMap();
        m[this.ctx.visao || "_"] = keys;
        const json = JSON.stringify(m);
        this.settings.colunas.ocultas.value = json;
        this.host.persistProperties({ merge: [{ objectName: "colunas", selector: null, properties: { ocultas: json } }] });
    }

    private allCols(): Col[] { return this.fixedCols.slice(0, 1).concat(this.dynCols, this.fixedCols.slice(1)); }
    private columns(): Col[] {
        const h = this.hidden();
        return this.allCols().filter(c => c.key === NAME_COL || h.indexOf(c.key) < 0);
    }

    // ---------- filtros da lista ----------
    private inSeg(r: Row, s: string): boolean { return s === "Todas" || r.seg === s; }
    private base(): Row[] { return this.soExcecoes ? this.rows.filter(r => r.alertas.length > 0) : this.rows; }

    private visible(): Row[] {
        const q = normalize(this.query);
        const list = this.base().filter(r => this.inSeg(r, this.seg) && (!q || r.text.indexOf(q) >= 0));
        const sort = this.sort || (this.ctx.ordem ? { key: this.ctx.ordem, desc: true } : null);
        if (!sort) return list;
        const dir = sort.desc ? -1 : 1;
        return list.slice().sort((a, b) => {
            const x = a.cells[sort.key] ? a.cells[sort.key].sort : null;
            const y = b.cells[sort.key] ? b.cells[sort.key].sort : null;
            if (x === y) return a.index - b.index;
            if (x === null) return 1;
            if (y === null) return -1;
            return (x < y ? -1 : 1) * dir;
        });
    }

    // ---------- desenho ----------
    private render() {
        this.renderTop();
        this.renderSegs();
        this.renderHead();
        this.renderTable();
    }

    private renderTop() {
        clear(this.topEl);
        const total = this.rows.length;
        const big = el("div", "xp-t2__big");
        big.append(el("span", "xp-t2__n", INT.format(total)), el("span", "xp-t2__frase", this.ctx.frase || "aplicações"));
        this.topEl.appendChild(big);
        if (this.ctx.n !== null && this.complete) {
            const ok = Math.round(this.ctx.n) === total;
            const badge = el("span", "xp-t2__chk " + (ok ? "xp-t2__chk--ok" : "xp-t2__chk--warn"),
                ok ? `✓ igual ao gráfico${this.ctx.origem ? " \"" + this.ctx.origem + "\"" : ""}`
                   : `⚠ o gráfico mostra ${INT.format(this.ctx.n)} · a lista tem ${INT.format(total)}`);
            if (!ok) badge.title = "Diferença conhecida: aplicações em etapa sem nome ou linhas acima do limite carregado. Veja a página Conceitos.";
            this.topEl.appendChild(badge);
        } else if (!this.complete) {
            this.topEl.appendChild(el("span", "xp-t2__chk", "Carregando a lista inteira…"));
        }
    }

    private renderSegs() {
        clear(this.segEl);
        this.segEl.setAttribute("role", "tablist");
        const base = this.base();
        const present = Array.from(new Set(base.map(r => r.seg).filter(Boolean)));
        const segs = ["Todas"].concat(this.ctx.segs.filter(s => present.indexOf(s) >= 0 || this.ctx.segs.length <= 6), present.filter(s => this.ctx.segs.indexOf(s) < 0));
        if (segs.indexOf(this.seg) < 0) this.seg = "Todas";
        for (const s of segs) {
            const n = base.filter(r => this.inSeg(r, s)).length;
            const on = s === this.seg;
            const b = el("button", "xp-t2__seg" + (on ? " is-on" : "") + (n === 0 ? " is-zero" : ""));
            b.setAttribute("role", "tab");
            b.setAttribute("aria-selected", String(on));
            b.append(document.createTextNode(s + " "), el("b", "", INT.format(n)));
            b.addEventListener("click", () => {
                if (this.seg === s) return;
                this.seg = s;
                this.shown = this.pageSize();
                this.expanded.clear();
                this.render();
            });
            this.segEl.appendChild(b);
        }
    }

    private renderHead() {
        clear(this.head);
        const search = el("label", "xp-t2__search");
        search.appendChild(el("span", "xp-t2__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = this.settings.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.shown = this.pageSize(); this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.head.appendChild(search);

        const nEx = this.rows.filter(r => r.alertas.length > 0).length;
        const ex = el("button", "xp-t2__toggle" + (this.soExcecoes ? " is-on" : ""), `⚠ Só exceções (${INT.format(nEx)})`);
        ex.setAttribute("aria-pressed", String(this.soExcecoes));
        ex.title = "Mostra só as aplicações com algum alerta (voltou de etapa, etapa de configuração, sem motivo…)";
        ex.addEventListener("click", () => { this.soExcecoes = !this.soExcecoes; this.shown = this.pageSize(); this.render(); });
        this.head.appendChild(ex);

        const colBtn = el("button", "xp-t2__btn xp-t2__colbtn", "Colunas ▾");
        colBtn.setAttribute("aria-haspopup", "true");
        colBtn.addEventListener("click", () => (this.menuEl ? this.closeMenu() : this.openMenu(colBtn)));
        this.head.appendChild(colBtn);

        const exp = el("button", "xp-t2__btn", "⤓ Exportar CSV");
        exp.title = "Baixa a lista inteira (aba, busca e colunas escolhidas), não só as linhas visíveis";
        exp.addEventListener("click", () => this.exportCsv(exp));
        this.head.appendChild(exp);
    }

    private openMenu(anchor: HTMLElement) {
        this.closeMenu();
        const menu = el("div", "xp-t2__menu");
        menu.setAttribute("role", "dialog");
        menu.setAttribute("aria-label", "Escolher colunas");
        menu.appendChild(el("div", "xp-t2__menu-t", "Colunas desta visão"));
        const h = this.hidden();
        for (const c of this.allCols()) {
            const lab = el("label", "xp-t2__opt" + (c.key === NAME_COL ? " is-lock" : ""));
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.checked = h.indexOf(c.key) < 0;
            cb.disabled = c.key === NAME_COL;
            cb.addEventListener("change", () => {
                const cur = this.hidden().filter(k => k !== c.key);
                if (!cb.checked) cur.push(c.key);
                this.setHidden(cur);
                this.renderTable();
            });
            lab.append(cb, document.createTextNode(" " + c.title + (c.fixed && c.key !== NAME_COL ? "" : "")));
            menu.appendChild(lab);
        }
        const reset = el("button", "xp-t2__link-btn", "Mostrar todas");
        reset.addEventListener("click", () => { this.setHidden([]); this.closeMenu(); this.renderTable(); });
        menu.appendChild(reset);
        this.root.appendChild(menu);
        const r = anchor.getBoundingClientRect(), base = this.root.getBoundingClientRect();
        menu.style.top = (r.bottom - base.top + 4) + "px";
        menu.style.left = Math.max(0, r.right - base.left - 240) + "px";
        menu.style.maxHeight = Math.max(160, this.height - (r.bottom - base.top) - 16) + "px";
        this.menuEl = menu;
    }
    private closeMenu() { if (this.menuEl) { this.menuEl.remove(); this.menuEl = null; } }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        const avail = Math.max(140, this.height - this.topEl.offsetHeight - this.segEl.offsetHeight - this.head.offsetHeight - 54);
        this.wrap.style.height = avail + "px";
        if (!this.hasDados || !this.fixedCols.length) {
            this.wrap.appendChild(el("div", "xp-t2__empty", "Arraste o Link, o Candidato (nome_completo), as Colunas fixas e as medidas Esteira | Visão Dados, Nominal Jornada, Nominal Etapas Seguintes, Nominal Alertas e Visão Contexto."));
            clear(this.foot);
            return;
        }
        const all = this.visible();
        const list = all.slice(0, this.shown);
        const cols = this.columns();
        const sort = this.sort || (this.ctx.ordem ? { key: this.ctx.ordem, desc: true } : null);
        const hasAlert = this.rows.some(r => r.alertas.length > 0);

        const table = el("table", "xp-t2__table");
        const hr = el("tr", "");
        hr.appendChild(el("th", "xp-t2__th-x"));
        if (this.hasLink) hr.appendChild(el("th", "", s.textos.link.value || "Greenhouse"));
        for (const c of cols) {
            const th = el("th", c.kind !== "text" ? "xp-t2__r" : "");
            const on = !!sort && sort.key === c.key;
            const btn = el("button", "xp-t2__sort" + (on ? " is-on" : ""), c.title);
            if (on && sort) btn.appendChild(el("span", "", sort.desc ? " ↓" : " ↑"));
            btn.addEventListener("click", () => {
                if (!sort || sort.key !== c.key) this.sort = { key: c.key, desc: true };
                else if (sort.desc) this.sort = { key: c.key, desc: false };
                else this.sort = { key: c.key, desc: true };
                this.renderTable();
            });
            th.appendChild(btn);
            hr.appendChild(th);
        }
        if (hasAlert) hr.appendChild(el("th", "", "Alertas"));
        const thead = el("thead", "");
        thead.appendChild(hr);
        table.appendChild(thead);
        const span = cols.length + 1 + (this.hasLink ? 1 : 0) + (hasAlert ? 1 : 0);

        const tbody = el("tbody", "");
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-t2__none", this.query ? `Ninguém encontrado para "${this.query}"` : "Nenhuma aplicação nesta aba com os filtros da página");
            td.setAttribute("colspan", String(span));
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        const alertaDias = s.dias.alerta.value;
        for (const r of list) {
            const open = this.expanded.has(r.key);
            const tr = el("tr", "xp-t2__row" + (open ? " is-open" : ""));
            tr.tabIndex = 0;
            tr.setAttribute("aria-expanded", String(open));
            tr.appendChild(el("td", "xp-t2__x", open ? "▾" : "▸"));
            if (this.hasLink) {
                const td = el("td", "");
                const url = this.url(r.link);
                if (url) {
                    const a = el("button", "xp-t2__link", "Abrir ↗");
                    a.title = url;
                    a.addEventListener("click", e => { e.stopPropagation(); this.host.launchUrl(url); });
                    td.appendChild(a);
                } else td.textContent = r.link || "—";
                tr.appendChild(td);
            }
            for (const c of cols) {
                const cell = r.cells[c.key];
                const raw = cell ? cell.raw : "";
                const td = el("td", "");
                if (PILL_COLS.indexOf(c.title.toLowerCase()) >= 0 && raw) {
                    td.appendChild(el("span", "xp-t2__pill xp-t2__pill--" + (PILL[normalize(raw)] || "off"), raw));
                } else if (c.kind === "date") {
                    td.className = "xp-t2__r";
                    td.textContent = raw ? shortDate(raw, true) : "—";
                } else if (c.kind === "num") {
                    td.className = "xp-t2__r xp-t2__num";
                    const n = num(raw);
                    td.textContent = n === null ? "—" : INT.format(n);
                    if (n !== null && /dias/i.test(c.title) && n > alertaDias) td.classList.add("is-bad");
                } else {
                    if (c.key === NAME_COL) td.className = "xp-t2__strong";
                    if (/motivo/i.test(c.title)) td.className = "xp-t2__muted";
                    highlight(td, raw || "—", q);
                    td.title = raw;
                }
                tr.appendChild(td);
            }
            if (hasAlert) {
                const td = el("td", "xp-t2__al");
                for (const a of r.alertas) td.appendChild(el("span", "xp-t2__alc" + (/sem nome|sem motivo|antes da|em dobro/i.test(a) ? " is-dado" : ""), a));
                tr.appendChild(td);
            }
            const toggle = () => {
                if (this.expanded.has(r.key)) this.expanded.delete(r.key); else this.expanded.add(r.key);
                this.renderTable();
            };
            tr.addEventListener("click", toggle);
            tr.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
            tr.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(r.id, { x: e.clientX, y: e.clientY });
            });
            tbody.appendChild(tr);
            if (open) {
                const det = el("tr", "xp-t2__det");
                const td = el("td", "");
                td.setAttribute("colspan", String(span));
                td.appendChild(this.journey(r));
                det.appendChild(td);
                tbody.appendChild(det);
            }
        }
        table.appendChild(tbody);
        this.wrap.appendChild(table);

        clear(this.foot);
        this.foot.appendChild(el("span", "", all.length ? `Mostrando ${INT.format(list.length)} de ${INT.format(all.length)}` : ""));
        if (all.length > list.length) {
            const more = el("button", "xp-t2__more", `Mostrar mais ${INT.format(Math.min(this.step(), all.length - list.length))} ▾`);
            more.addEventListener("click", () => { this.shown += this.step(); this.renderTable(); });
            this.foot.appendChild(more);
            const allBtn = el("button", "xp-t2__more xp-t2__more--ghost", "Mostrar todas");
            allBtn.addEventListener("click", () => { this.shown = all.length; this.renderTable(); });
            if (all.length - list.length > this.step()) this.foot.appendChild(allBtn);
        }
        if (this.loading) this.foot.appendChild(el("span", "xp-t2__loading", "Carregando mais aplicações…"));
        else if (!this.complete) this.foot.appendChild(el("span", "xp-t2__loading", `Lista limitada a ${INT.format(this.rows.length)} linhas: use os filtros para reduzir`));
    }

    // Linha do tempo: etapa|entrada|saída|resultado|dias;;… + etapas seguintes que a aplicação não alcançou.
    private journey(r: Row): HTMLElement {
        const outer = el("div", "");
        const box = el("div", "xp-t2__jr");
        const steps = r.jornada.split(";;").map(x => x.split("|")).filter(p => p[0] && p[0].trim());
        const next = r.seguintes.split(";;").map(x => x.trim()).filter(Boolean);
        if (!steps.length) { outer.appendChild(el("div", "xp-t2__muted", "Sem histórico de etapas para esta aplicação.")); return outer; }
        const add = (name: string, sub: string, cls: string) => {
            const st = el("div", "xp-t2__st xp-t2__st--" + cls);
            st.append(el("i", ""), el("b", "", name), el("span", "", sub));
            box.appendChild(st);
        };
        let total = 0;
        for (const p of steps) {
            const [name, ini, fim, res, dias] = p.map(x => (x || "").trim());
            const rn = normalize(res);
            const cls = rn.startsWith("rejeit") ? "bad" : rn.indexOf("andamento") >= 0 ? "now" : rn.startsWith("voltou") ? "back" : rn.startsWith("saiu") ? "out" : "ok";
            const range = `${shortDate(ini, false)}${fim ? " → " + shortDate(fim, false) : " → hoje"}`;
            const nd = dias !== "" && isFinite(Number(dias)) ? Number(dias) : null;
            if (nd !== null) total += nd;
            const d = nd !== null ? ` · ${INT.format(nd)} d` : "";
            const tail = cls === "bad" ? " · rejeitada" : cls === "now" ? " · em andamento" : cls === "back" ? " · voltou" : cls === "out" ? " · saiu para outra vaga" : "";
            add(name, range + d + tail, cls);
        }
        const emAndamento = steps.some(p => normalize(p[3] || "").indexOf("andamento") >= 0);
        for (const n of next) add(n, emAndamento ? "ainda não chegou" : "não chegou", "off");
        outer.appendChild(box);
        outer.appendChild(el("div", "xp-t2__total", `Soma do tempo nas etapas: ${INT.format(total)} dias`));
        return outer;
    }

    private exportCsv(btn: HTMLElement) {
        const list = this.visible();
        const cols = this.columns();
        const hasAlert = this.rows.some(r => r.alertas.length > 0);
        const header = [this.hasLink ? (this.settings.textos.link.value || "Link") : null, ...cols.map(c => c.title), hasAlert ? "Alertas" : null]
            .filter((x): x is string => x !== null);
        const lines = [header];
        for (const r of list) {
            const line: string[] = [];
            if (this.hasLink) line.push(this.url(r.link) || r.link);
            for (const c of cols) {
                const cell = r.cells[c.key];
                const raw = cell ? cell.raw : "";
                line.push(c.kind === "date" && raw ? shortDate(raw, true) : raw);
            }
            if (hasAlert) line.push(r.alertas.join(" · "));
            lines.push(line);
        }
        const csv = "﻿" + lines.map(l => l.map(x => /[";\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x).join(";")).join("\r\n");
        const name = `dados-${slug(this.ctx.visao || "lista")}${this.seg !== "Todas" ? "-" + slug(this.seg) : ""}.csv`;
        const fail = () => { btn.textContent = "Use ⋯ → Exportar dados"; setTimeout(() => { btn.textContent = "⤓ Exportar CSV"; }, 4000); };
        try {
            const ds = this.host.downloadService;
            if (!ds) { fail(); return; }
            ds.exportVisualsContent(csv, name, "csv", "Dados do dash").then(ok => { if (!ok) fail(); }).catch(fail);
        } catch { fail(); }
    }

    private url(v: string): string | null {
        if (!v) return null;
        if (/^https:\/\//i.test(v)) return v;
        const model = (this.settings.link.modelo.value || "").trim();
        if (model && model.indexOf("{valor}") >= 0 && /^https:\/\//i.test(model)) return model.replace("{valor}", encodeURIComponent(v));
        return null;
    }
}

// ---------- auxiliares ----------
function toCell(v: string): Cell {
    if (v.startsWith("@")) {
        const raw = v.slice(1);
        const d = toDate(raw);
        return { raw, kind: "date", sort: d ? d.getTime() : null };
    }
    if (v.startsWith("#")) {
        const raw = v.slice(1);
        return { raw, kind: "num", sort: num(raw) };
    }
    return { raw: v, kind: "text", sort: v ? normalize(v) : null };
}
function clean(name: string): string {
    const parts = (name || "").split("|");
    return parts[parts.length - 1].trim();
}
function num(v: PrimitiveValue | string | undefined): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return isFinite(n) ? n : null;
}
function asText(v: PrimitiveValue | undefined): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString();
    return String(v).trim();
}
function fmtPrimitive(v: PrimitiveValue | undefined): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return `${pad(v.getDate())}/${pad(v.getMonth() + 1)}/${v.getFullYear()}`;
    if (typeof v === "number") return INT.format(v);
    return String(v).trim();
}
function pad(n: number): string { return String(n).padStart(2, "0"); }
function toDate(v: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
function shortDate(v: string, year: boolean): string {
    const d = toDate(v);
    if (!d) return v;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` + (year ? `/${String(d.getFullYear()).slice(2)}` : "");
}
function slug(t: string): string {
    return normalize(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }
function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.textContent = label; return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
