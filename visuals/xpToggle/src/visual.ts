"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import PrimitiveValue = powerbi.PrimitiveValue;
import DataView = powerbi.DataView;

import { ToggleSettings } from "./settings";
import { xpFont } from "./xpTheme";

interface Option { key: string; raw: PrimitiveValue; label: string; tip: string; context: string; }
interface Target { table: string; column: string; }

// Identificador fixo do formato de filtro do Power BI (não é um endereço acessado).
const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";

// Botão de modo: uma opção sempre ativa, que filtra a tabela de opções (sem relação) para as medidas lerem o modo.
export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: ToggleSettings;
    private formattingSettingsService: FormattingSettingsService;
    private options: Option[] = [];
    private target: Target | null = null;
    private active: string | null = null;
    private defaultSent = false;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("div", "xp-tg");
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(ToggleSettings, dv);
            this.read(dv);
            this.active = this.restore(options.jsonFilters);
            if (!this.active && this.options.length) {
                const def = this.defaultOption();
                // Sem nada escolhido: mostra a padrão e grava o filtro uma vez, para as medidas lerem o modo.
                if (this.settings.comportamento.aplicarPadrao.value && !this.defaultSent) {
                    this.defaultSent = true;
                    this.apply(def);
                }
                this.active = def.key;
            }
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private read(dv: DataView | undefined) {
        this.options = [];
        this.target = null;
        const cat = dv && dv.categorical;
        const column = cat && cat.categories && cat.categories[0];
        if (!column) return;
        this.target = toTarget(column.source.queryName || "", column.source.displayName);
        const ctx = cat.values && cat.values.find(v => v.source.roles && v.source.roles["contexto"]);
        const labels = splitList(this.settings.textos.rotulos.value, ";");
        const tips = splitList(this.settings.textos.dicas.value, "|");
        const seen = new Set<string>();
        column.values.forEach((v, i) => {
            const key = keyOf(v);
            if (seen.has(key)) return;
            seen.add(key);
            const n = this.options.length;
            const c = ctx ? ctx.values[i] : null;
            this.options.push({
                key,
                raw: v,
                label: labels[n] || (v === null || v === undefined || v === "" ? "(Em branco)" : String(v)),
                tip: tips[n] || "",
                context: c === null || c === undefined ? "" : String(c)
            });
        });
    }

    private defaultOption(): Option {
        const want = (this.settings.comportamento.padrao.value || "").trim().toLowerCase();
        return this.options.find(o => want && (o.label.toLowerCase() === want || String(o.raw).toLowerCase() === want)) || this.options[0];
    }

    // A opção ativa vem do filtro salvo no relatório (ou de um indicador / página sincronizada).
    private restore(filters: powerbi.IFilter[] | undefined): string | null {
        const f = (filters || [])[0] as { values?: PrimitiveValue[] } | undefined;
        if (!f || !Array.isArray(f.values) || !f.values.length) return null;
        const key = keyOf(f.values[0]);
        return this.options.some(o => o.key === key) ? key : null;
    }

    private apply(o: Option) {
        if (!this.target) return;
        const filter = { $schema: SCHEMA_BASIC, target: this.target, operator: "In", values: [o.raw], filterType: 1 };
        this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
    }

    private choose(o: Option) {
        if (this.active === o.key) return;
        this.active = o.key;
        this.apply(o);
        this.render();
    }

    private render() {
        const s = this.settings;
        const root = this.root;
        while (root.firstChild) root.removeChild(root.firstChild);
        const estilo = String(s.formato.estilo.value.value);
        const pos = String(s.contexto.posicao.value.value);
        root.className = "xp-tg xp-tg--" + estilo + " xp-tg--ctx-" + pos + " xp-tg--al-" + String(s.formato.alinhamento.value.value);
        root.style.fontFamily = xpFont;
        root.style.setProperty("--xp-tg-on", s.cores.ativo.value.value);
        root.style.setProperty("--xp-tg-on-text", s.cores.textoAtivo.value.value);
        root.style.setProperty("--xp-tg-track", s.cores.trilho.value.value);
        root.style.setProperty("--xp-tg-text", s.cores.texto.value.value);
        root.style.setProperty("--xp-tg-border", s.cores.borda.value.value);
        root.style.setProperty("--xp-tg-size", Math.max(9, s.formato.tamanho.value) + "px");
        root.style.setProperty("--xp-tg-h", Math.max(22, s.formato.altura.value) + "px");
        root.style.setProperty("--xp-tg-r", Math.max(0, s.formato.cantos.value) + "px");
        root.style.setProperty("--xp-tg-ctx-size", Math.max(9, s.contexto.tamanho.value) + "px");
        root.style.setProperty("--xp-tg-ctx", s.contexto.cor.value.value);
        root.style.setProperty("--xp-tg-ctx-b", s.contexto.destaque.value.value);

        if (!this.options.length) {
            root.appendChild(el("div", "xp-tg__empty", "Arraste a coluna de opções para o campo Opções."));
            return;
        }
        const group = el("div", "xp-tg__group");
        group.setAttribute("role", "radiogroup");
        if (s.formato.larguraIgual.value) group.classList.add("xp-tg__group--equal");
        this.options.forEach((o, n) => {
            const on = o.key === this.active;
            const b = el("button", "xp-tg__opt" + (on ? " xp-tg__opt--on" : ""), o.label);
            b.setAttribute("role", "radio");
            b.setAttribute("aria-checked", String(on));
            b.tabIndex = on ? 0 : -1;
            b.addEventListener("click", () => this.choose(o));
            b.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    const next = this.options[(n + (e.key === "ArrowRight" ? 1 : this.options.length - 1)) % this.options.length];
                    this.choose(next);
                    const btn = this.root.querySelectorAll<HTMLElement>(".xp-tg__opt")[this.options.indexOf(next)];
                    if (btn) btn.focus();
                }
            });
            if (o.tip) {
                b.setAttribute("aria-description", o.tip);
                // Dica nativa do Power BI: aparece fora do retângulo do visual.
                b.addEventListener("mousemove", (e: MouseEvent) => this.host.tooltipService.show({
                    dataItems: [{ displayName: o.label, value: o.tip }], identities: [],
                    coordinates: [e.clientX, e.clientY], isTouchEvent: false }));
                b.addEventListener("mouseleave", () => this.host.tooltipService.hide({ immediately: true, isTouchEvent: false }));
            }
            group.appendChild(b);
        });
        root.appendChild(group);
        const act = this.options.find(o => o.key === this.active);
        if (pos !== "nenhum" && act && act.context) {
            const ctx = el("div", "xp-tg__ctx");
            boldText(ctx, act.context);
            ctx.title = act.context.replace(/\*\*/g, "");
            root.appendChild(ctx);
        }
    }
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function keyOf(v: PrimitiveValue): string { return v === null || v === undefined ? "∅" : typeof v + ":" + String(v); }
function splitList(text: string, sep: string): string[] { return (text || "").split(sep).map(x => x.trim()); }
function toTarget(queryName: string, displayName: string): Target {
    const i = queryName.indexOf(".");
    if (i < 0) return { table: queryName, column: displayName };
    return { table: queryName.slice(0, i), column: queryName.slice(i + 1) };
}
// "texto **negrito** texto" → nós de texto e <b>, sem innerHTML.
function boldText(target: HTMLElement, text: string) {
    text.split("**").forEach((part, i) => {
        if (!part) return;
        if (i % 2 === 1) target.appendChild(el("b", "", part));
        else target.appendChild(document.createTextNode(part));
    });
}
