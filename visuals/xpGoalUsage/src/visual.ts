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

import { GoalSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";
import { mixOklab } from "./color";

interface Item {
    index: number;
    label: string;
    weight: number;
    share: number;
    amount: number;
    color: string;
    selectionId: ISelectionId;
}

type Order = "maior" | "original";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: GoalSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rowEls: { el: HTMLElement; id: ISelectionId }[] = [];
    private order: Order | null = null;
    private useAlt = false;
    private lastView: DataView | undefined;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = document.createElement("div");
        this.root.className = "xp-goal";
        options.element.appendChild(this.root);
        this.root.addEventListener("click", () => {
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
            this.lastView = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(GoalSettings, this.lastView);
            if (this.order === null) this.order = String(this.settings.lista.ordemInicial.value.value) as Order;
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private render() {
        const s = this.settings;
        const palette = this.host.colorPalette;
        const hc = palette.isHighContrast;
        while (this.root.firstChild) this.root.removeChild(this.root.firstChild);
        this.rowEls = [];
        this.root.style.fontFamily = xpFont;

        const cat = this.lastView && this.lastView.categorical;
        const categories = cat && cat.categories && cat.categories[0];
        const values = (cat && cat.values) ? Array.from(cat.values) : [];
        const byRole = (role: string) => values.filter(v => v.source.roles && v.source.roles[role])[0];
        const pesoCol = byRole("peso"), metaCol = byRole("meta");
        const altCol = byRole("total2");
        if (!altCol) this.useAlt = false;
        const totalCol = this.useAlt && altCol ? altCol : byRole("total");
        if (!categories || !pesoCol || !totalCol) {
            this.root.appendChild(this.el("div", "xp-goal__empty", "Arraste os itens, o \"Peso de cada item\" e o \"Total realizado\"."));
            return;
        }

        // Total e meta não dependem do item: pega o primeiro valor numérico.
        const firstNumber = (vals: powerbi.PrimitiveValue[]) => vals.map(asNumber).find(v => v !== null) as number | undefined;
        const total = firstNumber(totalCol.values) || 0;
        const meta = metaCol ? firstNumber(metaCol.values) || 0 : 0;
        const n = categories.values.length;
        const weights = categories.values.map((_, i) => Math.max(0, asNumber(pesoCol.values[i]) || 0));
        const sumW = weights.reduce((a, v) => a + v, 0);
        const start = s.cores.inicio.value.value, end = s.cores.fim.value.value;

        const items: Item[] = categories.values.map((c, i) => ({
            index: i,
            label: c === null || c === undefined ? "(vazio)" : String(c),
            weight: weights[i],
            share: sumW > 0 ? weights[i] / sumW : 0,
            amount: sumW > 0 ? weights[i] / sumW * total : 0,
            color: hc ? palette.foreground.value : mixOklab(start, end, n > 1 ? i / (n - 1) : 0),
            selectionId: this.host.createSelectionIdBuilder().withCategory(categories, i).createSelectionId()
        }));

        const unit = s.textos.unidade.value;
        const totalFmt = valueFormatter.create({ format: totalCol.source.format || "#,0", cultureSelector: this.host.locale });
        const metaFmt = valueFormatter.create({ format: (metaCol && metaCol.source.format) || "#,0", cultureSelector: this.host.locale });
        const dec = (v: number) => new Intl.NumberFormat(this.host.locale || "pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
        const pct = (v: number) => new Intl.NumberFormat(this.host.locale || "pt-BR", { style: "percent", maximumFractionDigits: 0 }).format(v);

        // Cabeçalho: número grande + selo da meta.
        const head = this.el("div", "xp-goal__head");
        const big = this.el("div", "xp-goal__big", totalFmt.format(total));
        if (unit) big.appendChild(this.el("small", "xp-goal__unit", unit));
        head.appendChild(big);
        if (altCol) {
            // Alternância entre o total principal e o alternativo (ex.: Mediana | Média).
            const sw = this.el("div", "xp-goal__switch");
            [[false, s.textos.rotuloTotal.value], [true, s.textos.rotuloTotal2.value]].forEach(([alt, label]) => {
                const b = this.el("button", "xp-goal__seg-btn" + (this.useAlt === alt ? " xp-goal__seg-btn--on" : ""), String(label));
                b.setAttribute("aria-pressed", String(this.useAlt === alt));
                b.addEventListener("click", e => { e.stopPropagation(); this.useAlt = alt as boolean; this.render(); });
                sw.appendChild(b);
            });
            head.appendChild(sw);
        }
        head.appendChild(this.el("div", "xp-goal__caption", `${s.textos.realizado.value}${altCol ? ` (${(this.useAlt ? s.textos.rotuloTotal2.value : s.textos.rotuloTotal.value).toLowerCase()})` : ""}${meta ? ` · meta ${metaFmt.format(meta)}` : ""}`.trim()));
        if (meta > 0) {
            const within = total <= meta;
            const chipColor = within ? s.cores.dentro.value.value : s.cores.acima.value.value;
            const chip = this.el("span", "xp-goal__chip", within
                ? `${pct(total / meta)} da meta · folga de ${metaFmt.format(meta - total)} ${unit}`.trim()
                : `${pct(total / meta)} da meta · ${metaFmt.format(total - meta)} ${unit} acima`.trim());
            chip.style.color = hc ? palette.foreground.value : mixOklab(chipColor, "#000000", 0.25);
            chip.style.background = hc ? "transparent" : mixOklab(chipColor, "#FFFFFF", 0.88);
            head.appendChild(chip);
        }
        this.root.appendChild(head);

        // Régua: segmentos na ordem original; fundo hachurado até a meta.
        const scaleMax = Math.max(meta, total, 1);
        const track = this.el("div", "xp-goal__track");
        for (const it of items) {
            if (it.amount <= 0) continue;
            const seg = this.el("div", "xp-goal__seg");
            seg.style.width = (it.amount / scaleMax * 100) + "%";
            seg.style.background = it.color;
            seg.title = `${it.label}: ${dec(it.amount)} ${unit} (${pct(it.share)})`;
            track.appendChild(seg);
        }
        if (meta > 0 && total > meta) {
            const line = this.el("div", "xp-goal__meta-line");
            line.style.left = (meta / scaleMax * 100) + "%";
            line.title = `Meta: ${metaFmt.format(meta)} ${unit}`;
            track.appendChild(line);
        }
        this.root.appendChild(track);
        const scale = this.el("div", "xp-goal__scale");
        [0, 1 / 3, 2 / 3, 1].forEach((f, i) => {
            const v = Math.round(scaleMax * f);
            scale.appendChild(this.el("span", "", i === 3 ? `${v} ${unit}`.trim() : String(v)));
        });
        this.root.appendChild(scale);

        // Ferramenta de ordem.
        const bar = this.el("div", "xp-goal__toolbar");
        const options: [Order, string][] = [["maior", "Mais lentos"], ["original", "Ordem do processo"]];
        for (const [value, label] of options) {
            const b = this.el("button", "xp-goal__seg-btn" + (this.order === value ? " xp-goal__seg-btn--on" : ""), label);
            b.setAttribute("aria-pressed", String(this.order === value));
            b.addEventListener("click", e => { e.stopPropagation(); this.order = value; this.render(); });
            bar.appendChild(b);
        }
        this.root.appendChild(bar);

        // Lista.
        const list = this.el("div", "xp-goal__list");
        let rows = items.filter(it => s.lista.mostrarZerados.value || it.amount > 0);
        if (this.order === "maior") rows = rows.slice().sort((a, b) => b.amount - a.amount || a.index - b.index);
        const maxAmount = Math.max(...items.map(i => i.amount), 0.0001);
        const h = Math.max(14, s.lista.altura.value);
        for (const it of rows) {
            const row = this.el("div", "xp-goal__row" + (it.amount > 0 ? "" : " xp-goal__row--zero"));
            row.style.minHeight = h + "px";
            const name = this.el("div", "xp-goal__name", it.label);
            name.title = it.label;
            row.appendChild(name);
            const lane = this.el("div", "xp-goal__lane");
            if (it.amount > 0) {
                const b = this.el("div", "xp-goal__bar");
                b.style.width = `max(${(it.amount / maxAmount * 100).toFixed(2)}%, 3px)`;
                b.style.height = Math.round(h * 0.6) + "px";
                b.style.background = it.color;
                lane.appendChild(b);
            }
            row.appendChild(lane);
            const val = this.el("div", "xp-goal__val");
            val.appendChild(this.el("b", "", it.amount > 0 ? `${dec(it.amount)} ${s.textos.unidadeCurta.value}`.trim() : "—"));
            if (it.amount > 0) val.appendChild(this.el("span", "", `${pct(it.share)} ${s.textos.partePor.value}`.trim()));
            row.appendChild(val);
            row.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.selectionManager.select(it.selectionId, e.ctrlKey || e.metaKey).then(ids => this.paintSelection(ids as ISelectionId[]));
            });
            row.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(it.selectionId, { x: e.clientX, y: e.clientY });
            });
            row.setAttribute("role", "listitem");
            row.setAttribute("aria-label", `${it.label}: ${dec(it.amount)} ${unit}, ${pct(it.share)}`);
            list.appendChild(row);
            this.rowEls.push({ el: row, id: it.selectionId });
        }
        list.setAttribute("role", "list");
        this.root.appendChild(list);
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rowEls) r.el.style.opacity = !any || ids.some(id => id.equals(r.id)) ? "1" : "0.4";
    }

    private el(tag: string, className: string, text?: string): HTMLElement {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
}

function asNumber(v: powerbi.PrimitiveValue): number | null {
    return typeof v === "number" && isFinite(v) ? v : null;
}

export { xpColors };
