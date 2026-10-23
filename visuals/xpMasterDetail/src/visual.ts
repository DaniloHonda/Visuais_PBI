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

import { MasterDetailSettings, topItems } from "./settings";
import { xpFont } from "./xpTheme";

interface Item {
    label: string;
    value: number;
    id: ISelectionId;
}

interface Group {
    index: number;
    label: string;
    total: number;
    items: Item[];
    id: ISelectionId;
}

const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private toolbar: HTMLElement;
    private body: HTMLElement;
    private listEl: HTMLElement;
    private detailEl: HTMLElement;
    private settings: MasterDetailSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private groups: Group[] = [];
    private chosen: string | null = null;
    private query = "";
    private top: number | null = null;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-md");
        this.toolbar = el("div", "xp-md__bar");
        this.body = el("div", "xp-md__body");
        this.listEl = el("div", "xp-md__list");
        this.detailEl = el("div", "xp-md__detail");
        this.body.append(this.listEl, this.detailEl);
        this.root.append(this.toolbar, this.body);
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
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(MasterDetailSettings, dv);
            if (this.top === null) this.top = Number(this.settings.comportamento.top.value.value) || 0;
            this.height = options.viewport.height;
            this.read(dv);
            this.root.style.fontFamily = xpFont;
            this.root.style.setProperty("--xp-md-bar", this.settings.cores.barra.value.value);
            this.root.style.setProperty("--xp-md-sel", this.settings.cores.selecao.value.value);
            this.root.style.setProperty("--xp-md-hl", this.settings.destaque.cor.value.value);
            this.renderToolbar();
            this.renderBody();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    // Cada linha do dataView é um par (grupo, item); agrupa mantendo a ordem de chegada do grupo.
    private read(dv: DataView | undefined) {
        this.groups = [];
        const cat = dv && dv.categorical;
        const cats = (cat && cat.categories) || [];
        const gCol = cats.find(c => c.source.roles && c.source.roles["grupo"]);
        const iCol = cats.find(c => c.source.roles && c.source.roles["item"]);
        const vCol = cat && cat.values && cat.values.find(v => v.source.roles && v.source.roles["valor"]);
        if (!gCol || !vCol) return;
        const byLabel = new Map<string, Group>();
        const emptyItem = this.settings.textos.vazio.value || "(vazio)";
        for (let i = 0; i < gCol.values.length; i++) {
            const g = gCol.values[i];
            const label = g === null || g === undefined || g === "" ? "(vazio)" : String(g);
            let group = byLabel.get(label);
            if (!group) {
                group = { index: byLabel.size, label, total: 0, items: [], id: this.host.createSelectionIdBuilder().withCategory(gCol, i).createSelectionId() };
                byLabel.set(label, group);
                this.groups.push(group);
            }
            const v = Number(vCol.values[i]);
            if (!isFinite(v) || v === 0) continue;
            group.total += v;
            if (iCol) {
                const raw = iCol.values[i];
                const builder = this.host.createSelectionIdBuilder().withCategory(gCol, i).withCategory(iCol, i);
                group.items.push({ label: raw === null || raw === undefined || raw === "" ? emptyItem : String(raw), value: v, id: builder.createSelectionId() });
            }
        }
        for (const g of this.groups) g.items.sort((a, b) => b.value - a.value);
        if (String(this.settings.comportamento.ordem.value.value) === "total") {
            this.groups.sort((a, b) => b.total - a.total || a.index - b.index);
        }
        if (!this.chosen || !this.groups.some(g => g.label === this.chosen && g.total > 0)) {
            const first = this.groups.find(g => g.total > 0);
            this.chosen = first ? first.label : null;
        }
    }

    private renderToolbar() {
        clear(this.toolbar);
        const search = el("label", "xp-md__search");
        search.appendChild(el("span", "xp-md__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = this.settings.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.renderList(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderList(); } });
        search.appendChild(input);
        this.toolbar.appendChild(search);
        this.toolbar.appendChild(el("span", "xp-md__spacer"));

        const seg = el("div", "xp-md__seg");
        seg.setAttribute("role", "group");
        seg.setAttribute("aria-label", "Quantos itens mostrar");
        for (const t of topItems) {
            const n = Number(t.value);
            const b = el("button", "xp-md__opt" + (this.top === n ? " xp-md__opt--on" : ""), t.displayName);
            b.setAttribute("aria-pressed", String(this.top === n));
            b.addEventListener("click", () => { if (this.top !== n) { this.top = n; this.renderToolbar(); this.renderDetail(); } });
            seg.appendChild(b);
        }
        this.toolbar.appendChild(seg);
    }

    private renderBody() {
        const avail = Math.max(120, this.height - this.toolbar.offsetHeight - 10);
        this.body.style.height = avail + "px";
        this.renderList();
        this.renderDetail();
    }

    private renderList() {
        clear(this.listEl);
        if (!this.groups.length) {
            this.listEl.appendChild(el("div", "xp-md__empty", "Arraste os campos para Lista, Itens e Valor."));
            return;
        }
        const q = normalize(this.query);
        const list = this.groups.filter(g => g.total > 0 && (!q || normalize(g.label).indexOf(q) >= 0));
        if (!list.length) {
            this.listEl.appendChild(el("div", "xp-md__empty", `Nada encontrado para "${this.query}"`));
            return;
        }
        this.listEl.setAttribute("role", "listbox");
        for (const g of list) {
            const on = g.label === this.chosen;
            const row = el("button", "xp-md__group" + (on ? " xp-md__group--on" : ""));
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", String(on));
            const name = el("span", "xp-md__gname");
            highlight(name, g.label, q);
            name.title = g.label;
            row.append(name, el("span", "xp-md__gval", INT.format(g.total)));
            row.addEventListener("click", () => this.choose(g));
            row.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
                e.preventDefault();
                const i = list.indexOf(g) + (e.key === "ArrowDown" ? 1 : -1);
                if (list[i]) { this.choose(list[i]); (this.listEl.children[i] as HTMLElement).focus(); }
            });
            row.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(g.id, { x: e.clientX, y: e.clientY });
            });
            this.listEl.appendChild(row);
        }
    }

    private choose(g: Group) {
        this.chosen = g.label;
        if (this.settings.comportamento.filtrarGrupo.value) this.selectionManager.select(g.id, false);
        this.renderList();
        this.renderDetail();
    }

    private renderDetail() {
        clear(this.detailEl);
        const s = this.settings;
        const g = this.groups.find(x => x.label === this.chosen);
        if (!g) {
            if (this.groups.length) this.detailEl.appendChild(el("div", "xp-md__empty", "Sem valores no período."));
            return;
        }
        const unit = s.textos.unidade.value;
        const n = this.top && this.top > 0 ? this.top : g.items.length;
        const shown = g.items.slice(0, n);
        const rest = g.items.slice(n);
        const shownSum = shown.reduce((t, i) => t + i.value, 0);
        this.detailEl.appendChild(el("div", "xp-md__title", g.label));
        const sub = `${INT.format(g.total)} ${unit} · ${g.items.length} ${g.items.length === 1 ? s.textos.item.value : s.textos.itens.value}`
            + (rest.length ? ` · top ${shown.length} = ${Math.round((shownSum / (g.total || 1)) * 100)}%` : "");
        this.detailEl.appendChild(el("div", "xp-md__sub", sub));

        const items = el("div", "xp-md__items");
        const max = Math.max(1, ...shown.map(i => i.value), rest.reduce((t, i) => t + i.value, 0));
        const prefix = (s.destaque.prefixo.value || "").trim().toLowerCase();
        const addRow = (label: string, value: number, id: ISelectionId | null, hl: boolean, other: boolean) => {
            const row = el(id ? "button" : "div", "xp-md__item" + (other ? " xp-md__item--other" : ""));
            const top = el("div", "xp-md__itop");
            const name = el("span", "xp-md__iname" + (hl ? " xp-md__iname--hl" : ""), label);
            name.title = label;
            top.append(name, el("span", "xp-md__ival", `${INT.format(value)} · ${pct(value / (g.total || 1))}`));
            const track = el("div", "xp-md__track");
            const fill = el("i", hl ? "xp-md__fill xp-md__fill--hl" : "xp-md__fill");
            fill.style.width = (value / max * 100).toFixed(2) + "%";
            track.appendChild(fill);
            row.append(top, track);
            row.setAttribute("aria-label", `${label}: ${INT.format(value)} ${unit}, ${pct(value / (g.total || 1))}`);
            if (id) {
                row.addEventListener("click", (e: MouseEvent) => {
                    this.selectionManager.select(id, e.ctrlKey || e.metaKey).then(ids => this.paint(ids as ISelectionId[]));
                });
                row.addEventListener("contextmenu", (e: MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    this.selectionManager.showContextMenu(id, { x: e.clientX, y: e.clientY });
                });
                (row as HTMLElement & { _id?: ISelectionId })._id = id;
            }
            items.appendChild(row);
        };
        for (const it of shown) addRow(it.label, it.value, it.id, !!prefix && it.label.toLowerCase().startsWith(prefix), false);
        if (rest.length) addRow(`Outros (${rest.length} ${rest.length === 1 ? s.textos.item.value : s.textos.itens.value})`, rest.reduce((t, i) => t + i.value, 0), null, false, true);
        this.detailEl.appendChild(items);
        const note = (s.textos.nota.value || "").trim();
        if (note && prefix && g.items.some(i => i.label.toLowerCase().startsWith(prefix))) this.detailEl.appendChild(el("div", "xp-md__note", note));
        this.paint(this.selectionManager.getSelectionIds() as ISelectionId[]);
    }

    private paint(ids: ISelectionId[]) {
        const any = ids && ids.length > 0;
        this.detailEl.querySelectorAll(".xp-md__item").forEach(node => {
            const id = (node as HTMLElement & { _id?: ISelectionId })._id;
            const on = !!id && any && ids.some(x => x.equals(id));
            (node as HTMLElement).classList.toggle("xp-md__item--dim", any && !on);
        });
    }
}

function pct(v: number): string {
    const p = v * 100;
    return (p > 0 && p < 1 ? p.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : String(Math.round(p))) + "%";
}
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
