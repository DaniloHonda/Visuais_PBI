"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { ChipsSettings } from "./settings";
import { xpFont } from "./xpTheme";

// Pílulas dos filtros em uso. Texto da medida: "Rótulo|valor" separados por ";;".
// O que não couber vira "+N" (passe o mouse para ver todos).
export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: ChipsSettings;
    private formattingSettingsService: FormattingSettingsService;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = document.createElement("div");
        this.root.className = "xp-ch";
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(ChipsSettings, dv);
            const raw = dv && dv.single ? dv.single.value : null;
            const chips = String(raw === null || raw === undefined ? "" : raw)
                .split(";;").map(x => x.trim()).filter(Boolean)
                .map(x => { const k = x.indexOf("|"); return k < 0 ? { label: "", value: x } : { label: x.slice(0, k).trim(), value: x.slice(k + 1).trim() }; });
            this.render(chips);
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private render(chips: { label: string; value: string }[]) {
        const s = this.settings.cores;
        const root = this.root;
        root.style.fontFamily = xpFont;
        root.style.setProperty("--xp-ch-bg", s.fundo.value.value);
        root.style.setProperty("--xp-ch-border", s.borda.value.value);
        root.style.setProperty("--xp-ch-text", s.texto.value.value);
        while (root.firstChild) root.removeChild(root.firstChild);
        root.removeAttribute("title");
        if (!chips.length) {
            root.appendChild(el("span", "xp-ch__empty", this.settings.textos.vazio.value || ""));
            return;
        }
        const nodes = chips.map(c => {
            const n = el("span", "xp-ch__chip");
            if (c.label) n.appendChild(el("b", "", c.label));
            n.appendChild(document.createTextNode((c.label ? " " : "") + c.value));
            n.title = (c.label ? c.label + ": " : "") + c.value;
            root.appendChild(n);
            return n;
        });
        // Esconde do fim para o começo até caber, deixando espaço para o "+N".
        const more = el("span", "xp-ch__chip xp-ch__more", "");
        root.appendChild(more);
        more.style.display = "none";
        let hidden = 0;
        const overflow = () => root.scrollWidth > root.clientWidth + 1;
        for (let i = nodes.length - 1; i > 0 && overflow(); i--) {
            nodes[i].style.display = "none";
            hidden++;
            more.textContent = "+" + hidden;
            more.style.display = "";
        }
        if (hidden) root.title = chips.map(c => (c.label ? c.label + ": " : "") + c.value).join("\n");
    }
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
