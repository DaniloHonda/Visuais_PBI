"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;
import DataViewValueColumn = powerbi.DataViewValueColumn;

import { CompositeSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";

interface Part {
    label: string;
    color: string;
    format: string;
}

interface Row {
    index: number;
    label: string;
    values: (number | null)[];
    total: number;
    indicator: number | null;
    selectionId: ISelectionId;
}

type Order = "processo" | "total" | "parte2" | "indicador";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private list: HTMLElement;
    private insight: HTMLElement;
    private summary: HTMLElement;
    private settings: CompositeSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;

    private rows: Row[] = [];
    private parts: Part[] = [];
    private indicatorFormat = "";
    private hasTotal = false;
    private rowEls: { el: HTMLElement; id: ISelectionId }[] = [];

    // Estado das ferramentas: vive enquanto o relatório está aberto.
    private search = "";
    private onlyWithData: boolean | null = null;
    private order: Order | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = this.el("div", "xp-cbar");
        this.toolbar = this.el("div", "xp-cbar__toolbar");
        this.list = this.el("div", "xp-cbar__list");
        this.insight = this.el("div", "xp-cbar__insight");
        this.summary = this.el("div", "xp-cbar__summary");
        this.root.appendChild(this.toolbar);
        this.root.appendChild(this.summary);
        this.root.appendChild(this.list);
        this.root.appendChild(this.insight);
        options.element.appendChild(this.root);
        this.list.addEventListener("click", () => {
            this.selectionManager.clear().then(() => this.paintSelection([]));
        });
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => this.paintSelection(ids));
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(CompositeSettings, dataView);
            if (this.onlyWithData === null) this.onlyWithData = this.settings.ferramentas.soComDadosInicial.value;
            if (this.order === null) this.order = String(this.settings.pareto.ordemInicial.value.value) === "total" ? "total" : "processo";
            this.read(dataView);
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private read(dataView: DataView | undefined) {
        const s = this.settings;
        this.rows = [];
        this.parts = [];
        this.insight.textContent = "";
        const cat = dataView && dataView.categorical;
        const categories = cat && cat.categories && cat.categories[0];
        const values: DataViewValueColumn[] = (cat && cat.values) ? Array.from(cat.values) : [];
        const byRole = (role: string) => values.filter(v => v.source.roles && v.source.roles[role]);
        const partCols = byRole("partes").slice(0, 5);
        const totalCol = byRole("total")[0];
        const indicatorCol = byRole("indicador")[0];
        const insightCol = byRole("destaque")[0];
        if (!categories || partCols.length === 0) return;

        const colors = [s.barras.cor1, s.barras.cor2, s.barras.cor3, s.barras.cor4, s.barras.cor5].map(c => c.value.value);
        const names = [s.rotulos.rotulo1, s.rotulos.rotulo2, s.rotulos.rotulo3, s.rotulos.rotulo4, s.rotulos.rotulo5].map(t => (t.value || "").trim());
        this.parts = partCols.map((c, i) => ({
            label: names[i] || cleanName(c.source.displayName),
            color: colors[i],
            format: c.source.format || "#,0"
        }));
        this.hasTotal = !!totalCol;
        this.indicatorFormat = indicatorCol ? indicatorCol.source.format || "0%" : "";

        this.rows = categories.values.map((c, i) => {
            const vals = partCols.map(col => asNumber(col.values[i]));
            const sum = vals.reduce<number>((a, v) => a + (v || 0), 0);
            const total = totalCol ? asNumber(totalCol.values[i]) || 0 : sum;
            return {
                index: i,
                label: c === null || c === undefined ? "(vazio)" : String(c),
                values: vals,
                total,
                indicator: indicatorCol ? asNumber(indicatorCol.values[i]) : null,
                selectionId: this.host.createSelectionIdBuilder().withCategory(categories, i).createSelectionId()
            };
        });

        if (insightCol) {
            const text = insightCol.values.map(v => (v === null || v === undefined ? "" : String(v).trim())).find(v => v !== "");
            if (text) this.insight.dataset.text = text; else delete this.insight.dataset.text;
        } else {
            delete this.insight.dataset.text;
        }
    }

    private render() {
        const s = this.settings;
        this.root.style.fontFamily = xpFont;
        this.renderToolbar();
        this.renderSummary();
        this.renderList();

        const text = this.insight.dataset.text;
        while (this.insight.firstChild) this.insight.removeChild(this.insight.firstChild);
        if (s.destaque.mostrar.value && text && this.rows.length) {
            this.insight.style.display = "block";
            this.insight.style.background = this.host.colorPalette.isHighContrast ? "transparent" : s.destaque.fundo.value.value;
            appendBold(this.insight, text);
        } else {
            this.insight.style.display = "none";
        }
    }

    private renderToolbar() {
        const s = this.settings;
        while (this.toolbar.firstChild) this.toolbar.removeChild(this.toolbar.firstChild);
        if (!this.rows.length) { this.toolbar.style.display = "none"; return; }
        this.toolbar.style.display = "flex";

        if (s.ferramentas.busca.value) {
            const input = document.createElement("input");
            input.type = "search";
            input.className = "xp-cbar__search";
            input.placeholder = "Buscar";
            input.value = this.search;
            input.setAttribute("aria-label", "Buscar linha");
            input.addEventListener("input", () => { this.search = input.value; this.renderList(); });
            input.addEventListener("click", e => e.stopPropagation());
            input.addEventListener("keydown", e => e.stopPropagation());
            this.toolbar.appendChild(input);
        }
        if (s.ferramentas.soComDados.value) {
            const chip = this.el("button", "xp-cbar__chip" + (this.onlyWithData ? " xp-cbar__chip--on" : ""), (this.onlyWithData ? "✓ " : "") + "Só com movimento");
            chip.setAttribute("aria-pressed", String(!!this.onlyWithData));
            chip.addEventListener("click", e => {
                e.stopPropagation();
                this.onlyWithData = !this.onlyWithData;
                this.renderToolbar();
                this.renderList();
            });
            this.toolbar.appendChild(chip);
        }
        if (s.ferramentas.ordenacao.value) {
            const select = document.createElement("select");
            select.className = "xp-cbar__chip xp-cbar__select" + (this.order !== "processo" ? " xp-cbar__chip--on" : "");
            select.setAttribute("aria-label", "Ordem das linhas");
            const opts: [Order, string][] = [["processo", "Ordem: original"], ["total", "Ordem: maior total"]];
            if (this.parts[1]) opts.push(["parte2", `Ordem: mais ${this.parts[1].label.toLowerCase()}`]);
            if (this.rows.some(r => r.indicator !== null)) opts.push(["indicador", "Ordem: menor indicador"]);
            for (const [value, label] of opts) {
                const o = document.createElement("option");
                o.value = value;
                o.textContent = label;
                if (value === this.order) o.selected = true;
                select.appendChild(o);
            }
            select.addEventListener("click", e => e.stopPropagation());
            select.addEventListener("change", () => {
                this.order = select.value as Order;
                this.renderToolbar();
                this.renderSummary();
                this.renderList();
            });
            this.toolbar.appendChild(select);
        }
        if (s.barras.mostrarLegenda.value && this.parts.length > 1) {
            const legend = this.el("div", "xp-cbar__legend");
            for (const p of this.parts) {
                const item = this.el("span", "xp-cbar__legend-item");
                const sw = this.el("span", "xp-cbar__swatch");
                sw.style.background = this.host.colorPalette.isHighContrast ? this.host.colorPalette.foreground.value : p.color;
                item.appendChild(sw);
                item.appendChild(document.createTextNode(p.label));
                legend.appendChild(item);
            }
            this.toolbar.appendChild(legend);
        }
    }

    // Linha de resumo: total geral, parte em destaque e, no ranking, quantos itens fazem o corte.
    private renderSummary() {
        const s = this.settings;
        while (this.summary.firstChild) this.summary.removeChild(this.summary.firstChild);
        const pareto = this.paretoInfo();
        const show = s.resumo.mostrar.value && this.rows.length > 0;
        if (!show && !(pareto && pareto.cutCount > 0 && this.order === "total")) { this.summary.style.display = "none"; return; }
        this.summary.style.display = "flex";
        const fmt = { format: (v: number) => fmtNum(v, "#,0") };
        const grand = this.rows.reduce((a, r) => a + r.total, 0);
        if (show) {
            const tot = this.el("span", "xp-cbar__sum-item");
            tot.appendChild(this.el("strong", "", fmt.format(grand)));
            tot.appendChild(document.createTextNode(" " + s.resumo.textoTotal.value));
            this.summary.appendChild(tot);
            const k = Number(s.resumo.nota.value.value) - 1;
            if (k >= 0 && this.parts[k]) {
                const v = this.rows.reduce((a, r) => a + (r.values[k] || 0), 0);
                const item = this.el("span", "xp-cbar__sum-item");
                item.appendChild(this.el("strong", "", fmt.format(v)));
                const label = (s.resumo.textoNota.value || "").trim() || this.parts[k].label.toLowerCase();
                item.appendChild(document.createTextNode(` ${label} (${pctText(grand ? v / grand : 0)} do total)`));
                this.summary.appendChild(item);
            }
        }
        if (pareto && pareto.cutCount > 0 && this.order === "total") {
            const n = pareto.cutCount;
            const head = this.el("span", "xp-cbar__sum-pareto",
                `${n} ${n === 1 ? singular(s.pareto.item.value) : s.pareto.item.value} = ${Math.round(pareto.cutShare * 100)}% ${s.pareto.medida.value}`.trim());
            this.summary.appendChild(head);
        }
    }

    // % do total e acumulado na ordem do maior total (sobre todas as linhas, sem a busca).
    private paretoInfo(): { share: Map<number, number>; acc: Map<number, number>; cutCount: number; cutShare: number } | null {
        if (!this.settings.pareto.ativar.value || !this.rows.length) return null;
        const grand = this.rows.reduce((a, r) => a + r.total, 0);
        const share = new Map<number, number>(), acc = new Map<number, number>();
        const sorted = this.rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total || a.index - b.index);
        const cut = Math.min(100, Math.max(1, this.settings.pareto.corte.value)) / 100;
        let run = 0, cutCount = 0, cutShare = 0;
        for (const r of sorted) {
            run += r.total;
            share.set(r.index, grand ? r.total / grand : 0);
            acc.set(r.index, grand ? run / grand : 0);
            if (cutCount === 0 && grand && run / grand >= cut - 1e-9) { cutCount = sorted.indexOf(r) + 1; cutShare = run / grand; }
        }
        return { share, acc, cutCount, cutShare };
    }

    private renderList() {
        const s = this.settings;
        const palette = this.host.colorPalette;
        const hc = palette.isHighContrast;
        while (this.list.firstChild) this.list.removeChild(this.list.firstChild);
        this.rowEls = [];
        this.list.style.gap = Math.max(0, s.barras.espacamento.value) + "px";

        if (!this.rows.length) {
            this.list.appendChild(this.el("div", "xp-cbar__empty", "Arraste uma coluna para \"Linhas\" e ao menos uma medida para \"Partes da barra\"."));
            return;
        }

        const q = normalize(this.search);
        let rows = this.rows.filter(r => (!q || normalize(r.label).indexOf(q) >= 0) && (!this.onlyWithData || r.total > 0));
        if (this.order === "total") rows = rows.slice().sort((a, b) => b.total - a.total || a.index - b.index);
        if (this.order === "parte2") rows = rows.slice().sort((a, b) => (b.values[1] || 0) - (a.values[1] || 0) || a.index - b.index);
        if (this.order === "indicador") rows = rows.slice().sort((a, b) => nullsLast(a.indicator, b.indicator) || a.index - b.index);

        if (!rows.length) {
            this.list.appendChild(this.el("div", "xp-cbar__empty", "Nenhuma linha encontrada."));
            return;
        }

        const max = Math.max(1, ...this.rows.map(r => r.total));
        const fontSize = Math.max(9, s.rotulos.tamanho.value);
        const height = Math.max(8, s.barras.altura.value);
        const pareto = this.paretoInfo();
        const ranking = !!pareto && this.order === "total";
        const notaIdx = Number(s.resumo.nota.value.value) - 1;
        const hasIndicator = !!pareto || this.rows.some(r => r.indicator !== null);
        const columns = `${Math.max(60, s.rotulos.largura.value)}px minmax(0, 1fr)` + (hasIndicator ? (pareto ? " 104px" : " 84px") : "");
        const totalFormatter = { format: (v: number) => fmtNum(v, "#,0") };
        const indFormatter = { format: (v: number) => fmtNum(v, this.indicatorFormat || "0%") };

        for (const r of rows) {
            const row = this.el("div", "xp-cbar__row");
            row.style.gridTemplateColumns = columns;

            const name = this.el("div", "xp-cbar__name");
            const title = this.el("div", "xp-cbar__label", r.label);
            title.style.fontSize = fontSize + "px";
            title.title = r.label;
            name.appendChild(title);
            if (this.hasTotal) name.appendChild(this.el("div", "xp-cbar__sub", `${totalFormatter.format(r.total)} ${s.rotulos.textoTotal.value}`.trim()));
            row.appendChild(name);

            const lane = this.el("div", "xp-cbar__lane");
            const parts = r.values.map((v, i) => ({ v: v || 0, p: this.parts[i] })).filter(x => x.v > 0);
            if (r.total > 0 && parts.length) {
                const bar = this.el("div", "xp-cbar__bar");
                bar.style.height = height + "px";
                bar.style.width = `max(${(r.total / max * 100).toFixed(2)}%, 6px)`;
                for (const x of parts) {
                    const seg = this.el("div", "xp-cbar__seg");
                    seg.style.flex = String(x.v);
                    seg.style.background = hc ? palette.foreground.value : x.p.color;
                    seg.title = `${x.p.label}: ${fmtNum(x.v, x.p.format)}`;
                    bar.appendChild(seg);
                }
                const line = this.el("div", "xp-cbar__barline");
                line.appendChild(bar);
                const nv = notaIdx >= 0 ? r.values[notaIdx] || 0 : 0;
                if (nv > 0 && this.parts[notaIdx]) {
                    const label = (s.resumo.textoNota.value || "").trim() || this.parts[notaIdx].label.toLowerCase();
                    const note = this.el("span", "xp-cbar__note", `${totalFormatter.format(nv)} de ${totalFormatter.format(r.total)} ${label} (${pctText(nv / r.total)})`);
                    note.style.color = hc ? palette.foreground.value : this.parts[notaIdx].color;
                    line.appendChild(note);
                }
                lane.appendChild(line);
                if (s.barras.mostrarDetalhe.value) {
                    const detail = parts.map(x => `${fmtNum(x.v, x.p.format)} ${(x.v === 1 ? singular(x.p.label) : x.p.label).toLowerCase()}`).join(" · ");
                    lane.appendChild(this.el("div", "xp-cbar__detail", detail));
                }
            } else {
                const empty = this.el("div", "xp-cbar__none", s.barras.textoVazio.value);
                empty.style.height = height + "px";
                lane.appendChild(empty);
            }
            row.appendChild(lane);

            if (pareto) {
                const ind = this.el("div", "xp-cbar__ind");
                ind.appendChild(this.el("div", "xp-cbar__ind-value xp-cbar__ind-value--sm", r.total > 0 ? totalFormatter.format(r.total) : "—"));
                const sh = pareto.share.get(r.index);
                const ac = pareto.acc.get(r.index);
                ind.appendChild(this.el("div", "xp-cbar__ind-label", sh === undefined ? "" : ranking && ac !== undefined ? `${pctText(sh)} · acum. ${pctText(ac)}` : `${pctText(sh)} do total`));
                row.appendChild(ind);
                const pos = ranking ? Array.from(pareto.acc.keys()).indexOf(r.index) : -1;
                if (pos >= 0 && pos < pareto.cutCount) row.classList.add("xp-cbar__row--top");
            } else if (hasIndicator) {
                const ind = this.el("div", "xp-cbar__ind");
                const val = this.el("div", "xp-cbar__ind-value", r.indicator === null ? "—" : indFormatter.format(r.indicator));
                if (r.indicator === null) val.classList.add("xp-cbar__ind-value--none");
                ind.appendChild(val);
                ind.appendChild(this.el("div", "xp-cbar__ind-label", s.indicador.texto.value));
                row.appendChild(ind);
            }

            row.setAttribute("role", "listitem");
            row.setAttribute("aria-label", `${r.label}: ${parts.map(x => `${x.v} ${x.p.label}`).join(", ") || s.barras.textoVazio.value}`);
            row.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.selectionManager.select(r.selectionId, e.ctrlKey || e.metaKey).then(ids => this.paintSelection(ids as ISelectionId[]));
            });
            row.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(r.selectionId, { x: e.clientX, y: e.clientY });
            });
            this.list.appendChild(row);
            this.rowEls.push({ el: row, id: r.selectionId });
            if (ranking && pareto && pareto.cutCount > 0 && Array.from(pareto.acc.keys()).indexOf(r.index) === pareto.cutCount - 1) {
                const cut = this.el("div", "xp-cbar__cut");
                cut.appendChild(this.el("span", "", `${Math.round(pareto.cutShare * 100)}% acumulado`));
                this.list.appendChild(cut);
            }
        }
        this.list.setAttribute("role", "list");
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rowEls) {
            r.el.style.opacity = !any || ids.some(id => id.equals(r.id)) ? "1" : "0.4";
        }
    }

    private el(tag: string, className: string, text?: string): HTMLElement {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
}

