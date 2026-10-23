"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;

import { PeriodSettings } from "./settings";
import { xpColors, xpFont } from "./xpTheme";

type Preset = "mes" | "mesAnterior" | "trimestre" | "trimestreAnterior" | "ultimos30" | "proximos30" | "ano" | "tudo";
interface Range { start: Date; end: Date; }
interface Target { table: string; column: string; }

// Identificador fixo do formato de filtro do Power BI (não é um endereço acessado).
const SCHEMA_ADVANCED = "ht" + "tp://powerbi.com/product/schema#advanced";
const DAY = 86400000;
const WEEK = ["S", "T", "Q", "Q", "S", "S", "D"];

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private box: HTMLElement;
    private panel: HTMLElement;
    private settings: PeriodSettings;
    private formattingSettingsService: FormattingSettingsService;
    private target: Target | null = null;
    private minDate: Date | null = null;
    private refDate: Date = startOfDay(new Date());
    private maxDate: Date | null = null;
    private current: Range | null = null;
    private open = false;
    // Seleção em andamento no calendário (só vira filtro no "Aplicar").
    private draftStart: Date | null = null;
    private draftEnd: Date | null = null;
    private viewMonth: Date = startOfMonth(new Date());
    private lastPreset: Preset | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("div", "xp-pe");
        this.box = el("div", "xp-pe__box");
        this.box.tabIndex = 0;
        this.box.setAttribute("role", "button");
        this.box.addEventListener("click", () => this.setOpen(!this.open));
        this.box.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") { e.preventDefault(); this.setOpen(true); }
            if (e.key === "Escape") this.setOpen(false);
        });
        this.panel = el("div", "xp-pe__panel");
        this.panel.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Escape") { this.setOpen(false); this.box.focus(); } });
        this.root.append(this.box, this.panel);
        options.element.appendChild(this.root);
        // Fecha ao clicar fora: na área transparente do visual ou em qualquer outro lugar do relatório.
        this.root.addEventListener("mousedown", (e: MouseEvent) => { if (this.open && e.target === this.root) this.setOpen(false); });
        window.addEventListener("blur", () => this.setOpen(false));
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(PeriodSettings, dataView);
            this.read(dataView);
            this.current = this.restore(options.jsonFilters);
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
        this.target = null;
        this.minDate = null;
        this.maxDate = null;
        const cat = dataView && dataView.categorical;
        const column = cat && cat.categories && cat.categories[0];
        if (!column) return;
        this.target = toTarget(column.source.queryName || "", column.source.displayName);
        const times = column.values.map(asDate).filter((d): d is Date => d !== null).map(d => d.getTime());
        const today = startOfDay(new Date());
        const maxDate = times.length ? new Date(Math.max(...times)) : null;
        if (times.length) this.minDate = new Date(Math.min(...times));
        this.maxDate = maxDate;
        const refCol = cat.values && cat.values[0];
        const ref = refCol ? refCol.values.map(asDate).find(d => d !== null) : null;
        this.refDate = ref || (maxDate && maxDate < today ? maxDate : today);
    }

    private restore(filters: powerbi.IFilter[] | undefined): Range | null {
        const f = (filters || [])[0] as { conditions?: { operator: string; value: unknown }[] } | undefined;
        if (!f || !Array.isArray(f.conditions)) return null;
        let start: Date | null = null, end: Date | null = null;
        for (const c of f.conditions) {
            const d = asDate(c.value);
            if (!d) continue;
            if (c.operator === "GreaterThanOrEqual") start = d;
            if (c.operator === "LessThan") end = new Date(d.getTime() - DAY);
            if (c.operator === "LessThanOrEqual") end = d;
        }
        return start && end ? { start, end } : null;
    }

    // Último dia que pode ser escolhido: a última data da coluna (permite datas futuras) ou a referência.
    private limit(): Date | null {
        if (!this.settings.calendario.futuro.value) return this.refDate;
        return this.maxDate && this.maxDate > this.refDate ? this.maxDate : this.refDate;
    }

    private presetRange(p: Preset): Range | null {
        const r = this.refDate;
        const y = r.getFullYear(), m = r.getMonth();
        const clampStart = (d: Date) => (this.minDate && d < this.minDate ? this.minDate : d);
        switch (p) {
            case "mes": return { start: clampStart(new Date(y, m, 1)), end: r };
            case "mesAnterior": return { start: clampStart(new Date(y, m - 1, 1)), end: new Date(y, m, 0) };
            case "trimestre": return { start: clampStart(new Date(y, Math.floor(m / 3) * 3, 1)), end: r };
            case "trimestreAnterior": {
                const q0 = Math.floor(m / 3) * 3;
                return { start: clampStart(new Date(y, q0 - 3, 1)), end: new Date(y, q0, 0) };
            }
            case "ultimos30": return { start: clampStart(new Date(r.getTime() - 29 * DAY)), end: r };
            case "proximos30": return { start: r, end: new Date(y, m, r.getDate() + 29) };
            case "ano": return { start: clampStart(new Date(y, 0, 1)), end: r };
            default: return null;
        }
    }

    private activePreset(): Preset | null {
        if (!this.current) return "tudo";
        // Dois atalhos podem dar o mesmo intervalo (ex.: em outubro, mês atual = trimestre atual): vale o clicado.
        if (this.lastPreset && this.lastPreset !== "tudo") {
            const r = this.presetRange(this.lastPreset);
            if (r && sameDay(r.start, this.current.start) && sameDay(r.end, this.current.end)) return this.lastPreset;
        }
        for (const p of ["mes", "mesAnterior", "trimestre", "trimestreAnterior", "ultimos30", "proximos30", "ano"] as Preset[]) {
            const r = this.presetRange(p);
            if (r && sameDay(r.start, this.current.start) && sameDay(r.end, this.current.end)) return p;
        }
        return null;
    }

    private apply(range: Range | null) {
        this.current = range;
        if (this.target) {
            if (!range) {
                this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
            } else {
                const filter = {
                    $schema: SCHEMA_ADVANCED,
                    target: this.target,
                    logicalOperator: "And",
                    conditions: [
                        { operator: "GreaterThanOrEqual", value: range.start },
                        { operator: "LessThan", value: new Date(range.end.getTime() + DAY) }
                    ],
                    filterType: 0
                };
                this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
            }
        }
        this.open = false;
        this.render();
    }

    private setOpen(open: boolean) {
        if (open === this.open || (open && !this.target)) return;
        this.open = open;
        if (open) {
            this.draftStart = this.current ? this.current.start : null;
            this.draftEnd = this.current ? this.current.end : null;
            this.viewMonth = startOfMonth(this.draftEnd || this.refDate);
        }
        this.render();
    }

    private render() {
        const s = this.settings;
        this.root.style.fontFamily = xpFont;
        this.root.style.setProperty("--xp-pe-accent", s.cores.destaque.value.value);
        this.root.style.setProperty("--xp-pe-border", s.cores.borda.value.value);
        this.root.style.setProperty("--xp-pe-bg", s.cores.fundo.value.value);
        this.renderBox();
        this.panel.style.display = this.open ? "" : "none";
        if (this.open) this.renderPanel();
    }

    private tudoLabel(): string {
        const custom = (this.settings.caixa.rotuloTudo.value || "").trim();
        if (custom) return custom;
        return this.minDate ? `Desde ${shortDate(this.minDate, this.host.locale)}` : "Todos os dados";
    }

    private renderBox() {
        const s = this.settings;
        clear(this.box);
        const on = !!this.current;
        this.box.style.height = Math.max(32, s.caixa.altura.value) + "px";
        this.box.classList.toggle("xp-pe__box--on", on);
        this.box.classList.toggle("xp-pe__box--open", this.open);
        this.box.setAttribute("aria-expanded", String(this.open));
        this.box.appendChild(el("span", "xp-pe__label", s.caixa.titulo.value));
        const text = !this.target ? "Arraste a coluna de data para \"Data\""
            : this.current ? (this.quarterLabel(this.current) || `${fmt(this.current.start, this.host.locale)} – ${fmt(this.current.end, this.host.locale)}`) : this.tudoLabel();
        this.box.appendChild(el("span", "xp-pe__value" + (on ? "" : " xp-pe__value--ph"), text));
        this.box.setAttribute("aria-label", `${s.caixa.titulo.value}: ${text}. Abrir calendário`);
        if (on) {
            const x = el("button", "xp-pe__clear", "✕");
            x.title = "Limpar período";
            x.setAttribute("aria-label", "Limpar período");
            x.addEventListener("click", e => { e.stopPropagation(); this.apply(null); });
            this.box.appendChild(x);
        }
        this.box.appendChild(el("span", "xp-pe__caret", this.open ? "▴" : "▾"));
    }

    // Trimestre do calendário: "T3 2026 · 01/07 – 30/09" (inteiro) ou "T4 2026 · 01/10 – hoje" (até a data de referência).
    private quarterLabel(r: Range): string {
        const s = r.start;
        if (s.getDate() !== 1 || s.getMonth() % 3 !== 0) return "";
        const qEnd = new Date(s.getFullYear(), s.getMonth() + 3, 0);
        const dm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        const label = `T${s.getMonth() / 3 + 1} ${s.getFullYear()} · ${dm(s)} – `;
        if (sameDay(r.end, qEnd)) return label + dm(qEnd);
        if (sameDay(r.end, this.refDate) && r.end < qEnd) return label + "hoje";
        return "";
    }

    private renderPanel() {
        const s = this.settings;
        const locale = this.host.locale || "pt-BR";
        clear(this.panel);

        // Atalhos: aplicam na hora.
        const chips = el("div", "xp-pe__chips");
        const active = this.activePreset();
        const defs: [Preset, string, boolean][] = [
            ["mes", "Mês atual", s.atalhos.mes.value],
            ["mesAnterior", "Mês anterior", s.atalhos.mesAnterior.value],
            ["trimestre", "Trimestre atual", s.atalhos.trimestre.value],
            ["trimestreAnterior", "Trimestre anterior", s.atalhos.trimestreAnterior.value],
            ["ultimos30", "Últimos 30 dias", s.atalhos.ultimos30.value],
            ["proximos30", "Próximos 30 dias", s.atalhos.proximos30.value],
            ["ano", "Ano atual", s.atalhos.ano.value],
            ["tudo", this.tudoLabel(), s.atalhos.tudo.value]
        ];
        for (const [p, label, show] of defs) {
            if (!show) continue;
            const b = el("button", "xp-pe__chip" + (p === active ? " xp-pe__chip--on" : ""), label);
            b.addEventListener("click", () => { this.lastPreset = p; this.apply(p === "tudo" ? null : this.presetRange(p)); });
            chips.appendChild(b);
        }
        this.panel.appendChild(chips);

        // Campos De / Até (aceitam digitação dd/mm/aaaa).
        const inputs = el("div", "xp-pe__inputs");
        inputs.appendChild(this.dateField("De", this.draftStart, d => { this.draftStart = d; if (this.draftEnd && d > this.draftEnd) this.draftEnd = d; this.viewMonth = startOfMonth(d); this.renderPanel(); }));
        inputs.appendChild(this.dateField("Até", this.draftEnd, d => { this.draftEnd = d; if (!this.draftStart || d < this.draftStart) this.draftStart = d; this.viewMonth = startOfMonth(d); this.renderPanel(); }));
        this.panel.appendChild(inputs);

        // Calendário de um mês.
        const head = el("div", "xp-pe__month");
        const prev = el("button", "xp-pe__nav", "‹");
        prev.setAttribute("aria-label", "Mês anterior");
        const next = el("button", "xp-pe__nav", "›");
        next.setAttribute("aria-label", "Próximo mês");
        const vm = this.viewMonth;
        const canPrev = !this.minDate || vm > startOfMonth(this.minDate);
        const lim = this.limit();
        const canNext = !lim || vm < startOfMonth(lim);
        prev.toggleAttribute("disabled", !canPrev);
        next.toggleAttribute("disabled", !canNext);
        prev.addEventListener("click", () => { this.viewMonth = new Date(vm.getFullYear(), vm.getMonth() - 1, 1); this.renderPanel(); });
        next.addEventListener("click", () => { this.viewMonth = new Date(vm.getFullYear(), vm.getMonth() + 1, 1); this.renderPanel(); });
        const name = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(vm).replace(" de ", " ");
        head.append(prev, el("span", "xp-pe__month-name", name.charAt(0).toUpperCase() + name.slice(1)), next);
        this.panel.appendChild(head);

        const grid = el("div", "xp-pe__grid");
        WEEK.forEach(w => grid.appendChild(el("span", "xp-pe__wd", w)));
        const offset = (vm.getDay() + 6) % 7;
        for (let i = 0; i < offset; i++) grid.appendChild(el("span", ""));
        const days = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate();
        const ds = this.draftStart, de = this.draftEnd || this.draftStart;
        for (let d = 1; d <= days; d++) {
            const date = new Date(vm.getFullYear(), vm.getMonth(), d);
            const disabled = (!!lim && date > lim) || (!!this.minDate && date < this.minDate);
            let cls = "xp-pe__day";
            if (disabled) cls += " xp-pe__day--off";
            else if (ds && de && date >= ds && date <= de) {
                cls += sameDay(date, ds) || sameDay(date, de) ? " xp-pe__day--edge" : " xp-pe__day--in";
                if (sameDay(date, ds)) cls += " xp-pe__day--start";
                if (sameDay(date, de)) cls += " xp-pe__day--end";
            }
            if (sameDay(date, this.refDate)) cls += " xp-pe__day--ref";
            const b = el("button", cls, String(d));
            b.toggleAttribute("disabled", disabled);
            b.setAttribute("aria-label", fmt(date, locale));
            b.addEventListener("click", () => this.pick(date));
            grid.appendChild(b);
        }
        this.panel.appendChild(grid);

        // Rodapé: total de dias, Limpar, Aplicar.
        const foot = el("div", "xp-pe__foot");
        const n = ds ? Math.round(((de || ds).getTime() - ds.getTime()) / DAY) + 1 : 0;
        foot.appendChild(el("span", "xp-pe__count", ds ? (this.draftEnd ? `${n} dia${n > 1 ? "s" : ""}` : "Escolha o último dia") : "Escolha o primeiro dia"));
        const clr = el("button", "xp-pe__link", "Limpar");
        clr.addEventListener("click", () => this.apply(null));
        const ok = el("button", "xp-pe__apply", "Aplicar");
        ok.toggleAttribute("disabled", !ds);
        ok.addEventListener("click", () => { if (ds) this.apply({ start: ds, end: this.draftEnd || ds }); });
        foot.append(clr, ok);
        this.panel.appendChild(foot);
    }

    // 1º clique: início. 2º clique: fim (se for antes do início, inverte). Mesmo dia duas vezes: um dia só.
    private pick(date: Date) {
        if (!this.draftStart || this.draftEnd) {
            this.draftStart = date;
            this.draftEnd = null;
        } else if (date < this.draftStart) {
            this.draftEnd = this.draftStart;
            this.draftStart = date;
        } else {
            this.draftEnd = date;
        }
        this.renderPanel();
    }

    private dateField(label: string, value: Date | null, onChange: (d: Date) => void): HTMLElement {
        const wrap = el("label", "xp-pe__field");
        wrap.appendChild(el("span", "xp-pe__field-label", label));
        const input = document.createElement("input");
        input.type = "text";
        input.inputMode = "numeric";
        input.placeholder = "dd/mm/aaaa";
        input.value = value ? fmt(value, this.host.locale) : "";
        const commit = () => {
            const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.value.trim());
            if (!m) { input.classList.toggle("xp-pe__input--bad", input.value.trim() !== ""); return; }
            let d = new Date(+m[3], +m[2] - 1, +m[1]);
            const lim = this.limit();
            if (lim && d > lim) d = lim;
            if (this.minDate && d < this.minDate) d = this.minDate;
            onChange(d);
        };
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Enter") commit(); if (e.key === "Escape") this.setOpen(false); });
        input.addEventListener("change", commit);
        wrap.appendChild(input);
        return wrap;
    }
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function sameDay(a: Date, b: Date): boolean { return startOfDay(a).getTime() === startOfDay(b).getTime(); }
function fmt(d: Date, locale?: string): string {
    return new Intl.DateTimeFormat(locale || "pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}
function shortDate(d: Date, locale?: string): string {
    return String(d.getDate()).padStart(2, "0") + "/" + new Intl.DateTimeFormat(locale || "pt-BR", { month: "short" }).format(d).replace(".", "");
}

// Aceita Date, texto ISO ou número de série do Excel/DAX (dias desde 30/12/1899).
function asDate(v: unknown): Date | null {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : startOfDay(v);
    if (typeof v === "number" && v > 20000 && v < 80000) return startOfDay(new Date(1899, 11, 30 + Math.floor(v)));
    if (typeof v === "string" && v) {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : startOfDay(d);
    }
    return null;
}

function toTarget(queryName: string, displayName: string): Target {
    const i = queryName.indexOf(".");
    if (i < 0) return { table: queryName, column: displayName };
    return { table: queryName.slice(0, i), column: queryName.slice(i + 1) };
}

export { xpColors };

function pad(n: number): string { return n < 10 ? "0" + n : String(n); }
