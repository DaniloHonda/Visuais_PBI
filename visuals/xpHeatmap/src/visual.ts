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

import { HeatmapSettings } from "./settings";
import { xpFont } from "./xpTheme";
import { mixOklab, mixLab, textOn } from "./color";

interface Row {
    index: number;
    label: string;
    values: (number | null)[];
    bases: (number | null)[];
    total: number;
    ordem: number | null;
    grupo: string;
    rowIds: ISelectionId[];
    cellIds: ISelectionId[][];
}

// Ordem: coluna (índice, -1 = total) e direção; null = ordem original.
type Sort = { col: number; desc: boolean } | null;
type Mode = "num" | "pct" | "taxa";

const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private wrap: HTMLElement;
    private note: HTMLElement;
    private tip: HTMLElement;
    private settings: HeatmapSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private columns: string[] = [];
    private colDetails: string[] = [];
    private rows: Row[] = [];
    private rowName = "";
    private cellEls: { el: HTMLElement; ids: ISelectionId[] }[] = [];
    private query = "";
    private onlyMoving: boolean | null = null;
    private mode: Mode | null = null;
    private hasBase = false;
    private colRates: (number | null)[] = [];
    private sort: Sort = null;
    private height = 0;
    private hasGrupo = false;
    private byGroup = false;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-hm");
        this.toolbar = el("div", "xp-hm__bar");
        this.wrap = el("div", "xp-hm__wrap");
        this.note = el("div", "xp-hm__note");
        this.tip = el("div", "xp-hm__tip");
        this.tip.style.display = "none";
        this.root.append(this.toolbar, this.wrap, this.note, this.tip);
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
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(HeatmapSettings, dv);
            if (this.onlyMoving === null) this.onlyMoving = this.settings.comportamento.soMovimento.value;
            this.height = options.viewport.height;
            this.read(dv);
            if (this.mode === null) {
                const ini = String(this.settings.taxa.modoInicial.value.value);
                this.mode = ini === "taxa" && this.hasBase ? "taxa" : this.settings.comportamento.modoPct.value ? "pct" : "num";
            }
            if (this.mode === "taxa" && !this.hasBase) this.mode = "num";
            this.root.style.fontFamily = xpFont;
            this.root.style.setProperty("--xp-hm-alert", this.settings.alerta.cor.value.value);
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

    // Cada coluna de valores é um grupo (um valor do campo "Colunas").
    private read(dv: DataView | undefined) {
        this.columns = [];
        this.colDetails = [];
        this.rows = [];
        const cat = dv && dv.categorical;
        const rowsCat = cat && cat.categories && cat.categories[0];
        if (!rowsCat || !cat.values) return;
        this.rowName = rowsCat.source.displayName;
        const cols = cat.values.filter(v => v.source.roles && v.source.roles["valor"]);
        const baseCols = cat.values.filter(v => v.source.roles && v.source.roles["base"]);
        this.hasBase = baseCols.length > 0;
        this.columns = cols.map(c => c.source.groupName === null || c.source.groupName === undefined ? c.source.displayName : String(c.source.groupName));
        // A segunda medida (base da taxa) vem no mesmo grupo de cada coluna.
        const baseFor = cols.map(c => baseCols.find(b => String(b.source.groupName) === String(c.source.groupName)) || null);
        // Texto de detalhe da coluna (ex.: etapas do grupo): primeiro valor preenchido do grupo.
        const detCols = cat.values.filter(v => v.source.roles && v.source.roles["detalhe"]);
        // Ordem e grupo da linha: medidas repetidas em cada coluna; vale o primeiro valor preenchido.
        const ordCols = cat.values.filter(v => v.source.roles && v.source.roles["ordem"]);
        const grpCols = cat.values.filter(v => v.source.roles && v.source.roles["grupo"]);
        this.hasGrupo = grpCols.length > 0;
        if (!this.hasGrupo) this.byGroup = false;
        const first = (list: powerbi.DataViewValueColumn[], i: number) => {
            for (const c of list) { const v = c.values[i]; if (v !== null && v !== undefined && String(v).trim() !== "") return v; }
            return null;
        };
        this.colDetails = cols.map(c => {
            const d = detCols.find(x => String(x.source.groupName) === String(c.source.groupName));
            const v = d ? d.values.find(x => x !== null && x !== undefined && String(x).trim() !== "") : null;
            return v === null || v === undefined ? "" : String(v).trim();
        });
        for (let i = 0; i < rowsCat.values.length; i++) {
            const raw = rowsCat.values[i];
            const values = cols.map(c => num(c.values[i]));
            const bases = baseFor.map(b => (b ? num(b.values[i]) : null));
            const g = first(grpCols, i);
            const rowId = this.host.createSelectionIdBuilder().withCategory(rowsCat, i).createSelectionId();
            this.rows.push({
                index: i,
                label: raw === null || raw === undefined || raw === "" ? "(vazio)" : String(raw),
                values,
                bases,
                total: values.reduce((t: number, v) => t + (v || 0), 0),
                ordem: num(first(ordCols, i)),
                grupo: g === null ? "" : String(g).trim(),
                rowIds: [rowId],
                cellIds: cols.map(c => [this.host.createSelectionIdBuilder().withCategory(rowsCat, i).withSeries(cat.values, c).createSelectionId()])
            });
        }
    }

    // Taxa da célula: valor ÷ (valor + base) ou valor ÷ base, conforme Formatar → Taxa.
    private rate(v: number | null, b: number | null): { r: number | null; n: number } {
        const a = v || 0, base = b || 0;
        const den = String(this.settings.taxa.formula.value.value) === "base" ? base : a + base;
        return { r: den > 0 ? a / den : null, n: den };
    }

    private computeColRates(rows: Row[]) {
        this.colRates = this.columns.map((_, i) => {
            let a = 0, b = 0;
            for (const r of rows) { a += r.values[i] || 0; b += r.bases[i] || 0; }
            return this.rate(a, b).r;
        });
    }

    private byRow(): boolean { return String(this.settings.taxa.comparar.value.value) === "linha"; }

    // Taxa da linha inteira (todas as colunas): a "média da etapa" quando a comparação é pela linha.
    private rowRate(r: Row): number | null {
        let a = 0, b = 0;
        r.values.forEach((v, i) => { a += v || 0; b += r.bases[i] || 0; });
        return this.rate(a, b).r;
    }

    private avgFor(r: Row, i: number): number | null { return this.byRow() ? this.rowRate(r) : this.colRates[i]; }

    // Ordem fixa: pela medida de ordem (sem ordem vai para o fim), empate pela ordem que veio do Power BI.
    private ordered(list: Row[]): Row[] {
        const k = (r: Row) => (r.ordem === null ? Number.MAX_SAFE_INTEGER : r.ordem);
        return list.slice().sort((a, b) => (k(a) - k(b)) || (a.index - b.index));
    }

    // Visão por grupo: soma as linhas de cada grupo, na ordem da primeira linha do grupo.
    private groupRows(): Row[] {
        const map = new Map<string, Row>();
        const out: Row[] = [];
        for (const r of this.ordered(this.rows)) {
            const key = r.grupo || "(sem grupo)";
            let g = map.get(key);
            if (!g) {
                g = { index: out.length, label: key, values: r.values.map(() => null), bases: r.bases.map(() => null), total: 0,
                    ordem: r.ordem, grupo: key, rowIds: [], cellIds: r.cellIds.map(() => []) };
                map.set(key, g);
                out.push(g);
            }
            const grp = g;
            r.values.forEach((v, i) => { if (v !== null) grp.values[i] = (grp.values[i] || 0) + v; });
            r.bases.forEach((v, i) => { if (v !== null) grp.bases[i] = (grp.bases[i] || 0) + v; });
            grp.total += r.total;
            grp.rowIds.push(...r.rowIds);
            r.cellIds.forEach((ids, i) => grp.cellIds[i].push(...ids));
        }
        return out;
    }

    private baseRows(): Row[] { return this.byGroup ? this.groupRows() : this.rows; }

    // Colunas visíveis: com "Só com movimento", some a coluna sem valor e sem base em nenhuma linha.
    private visibleCols(rows: Row[]): number[] {
        const all = this.columns.map((_, i) => i);
        if (!this.onlyMoving || !this.settings.comportamento.ocultarColunas.value) return all;
        const keep = all.filter(i => rows.some(r => (r.values[i] || 0) > 0 || (r.bases[i] || 0) > 0));
        return keep.length ? keep : all;
    }

    private alertIndex(): number {
        if (this.mode === "taxa") return -1;
        const s = this.settings.alerta;
        if (this.byRow()) return -1;
        const name = (s.coluna.value || "").trim().toLowerCase();
        if (name) {
            const i = this.columns.findIndex(c => c.trim().toLowerCase() === name);
            if (i >= 0) return i;
        }
        return s.ultima.value ? this.columns.length - 1 : -1;
    }

    private renderToolbar() {
        clear(this.toolbar);
        if (!this.settings.comportamento.busca.value) { this.toolbar.style.display = "none"; return; }
        this.toolbar.style.display = "";
        const search = el("label", "xp-hm__search");
        search.appendChild(el("span", "xp-hm__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Buscar " + (this.settings.textos.colLinhas.value || this.rowName).toLowerCase();
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.toolbar.appendChild(search);

        const moving = el("button", "xp-hm__btn" + (this.onlyMoving ? " xp-hm__btn--on" : ""), "Só com movimento");
        moving.setAttribute("aria-pressed", String(!!this.onlyMoving));
        moving.addEventListener("click", () => { this.onlyMoving = !this.onlyMoving; this.renderToolbar(); this.renderTable(); });
        this.toolbar.appendChild(moving);

        if (this.hasGrupo && this.settings.comportamento.botaoGrupo.value) {
            const gseg = el("div", "xp-hm__seg");
            const opts: [boolean, string][] = [[false, this.settings.textos.colLinhas.value || this.rowName], [true, this.settings.textos.rotuloGrupo.value || "Grupo"]];
            for (const [g, label] of opts) {
                const b = el("button", "xp-hm__opt" + (this.byGroup === g ? " xp-hm__opt--on" : ""), label);
                b.setAttribute("aria-pressed", String(this.byGroup === g));
                b.addEventListener("click", () => {
                    if (this.byGroup === g) return;
                    this.byGroup = g;
                    this.sort = null;
                    this.selectionManager.clear();
                    this.renderToolbar();
                    this.renderTable();
                });
                gseg.appendChild(b);
            }
            this.toolbar.appendChild(gseg);
        }

        const seg = el("div", "xp-hm__seg");
        const modes: [Mode, string][] = [["num", this.settings.taxa.rotuloNumeros.value || "Números"]];
        if (this.settings.taxa.mostrarPct.value) modes.push(["pct", "% da linha"]);
        if (this.hasBase) modes.push(["taxa", this.settings.taxa.rotulo.value || "Taxa vs. média"]);
        for (const [m, label] of modes) {
            const b = el("button", "xp-hm__opt" + (this.mode === m ? " xp-hm__opt--on" : ""), label);
            b.setAttribute("aria-pressed", String(this.mode === m));
            b.addEventListener("click", () => { if (this.mode !== m) { this.mode = m; this.renderToolbar(); this.renderTable(); } });
            seg.appendChild(b);
        }
        this.toolbar.appendChild(seg);

        if (this.sort) {
            const reset = el("button", "xp-hm__btn", this.hasOrdem() ? "Ordem do processo" : "Ordem original");
            reset.addEventListener("click", () => { this.sort = null; this.renderToolbar(); this.renderTable(); });
            this.toolbar.appendChild(reset);
        }
    }

    private hasOrdem(): boolean { return this.rows.some(r => r.ordem !== null); }

    private visibleRows(): Row[] {
        const q = normalize(this.query);
        let list = this.ordered(this.baseRows()).filter(r => (!this.onlyMoving || r.total > 0) && (!q || normalize(r.label).indexOf(q) >= 0));
        const sort = this.sort;
        if (sort) {
            const key = (r: Row) => {
                if (sort.col === -2) { const x = this.rowRate(r); return x === null ? -1 : x; }
                if (sort.col < 0) return r.total;
                if (this.mode === "taxa") { const x = this.rate(r.values[sort.col], r.bases[sort.col]).r; return x === null ? -1 : x; }
                const v = r.values[sort.col] || 0;
                return this.mode === "pct" ? (r.total ? v / r.total : 0) : v;
            };
            const pos = new Map<Row, number>();
            list.forEach((r, n) => pos.set(r, n));
            list = list.slice().sort((a, b) => (key(a) === key(b) ? (pos.get(a) || 0) - (pos.get(b) || 0) : (key(a) - key(b)) * (sort.desc ? -1 : 1)));
        }
        return list;
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        this.cellEls = [];
        this.note.textContent = ((this.mode === "taxa" ? s.taxa.rodape.value : s.textos.rodape.value) || "").trim();
        this.note.style.display = this.note.textContent ? "" : "none";
        const alert = this.alertIndex();
        if (alert >= 0 && this.columns[alert]) {
            const mark = el("span", "xp-hm__note-alert", `contorno = ${this.columns[alert]}`);
            if (this.note.textContent) this.note.appendChild(document.createTextNode(" · "));
            this.note.appendChild(mark);
            this.note.style.display = "";
        }
        const avail = Math.max(60, this.height - this.toolbar.offsetHeight - this.note.offsetHeight - 10);
        this.wrap.style.height = avail + "px";

        if (!this.rows.length || !this.columns.length) {
            this.wrap.appendChild(el("div", "xp-hm__empty", "Arraste os campos para Linhas, Colunas e Valor."));
            return;
        }

        const base = this.baseRows();
        this.computeColRates(base);
        const list = this.visibleRows();
        const cols = this.visibleCols(base);
        const showTotal = s.comportamento.mostrarTotal.value;
        const rowAvg = this.mode === "taxa" && this.byRow();
        // Títulos de grupo entre as linhas: só na ordem do processo, sem busca de grupo e fora da visão por grupo.
        const showGroups = this.hasGrupo && !this.byGroup && !this.sort;
        // Escala da cor: maior valor visível (ou maior % da linha).
        let max = 0;
        for (const r of list) cols.forEach(i => { const x = this.cellValue(r.values[i], r); if (x > max) max = x; });

        const table = el("table", "xp-hm__table");
        const head = el("tr", "");
        const rowTitle = this.byGroup ? (s.textos.rotuloGrupo.value || "Grupo") : (s.textos.colLinhas.value || this.rowName);
        head.appendChild(el("th", "xp-hm__th-name", rowTitle));
        const headers: [string, number][] = [];
        if (rowAvg) headers.push([s.textos.rotuloMediaCol.value || "Média", -2]);
        cols.forEach(i => headers.push([this.columns[i], i]));
        if (showTotal) headers.push([s.textos.rotuloTotal.value || "Total", -1]);
        for (const [label, i] of headers) {
            const th = el("th", (alert >= 0 && i === alert ? "xp-hm__th-alert" : "") + (i === -1 ? " xp-hm__th-total" : "") + (i === -2 ? " xp-hm__th-avg" : ""));
            const b = el("button", "xp-hm__sort" + (this.sort && this.sort.col === i ? " xp-hm__sort--on" : ""), label);
            if (this.sort && this.sort.col === i) b.appendChild(el("span", "", this.sort.desc ? " ↓" : " ↑"));
            b.title = "Ordenar por " + label;
            b.addEventListener("click", e => {
                e.stopPropagation();
                // 1º clique: maior primeiro; 2º: menor primeiro; 3º: ordem original.
                if (!this.sort || this.sort.col !== i) this.sort = { col: i, desc: true };
                else if (this.sort.desc) this.sort = { col: i, desc: false };
                else this.sort = null;
                this.renderToolbar();
                this.renderTable();
            });
            th.appendChild(b);
            const detail = i >= 0 ? this.colDetails[i] : "";
            if (detail) {
                const info = el("span", "xp-hm__info", "ⓘ");
                info.setAttribute("aria-label", `${label}: ${detail.replace(/\n/g, ", ")}`);
                info.tabIndex = 0;
                const show = (e: MouseEvent) => {
                    clear(this.tip);
                    this.tip.appendChild(el("div", "xp-hm__tip-head", label));
                    for (const line of detail.split(/\n|;/).map(x => x.trim()).filter(Boolean)) this.tip.appendChild(el("div", "", line));
                    this.placeTip(e);
                };
                info.addEventListener("mousemove", show);
                info.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
                info.addEventListener("click", e => e.stopPropagation());
                th.appendChild(info);
            }
            // Colunas de valor com a mesma largura (a sobra fica com o nome da linha).
            if (i >= 0) th.style.width = Math.floor(64 / Math.max(1, cols.length)) + "%";
            th.setAttribute("aria-sort", this.sort && this.sort.col === i ? (this.sort.desc ? "descending" : "ascending") : "none");
            head.appendChild(th);
        }
        const thead = el("thead", "");
        thead.appendChild(head);
        table.appendChild(thead);

        const tbody = el("tbody", "");
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-hm__none", this.query ? `Nada encontrado para "${this.query}"` : "Sem valores no período");
            td.setAttribute("colspan", String(headers.length + 1));
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        const light = s.cores.clara.value.value, mid = s.cores.meio.value.value, dark = s.cores.escura.value.value;
        // Degradê em três pontos (claro → meio → escuro), escala raiz para os valores pequenos aparecerem.
        const shade = (t: number) => (t < 0.5 ? mixOklab(light, mid, t * 2) : mixOklab(mid, dark, (t - 0.5) * 2));
        let lastGroup: string | null = null;
        for (const r of list) {
            if (showGroups && r.grupo !== lastGroup) {
                lastGroup = r.grupo;
                const gtr = el("tr", "xp-hm__grp");
                const gtd = el("td", "", r.grupo || "Sem grupo");
                gtd.setAttribute("colspan", String(headers.length + 1));
                gtr.appendChild(gtd);
                tbody.appendChild(gtr);
            }
            const tr = el("tr", "");
            const name = el("td", "xp-hm__name");
            name.tabIndex = 0;
            highlight(name, r.label, q);
            name.title = r.label;
            this.bindSelect(name, r.rowIds);
            this.cellEls.push({ el: name, ids: r.rowIds });
            tr.appendChild(name);
            if (rowAvg) {
                const avg = this.rowRate(r);
                tr.appendChild(el("td", "xp-hm__avg-col", avg === null ? "—" : Math.round(avg * 100) + "%"));
            }
            cols.forEach(i => {
                const v = r.values[i];
                const x = this.cellValue(v, r);
                const td = el("td", "xp-hm__cell" + (i === alert && x > 0 ? " xp-hm__cell--alert" : ""));
                if (this.mode === "taxa") {
                    this.paintRate(td, r, i);
                } else if (x > 0) {
                    const bg = shade(max ? Math.sqrt(x / max) : 0);
                    td.style.background = bg;
                    td.style.color = textOn(bg);
                    td.textContent = this.mode === "pct" ? Math.round(x * 100) + "%" : INT.format(x);
                } else {
                    td.classList.add("xp-hm__cell--zero");
                    td.textContent = "—";
                }
                td.addEventListener("mousemove", (e: MouseEvent) => this.showTip(e, r, i));
                td.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
                this.bindSelect(td, r.cellIds[i]);
                this.cellEls.push({ el: td, ids: r.cellIds[i].concat(r.rowIds) });
                tr.appendChild(td);
            });
            if (showTotal) tr.appendChild(el("td", "xp-hm__total", INT.format(r.total)));
            tbody.appendChild(tr);
        }
        if (this.mode === "taxa" && list.length && !rowAvg) {
            const tr = el("tr", "xp-hm__avg");
            tr.appendChild(el("td", "xp-hm__name", s.taxa.rotuloMedia.value || "Média"));
            cols.forEach(i => { const c = this.colRates[i]; tr.appendChild(el("td", "xp-hm__avg-cell", c === null ? "—" : Math.round(c * 100) + "%")); });
            if (showTotal) tr.appendChild(el("td", "xp-hm__total", ""));
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        this.wrap.appendChild(table);
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private cellValue(v: number | null, r: Row): number {
        if (!v) return 0;
        return this.mode === "pct" ? (r.total ? v / r.total : 0) : v;
    }

    // Divergente: teal acima da média da coluna, coral abaixo, cinza dentro da tolerância; pouco volume fica sem cor.
    private paintRate(td: HTMLElement, r: Row, i: number) {
        const t = this.settings.taxa;
        const { r: rate, n } = this.rate(r.values[i], r.bases[i]);
        const avg = this.avgFor(r, i);
        if (rate === null) { td.classList.add("xp-hm__cell--zero"); td.textContent = "—"; return; }
        td.appendChild(document.createTextNode(Math.round(rate * 100) + "%"));
        if (n < t.minimo.value || avg === null) {
            td.classList.add("xp-hm__cell--few");
            return;
        }
        const d = (rate - avg) * 100;
        const sign = Math.round(d) === 0 ? "±0" : (d > 0 ? "+" : "−") + Math.abs(Math.round(d));
        td.appendChild(el("span", "xp-hm__delta", " " + sign));
        const tol = Math.max(0, t.tolerancia.value);
        if (Math.abs(d) <= tol) { td.style.background = "#F2F2F2"; td.style.color = "#121212"; return; }
        const k = Math.min(1, (Math.abs(d) - tol) / Math.max(1, t.escala.value - tol));
        const bg = mixLab("#F2F2F2", d > 0 ? t.acima.value.value : t.abaixo.value.value, 0.2 + 0.8 * k);
        td.style.background = bg;
        td.style.color = textOn(bg);
    }

    private showTip(e: MouseEvent, r: Row, i: number) {
        const v = r.values[i] || 0;
        clear(this.tip);
        if (this.mode === "taxa") {
            const t = this.settings.taxa;
            const { r: rate, n } = this.rate(r.values[i], r.bases[i]);
            const avg = this.avgFor(r, i);
            this.tip.appendChild(el("div", "xp-hm__tip-head", `${r.label} · ${this.columns[i]}`));
            this.tip.appendChild(el("div", "", rate === null ? "Sem decisões" : `${Math.round(rate * 100)}% (${INT.format(v)} de ${INT.format(n)})`));
            if (avg !== null && rate !== null) {
                const d = Math.round((rate - avg) * 100);
                this.tip.appendChild(el("div", "xp-hm__tip-sub", `${this.byRow() ? "Média da linha" : "Média da coluna"}: ${Math.round(avg * 100)}% · ${d === 0 ? "na média" : Math.abs(d) + " p.p. " + (d > 0 ? "acima" : "abaixo")}`));
            }
            if (rate !== null && n < t.minimo.value) this.tip.appendChild(el("div", "xp-hm__tip-sub", `Poucos casos (menos de ${t.minimo.value}): sem cor`));
            this.placeTip(e);
            return;
        }
        this.tip.appendChild(el("div", "xp-hm__tip-head", r.label));
        this.tip.appendChild(el("div", "", `${this.columns[i]}: ${INT.format(v)} ${this.settings.textos.unidade.value}`));
        if (r.total) this.tip.appendChild(el("div", "xp-hm__tip-sub", `${Math.round((v / r.total) * 100)}% de ${INT.format(r.total)} na linha`));
        this.placeTip(e);
    }

    private placeTip(e: MouseEvent) {
        this.tip.style.display = "";
        const box = this.root.getBoundingClientRect();
        let x = e.clientX - box.left + 14;
        if (x + this.tip.offsetWidth > box.width) x = e.clientX - box.left - 14 - this.tip.offsetWidth;
        let y = e.clientY - box.top + 14;
        if (y + this.tip.offsetHeight > box.height) y = e.clientY - box.top - 14 - this.tip.offsetHeight;
        this.tip.style.left = Math.max(0, x) + "px";
        this.tip.style.top = Math.max(0, y) + "px";
    }

    private bindSelect(node: HTMLElement, ids: ISelectionId[]) {
        const id: ISelectionId | ISelectionId[] = ids.length === 1 ? ids[0] : ids;
        const pick = (multi: boolean) => this.selectionManager.select(id, multi).then(ids => this.paintSelection(ids as ISelectionId[]));
        node.addEventListener("click", (e: MouseEvent) => { e.stopPropagation(); pick(e.ctrlKey || e.metaKey); });
        node.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e.ctrlKey || e.metaKey); } });
        node.addEventListener("contextmenu", (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            this.selectionManager.showContextMenu(ids[0] || {}, { x: e.clientX, y: e.clientY });
        });
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const c of this.cellEls) {
            const on = any && c.ids.some(id => ids.some(s => s.equals(id)));
            c.el.classList.toggle("xp-hm__dim", any && !on);
        }
    }
}

function num(v: powerbi.PrimitiveValue): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
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
