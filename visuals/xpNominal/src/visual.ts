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

import { NominalSettings } from "./settings";
import { xpFont } from "./xpTheme";

type Kind = "link" | "texto" | "segmento" | "situacao" | "dias" | "sla";

interface Col {
    key: string;
    title: string;
    kind: Kind;
    src: number;
    isDate: boolean;
}

interface Row {
    index: number;
    cells: powerbi.PrimitiveValue[];
    text: string;
    segment: string;
    days: number | null;
    id: ISelectionId;
}

const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private kpis: HTMLElement;
    private wrap: HTMLElement;
    private foot: HTMLElement;
    private settings: NominalSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private cols: Col[] = [];
    private rows: Row[] = [];
    private segments: string[] = [];
    private hasDays = false;
    private query = "";
    private segment: string | null = null;
    private overOnly = false;
    private sort: { key: string; desc: boolean } | null = null;
    private height = 0;
    private rowEls: { el: HTMLElement; id: ISelectionId }[] = [];
    private shown = 0;
    private loading = false;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-nm");
        this.toolbar = el("div", "xp-nm__bar");
        this.kpis = el("div", "xp-nm__kpis");
        this.wrap = el("div", "xp-nm__wrap");
        this.foot = el("div", "xp-nm__foot");
        this.root.append(this.toolbar, this.kpis, this.wrap, this.foot);
        options.element.appendChild(this.root);
        this.wrap.addEventListener("click", () => this.selectionManager.clear().then(() => this.paint([])));
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => this.paint(ids));
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(NominalSettings, dv);
            this.height = options.viewport.height;
            this.read(dv);
            // Carrega o resto das linhas em blocos (o Power BI entrega 10 mil por vez).
            this.loading = false;
            if (dv && dv.metadata && dv.metadata.segment && this.rows.length < this.settings.comportamento.maxLinhas.value) {
                this.loading = this.host.fetchMoreData(true);
            }
            this.shown = Math.max(this.shown, this.pageSize());
            if (this.segment !== null && this.segments.indexOf(this.segment) < 0) this.segment = null;
            if (this.sort === null && this.hasDays) this.sort = { key: "dias", desc: true };
            this.root.style.fontFamily = xpFont;
            this.renderToolbar();
            this.renderAll();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    private pageSize(): number { return Math.max(20, this.settings.comportamento.linhasTela.value); }

    // Volta para a primeira página quando a lista muda (busca, botões, ordem).
    private reset() { this.shown = this.pageSize(); }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    // Monta as colunas: link, as duas primeiras "Colunas", segmento, situação, o resto das "Colunas", dias e SLA total.
    private read(dv: DataView | undefined) {
        this.cols = [];
        this.rows = [];
        this.segments = [];
        const table = dv && dv.table;
        if (!table || !table.columns.length) return;
        const s = this.settings;
        const idx = (role: string) => table.columns.map((c, i) => ({ c, i })).filter(x => x.c.roles && x.c.roles[role]);
        const make = (x: { c: powerbi.DataViewMetadataColumn; i: number }, kind: Kind, title?: string): Col => ({
            key: kind === "texto" ? "c" + x.i : kind, title: title || clean(x.c.displayName), kind, src: x.i,
            isDate: !!(x.c.type && x.c.type.dateTime)
        });
        const link = idx("link")[0], seg = idx("segmento")[0], sit = idx("situacao")[0], days = idx("dias")[0], sla = idx("sla")[0];
        const texts = idx("colunas").map(x => make(x, "texto"));
        if (link) this.cols.push(make(link, "link", s.textos.link.value || clean(link.c.displayName)));
        this.cols.push(...texts.slice(0, 2));
        if (seg && s.comportamento.colunaSegmento.value) this.cols.push(make(seg, "segmento"));
        if (sit) this.cols.push(make(sit, "situacao"));
        this.cols.push(...texts.slice(2));
        if (days) this.cols.push(make(days, "dias", s.textos.colDias.value || clean(days.c.displayName)));
        if (sla) this.cols.push(make(sla, "sla", s.textos.colSla.value || clean(sla.c.displayName)));
        this.hasDays = !!days;

        const seen = new Set<string>();
        table.rows.forEach((r, i) => {
            const segment = seg ? asText(r[seg.i]) : "";
            if (seg && segment && !seen.has(segment)) { seen.add(segment); this.segments.push(segment); }
            const textParts = this.cols.filter(c => c.kind !== "link" && c.kind !== "dias" && c.kind !== "sla").map(c => fmtCell(r[c.src], c.isDate));
            this.rows.push({
                index: i, cells: r, text: normalize(textParts.join(" ")), segment,
                days: days ? num(r[days.i]) : null,
                id: this.host.createSelectionIdBuilder().withTable(table, i).createSelectionId()
            });
        });
    }

    private renderToolbar() {
        const s = this.settings;
        clear(this.toolbar);
        const search = el("label", "xp-nm__search");
        search.appendChild(el("span", "xp-nm__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = s.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.reset(); this.renderAll(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderAll(); } });
        search.appendChild(input);
        this.toolbar.appendChild(search);

        if (this.segments.length > 1) {
            const chip = (label: string, value: string | null) => {
                const on = this.segment === value;
                const b = el("button", "xp-nm__btn" + (on ? " xp-nm__btn--on" : ""), label);
                b.setAttribute("aria-pressed", String(on));
                b.addEventListener("click", () => { this.segment = value; this.reset(); this.renderToolbar(); this.renderAll(); });
                this.toolbar.appendChild(b);
            };
            chip(s.textos.todos.value || "Todos", null);
            for (const sg of this.segments) chip(sg, sg);
        }
        if (this.hasDays && s.dias.botao.value) {
            const b = el("button", "xp-nm__btn" + (this.overOnly ? " xp-nm__btn--on" : ""), `Acima de ${INT.format(s.dias.atencao.value)} dias`);
            b.setAttribute("aria-pressed", String(this.overOnly));
            b.addEventListener("click", () => { this.overOnly = !this.overOnly; this.reset(); this.renderToolbar(); this.renderAll(); });
            this.toolbar.appendChild(b);
        }
        if (s.comportamento.exportar.value && this.cols.length) {
            const exp = el("button", "xp-nm__btn xp-nm__export", "⤓ Exportar");
            exp.title = "Baixa a lista (com a busca e os botões aplicados) em CSV, que abre no Excel";
            exp.addEventListener("click", () => this.exportCsv(exp));
            this.toolbar.appendChild(exp);
        }
    }

    private renderAll() {
        this.renderKpis();
        this.renderTable();
    }

    private renderKpis() {
        const s = this.settings;
        clear(this.kpis);
        if (!this.rows.length) { this.kpis.style.display = "none"; return; }
        this.kpis.style.display = "";
        const add = (n: number, label: string, cls = "") => {
            const k = el("span", "xp-nm__kpi " + cls);
            k.appendChild(el("strong", "", INT.format(n)));
            k.appendChild(document.createTextNode(" " + label));
            this.kpis.appendChild(k);
        };
        add(this.rows.length, s.textos.total.value);
        if (this.segments.length > 1) for (const sg of this.segments) add(this.rows.filter(r => r.segment === sg).length, "em " + sg);
        if (this.hasDays) add(this.rows.filter(r => (r.days || 0) > s.dias.alerta.value).length, `acima de ${INT.format(s.dias.alerta.value)} dias`, "xp-nm__kpi--bad");
    }

    private visibleRows(): Row[] {
        const q = normalize(this.query);
        const lim = this.settings.dias.atencao.value;
        let list = this.rows.filter(r => (this.segment === null || r.segment === this.segment)
            && (!this.overOnly || (r.days || 0) > lim)
            && (!q || r.text.indexOf(q) >= 0));
        const sort = this.sort;
        const col = sort ? this.cols.find(c => c.key === sort.key) : null;
        if (sort && col) {
            const dir = sort.desc ? -1 : 1;
            list = list.slice().sort((a, b) => {
                const x = sortValue(a.cells[col.src]), y = sortValue(b.cells[col.src]);
                if (x === y) return a.index - b.index;
                if (x === null) return 1;
                if (y === null) return -1;
                return (x < y ? -1 : 1) * dir;
            });
        }
        return list;
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        this.rowEls = [];
        const all = this.visibleRows();
        const list = all.slice(0, this.shown);
        clear(this.foot);
        this.foot.appendChild(el("span", "", all.length ? `1–${INT.format(list.length)} de ${INT.format(all.length)}` : ""));
        if (all.length > list.length) {
            const more = el("button", "xp-nm__more", `Mostrar mais ${INT.format(Math.min(this.pageSize(), all.length - list.length))}`);
            more.addEventListener("click", () => { this.shown += this.pageSize(); this.renderTable(); });
            this.foot.appendChild(more);
        }
        if (this.loading) this.foot.appendChild(el("span", "xp-nm__loading", "Carregando mais aplicações…"));
        this.foot.style.display = all.length || this.loading ? "" : "none";
        const avail = Math.max(80, this.height - this.toolbar.offsetHeight - this.kpis.offsetHeight - this.foot.offsetHeight - 14);
        this.wrap.style.height = avail + "px";

        if (!this.cols.length) {
            this.wrap.appendChild(el("div", "xp-nm__empty", "Arraste os campos para Colunas (e, se quiser, Link, Segmento, Situação e Dias)."));
            return;
        }
        const table = el("table", "xp-nm__table");
        const hr = el("tr", "");
        for (const c of this.cols) {
            const th = el("th", c.kind === "dias" || c.kind === "sla" || (c.kind === "texto" && c.isDate) ? "xp-nm__r" : "");
            if (c.kind === "link") { th.textContent = c.title; hr.appendChild(th); continue; }
            const on = this.sort && this.sort.key === c.key;
            const b = el("button", "xp-nm__sort" + (on ? " xp-nm__sort--on" : ""), c.title);
            if (on) b.appendChild(el("span", "", this.sort.desc ? " ↓" : " ↑"));
            b.addEventListener("click", e => {
                e.stopPropagation();
                // 1º clique: maior/Z primeiro; 2º: menor/A primeiro; 3º: ordem original.
                if (!this.sort || this.sort.key !== c.key) this.sort = { key: c.key, desc: true };
                else if (this.sort.desc) this.sort = { key: c.key, desc: false };
                else this.sort = { key: "", desc: false };
                this.reset();
                this.renderTable();
            });
            th.appendChild(b);
            th.setAttribute("aria-sort", on ? (this.sort.desc ? "descending" : "ascending") : "none");
            hr.appendChild(th);
        }
        const thead = el("thead", "");
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = el("tbody", "");
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-nm__none", this.query ? `Ninguém encontrado para "${this.query}"` : "Nenhuma aplicação com esses filtros");
            td.setAttribute("colspan", String(this.cols.length));
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        const firstText = this.cols.find(c => c.kind === "texto");
        for (const r of list) {
            const tr = el("tr", "xp-nm__row");
            tr.tabIndex = 0;
            for (const c of this.cols) {
                const v = r.cells[c.src];
                const td = el("td", "");
                if (c.kind === "link") {
                    const url = this.url(v);
                    if (url) {
                        const a = el("button", "xp-nm__link", "Abrir ↗");
                        a.title = url;
                        a.addEventListener("click", e => { e.stopPropagation(); this.host.launchUrl(url); });
                        td.appendChild(a);
                    } else td.textContent = asText(v) || "—";
                } else if (c.kind === "dias" || c.kind === "sla") {
                    td.className = "xp-nm__r";
                    const d = num(v);
                    if (d === null) td.textContent = "—";
                    else {
                        const cls = d > s.dias.alerta.value ? "bad" : d > s.dias.atencao.value ? "warn" : "ok";
                        td.appendChild(el("span", "xp-nm__days xp-nm__days--" + cls, `${INT.format(d)} ${s.textos.unidade.value}`.trim()));
                    }
                } else if (c.kind === "situacao") {
                    const t = asText(v);
                    if (t) td.appendChild(el("span", "xp-nm__pill", t)); else td.textContent = "—";
                } else {
                    const t = fmtCell(v, c.isDate);
                    if (c.isDate) td.className = "xp-nm__r";
                    if (c === firstText) td.classList.add("xp-nm__strong");
                    highlight(td, t || "—", q);
                    td.title = t;
                }
                tr.appendChild(td);
            }
            const pick = (multi: boolean) => this.selectionManager.select(r.id, multi).then(ids => this.paint(ids as ISelectionId[]));
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
        this.wrap.appendChild(table);
        this.paint(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    // CSV com ";" e BOM (abre certo no Excel em português). Depende de "downloads de visuais personalizados" liberado no Power BI.
    private exportCsv(btn: HTMLElement) {
        const header = this.cols.map(c => c.title);
        const lines = [header];
        for (const r of this.visibleRows()) {
            lines.push(this.cols.map(c => {
                const v = r.cells[c.src];
                if (c.kind === "link") return this.url(v) || asText(v);
                if (c.kind === "dias" || c.kind === "sla") { const d = num(v); return d === null ? "" : String(d).replace(".", ","); }
                if (typeof v === "number" && !c.isDate) return String(v).replace(".", ",");
                return fmtCell(v, c.isDate);
            }));
        }
        const csv = "\uFEFF" + lines.map(l => l.map(x => /[";\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x).join(";")).join("\r\n");
        const fail = () => { btn.textContent = "Use ⋯ → Exportar dados"; setTimeout(() => { btn.textContent = "⤓ Exportar"; }, 4000); };
        try {
            const ds = this.host.downloadService;
            if (!ds) { fail(); return; }
            ds.exportVisualsContent(csv, "tabela-nominal.csv", "csv", "Tabela nominal").then(ok => { if (!ok) fail(); }).catch(fail);
        } catch { fail(); }
    }

    // URL direta (https…) ou montada pelo modelo com {valor}.
    private url(v: powerbi.PrimitiveValue): string | null {
        const t = asText(v);
        if (!t) return null;
        if (/^https:\/\//i.test(t)) return t;
        const model = (this.settings.link.modelo.value || "").trim();
        if (model && model.indexOf("{valor}") >= 0 && /^https:\/\//i.test(model)) return model.replace("{valor}", encodeURIComponent(t));
        return null;
    }

    private paint(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rowEls) {
            const on = any && ids.some(id => id.equals(r.id));
            r.el.classList.toggle("xp-nm__row--dim", any && !on);
            r.el.classList.toggle("xp-nm__row--sel", !!on);
        }
    }
}

function clean(name: string): string {
    const parts = (name || "").split("|");
    return parts[parts.length - 1].trim();
}
function num(v: powerbi.PrimitiveValue): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
}
function asText(v: powerbi.PrimitiveValue): string {
    return v === null || v === undefined ? "" : String(v).trim();
}
function fmtCell(v: powerbi.PrimitiveValue, isDate: boolean): string {
    if (v === null || v === undefined || v === "") return "";
    if (v instanceof Date || (isDate && typeof v === "string")) {
        const d = v instanceof Date ? v : new Date(v);
        if (!isNaN(d.getTime())) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    if (typeof v === "number") return INT.format(v);
    return String(v);
}
function sortValue(v: powerbi.PrimitiveValue): number | string | null {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return v.getTime();
    if (typeof v === "number") return v;
    return normalize(String(v));
}
function pad(n: number): string { return String(n).padStart(2, "0"); }
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
