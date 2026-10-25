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

import { AlertListSettings } from "./settings";
import { xpFont } from "./xpTheme";

interface Item {
    key: string; raw: PrimitiveValue; label: string; grupo: string; descricao: string; onde: string;
    apps: number | null; pct: number | null; status: string; ordem: number; pos: number;
}
interface Target { table: string; column: string; }

const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
const PCT = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private tip: HTMLElement | null = null;
    private settings: AlertListSettings;
    private fmtService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private items: Item[] = [];
    private target: Target | null = null;
    private selectedKey: string | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.fmtService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = document.createElement("div");
        this.root.className = "xp-al";
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
            this.settings = this.fmtService.populateFormattingSettingsModel(AlertListSettings, dv);
            this.read(dv);
            const f = ((options.jsonFilters || [])[0] || null) as { values?: PrimitiveValue[] } | null;
            this.selectedKey = f && Array.isArray(f.values) && f.values.length ? keyOf(f.values[0]) : null;
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
        this.items = [];
        this.target = null;
        const cat = dv && dv.categorical;
        const cats = (cat && cat.categories) || [];
        const by = (role: string) => cats.find(c => c.source.roles && c.source.roles[role]);
        const val = (role: string) => ((cat && cat.values) || []).find(c => c.source.roles && c.source.roles[role]);
        const alerta = by("alerta");
        if (!alerta) return;
        const grupo = by("grupo"), ordem = by("ordem"), descricao = by("descricao"), onde = by("onde");
        const apps = val("apps"), pct = val("pct"), status = val("status");
        this.target = toTarget(alerta.source.queryName || "");
        const seen = new Set<string>();
        alerta.values.forEach((v, i) => {
            const key = keyOf(v);
            if (seen.has(key) || v === null || v === undefined || v === "") return;
            seen.add(key);
            this.items.push({
                key, raw: v, label: String(v),
                grupo: grupo ? text(grupo.values[i]) : "",
                descricao: descricao ? text(descricao.values[i]) : "",
                onde: onde ? text(onde.values[i]) : "",
                apps: apps ? num(apps.values[i]) : null,
                pct: pct ? num(pct.values[i]) : null,
                status: status ? normalize(text(status.values[i])) : "",
                ordem: ordem && isFinite(Number(ordem.values[i])) ? Number(ordem.values[i]) : Number.MAX_SAFE_INTEGER,
                pos: i
            });
        });
        this.items.sort((a, b) => a.ordem - b.ordem || a.pos - b.pos);
        // Cada grupo junto, na posição do seu primeiro alerta.
        const first = new Map<string, number>();
        this.items.forEach((it, i) => { if (!first.has(it.grupo)) first.set(it.grupo, i); });
        this.items = this.items.map((it, i) => ({ it, i }))
            .sort((a, b) => (first.get(a.it.grupo) as number) - (first.get(b.it.grupo) as number) || a.i - b.i).map(x => x.it);
    }

    private legend(grupo: string): string {
        for (const part of (this.settings.textos.legendas.value || "").split(";")) {
            const p = part.indexOf("=");
            if (p > 0 && normalize(part.slice(0, p)) === normalize(grupo)) return part.slice(p + 1).trim();
        }
        return "";
    }

    private barColor(status: string): string {
        const c = this.settings.cores;
        if (status.startsWith("crit")) return c.critico.value.value;
        if (status.startsWith("aten")) return c.atencao.value.value;
        return c.ok.value.value;
    }

    private toggle(item: Item) {
        if (!this.target) return;
        if (this.selectedKey === item.key) {
            this.selectedKey = null;
            this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
        } else {
            this.selectedKey = item.key;
            const filter = { $schema: SCHEMA_BASIC, target: this.target, operator: "In", values: [item.raw], filterType: 1 };
            this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        }
        this.render();
    }

    private render() {
        const s = this.settings;
        this.hideTip();
        this.root.replaceChildren();
        this.root.style.fontFamily = xpFont;
        this.root.style.setProperty("--xp-al-accent", s.cores.destaque.value.value);
        if (s.textos.titulo.value) this.root.appendChild(el("div", "xp-al__title", s.textos.titulo.value));
        if (s.textos.subtitulo.value) this.root.appendChild(el("div", "xp-al__sub", s.textos.subtitulo.value));
        if (!this.items.length) {
            this.root.appendChild(el("div", "xp-al__empty", "Coloque dAlerta[alerta], grupo, ordem, descricao e onde_corrigir, e as medidas Aplicações com Alerta, % com Alerta e DQ Status."));
            return;
        }
        const max = Math.max(1, ...this.items.map(i => i.apps || 0));
        const list = el("div", "xp-al__list");
        list.setAttribute("role", "listbox");
        list.setAttribute("aria-label", s.textos.titulo.value || "Tipos de alerta");
        let last: string | null = null;
        for (const it of this.items) {
            if (it.grupo !== last) {
                last = it.grupo;
                const lg = this.legend(it.grupo);
                if (it.grupo) list.appendChild(el("div", "xp-al__grp", (it.grupo + (lg ? " · " + lg : "")).toUpperCase()));
            }
            const on = this.selectedKey === it.key;
            const dim = !!this.selectedKey && !on;
            const row = el("div", "xp-al__row" + (on ? " is-on" : "") + (dim ? " is-dim" : ""));
            row.tabIndex = 0;
            row.setAttribute("role", "option");
            row.setAttribute("aria-selected", String(on));
            const info = el("span", "xp-al__info", "i");
            if (it.descricao || it.onde) {
                info.addEventListener("mouseenter", () => this.showTip(it, row));
                info.addEventListener("mouseleave", () => this.hideTip());
                row.addEventListener("focus", () => this.showTip(it, row));
                row.addEventListener("blur", () => this.hideTip());
            } else info.classList.add("is-off");
            const bar = el("span", "xp-al__bar");
            const fill = el("i", "");
            // Quantidade pequena ainda aparece (mínimo de 4 px), para "1 caso" não sumir da barra.
            fill.style.width = (((it.apps || 0) / max) * 100).toFixed(1) + "%";
            if ((it.apps || 0) > 0) fill.style.minWidth = "4px";
            fill.style.background = this.barColor(it.status);
            bar.appendChild(fill);
            const sev = it.status.startsWith("crit") ? " is-crit" : it.status.startsWith("aten") ? " is-warn" : "";
            row.append(info, el("span", "xp-al__name", it.label), bar,
                el("span", "xp-al__v" + sev, it.apps === null ? "—" : INT.format(it.apps)),
                el("span", "xp-al__p" + sev, it.pct === null ? "" : PCT.format(it.pct)));
            row.title = on ? "Clique para tirar o filtro" : "Clique para filtrar a página por este alerta";
            row.addEventListener("click", () => this.toggle(it));
            row.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.toggle(it); } });
            list.appendChild(row);
        }
        this.root.appendChild(list);
        if (this.selectedKey) {
            const clear = el("button", "xp-al__clear", "× Ver todos os alertas");
            clear.addEventListener("click", () => {
                this.selectedKey = null;
                this.host.applyJsonFilter(null, "general", "filter", powerbi.FilterAction.remove);
                this.render();
            });
            this.root.appendChild(clear);
        }
    }

    // Balão escuro abaixo da linha (ou acima, se não couber), sempre dentro do visual.
    private showTip(it: Item, row: HTMLElement) {
        this.hideTip();
        const tip = el("div", "xp-al__tip");
        tip.appendChild(el("b", "", it.label));
        if (it.descricao) tip.appendChild(el("div", "", it.descricao));
        if (it.onde) {
            const o = el("div", "xp-al__tip-onde");
            o.append(el("strong", "", "Onde corrigir: "), document.createTextNode(it.onde));
            tip.appendChild(o);
        }
        this.root.appendChild(tip);
        const base = this.root.getBoundingClientRect(), r = row.getBoundingClientRect();
        const h = tip.offsetHeight;
        let top = r.bottom - base.top + 4;
        if (top + h > this.root.clientHeight) top = Math.max(0, r.top - base.top - h - 4);
        tip.style.top = top + "px";
        this.tip = tip;
    }
    private hideTip() { if (this.tip) { this.tip.remove(); this.tip = null; } }
}

function keyOf(v: PrimitiveValue): string { return v === null || v === undefined ? "∅" : String(v); }
function text(v: PrimitiveValue): string { return v === null || v === undefined ? "" : String(v).trim(); }
function num(v: PrimitiveValue): number | null { return typeof v === "number" && isFinite(v) ? v : null; }
function normalize(t: string): string { return (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
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
