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
import PrimitiveValue = powerbi.PrimitiveValue;
import DialogAction = powerbi.DialogAction;

import { SlicerSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";
import { ListItem, SelectionList } from "./selectionList";
import { DialogResult, DialogState, SlicerDialog } from "./dialog";

interface Item extends ListItem {
    index: number;
    raw: PrimitiveValue;
    countValue: number | null;
}

interface Target { table: string; column: string; }

// Identificador fixo do formato de filtro do Power BI (não é um endereço acessado).
const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private box: HTMLElement;
    private listHost: HTMLElement;
    private dropHost: HTMLElement;
    private drop: SelectionList | null = null;
    private dropOpen = false;
    private list: SelectionList | null = null;
    private settings: SlicerSettings;
    private formattingSettingsService: FormattingSettingsService;
    private viewportHeight = 44;

    private items: Item[] = [];
    private target: Target | null = null;
    private selected = new Map<string, PrimitiveValue>();
    private title = "";
    private dialogOpen = false;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("div", "xp-slv");
        this.box = el("div", "xp-box");
        this.box.tabIndex = 0;
        this.box.setAttribute("role", "button");
        this.box.addEventListener("click", () => this.open());
        this.box.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); this.open(); }
            if (e.key === "Escape") this.setDrop(false);
        });
        this.listHost = el("div", "xp-slv__list");
        this.dropHost = el("div", "xp-slv__drop");
        this.dropHost.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Escape") { this.setDrop(false); this.box.focus(); } });
        this.root.append(this.box, this.dropHost, this.listHost);
        // Fecha a lista ao clicar fora: na área transparente do visual ou em qualquer outro lugar do relatório.
        this.root.addEventListener("mousedown", (e: MouseEvent) => {
            if (this.dropOpen && e.target === this.root) this.setDrop(false);
        });
        window.addEventListener("blur", () => this.setDrop(false));
        options.element.appendChild(this.root);
        void SlicerDialog; // garante o registro da janela no pacote
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(SlicerSettings, dataView);
            this.viewportHeight = options.viewport ? options.viewport.height : 44;
            this.read(dataView);
            this.restore(options.jsonFilters);
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
        this.items = [];
        this.target = null;
        const cat = dataView && dataView.categorical;
        const column = cat && cat.categories && cat.categories[0];
        const s = this.settings;
        this.title = (s.cabecalho.titulo.value || "").trim() || (column ? cleanName(column.source.displayName) : "");
        if (!column) return;
        this.target = toTarget(column.source.queryName || "", column.source.displayName);
        const counts = cat.values && cat.values[0];
        const fmt = valueFormatter.create({ format: (counts && counts.source.format) || "#,0", cultureSelector: this.host.locale });
        const seen = new Set<string>();
        column.values.forEach((v, i) => {
            const key = keyOf(v);
            if (seen.has(key)) return;
            seen.add(key);
            const c = counts ? counts.values[i] : null;
            const countValue = typeof c === "number" && isFinite(c) ? c : null;
            this.items.push({
                index: i,
                key,
                raw: v,
                label: v === null || v === undefined || v === "" ? "(Em branco)" : String(v instanceof Date ? v.toLocaleDateString(this.host.locale || "pt-BR") : v),
                countValue,
                count: counts ? (countValue === null ? "" : fmt.format(countValue)) : null,
                hasData: !counts || (countValue !== null && countValue > 0)
            });
        });
        const ordem = String(s.comportamento.ordem.value.value);
        if (ordem === "contagem") this.items.sort((a, b) => (b.countValue || 0) - (a.countValue || 0) || a.index - b.index);
        if (ordem === "alfabetica") this.items.sort((a, b) => a.label.localeCompare(b.label, this.host.locale || "pt-BR"));
        if (s.comportamento.semDadosNoFim.value) this.items = this.items.filter(i => i.hasData).concat(this.items.filter(i => !i.hasData));
    }

    // Recupera a seleção salva no relatório (ou vinda de outra página sincronizada).
    private restore(filters: powerbi.IFilter[] | undefined) {
        this.selected.clear();
        const f = (filters || [])[0] as { values?: PrimitiveValue[] } | undefined;
        if (!f || !Array.isArray(f.values)) return;
        for (const v of f.values) {
            const item = this.items.find(i => i.key === keyOf(v));
            this.selected.set(keyOf(v), item ? item.raw : v);
        }
    }

    private setSelection(keys: string[]) {
        this.selected.clear();
        for (const k of keys) {
            const item = this.items.find(i => i.key === k);
            if (item) this.selected.set(k, item.raw);
        }
        if (!this.target) return;
        if (this.selected.size === 0) {
            this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
        } else {
            const filter = {
                $schema: SCHEMA_BASIC,
                target: this.target,
                operator: "In",
                values: Array.from(this.selected.values()),
                filterType: 1
            };
            this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        }
        this.render();
    }

    private modo(): string { return String(this.settings.comportamento.modo.value.value); }

    private open() {
        if (this.modo() === "caixa") this.openDialog();
        else this.setDrop(!this.dropOpen);
    }

    private setDrop(open: boolean) {
        if (open === this.dropOpen || (open && !this.items.length)) return;
        this.dropOpen = open;
        this.render();
        if (open && this.drop) this.drop.focusSearch();
    }

    private openDialog() {
        if (this.dialogOpen || !this.items.length) return;
        const s = this.settings;
        const state: DialogState = {
            title: this.title,
            items: this.items.map(i => ({ key: i.key, label: i.label, count: i.count, hasData: i.hasData })),
            selected: Array.from(this.selected.keys()),
            single: s.comportamento.unica.value,
            search: s.comportamento.busca.value,
            selectAll: s.comportamento.selecionarTodos.value,
            accent: s.cores.destaque.value.value
        };
        const height = Math.min(520, 150 + this.items.length * 30);
        this.dialogOpen = true;
        this.host.openModalDialog(SlicerDialog.id, {
            title: this.title,
            size: { width: 360, height },
            position: { type: powerbi.VisualDialogPositionType.RelativeToVisual, left: 0, top: this.viewportHeight + 4 },
            actionButtons: [DialogAction.OK, DialogAction.Cancel]
        }, state).then((result: powerbi.extensibility.visual.ModalDialogResult) => {
            this.dialogOpen = false;
            if (result.actionId === DialogAction.OK) this.setSelection((result.resultState as DialogResult).selected || []);
        }, () => { this.dialogOpen = false; });
    }

    private render() {
        const s = this.settings;
        const modo = this.modo();
        const lista = modo === "lista";
        const suspensa = modo === "suspensa";
        if (!suspensa) this.dropOpen = false;
        this.root.style.fontFamily = xpFont;
        this.root.style.setProperty("--xp-sl-accent", s.cores.destaque.value.value);
        this.root.style.setProperty("--xp-sl-border", s.cores.borda.value.value);
        this.root.style.setProperty("--xp-sl-bg", s.cores.fundo.value.value);
        this.root.classList.toggle("xp-slv--lista", lista);
        this.root.classList.toggle("xp-slv--suspensa", suspensa);
        this.box.style.display = lista ? "none" : "";
        this.box.style.height = suspensa ? Math.max(32, s.comportamento.alturaCaixa.value) + "px" : "";
        this.box.style.flex = suspensa ? "0 0 auto" : "";
        this.box.classList.toggle("xp-box--open", this.dropOpen);
        this.box.setAttribute("aria-expanded", String(this.dropOpen));
        this.listHost.style.display = lista ? "" : "none";
        this.dropHost.style.display = this.dropOpen ? "" : "none";
        if (lista) this.renderList(); else this.renderBox();
        if (this.dropOpen) this.renderDrop();
    }

    private renderDrop() {
        const s = this.settings;
        const opts = {
            single: s.comportamento.unica.value,
            search: s.comportamento.busca.value,
            selectAll: s.comportamento.selecionarTodos.value,
            placeholder: this.title ? `Buscar ${this.title.toLowerCase()}` : "Buscar",
            onChange: (keys: string[]) => {
                this.setSelection(keys);
                if (s.comportamento.unica.value && keys.length) this.setDrop(false);
            }
        };
        if (!this.drop) this.drop = new SelectionList(this.dropHost, opts);
        else this.drop.setOptions(opts);
        this.drop.setData(this.items, Array.from(this.selected.keys()));
    }

    private renderBox() {
        const s = this.settings;
        while (this.box.firstChild) this.box.removeChild(this.box.firstChild);
        const on = this.selected.size > 0;
        this.box.classList.toggle("xp-box--on", on);
        this.box.setAttribute("aria-label", `${this.title}: ${on ? this.selectedLabels().join(", ") : s.cabecalho.vazio.value}. Abrir seleção`);
        if (s.cabecalho.mostrar.value) this.box.appendChild(el("span", "xp-box__label", this.title));
        const value = el("span", "xp-box__value");
        if (!this.items.length) {
            value.appendChild(el("span", "xp-box__ph", "Arraste uma coluna para \"Campo\""));
        } else if (!on) {
            value.appendChild(el("span", "xp-box__ph", s.cabecalho.vazio.value));
        } else {
            const labels = this.selectedLabels();
            const first = el("span", "xp-box__text", labels[0]);
            first.title = labels.join(", ");
            value.appendChild(first);
            if (labels.length > 1) value.appendChild(el("span", "xp-box__badge", `+${labels.length - 1}`));
        }
        this.box.appendChild(value);
        if (on) {
            const x = el("button", "xp-box__clear", "✕");
            x.setAttribute("aria-label", `Limpar ${this.title}`);
            x.title = "Limpar";
            x.addEventListener("click", e => { e.stopPropagation(); this.setSelection([]); });
            this.box.appendChild(x);
        }
        this.box.appendChild(el("span", "xp-box__caret", this.dropOpen ? "▴" : "▾"));
    }

    private renderList() {
        const s = this.settings;
        const opts = {
            single: s.comportamento.unica.value,
            search: s.comportamento.busca.value,
            selectAll: s.comportamento.selecionarTodos.value,
            placeholder: this.title ? `Buscar ${this.title.toLowerCase()}` : "Buscar",
            onChange: (keys: string[]) => this.setSelection(keys)
        };
        if (!this.list) this.list = new SelectionList(this.listHost, opts);
        else this.list.setOptions(opts);
        this.list.setData(this.items, Array.from(this.selected.keys()));
    }

    private selectedLabels(): string[] {
        return Array.from(this.selected.keys()).map(k => {
            const item = this.items.find(i => i.key === k);
            return item ? item.label : k.replace(/^[a-z]+:/, "");
        });
    }
}

function keyOf(v: PrimitiveValue): string {
    if (v instanceof Date) return "d:" + v.getTime();
    return typeof v + ":" + String(v);
}

// "Tabela.Coluna" → { table, column }. Nomes de tabela com ponto não são suportados.
function toTarget(queryName: string, displayName: string): Target {
    const i = queryName.indexOf(".");
    if (i < 0) return { table: queryName, column: displayName };
    return { table: queryName.slice(0, i), column: queryName.slice(i + 1) };
}

function cleanName(name: string): string {
    const parts = (name || "").split("|");
    return parts[parts.length - 1].trim();
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export { xpColors };
