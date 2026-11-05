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

// Um botão por gráfico (linha da dVisao). Sem o campo Gráfico, cada card tem um gráfico só: ele mesmo.
interface Graf { key: string; raw: PrimitiveValue; label: string; pagina: string; og: number; count: string; pos: number;
    grupo: string; descricao: string; icone: string; ordem: number; }
interface Item { label: string; grupo: string; descricao: string; icone: string; count: string; ordem: number; pos: number; grafs: Graf[]; }
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
    private comGrafico = false;
    private selectedKey: string | null = null;
    private alvo = "";
    private alvoFeito = "";

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
            if (this.applyAlvo()) return void this.host.eventService.renderingFinished(options);
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
        const grafico = by("grafico"), pagina = by("pagina"), ordemG = by("ordemGrafico");
        this.comGrafico = !!grafico;
        const vals = (cat.values || []) as powerbi.DataViewValueColumn[];
        const counts = vals.find(v => v.source.roles && v.source.roles.contagem) || null;
        const alvoCol = vals.find(v => v.source.roles && v.source.roles.alvo) || null;
        this.alvo = alvoCol ? (alvoCol.values.map(text).find(x => x.trim() !== "") || "").trim() : "";
        this.target = toTarget((grafico || visao).source.queryName || "");
        const num = (c: powerbi.DataViewCategoryColumn | undefined, i: number) =>
            c && isFinite(Number(c.values[i])) && c.values[i] !== null && c.values[i] !== "" ? Number(c.values[i]) : Number.MAX_SAFE_INTEGER;
        const seen = new Set<string>();
        const cards = new Map<string, Item>();
        visao.values.forEach((v, i) => {
            if (v === null || v === undefined || v === "") return;
            const raw = grafico ? grafico.values[i] : v;
            if (raw === null || raw === undefined || raw === "") return;
            const key = keyOf(raw);
            if (seen.has(key)) return;
            seen.add(key);
            const c = counts ? counts.values[i] : null;
            const g: Graf = {
                key, raw, label: String(raw), pagina: pagina ? text(pagina.values[i]) : "", og: num(ordemG, i),
                count: typeof c === "number" && isFinite(c) ? INT.format(c) : "", pos: i,
                grupo: grupo ? text(grupo.values[i]) : "", descricao: descricao ? text(descricao.values[i]) : "",
                icone: icone ? text(icone.values[i]) : "", ordem: num(ordem, i)
            };
            const label = String(v);
            let it = cards.get(label);
            if (!it) { it = { label, grupo: "", descricao: "", icone: "", count: "", ordem: g.ordem, pos: i, grafs: [] }; cards.set(label, it); }
            it.grafs.push(g);
            it.ordem = Math.min(it.ordem, g.ordem);
            it.pos = Math.min(it.pos, i);
        });
        // O card mostra o nome, o grupo, a descrição, o ícone e o número do 1º gráfico (menor "Ordem do gráfico").
        for (const it of cards.values()) {
            it.grafs.sort((a, b) => a.og - b.og || a.pos - b.pos);
            const f = it.grafs[0];
            it.grupo = f.grupo; it.descricao = f.descricao; it.icone = f.icone; it.count = f.count;
            this.items.push(it);
        }
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

    // Card ativo: o do gráfico filtrado; sem filtro, o card de "Visão sem seleção" (ou o primeiro). Gráfico ativo: o filtrado ou o 1º do card.
    private active(): { item: Item | null; graf: Graf | null } {
        for (const it of this.items) {
            const g = it.grafs.find(x => x.key === this.selectedKey);
            if (g) return { item: it, graf: g };
        }
        const padrao = (this.settings.menu.padrao.value || "").trim().toLowerCase();
        const p = this.items.find(i => i.label.trim().toLowerCase() === padrao) || this.items[0] || null;
        return { item: p, graf: p ? p.grafs[0] : null };
    }

    // Detalhamento: o gráfico de origem leva um filtro em dVisaoAlvo e a medida "Visão Alvo" chega aqui.
    // Aplica uma vez por abertura da página (o Power BI recria o visual ao entrar na página); depois o usuário troca à vontade.
    private applyAlvo(): boolean {
        if (!this.alvo || this.alvoFeito === this.alvo) return false;
        this.alvoFeito = this.alvo;
        const a = this.alvo.toLowerCase();
        const it = this.items.find(i => i.label.trim().toLowerCase() === a);
        const g = it ? it.grafs[0] : this.items.map(i => i.grafs.find(x => x.label.trim().toLowerCase() === a)).find(x => !!x);
        if (!g || g.key === this.selectedKey) return false;
        this.choose(g);
        return true;
    }

    private choose(g: Graf) {
        if (!this.target) return;
        const filter = { $schema: SCHEMA_BASIC, target: this.target, operator: "In", values: [g.raw], filterType: 1 };
        this.selectedKey = g.key;
        this.host.applyJsonFilter(filter as powerbi.IFilter, "general", "filter", powerbi.FilterAction.merge);
        this.render();
    }

    // Horizontal: um bloco por grupo (Resumo, Report) com um card clicável por visão: nome, número grande e descrição.
    // Com o campo Gráfico, embaixo dos cards: "De qual gráfico?" com os gráficos do card ativo e o número de cada um.
    private renderHorizontal(act: { item: Item | null; graf: Graf | null }) {
        const s = this.settings;
        const showG = this.comGrafico && !!act.item && (act.item.grafs.length > 1 || s.menu.graficoUnico.value);
        this.root.className = "xp-mn" + (showG ? " xp-mn--col" : " xp-mn--h");
        const secs = showG ? el("div", "xp-mn--h xp-mn__secs") : this.root;
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
                const on = it === act.item;
                const card = el("button", "xp-mn__card" + (on ? " is-on" : ""));
                card.setAttribute("aria-pressed", on ? "true" : "false");
                card.title = it.label + (it.descricao ? " · " + it.descricao : "")
                    + (this.comGrafico ? " · " + it.grafs.length + (it.grafs.length > 1 ? " gráficos" : " gráfico") : "");
                const top = el("span", "xp-mn__ctop");
                const ic = el("span", "xp-mn__ic");
                ic.appendChild(icon(it.icone));
                top.append(ic, el("span", "xp-mn__nm", it.label));
                card.appendChild(top);
                if (s.menu.mostrarContagem.value) card.appendChild(el("span", "xp-mn__big", it.count || "—"));
                if (s.menu.mostrarDescricao.value && it.descricao) card.appendChild(el("small", "xp-mn__ds", it.descricao));
                card.addEventListener("click", () => this.choose(it.grafs[0]));
                row.appendChild(card);
            }
            sec.appendChild(row);
            secs.appendChild(sec);
        }
        if (!showG || !act.item) return;
        this.root.appendChild(secs);
        const bar = el("div", "xp-mn__gbar");
        bar.setAttribute("role", "group");
        bar.setAttribute("aria-label", s.menu.tituloGrafico.value || "De qual gráfico?");
        bar.appendChild(el("span", "xp-mn__gq", (s.menu.tituloGrafico.value || "De qual gráfico?").toUpperCase()));
        for (const g of act.item.grafs) {
            const on = g === act.graf;
            const b = el("button", "xp-mn__gb" + (on ? " is-on" : ""));
            b.setAttribute("aria-pressed", on ? "true" : "false");
            b.title = (g.pagina ? g.pagina + " · " : "") + g.label + (g.count ? " · " + g.count : "");
            const tx = el("span", "xp-mn__gtx");
            if (g.pagina) tx.appendChild(el("small", "xp-mn__gp", g.pagina.toUpperCase()));
            tx.appendChild(el("span", "xp-mn__gn", g.label));
            b.appendChild(tx);
            if (s.menu.mostrarContagem.value) b.appendChild(el("b", "xp-mn__gc", g.count || "—"));
            b.addEventListener("click", () => this.choose(g));
            bar.appendChild(b);
        }
        this.root.appendChild(bar);
    }

    private render() {
        const s = this.settings;
        this.root.replaceChildren();
        this.root.style.background = s.cores.fundo.value.value;
        this.root.style.setProperty("--xp-accent", s.cores.destaque.value.value);
        if (!this.items.length) {
            this.root.appendChild(el("div", "xp-mn__empty", "Coloque dVisao[card] em \"Visão\" e dVisao[grafico] em \"Gráfico\" (e, se quiser, grupo, descrição, ícone, página, ordens e a medida Esteira | Gráfico Contagem)."));
            return;
        }
        const act = this.active();
        if (String(s.menu.layout.value.value) === "horizontal") { this.renderHorizontal(act); return; }
        this.root.className = "xp-mn";
        let lastGroup: string | null = null;
        for (const it of this.items) {
            if (it.grupo !== lastGroup) {
                if (it.grupo) this.root.appendChild(el("div", "xp-mn__grp", it.grupo.toUpperCase()));
                lastGroup = it.grupo;
            }
            const on = it === act.item;
            const row = el("button", "xp-mn__it" + (on ? " is-on" : ""));
            row.setAttribute("aria-pressed", on ? "true" : "false");
            const ic = el("span", "xp-mn__ic");
            ic.appendChild(icon(it.icone));
            const txt = el("span", "xp-mn__tx");
            txt.appendChild(el("span", "xp-mn__nm", it.label));
            if (s.menu.mostrarDescricao.value && it.descricao) txt.appendChild(el("small", "xp-mn__ds", it.descricao));
            row.append(ic, txt);
            if (s.menu.mostrarContagem.value) row.appendChild(el("span", "xp-mn__ct", it.count));
            row.addEventListener("click", () => this.choose(it.grafs[0]));
            this.root.appendChild(row);
            // Vertical: os gráficos do card ativo aparecem embaixo dele, recuados.
            if (on && this.comGrafico && (it.grafs.length > 1 || s.menu.graficoUnico.value)) {
                for (const g of it.grafs) {
                    const gon = g === act.graf;
                    const sub = el("button", "xp-mn__sub" + (gon ? " is-on" : ""));
                    sub.setAttribute("aria-pressed", gon ? "true" : "false");
                    const t2 = el("span", "xp-mn__tx");
                    if (g.pagina) t2.appendChild(el("small", "xp-mn__gp", g.pagina.toUpperCase()));
                    t2.appendChild(el("span", "xp-mn__nm", g.label));
                    sub.appendChild(t2);
                    if (s.menu.mostrarContagem.value) sub.appendChild(el("span", "xp-mn__ct", g.count));
                    sub.addEventListener("click", () => this.choose(g));
                    this.root.appendChild(sub);
                }
            }
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
