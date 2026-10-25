"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import PrimitiveValue = powerbi.PrimitiveValue;

import { OndeSettings } from "./settings";
import { xpFont } from "./xpTheme";

// Um recorte (botão): soma por valor das linhas recebidas. As medidas são contadas na linha da etapa atual
// da aplicação, então cada aplicação cai numa combinação só e as somas por recorte batem com o DAX.
interface Dim { title: string; queryName: string; target: Target | null; groups: Map<string, Group>; }
interface Group { key: string; raw: PrimitiveValue; label: string; apps: number; base: number; }
interface Target { table: string; column: string; }

const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT0 = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const PCT1 = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const BLANK = "(sem valor)";

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: OndeSettings;
    private fmtService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private dims: Dim[] = [];
    private titulo = "";
    private dimIndex = 0;
    private dimKey = "";
    private selectedKey: string | null = null;
    private loading = false;
    private scrollTop = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.fmtService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = document.createElement("div");
        this.root.className = "xp-on";
        options.element.appendChild(this.root);
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.fmtService.populateFormattingSettingsModel(OndeSettings, dv);
            this.read(dv);
            this.loading = !!(dv && dv.metadata && dv.metadata.segment) && this.host.fetchMoreData(true);
            this.restoreFilter(options.jsonFilters || []);
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.fmtService.buildFormattingModel(this.settings);
    }

    private read(dv: DataView | undefined) {
        this.dims = [];
        this.titulo = "";
        const table = dv && dv.table;
        if (!table) return;
        const idx = (role: string) => table.columns.findIndex(c => c.roles && c.roles[role]);
        const dimIdx = table.columns.map((c, i) => (c.roles && c.roles.dims ? i : -1)).filter(i => i >= 0);
        const iApps = idx("apps"), iBase = idx("base"), iTit = idx("titulo");
        this.dims = dimIdx.map(i => ({
            title: clean(table.columns[i].displayName),
            queryName: table.columns[i].queryName || "",
            target: toTarget(table.columns[i].queryName || ""),
            groups: new Map<string, Group>()
        }));
        for (const r of table.rows) {
            if (!this.titulo && iTit >= 0 && r[iTit] !== null && r[iTit] !== undefined) this.titulo = String(r[iTit]);
            const apps = iApps >= 0 ? num(r[iApps]) : 0;
            const base = iBase >= 0 ? num(r[iBase]) : 0;
            if (!apps && !base) continue;
            dimIdx.forEach((ci, d) => {
                const raw = r[ci];
                const key = keyOf(raw);
                const m = this.dims[d].groups;
                let g = m.get(key);
                if (!g) { g = { key, raw, label: isBlank(raw) ? BLANK : fmtValue(raw), apps: 0, base: 0 }; m.set(key, g); }
                g.apps += apps;
                g.base += base;
            });
        }
        // Mantém o botão escolhido mesmo que a ordem dos campos mude.
        const k = this.dims.findIndex(d => d.queryName === this.dimKey);
        this.dimIndex = k >= 0 ? k : Math.min(this.dimIndex, Math.max(0, this.dims.length - 1));
        this.dimKey = this.dims[this.dimIndex] ? this.dims[this.dimIndex].queryName : "";
    }

    // Filtro salvo (ou aplicado por este visual): volta para o botão do campo filtrado e marca a barra.
    private restoreFilter(filters: powerbi.IFilter[]) {
        const f = (filters[0] || null) as { target?: Target; values?: PrimitiveValue[] } | null;
        this.selectedKey = null;
        if (!f || !f.target || !Array.isArray(f.values) || !f.values.length) return;
        const d = this.dims.findIndex(x => x.target && f.target && x.target.table === f.target.table && x.target.column === f.target.column);
        if (d < 0) return;
        this.dimIndex = d;
        this.dimKey = this.dims[d].queryName;
        this.selectedKey = keyOf(f.values[0]);
    }

    private clearFilter() {
        if (this.selectedKey === null) return;
        this.selectedKey = null;
        this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
    }

    private chooseDim(i: number) {
        if (i === this.dimIndex) return;
        this.clearFilter();
        this.dimIndex = i;
        this.dimKey = this.dims[i].queryName;
        this.scrollTop = 0;
        this.render();
    }

    private chooseGroup(g: Group) {
        const dim = this.dims[this.dimIndex];
        if (!dim || !dim.target || isBlank(g.raw)) return;
        if (this.selectedKey === g.key) this.clearFilter();
        else {
            this.selectedKey = g.key;
            const filter = { $schema: SCHEMA_BASIC, target: dim.target, operator: "In", values: [g.raw], filterType: 1 };
            this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        }
        this.render();
    }

    private render() {
        const s = this.settings;
        const listOld = this.root.querySelector(".xp-on__list") as HTMLElement | null;
        if (listOld) this.scrollTop = listOld.scrollTop;
        this.root.replaceChildren();
        this.root.style.fontFamily = xpFont;
        this.root.style.setProperty("--xp-on-accent", s.cores.destaque.value.value);

        this.root.appendChild(el("div", "xp-on__title", this.titulo || "Onde acontece"));
        if (s.textos.subtitulo.value) this.root.appendChild(el("div", "xp-on__sub", s.textos.subtitulo.value));
        if (!this.dims.length) {
            this.root.appendChild(el("div", "xp-on__empty", "Coloque em Recortes os campos dos botões (recrutador, etapa, vaga, esteira, especialidade) e as medidas Aplicações com Alerta, DQ Onde Base e DQ Onde Título."));
            return;
        }

        const seg = el("div", "xp-on__seg");
        seg.setAttribute("role", "tablist");
        this.dims.forEach((d, i) => {
            const on = i === this.dimIndex;
            const b = el("button", "xp-on__btn" + (on ? " is-on" : ""), d.title);
            b.setAttribute("role", "tab");
            b.setAttribute("aria-selected", String(on));
            b.addEventListener("click", () => this.chooseDim(i));
            seg.appendChild(b);
        });
        this.root.appendChild(seg);

        const dim = this.dims[this.dimIndex];
        const groups = Array.from(dim.groups.values()).filter(g => g.apps > 0).sort((a, b) => b.apps - a.apps || a.label.localeCompare(b.label));
        const totApps = Array.from(dim.groups.values()).reduce((t, g) => t + g.apps, 0);
        const totBase = Array.from(dim.groups.values()).reduce((t, g) => t + g.base, 0);
        const geral = totBase > 0 ? totApps / totBase : 0;
        const r = s.regra;

        const legend = el("div", "xp-on__legend");
        legend.append(
            document.createTextNode(`taxa geral ${PCT1.format(geral)} · `),
            sw(s.cores.atencao.value.value), document.createTextNode(` ${fmtX(r.atencao.value)} a taxa geral · `),
            sw(s.cores.critico.value.value), document.createTextNode(` ${fmtX(r.critico.value)} (só com ${INT.format(r.minimo.value)}+ aplicações)`));
        this.root.appendChild(legend);

        const list = el("div", "xp-on__list");
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-label", dim.title);
        const max = Math.max(1, ...groups.map(g => g.apps));
        if (!groups.length) list.appendChild(el("div", "xp-on__empty", "Nenhuma aplicação com alerta nos filtros da página."));
        for (const g of groups) {
            const p = g.base > 0 ? g.apps / g.base : 0;
            const status = g.base >= r.minimo.value && geral > 0
                ? (p >= r.critico.value * geral ? "crit" : p >= r.atencao.value * geral ? "warn" : "") : "";
            const color = status === "crit" ? s.cores.critico.value.value : status === "warn" ? s.cores.atencao.value.value : s.cores.ok.value.value;
            const on = this.selectedKey === g.key;
            const row = el("div", "xp-on__row" + (on ? " is-on" : "") + (this.selectedKey && !on ? " is-dim" : "") + (isBlank(g.raw) ? " is-blank" : ""));
            row.tabIndex = 0;
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", String(on));
            row.title = `${g.label}: ${INT.format(g.apps)} de ${INT.format(g.base)} aplicações (${PCT1.format(p)})`;
            const bar = el("span", "xp-on__bar");
            const fill = el("i", "");
            fill.style.width = ((g.apps / max) * 100).toFixed(1) + "%";
            fill.style.minWidth = "4px";
            fill.style.background = color;
            bar.appendChild(fill);
            row.append(el("span", "xp-on__name", g.label), bar,
                el("span", "xp-on__v" + (status ? " is-" + status : ""), `${INT.format(g.apps)} · ${PCT0.format(p)}`));
            row.addEventListener("click", () => this.chooseGroup(g));
            row.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.chooseGroup(g); } });
            list.appendChild(row);
        }
        this.root.appendChild(list);
        list.scrollTop = this.scrollTop;

        const foot = el("div", "xp-on__foot", this.loading ? "Carregando o restante…" : (s.textos.rodape.value || ""));
        if (this.selectedKey !== null) {
            const clear = el("button", "xp-on__clear", "× tirar filtro");
            clear.addEventListener("click", () => { this.clearFilter(); this.render(); });
            foot.appendChild(clear);
        }
        this.root.appendChild(foot);
    }
}

function sw(color: string): HTMLElement { const s = el("i", "xp-on__sw"); s.style.background = color; return s; }
function fmtX(n: number): string { return "≥ " + new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(n) + "×"; }
function isBlank(v: PrimitiveValue): boolean { return v === null || v === undefined || v === ""; }
function keyOf(v: PrimitiveValue): string { return isBlank(v) ? "∅" : (v instanceof Date ? v.toISOString() : String(v)); }
function num(v: PrimitiveValue): number { return typeof v === "number" && isFinite(v) ? v : 0; }
function fmtValue(v: PrimitiveValue): string {
    if (v instanceof Date) return v.toLocaleDateString("pt-BR");
    if (typeof v === "number") return INT.format(v);
    return String(v).trim();
}
function clean(name: string): string { const parts = (name || "").split("|"); return parts[parts.length - 1].trim(); }
function toTarget(queryName: string): Target | null {
    const m = /^(.*)\.([^.]+)$/.exec(queryName);
    if (!m) return null;
    return { table: m[1].replace(/^'|'$/g, ""), column: m[2].replace(/^\[|\]$/g, "") };
}
function el(tag: string, className: string, txt?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (txt !== undefined) node.textContent = txt;
    return node;
}
