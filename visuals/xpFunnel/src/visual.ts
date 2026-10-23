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

import { FunnelSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";

interface Step {
    label: string;
    group: string | null;
    value: number | null;
    selectionId: ISelectionId;
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private legend: HTMLElement;
    private list: HTMLElement;
    private settings: FunnelSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: { el: HTMLElement; id: ISelectionId }[] = [];

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = document.createElement("div");
        this.root.className = "xp-funnel";
        options.element.appendChild(this.root);
        this.legend = document.createElement("div");
        this.legend.className = "xp-funnel__legend";
        this.list = document.createElement("div");
        this.list.className = "xp-funnel__list";
        this.root.appendChild(this.legend);
        this.root.appendChild(this.list);
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
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(FunnelSettings, dataView);
            this.render(dataView);
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private render(dataView: DataView | undefined) {
        const s = this.settings;
        const palette = this.host.colorPalette;
        const hc = palette.isHighContrast;
        while (this.list.firstChild) this.list.removeChild(this.list.firstChild);
        while (this.legend.firstChild) this.legend.removeChild(this.legend.firstChild);
        this.legend.style.display = "none";
        this.rows = [];
        this.root.style.fontFamily = xpFont;
        this.list.style.gap = Math.max(0, s.barras.espacamento.value) + "px";
        this.root.style.color = hc ? palette.foreground.value : s.rotulos.cor.value.value;

        const cat = dataView && dataView.categorical;
        const categories = cat && cat.categories && cat.categories.filter(c => c.source.roles && c.source.roles["etapa"])[0];
        const groupCol = cat && cat.categories && cat.categories.filter(c => c.source.roles && c.source.roles["grupo"])[0];
        const valueCol = cat && cat.values && cat.values.filter(v => v.source.roles && v.source.roles["valor"])[0];
        const baseCol = cat && cat.values && cat.values.filter(v => v.source.roles && v.source.roles["base"])[0];
        if (!categories || !valueCol) {
            this.list.appendChild(this.el("div", "xp-funnel__empty", "Arraste a coluna de etapas para \"Etapas\" e uma medida para \"Valor\"."));
            return;
        }

        const steps: Step[] = categories.values.map((c, i) => ({
            label: c === null || c === undefined ? "(vazio)" : String(c),
            group: groupCol && groupCol.values[i] !== null && groupCol.values[i] !== undefined ? String(groupCol.values[i]) : null,
            value: typeof valueCol.values[i] === "number" ? valueCol.values[i] as number : null,
            selectionId: this.host.createSelectionIdBuilder().withCategory(categories, i).createSelectionId()
        }));
        const max = Math.max(0, ...steps.map(st => st.value || 0));
        const baseRaw = baseCol ? baseCol.values.find(v => typeof v === "number") as number | undefined : undefined;
        const base = baseRaw !== undefined ? baseRaw : (steps[0] && steps[0].value) || 0;
        const format = valueCol.source.format || "#,0";
        const formatter = valueFormatter.create({ format, cultureSelector: this.host.locale });
        const centered = String(s.barras.formato.value.value) === "funil";
        const height = Math.max(16, s.barras.altura.value);
        const fontSize = Math.max(9, s.rotulos.tamanho.value);
        const showRight = s.percentuais.mostrarTotal.value || s.percentuais.mostrarAnterior.value;
        const destaque = (s.barras.etapaDestaque.value || "").trim().toLowerCase();

        // Cor por grupo: na ordem em que o grupo aparece (segue a ordem das etapas), nunca reciclada.
        const slots = [s.cores.cor1, s.cores.cor2, s.cores.cor3, s.cores.cor4, s.cores.cor5, s.cores.cor6].map(c => c.value.value);
        const groupColor = new Map<string, string>();
        const lastIndex = steps.length > 1 && s.barras.destacarUltima.value ? steps.length - 1 : -1;
        const modo = String(s.barras.modoCor.value.value);
        steps.forEach((st, i) => {
            if (modo === "grupo" && st.group !== null && i !== lastIndex && !groupColor.has(st.group)) {
                groupColor.set(st.group, slots[Math.min(groupColor.size, slots.length - 1)]);
            }
        });
        if (groupColor.size > 0 && s.cores.mostrarLegenda.value) {
            this.legend.style.display = "flex";
            groupColor.forEach((color, name) => {
                const item = this.el("span", "xp-funnel__legend-item");
                const sw = this.el("span", "xp-funnel__swatch");
                sw.style.background = hc ? palette.foreground.value : color;
                item.appendChild(sw);
                item.appendChild(document.createTextNode(name));
                this.legend.appendChild(item);
            });
            if (lastIndex >= 0) {
                const item = this.el("span", "xp-funnel__legend-item");
                const sw = this.el("span", "xp-funnel__swatch");
                sw.style.background = hc ? palette.foreground.value : s.barras.corUltima.value.value;
                item.appendChild(sw);
                item.appendChild(document.createTextNode(steps[lastIndex].label));
                this.legend.appendChild(item);
            }
        }

        const columns = `${Math.max(60, s.rotulos.largura.value)}px minmax(0, 1fr)` + (showRight ? " 150px" : "");
        steps.forEach((st, i) => {
            const row = this.el("div", "xp-funnel__row");
            row.style.gridTemplateColumns = columns;
            row.style.minHeight = height + "px";

            const label = this.el("div", "xp-funnel__label", st.label);
            label.style.fontSize = fontSize + "px";
            label.title = st.label;
            row.appendChild(label);

            const lane = this.el("div", "xp-funnel__lane" + (centered ? " xp-funnel__lane--center" : ""));
            const share = max > 0 && st.value ? st.value / max : 0;
            const bar = this.el("div", "xp-funnel__bar");
            bar.style.height = height + "px";
            bar.style.width = st.value ? `max(${(share * 100).toFixed(2)}%, 6px)` : "0px";
            const isLast = i === steps.length - 1 && steps.length > 1 && s.barras.destacarUltima.value;
            const isDestaque = destaque !== "" && st.label.trim().toLowerCase() === destaque;
            const byGroup = modo === "grupo" && st.group !== null && groupColor.has(st.group);
            const gradientSteps = lastIndex >= 0 ? steps.length - 2 : steps.length - 1;
            const color = hc ? palette.foreground.value
                : isLast ? s.barras.corUltima.value.value
                : byGroup ? groupColor.get(st.group as string) as string
                : modo === "degrade" ? mixOklab(s.barras.corInicio.value.value, s.barras.corFim.value.value, gradientSteps > 0 ? i / gradientSteps : 0)
                : isDestaque ? s.barras.corDestaque.value.value
                : s.barras.cor.value.value;
            bar.style.background = color;
            // Com degradê ou grupos, a cor já tem função: o destaque vira contorno.
            if (isDestaque && modo !== "unica") {
                bar.style.boxShadow = `0 0 0 2px #FFFFFF, 0 0 0 4px ${s.barras.corUltima.value.value}`;
                label.style.textDecoration = "underline";
            }
            const text = st.value === null ? "—" : formatter.format(st.value);
            const number = this.el("span", "xp-funnel__number", text);
            number.style.fontSize = (fontSize + 2) + "px";
            // Número dentro da barra quando cabe; senão, logo depois dela.
            const approxText = text.length * (fontSize + 2) * 0.62 + 20;
            const laneWidth = this.list.clientWidth - Math.max(60, s.rotulos.largura.value) - (showRight ? 150 : 0) - 28;
            if (st.value && share * laneWidth >= approxText) {
                number.style.color = hc ? palette.background.value : textOn(color);
                bar.appendChild(number);
                lane.appendChild(bar);
            } else {
                number.classList.add("xp-funnel__number--out");
                lane.appendChild(bar);
                lane.appendChild(number);
            }
            row.appendChild(lane);

            if (showRight) {
                const right = this.el("div", "xp-funnel__right");
                if (s.percentuais.mostrarTotal.value) {
                    const pctTotal = base > 0 && st.value !== null ? this.pct(st.value / base) : "—";
                    right.appendChild(this.el("div", "xp-funnel__pct", `${pctTotal} ${s.percentuais.textoTotal.value}`.trim()));
                }
                if (s.percentuais.mostrarAnterior.value) {
                    let step: string;
                    if (i === 0) step = s.percentuais.textoBase.value;
                    else {
                        const prev = steps[i - 1].value;
                        step = prev && st.value !== null ? `${this.pct(st.value / prev)} ${s.percentuais.textoAnterior.value}`.trim() : "—";
                    }
                    right.appendChild(this.el("div", "xp-funnel__step", step));
                }
                row.appendChild(right);
            }

            row.setAttribute("role", "listitem");
            row.setAttribute("aria-label", `${st.label}: ${text}`);
            row.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                this.selectionManager.select(st.selectionId, e.ctrlKey || e.metaKey).then(ids => this.paintSelection(ids as ISelectionId[]));
            });
            row.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(st.selectionId, { x: e.clientX, y: e.clientY });
            });
            this.list.appendChild(row);
            this.rows.push({ el: row, id: st.selectionId });
        });
        this.list.setAttribute("role", "list");
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rows) {
            const on = !any || ids.some(id => id.equals(r.id));
            r.el.style.opacity = on ? "1" : "0.4";
        }
    }

    private pct(v: number): string {
        const digits = Math.abs(v) < 0.1 && v !== 0 ? 1 : 0;
        return new Intl.NumberFormat(this.host.locale || "pt-BR", { style: "percent", maximumFractionDigits: digits }).format(v);
    }

    private el(tag: string, className: string, text?: string): HTMLElement {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
}