function asNumber(v: powerbi.PrimitiveValue): number | null {
    return typeof v === "number" && isFinite(v) ? v : null;
}

// Números e % sempre no padrão brasileiro (1.234,5 e 71,1%); moeda segue o formatador do Power BI.
function fmtNum(v: number, format: string): string {
    const f = format || "#,0";
    if (/[$R]/.test(f)) return valueFormatter.create({ format: f }).format(v);
    const dec = /\.(0+)/.exec(f);
    const n = dec ? dec[1].length : 0;
    const pct = f.indexOf("%") >= 0;
    return (pct ? v * 100 : v).toLocaleString("pt-BR", { minimumFractionDigits: n, maximumFractionDigits: n }) + (pct ? "%" : "");
}

function pctText(v: number): string {
    const p = v * 100;
    return (p > 0 && p < 1 ? p.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : String(Math.round(p))) + "%";
}

function nullsLast(a: number | null, b: number | null): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
}

// "Esteira | Aprovados" → "Aprovados"
function cleanName(name: string): string {
    const parts = (name || "").split("|");
    return parts[parts.length - 1].trim();
}

// "rejeitados" → "rejeitado" quando o valor é 1; nomes compostos ficam como estão.
function singular(label: string): string {
    return /^\S+s$/i.test(label) && !/ss$/i.test(label) ? label.slice(0, -1) : label;
}

function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Texto da medida com **negrito**, montado sem innerHTML.
function appendBold(target: HTMLElement, text: string) {
    text.split("**").forEach((piece, i) => {
        if (!piece) return;
        if (i % 2 === 1) {
            const b = document.createElement("strong");
            b.textContent = piece;
            target.appendChild(b);
        } else {
            target.appendChild(document.createTextNode(piece));
        }
    });
}

export { xpColors };
