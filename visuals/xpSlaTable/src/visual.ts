"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionId = powerbi.visuals.ISelectionId;
import DataView = powerbi.DataView;

import { SlaTableSettings, ordemItems } from "./settings";
import { xpFont } from "./xpTheme";

type Key = "tipico" | "p90" | "base" | "acima";
type Order = "processo" | Key;

interface Row {
    index: number;
    label: string;
    tipico: number | null;
    p90: number | null;
    base: number | null;
    acima: number | null;
    id: ISelectionId;
}

const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const DEC = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private summary: HTMLElement;
    private wrap: HTMLElement;
    private hint: HTMLElement;
    private tip: HTMLElement;
    private settings: SlaTableSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: Row[] = [];
    private rowEls: { el: HTMLElement; id: ISelectionId }[] = [];
    private query = "";
    private onlyMoving: boolean | null = null;
    private order: Order | null = null;
    private desc = true;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-sla");
        this.toolbar = el("div", "xp-sla__bar");
        this.summary = el("div", "xp-sla__summary");
        this.wrap = el("div", "xp-sla__wrap");
        this.hint = el("div", "xp-sla__hint");
        this.tip = el("div", "xp-sla__tip");
        this.tip.style.display = "none";
        this.root.append(this.toolbar, this.summary, this.wrap, this.hint, this.tip);
        options.element.appendChild(this.root);
        this.wrap.addEventListener("click", () => this.selectionManager.clear().then(() => this.paintSelection([])));
        this.root.addEventListener("contextmenu", (e: MouseEvent) => {
            this.selectionManager.showContextMenu({}, { x: e.clientX, y: e.clientY });
            e.preventDefault();
        });
        this.selectionManager.registerOnSelectCallback((ids: ISelectionId[]) => this.paintSelection(ids));
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dv = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(SlaTableSettings, dv);
            if (this.onlyMoving === null) this.onlyMoving = this.settings.comportamento.soMovimento.value;
            if (this.order === null) this.order = String(this.settings.comportamento.ordemInicial.value.value) as Order;
            this.height = options.viewport.height;
            this.read(dv);
            this.root.style.fontFamily = xpFont;
            this.root.style.setProperty("--xp-sla-tipico", this.settings.cores.tipico.value.value);
            this.root.style.setProperty("--xp-sla-p90", this.settings.cores.p90.value.value);
            this.root.style.setProperty("--xp-sla-acima", this.settings.cores.acima.value.value);
            this.renderToolbar();
            this.renderSummary();
            this.renderTable();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private read(dv: DataView | undefined) {
        this.rows = [];
        const cat = dv && dv.categorical;
        const column = cat && cat.categories && cat.categories[0];
        if (!column) return;
        const measure = (role: string) => {
            const col = (cat.values || []).find(v => v.source.roles && v.source.roles[role]);
            return (i: number) => (col ? num(col.values[i]) : null);
        };
        const tipico = measure("tipico"), p90 = measure("p90"), base = measure("base"), acima = measure("acima");
        for (let i = 0; i < column.values.length; i++) {
            const raw = column.values[i];
            this.rows.push({
                index: i,
                label: raw === null || raw === undefined || raw === "" ? "(sem etapa)" : String(raw),
                tipico: tipico(i), p90: p90(i), base: base(i), acima: acima(i),
                id: this.host.createSelectionIdBuilder().withCategory(column, i).createSelectionId()
            });
        }
    }

    private renderToolbar() {
        clear(this.toolbar);
        const search = el("label", "xp-sla__search");
        search.appendChild(el("span", "xp-sla__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = "Buscar etapa";
        input.value = this.query;
        input.setAttribute("aria-label", "Buscar etapa");
        input.addEventListener("input", () => { this.query = input.value; this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.toolbar.appendChild(search);

        const moving = el("button", "xp-sla__btn" + (this.onlyMoving ? " xp-sla__btn--on" : ""), "Só com movimento");
        moving.setAttribute("aria-pressed", String(!!this.onlyMoving));
        moving.addEventListener("click", () => { this.onlyMoving = !this.onlyMoving; this.renderToolbar(); this.renderTable(); });
        this.toolbar.appendChild(moving);

        const select = document.createElement("select");
        select.className = "xp-sla__select";
        select.setAttribute("aria-label", "Ordem");
        for (const o of ordemItems) {
            const opt = document.createElement("option");
            opt.value = o.value;
            opt.textContent = "Ordem: " + o.displayName.charAt(0).toLowerCase() + o.displayName.slice(1);
            select.appendChild(opt);
        }
        const preset = ordemItems.some(o => o.value === this.order) && (this.order === "processo" || this.desc);
        if (!preset) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Ordem: pela coluna";
            select.appendChild(opt);
        }
        select.value = preset ? String(this.order) : "";
        select.addEventListener("change", () => {
            if (!select.value) return;
            this.order = select.value as Order;
            this.desc = true;
            this.renderToolbar();
            this.renderTable();
        });
        this.toolbar.appendChild(select);
    }

    private renderSummary() {
        clear(this.summary);
        const total = this.rows.reduce((t, r) => t + (r.acima || 0), 0);
        if (!this.rows.length || !this.rows.some(r => r.acima !== null)) { this.summary.style.display = "none"; return; }
        this.summary.style.display = "";
        this.summary.appendChild(el("strong", "", INT.format(total)));
        this.summary.appendChild(document.createTextNode(" " + this.settings.textos.resumo.value));
    }

    private visibleRows(): Row[] {
        const q = normalize(this.query);
        let list = this.rows.filter(r => (!this.onlyMoving || (r.base || 0) > 0 || (r.acima || 0) > 0) && (!q || normalize(r.label).indexOf(q) >= 0));
        if (this.order && this.order !== "processo") {
            const k = this.order as Key, dir = this.desc ? -1 : 1;
            list = list.slice().sort((x, y) => {
                const a = x[k], b = y[k];
                if (a === null && b === null) return x.index - y.index;
                if (a === null) return 1;
                if (b === null) return -1;
                return a === b ? x.index - y.index : (a - b) * dir;
            });
        }
        return list;
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        this.rowEls = [];
        this.hint.textContent = (s.textos.rodape.value || "").trim();
        this.hint.style.display = this.hint.textContent ? "" : "none";
        const avail = Math.max(80, this.height - this.toolbar.offsetHeight - this.summary.offsetHeight - this.hint.offsetHeight - 22);
        this.wrap.style.height = avail + "px";

        if (!this.rows.length) {
            this.wrap.appendChild(el("div", "xp-sla__empty", "Arraste a etapa para \"Etapa\" e as medidas para as colunas."));
            return;
        }
        const list = this.visibleRows();
        const maxP90 = Math.max(1, ...list.map(r => Math.max(r.p90 || 0, r.tipico || 0)));

        const table = el("table", "xp-sla__table");
        const hr = el("tr", "");
        const cols: [string, Key | null, string][] = [
            [s.textos.colEtapa.value, null, "xp-sla__th-name"],
            ["Típico", "tipico", ""],
            ["Faixa", null, "xp-sla__th-range"],
            ["90% saem até", "p90", ""],
            ["Base", "base", ""],
            ["Acima hoje", "acima", ""]
        ];
        for (const [label, key, cls] of cols) {
            const th = el("th", cls);
            if (key) {
                const on = this.order === key;
                const b = el("button", "xp-sla__sort" + (on ? " xp-sla__sort--on" : ""), label);
                if (on) b.appendChild(el("span", "", this.desc ? " ↓" : " ↑"));
                b.addEventListener("click", e => {
                    e.stopPropagation();
                    // 1º clique: maior primeiro; 2º: menor primeiro; 3º: volta à ordem do processo.
                    if (this.order !== key) { this.order = key; this.desc = true; }
                    else if (this.desc) this.desc = false;
                    else { this.order = "processo"; this.desc = true; }
                    this.renderToolbar();
                    this.renderTable();
                });
                th.appendChild(b);
                th.setAttribute("aria-sort", on ? (this.desc ? "descending" : "ascending") : "none");
            } else {
                th.textContent = label;
            }
            hr.appendChild(th);
        }
        const thead = el("thead", "");
        thead.appendChild(hr);
        table.appendChild(thead);

        const tbody = el("tbody", "");
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-sla__none", this.query ? `Nenhuma etapa com "${this.query}"` : "Nenhuma etapa com movimento no período");
            td.setAttribute("colspan", "6");
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        for (const r of list) {
            const tr = el("tr", "xp-sla__row");
            tr.tabIndex = 0;
            const name = el("td", "xp-sla__name");
            highlight(name, r.label, q);
            name.title = r.label;
            tr.appendChild(name);
            tr.appendChild(el("td", "", days(r.tipico)));

            const range = el("td", "xp-sla__range");
            const track = el("div", "xp-sla__track");
            if (r.p90 !== null) {
                const p = el("div", "xp-sla__p90");
                p.style.width = (Math.max(0, r.p90) / maxP90 * 100).toFixed(2) + "%";
                track.appendChild(p);
            }
            if (r.tipico !== null) {
                const m = el("div", "xp-sla__tipico");
                m.style.width = (Math.max(0, r.tipico) / maxP90 * 100).toFixed(2) + "%";
                track.appendChild(m);
            }
            range.appendChild(track);
            range.addEventListener("mousemove", (e: MouseEvent) => this.showTip(e, r));
            range.addEventListener("mouseleave", () => { this.tip.style.display = "none"; });
            tr.appendChild(range);

            tr.appendChild(el("td", "xp-sla__strong", days(r.p90)));
            tr.appendChild(el("td", "xp-sla__muted", r.base === null ? "—" : INT.format(r.base)));
            const ac = el("td", "");
            if (r.acima && r.acima > 0) ac.appendChild(el("span", "xp-sla__pill", INT.format(r.acima)));
            else ac.appendChild(el("span", "xp-sla__muted", "—"));
            tr.appendChild(ac);

            tr.setAttribute("aria-label", `${r.label}: típico ${days(r.tipico)}, 90% saem até ${days(r.p90)}, ${r.acima || 0} acima hoje`);
            const pick = (multi: boolean) => this.selectionManager.select(r.id, multi).then(ids => this.paintSelection(ids as ISelectionId[]));
            tr.addEventListener("click", (e: MouseEvent) => { e.stopPropagation(); pick(e.ctrlKey || e.metaKey); });
            tr.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(e.ctrlKey || e.metaKey); } });
            tr.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(r.id, { x: e.clientX, y: e.clientY });
            });
            tbody.appendChild(tr);
            this.rowEls.push({ el: tr, id: r.id });
        }
        table.appendChild(tbody);
        this.wrap.appendChild(table);
        this.paintSelection(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private showTip(e: MouseEvent, r: Row) {
        clear(this.tip);
        this.tip.appendChild(el("div", "xp-sla__tip-head", r.label));
        this.tip.appendChild(el("div", "", `Metade sai em até ${days(r.tipico)}`));
        this.tip.appendChild(el("div", "", `90% saem em até ${days(r.p90)}`));
        if (r.base !== null) this.tip.appendChild(el("div", "xp-sla__tip-sub", `Base: ${INT.format(r.base)} aplicações concluídas`));
        if (r.acima !== null) this.tip.appendChild(el("div", "xp-sla__tip-sub", `Hoje: ${INT.format(r.acima)} em andamento acima de ${days(r.p90)}`));
        this.tip.style.display = "";
        const box = this.root.getBoundingClientRect();
        let x = e.clientX - box.left + 14;
        if (x + this.tip.offsetWidth > box.width) x = e.clientX - box.left - 14 - this.tip.offsetWidth;
        let y = e.clientY - box.top + 14;
        if (y + this.tip.offsetHeight > box.height) y = e.clientY - box.top - 14 - this.tip.offsetHeight;
        this.tip.style.left = Math.max(0, x) + "px";
        this.tip.style.top = Math.max(0, y) + "px";
    }

    private paintSelection(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        for (const r of this.rowEls) {
            const on = any && ids.some(id => id.equals(r.id));
            r.el.classList.toggle("xp-sla__row--dim", any && !on);
            r.el.classList.toggle("xp-sla__row--sel", !!on);
        }
    }
}

function num(v: powerbi.PrimitiveValue): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
}
function days(v: number | null): string { return v === null ? "—" : DEC.format(v) + " d"; }
function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }
function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}
// Destaca o trecho buscado, ignorando acentos, sem innerHTML.
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.textContent = label; return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
