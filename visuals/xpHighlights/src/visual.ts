"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;

import { HighlightsSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";

type Status = "ruim" | "atencao" | "bom" | "info";

interface Item {
    order: number;
    number: string;
    title: string;
    text: string;
    status: Status;
}

const severity: Record<Status, number> = { ruim: 0, atencao: 1, bom: 2, info: 3 };

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: HighlightsSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = document.createElement("div");
        this.root.className = "xp-hl";
        options.element.appendChild(this.root);
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(HighlightsSettings, dataView);
            this.render(this.read(dataView));
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private read(dataView: DataView | undefined): Item[] | null {
        const values = dataView && dataView.categorical && dataView.categorical.values;
        if (!values || !values.length) return null;
        const items: Item[] = [];
        Array.from(values).forEach((col, i) => {
            const raw = col.values[0];
            if (raw === null || raw === undefined) return;
            const [number = "", title = "", text = "", status = ""] = String(raw).split("||").map(p => p.trim());
            if (!title) return;
            items.push({ order: i, number, title, text, status: parseStatus(status) });
        });
        return items;
    }

    private render(items: Item[] | null) {
        const s = this.settings;
        const palette = this.host.colorPalette;
        const hc = palette.isHighContrast;
        while (this.root.firstChild) this.root.removeChild(this.root.firstChild);
        this.root.style.fontFamily = xpFont;
        this.root.style.gap = Math.max(0, s.layout.espaco.value) + "px";

        if (items === null) {
            this.root.appendChild(this.el("div", "xp-hl__empty", "Arraste medidas de texto para \"Destaques\" no formato: número || título || texto || status."));
            return;
        }
        if (!items.length) {
            this.root.appendChild(this.el("div", "xp-hl__empty", "Nenhum destaque para o período."));
            return;
        }

        const list = s.layout.ordenar.value
            ? items.slice().sort((a, b) => severity[a.status] - severity[b.status] || a.order - b.order)
            : items;
        const colors: Record<Status, string> = {
            ruim: s.cores.ruim.value.value,
            atencao: s.cores.atencao.value.value,
            bom: s.cores.bom.value.value,
            info: s.cores.info.value.value
        };

        for (const it of list) {
            const color = colors[it.status];
            const row = this.el("div", "xp-hl__item" + (s.layout.preencher.value ? " xp-hl__item--fill" : ""));
            row.style.gridTemplateColumns = `${Math.max(40, s.layout.larguraNumero.value)}px minmax(0, 1fr)`;
            row.style.borderLeftColor = hc ? palette.foreground.value : color;
            row.style.background = hc ? "transparent" : mix(color, "#FFFFFF", it.status === "info" ? 0.95 : 0.9);
            if (hc) row.style.border = `1px solid ${palette.foreground.value}`;

            const num = this.el("div", "xp-hl__number");
            num.style.fontSize = Math.max(12, s.layout.tamanhoNumero.value) + "px";
            num.style.color = hc ? palette.foreground.value : (it.status === "info" ? "#1F1F1F" : mix(color, "#000000", 0.25));
            // "12 dias" → "12" grande + "dias" pequeno.
            const m = /^(\S+)\s+(.+)$/.exec(it.number);
            num.appendChild(document.createTextNode(m ? m[1] : it.number));
            if (m) num.appendChild(this.el("small", "xp-hl__unit", m[2]));
            row.appendChild(num);

            const body = this.el("div", "xp-hl__body");
            const title = this.el("div", "xp-hl__title", it.title);
            title.style.fontSize = Math.max(9, s.layout.tamanhoTitulo.value) + "px";
            body.appendChild(title);
            if (it.text) body.appendChild(this.el("div", "xp-hl__text", it.text));
            row.appendChild(body);

            row.setAttribute("role", "listitem");
            row.setAttribute("aria-label", `${statusLabel(it.status)}: ${it.number} ${it.title}. ${it.text}`);
            this.root.appendChild(row);
        }
        this.root.setAttribute("role", "list");
    }

    private el(tag: string, className: string, text?: string): HTMLElement {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }
}

function parseStatus(raw: string): Status {
    const v = (raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
    if (["ruim", "bad", "critico", "erro", "vermelho"].indexOf(v) >= 0) return "ruim";
    if (["atencao", "alerta", "warning", "amarelo"].indexOf(v) >= 0) return "atencao";
    if (["bom", "ok", "good", "verde"].indexOf(v) >= 0) return "bom";
    return "info";
}

function statusLabel(s: Status): string {
    return { ruim: "Alerta", atencao: "Atenção", bom: "Ok", info: "Informativo" }[s];
}

function mix(a: string, b: string, t: number): string {
    const p = (h: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

export { xpColors };
