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

import { StageTableSettings } from "./settings";
import { xpFont } from "./xpTheme";

type Key = "p" | "a" | "r" | "e" | "conv" | "media" | "mediana";

interface Row {
    index: number;
    label: string;
    p: number | null;
    a: number | null;
    r: number | null;
    e: number | null;
    media: number | null;
    mediana: number | null;
    conv: number | null;
    id: ISelectionId;
}

interface Sort { key: Key | "processo"; desc: boolean; }


const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const DEC = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private wrap: HTMLElement;
    private hint: HTMLElement;
    private tip: HTMLElement;
    private settings: StageTableSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: Row[] = [];
    private rowEls: { el: HTMLElement; id: ISelectionId }[] = [];
    private query = "";
    private onlyMoving: boolean | null = null;
    private pct: boolean | null = null;
    private sort: Sort | null = null;
    private present: Record<string, boolean> = {};
    private avgConv: number | null = null;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-st");
        this.toolbar = el("div", "xp-st__bar");
        this.wrap = el("div", "xp-st__wrap");
        this.hint = el("div", "xp-st__hint");
        this.tip = el("div", "xp-st__tip");
        this.tip.style.display = "none";
        this.root.append(this.toolbar, this.wrap, this.hint, this.tip);
        options.element.appendChild(this.root);
        this.wrap.addEventListener("click", () => this.selectionManager.clear().then(() => this.paintSelection([])));
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => this.paintSelection(ids));
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(StageTableSettings, dv);
            if (this.onlyMoving === null) this.onlyMoving = this.settings.comportamento.soMovimento.value;
            if (this.pct === null) this.pct = this.settings.comportamento.modoPct.value;
            this.height = options.viewport.height;
            // Card estreito (ex.: meia largura da página): letras e espaços menores para caber sem rolagem lateral.
            this.root.classList.toggle("xp-st--compact", options.viewport.width < 1000);
            this.read(dv);
            if (this.sort === null) {
                const o = String(this.settings.comportamento.ordemInicial.value.value);
                this.sort = o === "processo" ? { key: "processo", desc: false } : { key: o as Key, desc: true };
            }
            this.root.style.fontFamily = xpFont;
            this.root.style.setProperty("--xp-st-a", this.settings.cores.aprovados.value.value);
            this.root.style.setProperty("--xp-st-r", this.settings.cores.rejeitados.value.value);
            this.root.style.setProperty("--xp-st-e", this.settings.cores.andamento.value.value);
            this.renderToolbar();
            this.renderTable();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private read(dv: DataView | undefined) {
        this.rows = [];
        const cat = dv && dv.categorical;
        const column = cat && cat.categories && cat.categories[0];
        if (!column) return;
        this.present = {};
        for (const r of ["participantes", "aprovados", "rejeitados", "andamento", "media", "mediana"]) {
            this.present[r] = (cat.values || []).some(v => v.source.roles && v.source.roles[r]);
        }
        const measure = (role: string) => {
            const col = (cat.values || []).find(v => v.source.roles && v.source.roles[role]);
            return (i: number) => (col ? num(col.values[i]) : null);
        };
        const p = measure("participantes"), a = measure("aprovados"), r = measure("rejeitados"), e = measure("andamento");
        const media = measure("media"), mediana = measure("mediana");
        for (let i = 0; i < column.values.length; i++) {
            const label = column.values[i] === null || column.values[i] === undefined || column.values[i] === "" ? "(sem etapa)" : String(column.values[i]);
            const ai = a(i), ri = r(i);
            this.rows.push({
                index: i, label, p: p(i), a: ai, r: ri, e: e(i), media: media(i), mediana: mediana(i),
                conv: (ai || 0) + (ri || 0) > 0 ? (ai || 0) / ((ai || 0) + (ri || 0)) : null,
                id: this.host.createSelectionIdBuilder().withCategory(column, i).createSelectionId()
            });
        }
    }

    private sortKey(): Key | "processo" { return this.sort ? this.sort.key : "processo"; }
    private sortDesc(): boolean { return this.sort ? this.sort.desc : false; }

    // Nomes das colunas vêm de Formatar → Textos (a mesma tabela serve para etapa ou recrutador).
    private names() {
        const t = this.settings.textos;
        return { p: t.colParticipantes.value, a: t.colAprovados.value, r: t.colRejeitados.value, e: t.colAndamento.value,
            conv: t.colConversao.value, media: t.colMedia.value, mediana: t.colMediana.value };
    }

    private orders(): { label: string; sort: Sort }[] {
        const n = this.names();
        const lo = (x: string) => x.toLowerCase();
        const list: { label: string; sort: Sort }[] = [{ label: "processo", sort: { key: "processo", desc: false } }];
        if (this.present.participantes) list.push({ label: "mais " + lo(n.p), sort: { key: "p", desc: true } });
        list.push({ label: "mais " + lo(n.a), sort: { key: "a", desc: true } });
        list.push({ label: "menor " + lo(n.conv), sort: { key: "conv", desc: false } });
        list.push({ label: "maior " + lo(n.conv), sort: { key: "conv", desc: true } });
        list.push({ label: "mais " + lo(n.r), sort: { key: "r", desc: true } });
        list.push({ label: "mais " + lo(n.e), sort: { key: "e", desc: true } });
        if (this.present.media) list.push({ label: "maior " + lo(n.media), sort: { key: "media", desc: true } });
        if (this.present.mediana) list.push({ label: "maior " + lo(n.mediana), sort: { key: "mediana", desc: true } });
        return list;
    }

    private renderToolbar() {
        clear(this.toolbar);
        const search = el("label", "xp-st__search");
        search.appendChild(el("span", "xp-st__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = this.settings.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", "Buscar etapa");
        input.addEventListener("input", () => { this.query = input.value; this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.toolbar.appendChild(search);

        const moving = el("button", "xp-st__btn" + (this.onlyMoving ? " xp-st__btn--on" : ""), "Só com movimento");
        moving.setAttribute("aria-pressed", String(!!this.onlyMoving));
        moving.addEventListener("click", () => { this.onlyMoving = !this.onlyMoving; this.renderToolbar(); this.renderTable(); });
        this.toolbar.appendChild(moving);

        const select = document.createElement("select");
        select.className = "xp-st__select";
        select.setAttribute("aria-label", "Ordem");
        const ORDERS = this.orders();
        const current = ORDERS.findIndex(o => o.sort.key === this.sortKey() && (o.sort.key === "processo" || o.sort.desc === this.sortDesc()));
        ORDERS.forEach((o, i) => {
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = "Ordem: " + o.label;
            select.appendChild(opt);
        });
        if (current < 0) {
            const opt = document.createElement("option");
            opt.value = "-1";
            opt.textContent = "Ordem: pela coluna";
            select.appendChild(opt);
        }
        select.value = String(current);
        select.addEventListener("change", () => {
            const o = ORDERS[Number(select.value)];
            if (o) { this.sort = { ...o.sort }; this.renderToolbar(); this.renderTable(); }
        });
        this.toolbar.appendChild(select);

        const seg = el("div", "xp-st__seg");
        for (const [isPct, label] of [[false, "Números"], [true, this.settings.textos.rotuloPct.value || "% da linha"]] as [boolean, string][]) {
            const b = el("button", "xp-st__opt" + (this.pct === isPct ? " xp-st__opt--on" : ""), label);
            b.setAttribute("aria-pressed", String(this.pct === isPct));
            b.addEventListener("click", () => { if (this.pct !== isPct) { this.pct = isPct; this.renderToolbar(); this.renderTable(); } });
            seg.appendChild(b);
        }
        this.toolbar.appendChild(seg);
        this.toolbar.appendChild(el("span", "xp-st__spacer"));

        const legend = el("div", "xp-st__legend");
        const nm = this.names();
        for (const [v, t] of [["a", nm.a], ["r", nm.r], ["e", nm.e]]) {
            const item = el("span", "");
            item.appendChild(el("i", "xp-st__dot xp-st__dot--" + v));
            item.appendChild(document.createTextNode(t));
            legend.appendChild(item);
        }
        this.toolbar.appendChild(legend);
    }

    private visibleRows(): Row[] {
        const q = normalize(this.query);
        let list = this.rows.filter(r => (!this.onlyMoving || moved(r)) && (!q || normalize(r.label).indexOf(q) >= 0));
        if (this.sortKey() !== "processo") {
            const k = this.sortKey() as Key, dir = this.sortDesc() ? -1 : 1;
            list = list.slice().sort((x, y) => {
                const a = x[k], b = y[k];
                if (a === null && b === null) return x.index - y.index;
                if (a === null) return 1;
                if (b === null) return -1;
                return a === b ? x.index - y.index : (a - b) * dir;
            });
        }
        return list;
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        this.rowEls = [];
        const custom = (s.textos.rodape.value || "").trim();
        this.hint.textContent = custom || `Clique numa linha para filtrar a página · clique no título da coluna para ordenar` + (this.present.media && this.present.mediana ? ` · ▲ média mais que ${DEC.format(s.limites.fatorSla.value).replace(",0", "")}× a mediana (poucos casos muito demorados)` : "");
        const all = this.rows.reduce((t, r) => [t[0] + (r.a || 0), t[1] + (r.r || 0)], [0, 0]);
        this.avgConv = all[0] + all[1] > 0 ? all[0] / (all[0] + all[1]) : null;
        const avail = Math.max(80, this.height - this.toolbar.offsetHeight - this.hint.offsetHeight - 14);
        this.wrap.style.height = avail + "px";

        if (!this.rows.length) {
            this.wrap.appendChild(el("div", "xp-st__empty", "Arraste a etapa para \"Etapa\" e as medidas para as colunas."));
            return;
        }

        const table = el("table", "xp-st__table");
        const thead = el("thead", "");
        const hr = el("tr", "");
        const cols: [string, Key | null, string][] = [
            [s.textos.colEtapa.value, null, "xp-st__th-name"],
            [this.names().p, "p", ""],
            ["Composição", null, "xp-st__th-comp"],
            [this.names().a, "a", ""],
            [this.names().r, "r", ""],
            [this.names().e, "e", ""],
            [this.names().conv, "conv", ""],
            [this.names().media, "media", ""],
            [this.names().mediana, "mediana", ""]
        ];
        for (const [label, key, cls] of cols) {
            const th = el("th", cls);
            if (key) {
                const b = el("button", "xp-st__sort" + (this.sortKey() === key ? " xp-st__sort--on" : ""), label);
                if (this.sortKey() === key) b.appendChild(el("span", "xp-st__arrow", this.sortDesc() ? " ↓" : " ↑"));
                b.addEventListener("click", e => {
                    e.stopPropagation();
                    // 1º clique: maior primeiro; 2º: menor primeiro; 3º: volta à ordem do processo.
                    if (this.sortKey() !== key) this.sort = { key, desc: true };
                    else if (this.sortDesc()) this.sort = { key, desc: false };
                    else this.sort = { key: "processo", desc: false };
                    this.renderToolbar();
                    this.renderTable();
                });
                th.appendChild(b);
                th.setAttribute("aria-sort", this.sortKey() === key ? (this.sortDesc() ? "descending" : "ascending") : "none");
            } else {
                th.textContent = label;
            }
            hr.appendChild(th);
        }
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = el("tbody", "");
        const list = this.visibleRows();
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-st__none", this.query ? `Nenhuma etapa com "${this.query}"` : "Nenhuma etapa com movimento no período");
            td.setAttribute("colspan", "9");
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        for (const r of list) {
            const tr = el("tr", "xp-st__row" + (moved(r) ? "" : " xp-st__row--zero"));
            tr.tabIndex = 0;
            const name = el("td", "xp-st__name");
            highlight(name, r.label, q);
            tr.appendChild(name);
            tr.appendChild(el("td", "", this.fmtInt(r.p)));
            tr.appendChild(this.compCell(r.label, r.p, r.a, r.r, r.e));
            tr.appendChild(el("td", "", this.share(r.a, r)));
            tr.appendChild(el("td", "", this.share(r.r, r)));
            tr.appendChild(el("td", "", this.share(r.e, r)));
            tr.appendChild(this.convCell(r.conv));
            tr.appendChild(el("td", "", days(r.media)));
            tr.appendChild(this.medianaCell(r.media, r.mediana));
            tr.setAttribute("aria-label", `${r.label}: ${this.fmtInt(r.p)} participantes, conversão ${r.conv === null ? "sem decisão" : Math.round(r.conv * 100) + "%"}`);
            const pick = (multi: boolean) => this.selectionManager.select(r.id, multi).then(ids => this.paintSelection(ids as ISelectionId[]));
            tr.addEventListener("click", (e: MouseEvent) => { e.stopPropagation(); pick(e.ctrlKey || e.metaKey); });
            tr.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e.ctrlKey || e.metaKey); } });
            tr.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(r.id, { x: e.clientX, y: e.clientY });
            });
            tbody.appendChild(tr);
            this.rowEls.push({ el: tr, id: r.id });
        }
        table.appendChild(tbody);

        if (s.comportamento.mostrarTotal.value && list.length) {
            const sum = (k: "a" | "r" | "e") => list.reduce((t, r) => t + (r[k] || 0), 0);
            const a = sum("a"), rj = sum("r"), e = sum("e");
            const pSum = s.comportamento.somarParticipantes.value ? list.reduce((t, r) => t + (r.p || 0), 0) : null;
            const tot = { p: pSum, a, r: rj, e } as Row;
            const tfoot = el("tfoot", "");
            const tr = el("tr", "xp-st__total");
            tr.appendChild(el("td", "xp-st__name", s.textos.rotuloTotal.value));
            tr.appendChild(el("td", "", pSum === null ? "—" : INT.format(pSum)));
            tr.appendChild(this.compCell(s.textos.rotuloTotal.value, null, a, rj, e));
            tr.appendChild(el("td", "", this.share(a, tot)));
            tr.appendChild(el("td", "", this.share(rj, tot)));
            tr.appendChild(el("td", "", this.share(e, tot)));
            tr.appendChild(this.convCell(a + rj > 0 ? a / (a + rj) : null));
            tr.appendChild(el("td", "", "—"));
            tr.appendChild(el("td", "", "—"));
            tfoot.appendChild(tr);
            table.appendChild(tfoot);
        }
        // Colunas sem medida no campo somem (ex.: sem "SLA média" na tabela de recrutador).
        const hide = [[1, "participantes"], [7, "media"], [8, "mediana"]].filter(([, r]) => !this.present[r as string]).map(([i]) => i as number).sort((x, y) => y - x);
        if (hide.length) table.querySelectorAll("tr").forEach(tr => { if (tr.children.length === 9) for (const i of hide) tr.children[i].remove(); });
        this.wrap.appendChild(table);
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private fmtInt(v: number | null): string { return v === null ? "—" : INT.format(v); }

    // Em "% da etapa", divide por participantes (ou pela soma das três partes).
    private share(v: number | null, r: Row): string {
        if (!this.pct) return this.fmtInt(v);
        const den = r.p || (r.a || 0) + (r.r || 0) + (r.e || 0);
        if (v === null || !den) return "—";
        return Math.round((v / den) * 100) + "%";
    }

    private compCell(label: string, p: number | null, a: number | null, r: number | null, e: number | null): HTMLElement {
        const td = el("td", "xp-st__comp");
        const av = a || 0, rv = r || 0, ev = e || 0, t = av + rv + ev;
        if (!t) {
            td.appendChild(el("span", "xp-st__muted", "sem movimento no período"));
            return td;
        }
        const bar = el("div", "xp-st__cbar");
        for (const [v, k] of [[av, "a"], [rv, "r"], [ev, "e"]] as [number, string][]) {
            if (!v) continue;
            const seg = el("i", "xp-st__seg-" + k);
            seg.style.flexGrow = String(v);
            bar.appendChild(seg);
        }
        td.appendChild(bar);
        bar.addEventListener("mousemove", (ev2: MouseEvent) => {
            clear(this.tip);
            this.tip.appendChild(el("div", "xp-st__tip-head", label));
            const nm = this.names();
            if (p !== null) this.tip.appendChild(el("div", "", `${INT.format(p)} ${nm.p.toLowerCase()}`));
            for (const [v, k, name] of [[av, "a", nm.a], [rv, "r", nm.r], [ev, "e", nm.e]] as [number, string, string][]) {
                const row = el("div", "");
                row.appendChild(el("i", "xp-st__dot xp-st__dot--" + k));
                row.appendChild(document.createTextNode(`${name} ${INT.format(v)} (${Math.round((v / t) * 100)}%)`));
                this.tip.appendChild(row);
            }
            this.tip.style.display = "";
            const box = this.root.getBoundingClientRect();
            let x = ev2.clientX - box.left + 14;
            if (x + this.tip.offsetWidth > box.width) x = ev2.clientX - box.left - 14 - this.tip.offsetWidth;
            let y = ev2.clientY - box.top + 14;
            if (y + this.tip.offsetHeight > box.height) y = ev2.clientY - box.top - 14 - this.tip.offsetHeight;
            this.tip.style.left = Math.max(0, x) + "px";
            this.tip.style.top = Math.max(0, y) + "px";
        });
        bar.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
        return td;
    }

    private convCell(c: number | null): HTMLElement {
        const td = el("td", "");
        if (c === null) { td.appendChild(el("span", "xp-st__muted", "—")); return td; }
        const pct = c * 100;
        const s = this.settings.limites;
        let cls: string;
        if (String(s.modoConv.value.value) === "media" && this.avgConv !== null) {
            const avg = this.avgConv * 100;
            cls = pct >= avg ? "good" : pct >= avg * s.fatorMedia.value / 100 ? "warn" : "bad";
        } else {
            cls = pct >= s.convBoa.value ? "good" : pct >= s.convAtencao.value ? "warn" : "bad";
        }
        const text = pct < 10 && pct > 0 ? DEC.format(pct) + "%" : Math.round(pct) + "%";
        const pill = el("span", "xp-st__pill xp-st__pill--" + cls, text);
        if (String(s.modoConv.value.value) === "media" && this.avgConv !== null) pill.title = `Média: ${DEC.format(this.avgConv * 100)}%`;
        td.appendChild(pill);
        return td;
    }

    private medianaCell(media: number | null, mediana: number | null): HTMLElement {
        const td = el("td", "", days(mediana));
        const f = this.settings.limites.fatorSla.value;
        if (media !== null && mediana !== null && mediana > 0 && f > 0 && media > mediana * f && media >= 1) {
            const flag = el("span", "xp-st__flag", "▲");
            flag.title = `Média (${days(media)}) mais que ${f}× a mediana`;
            td.appendChild(flag);
        }
        return td;
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rowEls) {
            const on = any && ids.some(id => id.equals(r.id));
            r.el.classList.toggle("xp-st__row--dim", any && !on);
            r.el.classList.toggle("xp-st__row--sel", !!on);
        }
    }
}

function moved(r: Row): boolean { return (r.p || 0) > 0 || (r.a || 0) + (r.r || 0) + (r.e || 0) > 0; }
function num(v: powerbi.PrimitiveValue): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
}
function days(v: number | null): string { return v === null ? "—" : DEC.format(v) + " d"; }
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
// Destaca o trecho buscado, ignorando acentos, sem innerHTML.
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.textContent = label; return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
