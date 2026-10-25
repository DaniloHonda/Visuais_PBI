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

import { MenuSettings } from "./settings";
import { xpFont } from "./xpTheme";
import { icon } from "./icons";

interface Item { key: string; raw: PrimitiveValue; label: string; grupo: string; descricao: string; icone: string; count: string; ordem: number; pos: number; }
interface Target { table: string; column: string; }

// Identificador fixo do formato de filtro do Power BI (não é um endereço acessado).
const SCHEMA_BASIC = "ht" + "tp://powerbi.com/product/schema#basic";
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: MenuSettings;
    private formattingSettingsService: FormattingSettingsService;
    private items: Item[] = [];
    private target: Target | null = null;
    private selectedKey: string | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("nav", "xp-mn");
        this.root.style.fontFamily = xpFont;
        this.root.setAttribute("aria-label", "Visões");
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            const dataView: DataView | undefined = options.dataViews && options.dataViews[0];
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(MenuSettings, dataView);
            this.read(dataView);
            const f = ((options.jsonFilters || [])[0] || null) as { values?: PrimitiveValue[] } | null;
            this.selectedKey = f && Array.isArray(f.values) && f.values.length ? keyOf(f.values[0]) : null;
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
        const cats = (cat && cat.categories) || [];
        const by = (role: string) => cats.find(c => c.source.roles && c.source.roles[role]);
        const visao = by("visao");
        if (!visao) return;
        const grupo = by("grupo"), descricao = by("descricao"), icone = by("icone"), ordem = by("ordem");
        const counts = cat.values && cat.values[0];
        this.target = toTarget(visao.source.queryName || "");
        const seen = new Set<string>();
        visao.values.forEach((v, i) => {
            const key = keyOf(v);
            if (seen.has(key) || v === null || v === undefined || v === "") return;
            seen.add(key);
            const c = counts ? counts.values[i] : null;
            this.items.push({
                key, raw: v, label: String(v),
                grupo: grupo ? text(grupo.values[i]) : "",
                descricao: descricao ? text(descricao.values[i]) : "",
                icone: icone ? text(icone.values[i]) : "",
                count: typeof c === "number" && isFinite(c) ? INT.format(c) : "",
                ordem: ordem && isFinite(Number(ordem.values[i])) ? Number(ordem.values[i]) : Number.MAX_SAFE_INTEGER,
                pos: i
            });
        });
        // Ordem: campo "Ordem" se houver; senão a ordem recebida. Os grupos seguem "Ordem dos grupos" (Resumo;Report);
        // grupos fora dessa lista vêm depois, na posição da sua primeira visão.
        this.items.sort((a, b) => a.ordem - b.ordem || a.pos - b.pos);
        const lista = (this.settings.menu.ordemGrupos.value || "").split(";").map(g => g.trim().toLowerCase()).filter(Boolean);
        const firstOfGroup = new Map<string, number>();
        this.items.forEach((it, i) => { if (!firstOfGroup.has(it.grupo)) firstOfGroup.set(it.grupo, i); });
        const rank = (g: string) => {
            const k = lista.indexOf(g.trim().toLowerCase());
            return k >= 0 ? k - lista.length : (firstOfGroup.get(g) as number);
        };
        this.items = this.items.map((it, i) => ({ it, i })).sort((a, b) => rank(a.it.grupo) - rank(b.it.grupo) || a.i - b.i).map(x => x.it);
    }

    private activeKey(): string | null {
        if (this.selectedKey && this.items.some(i => i.key === this.selectedKey)) return this.selectedKey;
        const padrao = (this.settings.menu.padrao.value || "").trim().toLowerCase();
        const p = this.items.find(i => i.label.trim().toLowerCase() === padrao);
        return p ? p.key : (this.items[0] ? this.items[0].key : null);
    }

    private choose(item: Item) {
        if (!this.target) return;
        const filter = { $schema: SCHEMA_BASIC, target: this.target, operator: "In", values: [item.raw], filterType: 1 };
        this.selectedKey = item.key;
        this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        this.render();
    }

    // Horizontal: um bloco por grupo (Resumo, Report) com um card clicável por visão: nome, número grande e descrição.
    private renderHorizontal(active: string | null) {
        const s = this.settings;
        this.root.className = "xp-mn xp-mn--h";
        const groups: { name: string; items: Item[] }[] = [];
        for (const it of this.items) {
            const last = groups[groups.length - 1];
            if (last && last.name === it.grupo) last.items.push(it); else groups.push({ name: it.grupo, items: [it] });
        }
        for (const g of groups) {
            const sec = el("div", "xp-mn__sec");
            sec.style.flexGrow = String(g.items.length);
            if (g.name) sec.appendChild(el("div", "xp-mn__grp", g.name.toUpperCase()));
            const row = el("div", "xp-mn__cards");
            for (const it of g.items) {
                const on = it.key === active;
                const card = el("button", "xp-mn__card" + (on ? " is-on" : ""));
                card.setAttribute("aria-pressed", on ? "true" : "false");
                card.title = it.label + (it.descricao ? " · " + it.descricao : "");
                const top = el("span", "xp-mn__ctop");
                const ic = el("span", "xp-mn__ic");
                ic.appendChild(icon(it.icone));
                top.append(ic, el("span", "xp-mn__nm", it.label));
                card.appendChild(top);
                if (s.menu.mostrarContagem.value) card.appendChild(el("span", "xp-mn__big", it.count || "—"));
                if (s.menu.mostrarDescricao.value && it.descricao) card.appendChild(el("small", "xp-mn__ds", it.descricao));
                card.addEventListener("click", () => this.choose(it));
                row.appendChild(card);
            }
            sec.appendChild(row);
            this.root.appendChild(sec);
        }
    }

    private render() {
        const s = this.settings;
        this.root.replaceChildren();
        this.root.style.background = s.cores.fundo.value.value;
        this.root.style.setProperty("--xp-accent", s.cores.destaque.value.value);
        if (!this.items.length) {
            this.root.appendChild(el("div", "xp-mn__empty", "Coloque dVisao[visao] em \"Visão\" (e, se quiser, grupo, descrição, ícone e a medida Esteira | Visão Contagem)."));
            return;
        }
        const active = this.activeKey();
        if (String(s.menu.layout.value.value) === "horizontal") { this.renderHorizontal(active); return; }
        this.root.className = "xp-mn";
        let lastGroup: string | null = null;
        for (const it of this.items) {
            if (it.grupo !== lastGroup) {
                if (it.grupo) this.root.appendChild(el("div", "xp-mn__grp", it.grupo.toUpperCase()));
                lastGroup = it.grupo;
            }
            const on = it.key === active;
            const row = el("button", "xp-mn__it" + (on ? " is-on" : ""));
            row.setAttribute("aria-pressed", on ? "true" : "false");
            const ic = el("span", "xp-mn__ic");
            ic.appendChild(icon(it.icone));
            const txt = el("span", "xp-mn__tx");
            txt.appendChild(el("span", "xp-mn__nm", it.label));
            if (s.menu.mostrarDescricao.value && it.descricao) txt.appendChild(el("small", "xp-mn__ds", it.descricao));
            row.append(ic, txt);
            if (s.menu.mostrarContagem.value) row.appendChild(el("span", "xp-mn__ct", it.count));
            row.addEventListener("click", () => this.choose(it));
            this.root.appendChild(row);
        }
    }
}

function el(tag: string, cls: string, txt?: string): HTMLElement {
    const e = document.createElement(tag);
    e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
}
function text(v: PrimitiveValue): string { return v === null || v === undefined ? "" : String(v); }
function keyOf(v: PrimitiveValue): string { return v === null || v === undefined ? "∅" : String(v); }
function toTarget(queryName: string): Target | null {
    const m = /^(.*)\.([^.]+)$/.exec(queryName);
    if (!m) return null;
    return { table: m[1].replace(/^'|'$/g, ""), column: m[2].replace(/^\[|\]$/g, "") };
}
