"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import DataViewValueColumn = powerbi.DataViewValueColumn;

import { KpiCardSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";

interface RoleValue {
    value: powerbi.PrimitiveValue;
    format: string;
    displayName: string;
}

type Roles = Partial<Record<"valor" | "cmpAtual" | "cmpAnterior" | "ytd" | "meta" | "contexto" | "perValor" | "rotCmp" | "rotYtd" | "status" | "insight" | "info", RoleValue>>;

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: KpiCardSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = document.createElement("div");
        this.root.className = "xp-kpi";
        options.element.appendChild(this.root);
        this.selectionManager = this.host.createSelectionManager();
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(KpiCardSettings, dataView);
            this.render(this.readRoles(dataView));
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private readRoles(dataView: DataView | undefined): Roles {
        const roles: Roles = {};
        const columns: DataViewValueColumn[] = (dataView && dataView.categorical && dataView.categorical.values) || [];
        for (const column of columns) {
            const r = column.source.roles || {};
            for (const key of Object.keys(r)) {
                if (r[key]) {
                    roles[key as keyof Roles] = {
                        value: column.values[0],
                        format: column.source.format || "",
                        displayName: column.source.displayName
                    };
                }
            }
        }
        // Medidas de comparação/YTD sem formato herdam o formato do valor principal (ex.: %).
        if (roles.valor) {
            for (const key of ["cmpAtual", "cmpAnterior", "ytd", "meta"] as const) {
                const r = roles[key];
                if (r && !r.format) r.format = roles.valor.format;
            }
        }
        return roles;
    }

    private fmt(role: RoleValue | undefined, units = 0, decimals = -1): string {
        if (!role || role.value === null || role.value === undefined || role.value === "") return "—";
        if (typeof role.value !== "number") return String(role.value);
        const formatter = valueFormatter.create({
            format: role.format || "#,0.##",
            value: units === 0 ? role.value : units,
            precision: decimals >= 0 ? decimals : undefined,
            cultureSelector: this.host.locale
        });
        return formatter.format(role.value);
    }

    private num(role: RoleValue | undefined): number | null {
        return role && typeof role.value === "number" && isFinite(role.value) ? role.value : null;
    }

    private el(tag: string, className: string, text?: string): HTMLElement {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    private render(roles: Roles) {
        const s = this.settings;
        const palette = this.host.colorPalette;
        if (palette.isHighContrast) {
            const fg = palette.foreground.value, bg = palette.background.value;
            s.cabecalho.corTitulo.value.value = fg;
            s.valor.cor.value.value = fg;
            s.comparacao.corBom.value.value = fg;
            s.comparacao.corRuim.value.value = fg;
            s.meta.corBarra.value.value = fg;
            s.aparencia.fundo.value.value = bg;
            s.aparencia.transparencia.value = 0;
            s.aparencia.corContexto.value.value = fg;
            this.root.style.color = fg;
        }
        while (this.root.firstChild) this.root.removeChild(this.root.firstChild);
        this.root.style.fontFamily = xpFont;
        this.root.style.padding = Math.max(0, s.aparencia.espacamento.value) + "px";
        const alpha = 1 - Math.min(100, Math.max(0, s.aparencia.transparencia.value)) / 100;
        this.root.style.background = this.withAlpha(s.aparencia.fundo.value.value, alpha);

        if (!roles.valor) {
            const empty = this.el("div", "xp-kpi__empty", "Arraste uma medida para \"Valor do período\".");
            this.root.appendChild(empty);
            this.root.setAttribute("aria-label", "Card de KPI sem dados");
            return;
        }

        const title = (s.cabecalho.titulo.value || "").trim() || roles.valor.displayName;
        const titleRow = this.el("div", "xp-kpi__title-row");
        const titleEl = this.el("div", "xp-kpi__title", title);
        titleEl.style.color = s.cabecalho.corTitulo.value.value;
        titleEl.style.fontSize = s.cabecalho.tamanhoTitulo.value + "px";
        titleRow.appendChild(titleEl);
        const info = this.text(roles.info) || (s.explicacao.texto.value || "").trim();
        if (info) titleRow.appendChild(this.infoIcon(info));
        this.root.appendChild(titleRow);

        const valueRow = this.el("div", "xp-kpi__value-row");
        const valueText = this.fmt(roles.valor, Number(s.valor.unidades.value) || 0, s.valor.casas.value);
        const valueEl = this.el("span", "xp-kpi__value", valueText);
        valueEl.style.fontSize = s.valor.tamanho.value + "px";
        valueEl.style.color = this.statusColor(this.text(roles.status)) || s.valor.cor.value.value;
        valueRow.appendChild(valueEl);
        if (s.cabecalho.unidade.value) valueRow.appendChild(this.el("span", "xp-kpi__unit", s.cabecalho.unidade.value));
        const perValor = s.periodos.mostrar.value ? this.text(roles.perValor) : "";
        if (perValor) {
            const chip = this.el("span", "xp-kpi__chip xp-kpi__chip--" + String(s.periodos.estilo.value.value), perValor);
            chip.title = perValor;
            valueRow.appendChild(chip);
        }
        this.root.appendChild(valueRow);

        if (roles.contexto && roles.contexto.value !== null && roles.contexto.value !== undefined) {
            const ctx = this.el("div", "xp-kpi__context", String(roles.contexto.value));
            ctx.style.color = s.aparencia.corContexto.value.value;
            this.root.appendChild(ctx);
        }

        const insight = this.text(roles.insight);
        if (insight) {
            const ins = this.el("div", "xp-kpi__insight", insight);
            ins.title = insight;
            this.root.appendChild(ins);
        }

        const meta = this.num(roles.meta), valor = this.num(roles.valor);
        if (s.meta.mostrar.value && meta !== null && meta !== 0 && valor !== null) {
            const share = valor / meta;
            const wrap = this.el("div", "xp-kpi__meta");
            const track = this.el("div", "xp-kpi__meta-track");
            const fill = this.el("div", "xp-kpi__meta-fill");
            fill.style.width = Math.min(100, Math.max(0, share * 100)).toFixed(1) + "%";
            fill.style.background = s.meta.corBarra.value.value;
            track.appendChild(fill);
            wrap.appendChild(track);
            wrap.appendChild(this.el("div", "xp-kpi__meta-label", `${s.meta.rotulo.value} ${this.fmt(roles.meta)} · ${this.pct(share)}`));
            this.root.appendChild(wrap);
        }

        const showCmp = s.comparacao.mostrar.value && (roles.cmpAtual || roles.cmpAnterior);
        const showYtd = s.acumulado.mostrar.value && roles.ytd;
        if (showCmp || showYtd) {
            const footer = this.el("div", "xp-kpi__footer");
            if (showCmp) footer.appendChild(this.comparisonBlock(roles));
            if (showYtd) {
                const block = this.el("div", "xp-kpi__block");
                block.appendChild(this.el("div", "xp-kpi__block-label", this.text(roles.rotYtd) || s.acumulado.rotulo.value));
                block.appendChild(this.el("div", "xp-kpi__block-value", this.fmt(roles.ytd)));
                footer.appendChild(block);
            }
            this.root.appendChild(footer);
        }

        this.root.setAttribute("role", "figure");
        this.root.setAttribute("aria-label", `${title}: ${valueText}${s.cabecalho.unidade.value ? " " + s.cabecalho.unidade.value : ""}`);
    }

    private comparisonBlock(roles: Roles): HTMLElement {
        const s = this.settings.comparacao;
        const block = this.el("div", "xp-kpi__block");
        block.appendChild(this.el("div", "xp-kpi__block-label", this.text(roles.rotCmp) || s.rotulo.value));
        const a = this.num(roles.cmpAtual), b = this.num(roles.cmpAnterior);
        const deltaEl = this.el("div", "xp-kpi__block-value");
        if (a === null || b === null) {
            deltaEl.textContent = "—";
        } else {
            const diff = a - b;
            const isPct = (roles.cmpAtual!.format || "").indexOf("%") >= 0;
            let tipo = String(s.tipo.value.value);
            // p.p. só faz sentido para medidas em %; em contagens ou dias vira diferença absoluta.
            if (tipo === "auto") tipo = isPct ? "pontos" : "percentual";
            else if (tipo === "pontos" && !isPct) tipo = "absoluto";
            const unit = this.settings.cabecalho.unidade.value;
            let text: string;
            if (tipo === "pontos") text = this.number(Math.abs(diff * 100), 1) + " p.p.";
            else if (tipo === "absoluto") text = this.fmt({ value: Math.abs(diff), format: roles.cmpAtual!.format, displayName: "" }) + (unit ? " " + unit : "");
            else text = b === 0 ? "—" : this.pct(Math.abs(diff / b));
            const arrow = diff > 0 ? "▲ " : diff < 0 ? "▼ " : "= ";
            deltaEl.textContent = arrow + text;
            const pol = String(s.polaridade.value.value);
            if (diff !== 0 && pol !== "neutro") {
                const better = pol === "maior" ? diff > 0 : diff < 0;
                deltaEl.style.color = better ? s.corBom.value.value : s.corRuim.value.value;
            }
        }
        block.appendChild(deltaEl);
        if (s.mostrarValores.value && a !== null && b !== null) {
            block.appendChild(this.el("div", "xp-kpi__block-detail", `${this.fmt(roles.cmpAtual)} vs ${this.fmt(roles.cmpAnterior)}`));
        }
        return block;
    }

    // ok · atencao · critico (aceita acento e maiúscula). Vazio = cor normal do valor.
    private statusColor(status: string): string {
        const k = (status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (k.startsWith("crit")) return this.settings.status.corCritico.value.value;
        if (k.startsWith("aten")) return this.settings.status.corAtencao.value.value;
        return "";
    }

    // ⓘ: abre um balão dentro do card ao passar o mouse ou focar com o teclado.
    private infoIcon(text: string): HTMLElement {
        const btn = this.el("span", "xp-kpi__info", "i");
        btn.tabIndex = 0;
        btn.setAttribute("role", "button");
        btn.setAttribute("aria-label", text);
        const tip = this.el("div", "xp-kpi__tip", text);
        const show = () => { if (!tip.parentNode) this.root.appendChild(tip); };
        const hide = () => { if (tip.parentNode) tip.parentNode.removeChild(tip); };
        btn.addEventListener("mouseenter", show);
        btn.addEventListener("mouseleave", hide);
        btn.addEventListener("focus", show);
        btn.addEventListener("blur", hide);
        return btn;
    }

    private text(role: RoleValue | undefined): string {
        if (!role || role.value === null || role.value === undefined) return "";
        return String(role.value).trim();
    }

    private pct(v: number): string {
        const digits = Math.abs(v) < 0.1 ? 1 : 0;
        return new Intl.NumberFormat(this.host.locale || "pt-BR", { style: "percent", maximumFractionDigits: digits }).format(v);
    }

    private number(v: number, digits: number): string {
        return new Intl.NumberFormat(this.host.locale || "pt-BR", { maximumFractionDigits: digits }).format(v);
    }

    private withAlpha(hex: string, alpha: number): string {
        const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
        if (!m) return "transparent";
        const n = parseInt(m[1], 16);
        return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha.toFixed(2)})`;
    }
}

export { xpColors };