// Interpolação em OKLab: mantém a saturação no meio do degradê (em RGB os tons do meio ficam acinzentados).
function toLinear(v: number): number { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function fromLinear(v: number): number { const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, c)) * 255); }
function hexToRgb(hex: string): number[] {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = m ? parseInt(m[1], 16) : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToOklab(rgb: number[]): number[] {
    const [r, g, b] = rgb.map(toLinear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToHex(lab: number[]): string {
    const [L, a, b] = lab;
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return "#" + rgb.map(v => fromLinear(v).toString(16).padStart(2, "0")).join("");
}
// Interpola luminosidade, saturação e matiz separadamente (OKLCH): o meio do degradê não acinzenta.
function mixOklab(a: string, b: string, t: number): string {
    const A = rgbToOklab(hexToRgb(a)), B = rgbToOklab(hexToRgb(b));
    const ca = Math.hypot(A[1], A[2]), cb = Math.hypot(B[1], B[2]);
    const ha = Math.atan2(A[2], A[1]);
    let dh = Math.atan2(B[2], B[1]) - ha;
    if (dh > Math.PI) dh -= 2 * Math.PI;
    if (dh < -Math.PI) dh += 2 * Math.PI;
    const L = A[0] + (B[0] - A[0]) * t, C = ca + (cb - ca) * t, h = ha + dh * t;
    return oklabToHex([L, C * Math.cos(h), C * Math.sin(h)]);
}
// Texto branco ou preto, o que tiver mais contraste com a barra.
function textOn(hex: string): string {
    const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const L = lum(hexToRgb(hex));
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#FFFFFF" : "#121212";
}

export { xpColors };
