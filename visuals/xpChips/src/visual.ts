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

interface Chip { label: string; value: string; }

// Barra de filtros: [☰ Filtros (n)] · pílulas dos filtros em uso · Limpar filtros.
// Visual personalizado não aciona indicadores: os cliques de "Filtros" e "Limpar" vêm de botões nativos
// transparentes posicionados por cima (larguras fixas em Formatar → Layout).
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
            const vals = (dv && dv.categorical && dv.categorical.values) || [];
            const pick = (role: string) => { const c = vals.find(v => v.source.roles && v.source.roles[role]); return c ? c.values[0] : null; };
            const raw = pick("texto");
            const chips: Chip[] = String(raw === null || raw === undefined ? "" : raw)
                .split(";;").map(x => x.trim()).filter(Boolean)
                .map(x => { const k = x.indexOf("|"); return k < 0 ? { label: "", value: x } : { label: x.slice(0, k).trim(), value: x.slice(k + 1).trim() }; });
            const q = Number(pick("qtde"));
            this.render(chips, isFinite(q) && pick("qtde") !== null ? q : chips.length);
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private render(chips: Chip[], qtde: number) {
        const s = this.settings;
        const root = this.root;
        root.style.fontFamily = xpFont;
        root.style.setProperty("--xp-ch-accent", s.cores.destaque.value.value);
        root.style.setProperty("--xp-ch-bg", s.cores.fundo.value.value);
        root.style.setProperty("--xp-ch-border", s.cores.borda.value.value);
        root.style.setProperty("--xp-ch-text", s.cores.texto.value.value);
        while (root.firstChild) root.removeChild(root.firstChild);

        const btn = el("div", "xp-ch__btn");
        btn.style.width = Math.max(60, s.layout.larguraBotao.value) + "px";
        btn.appendChild(el("span", "xp-ch__ico", "☰"));
        btn.appendChild(document.createTextNode((s.textos.botao.value || "Filtros") + (qtde > 0 ? ` (${qtde})` : "")));
        const strip = el("div", "xp-ch__strip");
        const clear = el("div", "xp-ch__clear" + (qtde > 0 || chips.length ? "" : " xp-ch__clear--off"), s.textos.limpar.value || "Limpar filtros");
        clear.style.width = Math.max(40, s.layout.larguraLimpar.value) + "px";
        root.append(btn, strip, clear);

        strip.removeAttribute("title");
        if (!chips.length) {
            strip.appendChild(el("span", "xp-ch__empty", s.textos.vazio.value || ""));
            return;
        }
        const nodes = chips.map(c => {
            const n = el("span", "xp-ch__chip");
            if (c.label) n.appendChild(el("b", "", c.label));
            n.appendChild(document.createTextNode((c.label ? " " : "") + c.value));
            n.title = (c.label ? c.label + ": " : "") + c.value;
            strip.appendChild(n);
            return n;
        });
        // Esconde do fim para o começo até caber, deixando espaço para o "+N".
        const more = el("span", "xp-ch__chip xp-ch__more", "");
        strip.appendChild(more);
        more.style.display = "none";
        let hidden = 0;
        const overflow = () => strip.scrollWidth > strip.clientWidth + 1;
        for (let i = nodes.length - 1; i > 0 && overflow(); i--) {
            nodes[i].style.display = "none";
            hidden++;
            more.textContent = "+" + hidden;
            more.style.display = "";
        }
        if (hidden) strip.title = chips.map(c => (c.label ? c.label + ": " : "") + c.value).join("\n");
    }
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
