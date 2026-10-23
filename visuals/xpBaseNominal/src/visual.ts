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

import { BaseNominalSettings, baseItems } from "./settings";
import { xpFont } from "./xpTheme";

type Base = "andamento" | "agendadas" | "contratadas" | "rejeitadas" | "declinaram" | "todas";
type Key = "candidato" | "vaga" | "recrutador" | "situacao" | "etapa" | "dias" | "motivo" | "candidatura" | "saida" | "sla" | "entrevista" | "etapaEntrevista";

interface Row {
    index: number;
    key: string;
    link: string;
    v: Partial<Record<Key, powerbi.PrimitiveValue>>;
    extras: powerbi.PrimitiveValue[];
    situacao: string;
    noPeriodo: boolean;
    jornada: string;
    seguintes: string;
    text: string;
    id: ISelectionId;
}

interface ColDef { key: Key | "extra"; title: string; extra?: number; }

// Colunas e ordem de cada base. O link vem sempre primeiro; as extras, no fim.
const LAYOUT: Record<Base, { cols: [Key, string][]; sort: [Key, boolean] }> = {
    andamento: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["recrutador", "Recrutador"], ["etapa", "Etapa atual"], ["dias", "Dias parado"]], sort: ["dias", true] },
    agendadas: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["recrutador", "Recrutador"], ["etapaEntrevista", "Etapa"], ["entrevista", "Entrevista em"]], sort: ["entrevista", false] },
    contratadas: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["recrutador", "Recrutador"], ["saida", "Contratada em"], ["sla", "SLA (dias)"]], sort: ["saida", true] },
    rejeitadas: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["etapa", "Parou em"], ["motivo", "Motivo"], ["saida", "Rejeitada em"], ["dias", "Dias na etapa"]], sort: ["dias", true] },
    declinaram: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["recrutador", "Recrutador"], ["motivo", "Motivo"], ["saida", "Recusou em"]], sort: ["saida", true] },
    todas: { cols: [["candidato", "Candidato"], ["vaga", "Vaga"], ["situacao", "Situação"], ["etapa", "Etapa atual"], ["candidatura", "Candidatura"]], sort: ["candidatura", true] }
};
const BASES: Base[] = ["andamento", "agendadas", "contratadas", "rejeitadas", "declinaram", "todas"];
const DATE_KEYS: Key[] = ["candidatura", "saida", "entrevista"];
const NUM_KEYS: Key[] = ["dias", "sla"];
const SIT_COLORS: Record<string, string> = { "em andamento": "#E3A33B", "contratada": "#067D84", "rejeitada": "#E05A4F", "declinou": "#7A1F1A" };
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private hintEl: HTMLElement;
    private cardsEl: HTMLElement;
    private head: HTMLElement;
    private wrap: HTMLElement;
    private foot: HTMLElement;
    private settings: BaseNominalSettings;
    private formattingSettingsService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: Row[] = [];
    private extraNames: string[] = [];
    private present: Partial<Record<string, boolean>> = {};
    private base: Base | null = null;
    private sort: { key: string; desc: boolean } | null = null;
    private query = "";
    private shown = 0;
    private expanded = new Set<string>();
    private loading = false;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-bn");
        this.hintEl = el("div", "xp-bn__hint");
        this.cardsEl = el("div", "xp-bn__cards");
        this.head = el("div", "xp-bn__head");
        this.wrap = el("div", "xp-bn__wrap");
        this.foot = el("div", "xp-bn__foot");
        this.root.append(this.hintEl, this.cardsEl, this.head, this.wrap, this.foot);
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
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(BaseNominalSettings, dv);
            this.height = options.viewport.height;
            if (this.base === null) this.base = String(this.settings.comportamento.baseInicial.value.value) as Base;
            this.read(dv);
            // Carrega o resto das linhas em blocos (o Power BI entrega 10 mil por vez).
            this.loading = false;
            if (dv && dv.metadata && dv.metadata.segment && this.rows.length < this.settings.comportamento.maxLinhas.value) {
                this.loading = this.host.fetchMoreData(true);
            }
            this.root.style.fontFamily = xpFont;
            this.shown = Math.max(this.shown, this.pageSize());
            this.renderCards();
            this.renderHead();
            this.renderTable();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    private pageSize(): number { return Math.max(20, this.settings.comportamento.linhasTela.value); }

    private read(dv: DataView | undefined) {
        this.rows = [];
        this.present = {};
        this.extraNames = [];
        const table = dv && dv.table;
        if (!table) return;
        const find = (role: string) => table.columns.findIndex(c => c.roles && c.roles[role]);
        const idx: Record<string, number> = {};
        for (const r of ["link", "candidato", "vaga", "recrutador", "situacao", "etapa", "dias", "motivo", "candidatura", "saida", "sla", "entrevista", "etapaEntrevista", "jornada", "seguintes", "noPeriodo"]) {
            idx[r] = find(r);
            this.present[r] = idx[r] >= 0;
        }
        const extraIdx = table.columns.map((c, i) => (c.roles && c.roles["extras"] ? i : -1)).filter(i => i >= 0);
        this.extraNames = extraIdx.map(i => clean(table.columns[i].displayName));
        const keys: Key[] = ["candidato", "vaga", "recrutador", "situacao", "etapa", "dias", "motivo", "candidatura", "saida", "sla", "entrevista", "etapaEntrevista"];
        table.rows.forEach((r, i) => {
            const v: Partial<Record<Key, powerbi.PrimitiveValue>> = {};
            for (const k of keys) if (idx[k] >= 0) v[k] = r[idx[k]];
            const extras = extraIdx.map(j => r[j]);
            const link = idx.link >= 0 ? asText(r[idx.link]) : "";
            const text = [link, asText(v.candidato), asText(v.vaga), asText(v.recrutador), asText(v.etapa), asText(v.motivo), ...extras.map(asText)].join(" ");
            this.rows.push({
                index: i, key: link || String(i), link, v, extras,
                situacao: normalize(asText(v.situacao)),
                // Sem o campo "No período", todas as linhas contam em "Todas".
                noPeriodo: idx.noPeriodo < 0 || (num(r[idx.noPeriodo]) || 0) > 0,
                jornada: idx.jornada >= 0 ? asText(r[idx.jornada]) : "",
                seguintes: idx.seguintes >= 0 ? asText(r[idx.seguintes]) : "",
                text: normalize(text),
                id: this.host.createSelectionIdBuilder().withTable(table, i).createSelectionId()
            });
        });
    }

    private inBase(r: Row, b: Base): boolean {
        switch (b) {
            case "andamento": return r.situacao === "em andamento";
            case "agendadas": return r.v.entrevista !== null && r.v.entrevista !== undefined && r.v.entrevista !== "";
            case "contratadas": return r.situacao === "contratada";
            case "rejeitadas": return r.situacao === "rejeitada";
            case "declinaram": return r.situacao === "declinou";
            default: return r.noPeriodo;
        }
    }

    private label(b: Base): string {
        const n = this.settings.numeros;
        const map: Record<Base, string> = {
            andamento: n.andamento.value, agendadas: n.agendadas.value, contratadas: n.contratadas.value,
            rejeitadas: n.rejeitadas.value, declinaram: n.declinaram.value, todas: n.todas.value
        };
        return map[b] || baseItems.find(x => x.value === b)?.displayName || b;
    }

    private renderCards() {
        const hint = (this.settings.numeros.dica.value || "").trim();
        this.hintEl.textContent = hint;
        this.hintEl.style.display = hint ? "" : "none";
        clear(this.cardsEl);
        this.cardsEl.setAttribute("role", "tablist");
        for (const b of BASES) {
            if (b === "agendadas" && !this.present.entrevista) continue;
            const on = b === this.base;
            const card = el("button", "xp-bn__card" + (on ? " xp-bn__card--on" : ""));
            card.setAttribute("role", "tab");
            card.setAttribute("aria-selected", String(on));
            const count = this.rows.filter(r => this.inBase(r, b)).length;
            const txt = el("span", "xp-bn__card-txt");
            txt.append(el("span", "xp-bn__card-label", this.label(b)), el("span", "xp-bn__card-num", INT.format(count)));
            card.append(txt, el("span", "xp-bn__card-go", on ? "✓" : "›"));
            card.setAttribute("aria-label", `${this.label(b)}: ${INT.format(count)}. ${on ? "Lista aberta" : "Ver lista"}`);
            card.addEventListener("click", () => {
                if (this.base === b) return;
                this.base = b;
                this.sort = null;
                this.shown = this.pageSize();
                this.expanded.clear();
                this.renderCards();
                this.renderHead();
                this.renderTable();
            });
            this.cardsEl.appendChild(card);
        }
    }

    private renderHead() {
        clear(this.head);
        const b = this.base as Base;
        const count = this.rows.filter(r => this.inBase(r, b)).length;
        const word = b === "agendadas" ? "aplicações com entrevista agendada" : b === "todas" ? "aplicações" : "aplicações " + this.label(b).toLowerCase();
        this.head.appendChild(el("div", "xp-bn__title", `${INT.format(count)} ${word}`));
        this.head.appendChild(el("span", "xp-bn__spacer"));
        const search = el("label", "xp-bn__search");
        search.appendChild(el("span", "xp-bn__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = this.settings.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.shown = this.pageSize(); this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.head.appendChild(search);
        const exp = el("button", "xp-bn__export", "⤓ Exportar");
        exp.title = "Baixa a lista desta base (com a busca aplicada) em CSV, que abre no Excel";
        exp.addEventListener("click", () => this.exportCsv(exp));
        this.head.appendChild(exp);
    }

    // CSV com ";" e BOM (abre certo no Excel em português). Depende de "downloads de visuais personalizados" liberado no Power BI.
    private exportCsv(btn: HTMLElement) {
        const cols = this.columns();
        const header = [this.present.link ? (this.settings.textos.link.value || "Link") : null, ...cols.map(c => c.title)].filter((x): x is string => x !== null);
        const lines = [header];
        for (const r of this.visible()) {
            const line: string[] = [];
            if (this.present.link) line.push(this.url(r.link) || r.link);
            for (const c of cols) {
                if (c.key === "extra") line.push(fmt(r.extras[c.extra as number], false));
                else line.push(DATE_KEYS.indexOf(c.key) >= 0 ? fmt(r.v[c.key], true, c.key === "entrevista") : NUM_KEYS.indexOf(c.key) >= 0 ? asText(r.v[c.key]) : asText(r.v[c.key]));
            }
            lines.push(line);
        }
        const csv = "\uFEFF" + lines.map(l => l.map(x => /[";\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x).join(";")).join("\r\n");
        const name = `base-nominal-${this.base}.csv`;
        const fail = () => { btn.textContent = "Use ⋯ → Exportar dados"; setTimeout(() => { btn.textContent = "⤓ Exportar"; }, 4000); };
        try {
            const ds = this.host.downloadService;
            if (!ds) { fail(); return; }
            ds.exportVisualsContent(csv, name, "csv", "Base nominal").then(ok => { if (!ok) fail(); }).catch(fail);
        } catch { fail(); }
    }

    private columns(): ColDef[] {
        const b = this.base as Base;
        const list: ColDef[] = LAYOUT[b].cols.filter(([k]) => this.present[k]).map(([k, t]) => ({ key: k, title: t }));
        this.extraNames.forEach((n, i) => list.push({ key: "extra", title: n, extra: i }));
        return list;
    }

    private visible(): Row[] {
        const b = this.base as Base;
        const q = normalize(this.query);
        let list = this.rows.filter(r => this.inBase(r, b) && (!q || r.text.indexOf(q) >= 0));
        const [defKey, defDesc] = LAYOUT[b].sort;
        const sort = this.sort || { key: defKey, desc: defDesc };
        if (sort.key) {
            const get = (r: Row) => sortValue(sort.key.startsWith("x") ? r.extras[Number(sort.key.slice(1))] : r.v[sort.key as Key], DATE_KEYS.indexOf(sort.key as Key) >= 0);
            const dir = sort.desc ? -1 : 1;
            list = list.slice().sort((a, c) => {
                const x = get(a), y = get(c);
                if (x === y) return a.index - c.index;
                if (x === null) return 1;
                if (y === null) return -1;
                return (x < y ? -1 : 1) * dir;
            });
        }
        return list;
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        const avail = Math.max(120, this.height - this.hintEl.offsetHeight - this.cardsEl.offsetHeight - this.head.offsetHeight - 52);
        this.wrap.style.height = avail + "px";
        if (!this.present.candidato && !this.present.link) {
            this.wrap.appendChild(el("div", "xp-bn__empty", "Arraste os campos (Link, Candidato, Vaga…) e as medidas da base nominal."));
            this.foot.textContent = "";
            return;
        }
        const cols = this.columns();
        const all = this.visible();
        const list = all.slice(0, this.shown);
        const b = this.base as Base;
        const [defKey, defDesc] = LAYOUT[b].sort;
        const sort = this.sort || { key: defKey, desc: defDesc };

        const table = el("table", "xp-bn__table");
        const hr = el("tr", "");
        hr.appendChild(el("th", "xp-bn__th-x"));
        if (this.present.link) hr.appendChild(el("th", "", s.textos.link.value || "Link"));
        for (const c of cols) {
            const key = c.key === "extra" ? "x" + c.extra : c.key;
            const right = c.key !== "extra" && (DATE_KEYS.indexOf(c.key) >= 0 || NUM_KEYS.indexOf(c.key) >= 0);
            const th = el("th", right ? "xp-bn__r" : "");
            const on = sort.key === key;
            const btn = el("button", "xp-bn__sort" + (on ? " xp-bn__sort--on" : ""), c.title);
            if (on) btn.appendChild(el("span", "", sort.desc ? " ↓" : " ↑"));
            btn.addEventListener("click", () => {
                if (sort.key !== key) this.sort = { key, desc: true };
                else if (sort.desc) this.sort = { key, desc: false };
                else this.sort = { key: defKey, desc: defDesc };
                this.renderTable();
            });
            th.appendChild(btn);
            hr.appendChild(th);
        }
        const thead = el("thead", "");
        thead.appendChild(hr);
        table.appendChild(thead);
        const span = cols.length + 1 + (this.present.link ? 1 : 0);

        const tbody = el("tbody", "");
        if (!list.length) {
            const tr = el("tr", "");
            const td = el("td", "xp-bn__none", this.query ? `Ninguém encontrado para "${this.query}"` : "Nenhuma aplicação nesta base com os filtros atuais");
            td.setAttribute("colspan", String(span));
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        for (const r of list) {
            const open = this.expanded.has(r.key);
            const tr = el("tr", "xp-bn__row" + (open ? " xp-bn__row--open" : ""));
            tr.tabIndex = 0;
            tr.setAttribute("aria-expanded", String(open));
            tr.appendChild(el("td", "xp-bn__x", open ? "▾" : "▸"));
            if (this.present.link) {
                const td = el("td", "");
                const url = this.url(r.link);
                if (url) {
                    const a = el("button", "xp-bn__link", "Abrir ↗");
                    a.title = url;
                    a.addEventListener("click", e => { e.stopPropagation(); this.host.launchUrl(url); });
                    td.appendChild(a);
                } else td.textContent = r.link || "—";
                tr.appendChild(td);
            }
            for (const c of cols) {
                const td = el("td", "");
                if (c.key === "extra") { highlight(td, fmt(r.extras[c.extra as number], false) || "—", q); tr.appendChild(td); continue; }
                const v = r.v[c.key];
                if (c.key === "situacao") {
                    const t = asText(v);
                    const dot = el("i", "xp-bn__dot");
                    dot.style.background = SIT_COLORS[normalize(t)] || "#A9B4B6";
                    td.append(dot, document.createTextNode(t || "—"));
                } else if (c.key === "dias" || c.key === "sla") {
                    td.className = "xp-bn__r xp-bn__num";
                    const n = num(v);
                    td.textContent = n === null ? "—" : INT.format(n);
                    if (c.key === "dias" && n !== null && n > s.dias.alerta.value) td.classList.add("xp-bn__num--bad");
                } else if (DATE_KEYS.indexOf(c.key) >= 0) {
                    td.className = "xp-bn__r";
                    td.textContent = fmt(v, true, c.key === "entrevista") || "—";
                } else {
                    if (c.key === "candidato") td.className = "xp-bn__strong";
                    if (c.key === "motivo") td.className = "xp-bn__muted";
                    const t = asText(v);
                    highlight(td, t || "—", q);
                    td.title = t;
                }
                tr.appendChild(td);
            }
            const toggle = () => {
                if (this.expanded.has(r.key)) this.expanded.delete(r.key); else this.expanded.add(r.key);
                this.renderTable();
            };
            tr.addEventListener("click", toggle);
            tr.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
            tr.addEventListener("contextmenu", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                this.selectionManager.showContextMenu(r.id, { x: e.clientX, y: e.clientY });
            });
            tbody.appendChild(tr);
            if (open) {
                const det = el("tr", "xp-bn__det");
                const td = el("td", "");
                td.setAttribute("colspan", String(span));
                td.appendChild(this.journey(r));
                det.appendChild(td);
                tbody.appendChild(det);
            }
        }
        table.appendChild(tbody);
        this.wrap.appendChild(table);

        clear(this.foot);
        this.foot.appendChild(el("span", "", all.length ? `1–${INT.format(list.length)} de ${INT.format(all.length)}` : ""));
        if (all.length > list.length) {
            const more = el("button", "xp-bn__more", `Mostrar mais ${INT.format(Math.min(this.pageSize(), all.length - list.length))}`);
            more.addEventListener("click", () => { this.shown += this.pageSize(); this.renderTable(); });
            this.foot.appendChild(more);
        }
        if (this.loading) this.foot.appendChild(el("span", "xp-bn__loading", "Carregando mais aplicações…"));
    }

    // Linha do tempo: etapas por onde passou (etapa|entrada|saída|resultado|dias;;…) e as que ainda não chegou.
    private journey(r: Row): HTMLElement {
        const box = el("div", "xp-bn__jr");
        const steps = r.jornada.split(";;").map(x => x.split("|")).filter(p => p[0] && p[0].trim());
        const next = r.seguintes.split(";;").map(x => x.trim()).filter(Boolean);
        if (!steps.length) { box.appendChild(el("div", "xp-bn__muted", "Sem histórico de etapas para esta aplicação.")); return box; }
        const add = (name: string, sub: string, cls: string) => {
            const st = el("div", "xp-bn__st xp-bn__st--" + cls);
            st.append(el("i", ""), el("b", "", name), el("span", "", sub));
            box.appendChild(st);
        };
        for (const p of steps) {
            const [name, ini, fim, res, dias] = p.map(x => (x || "").trim());
            const rn = normalize(res);
            const cls = rn.startsWith("aprov") ? "ok" : rn.startsWith("rejeit") ? "bad" : rn.indexOf("andamento") >= 0 ? "now" : "ok";
            const range = `${shortDate(ini)}${fim ? " → " + shortDate(fim) : " → hoje"}`;
            const d = dias !== "" && isFinite(Number(dias)) ? ` · ${INT.format(Number(dias))} d` : "";
            const tail = cls === "bad" ? " · rejeitada" : cls === "now" ? " · em andamento" : "";
            add(name, range + d + tail, cls);
        }
        if (r.situacao === "contratada") add("Contratada", shortDate(asText(r.v.saida)) || "", "hired");
        else if (r.situacao === "em andamento" || r.situacao === "rejeitada" || r.situacao === "declinou") {
            for (const n of next) add(n, r.situacao === "em andamento" ? "ainda não chegou" : "não chegou", "off");
        }
        return box;
    }

    private url(v: string): string | null {
        if (!v) return null;
        if (/^https:\/\//i.test(v)) return v;
        const model = (this.settings.link.modelo.value || "").trim();
        if (model && model.indexOf("{valor}") >= 0 && /^https:\/\//i.test(model)) return model.replace("{valor}", encodeURIComponent(v));
        return null;
    }
}

function clean(name: string): string {
    const parts = (name || "").split("|");
    return parts[parts.length - 1].trim();
}
function num(v: powerbi.PrimitiveValue | undefined): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return isFinite(n) ? n : null;
}
function asText(v: powerbi.PrimitiveValue | undefined): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString();
    return String(v).trim();
}
function pad(n: number): string { return String(n).padStart(2, "0"); }
// Aceita Date, texto ISO/aaaa-mm-dd ou número de série do Excel/DAX.
function toDate(v: powerbi.PrimitiveValue | undefined): Date | null {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "number" && v > 20000 && v < 80000) {
        const ms = Math.round((v - 25569) * 86400000);
        const d = new Date(ms);
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes());
    }
    if (typeof v === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(v);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
function fmt(v: powerbi.PrimitiveValue | undefined, isDate: boolean, withTime = false): string {
    if (v === null || v === undefined || v === "") return "";
    if (isDate || v instanceof Date) {
        const d = toDate(v);
        if (d) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` + (withTime ? ` ${pad(d.getHours())}:${pad(d.getMinutes())}` : "");
    }
    if (typeof v === "number") return INT.format(v);
    return String(v);
}
function shortDate(v: string): string {
    const d = toDate(v);
    return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : v;
}
function sortValue(v: powerbi.PrimitiveValue | undefined, isDate: boolean): number | string | null {
    if (v === null || v === undefined || v === "") return null;
    if (isDate) { const d = toDate(v); return d ? d.getTime() : null; }
    if (typeof v === "number") return v;
    const n = Number(v);
    if (v !== "" && isFinite(n) && typeof v !== "boolean") return n;
    return normalize(String(v));
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
