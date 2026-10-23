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

import { DetailSettings } from "./settings";
import { xpFont } from "./xpTheme";

// Segmentos (filtros compactos). "Aprovadas" só existe olhando uma etapa; "Contratadas" só olhando a aplicação.
type Seg = "todas" | "aprovadas" | "rejeitadas" | "declinaram" | "andamento" | "contratadas";
type Modo = "etapa" | "aplicacao";
type Key = "candidato" | "vaga" | "recrutador" | "etapa" | "resultado" | "motivo" | "candidatura" | "entrada" | "saida" | "dias";

interface Row {
    index: number;
    key: string;
    link: string;
    v: Partial<Record<Key, string | number | null>>;
    extras: powerbi.PrimitiveValue[];
    seg: Seg | "outro";
    jornada: string;
    seguintes: string;
    text: string;
    id: ISelectionId;
}
interface ColDef { key: Key | "extra"; title: string; extra?: number; }

const SEG_LABEL: Record<Seg, string> = {
    todas: "Todas", aprovadas: "Aprovadas na etapa", rejeitadas: "Rejeitadas pela XP",
    declinaram: "Declinaram", andamento: "Em andamento", contratadas: "Contratadas"
};
const SEGS: Record<Modo, Seg[]> = {
    etapa: ["todas", "aprovadas", "rejeitadas", "declinaram", "andamento"],
    aplicacao: ["todas", "andamento", "contratadas", "rejeitadas", "declinaram"]
};
const RES_SEG: Record<string, Seg> = {
    "aprovada": "aprovadas", "rejeitada": "rejeitadas", "declinou": "declinaram",
    "em andamento": "andamento", "contratada": "contratadas"
};
const RES_CLS: Record<string, string> = {
    "aprovada": "ok", "rejeitada": "bad", "declinou": "dec", "em andamento": "now", "contratada": "hired"
};
const DATE_KEYS: Key[] = ["candidatura", "entrada", "saida"];
const INT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private chipsEl: HTMLElement;
    private segEl: HTMLElement;
    private head: HTMLElement;
    private wrap: HTMLElement;
    private foot: HTMLElement;
    private settings: DetailSettings;
    private fmtService: FormattingSettingsService;
    private selectionManager: powerbi.extensibility.ISelectionManager;
    private rows: Row[] = [];
    private extraNames: string[] = [];
    private present: Partial<Record<string, boolean>> = {};
    private modo: Modo = "aplicacao";
    private aba: Seg = "todas";
    private chips: string[] = [];
    private lastContext: string | null = null;
    private seg: Seg = "todas";
    private sort: { key: string; desc: boolean } | null = null;
    private query = "";
    private shown = 0;
    private expanded = new Set<string>();
    private loading = false;
    private height = 0;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.fmtService = new FormattingSettingsService();
        this.selectionManager = this.host.createSelectionManager();
        this.root = el("div", "xp-dt");
        this.chipsEl = el("div", "xp-dt__chips");
        this.segEl = el("div", "xp-dt__segs");
        this.head = el("div", "xp-dt__head");
        this.wrap = el("div", "xp-dt__wrap");
        this.foot = el("div", "xp-dt__foot");
        this.root.append(this.chipsEl, this.segEl, this.head, this.wrap, this.foot);
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
            this.settings = this.fmtService.populateFormattingSettingsModel(DetailSettings, dv);
            this.height = options.viewport.height;
            this.root.style.fontFamily = xpFont;
            this.read(dv);
            this.loading = false;
            if (dv && dv.metadata && dv.metadata.segment && this.rows.length < this.settings.comportamento.maxLinhas.value) {
                this.loading = this.host.fetchMoreData(true);
            }
            this.shown = Math.max(this.shown, this.pageSize());
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.fmtService.buildFormattingModel(this.settings);
    }

    private pageSize(): number { return Math.max(10, this.settings.comportamento.linhasTela.value); }

    private read(dv: DataView | undefined) {
        this.rows = [];
        this.present = {};
        this.extraNames = [];
        const table = dv && dv.table;
        if (!table) return;
        const find = (role: string) => table.columns.findIndex(c => c.roles && c.roles[role]);
        const idx: Record<string, number> = {};
        for (const r of ["link", "candidato", "vaga", "recrutador", "linha", "jornada", "seguintes", "contexto"]) {
            idx[r] = find(r);
            this.present[r] = idx[r] >= 0;
        }
        const extraIdx = table.columns.map((c, i) => (c.roles && c.roles["extras"] ? i : -1)).filter(i => i >= 0);
        // Candidato aceita 1 ou 2 colunas (ex.: first_name + last_name), juntadas com espaço na ordem do poço.
        const nameIdx = table.columns.map((c, i) => (c.roles && c.roles["candidato"] ? i : -1)).filter(i => i >= 0);
        this.extraNames = extraIdx.map(i => clean(table.columns[i].displayName));

        // Contexto: igual em todas as linhas ("aba=…||modo=…||Etapa: …||…"). Pega o primeiro preenchido.
        let ctx = "";
        if (idx.contexto >= 0) {
            for (const r of table.rows) { const t = asText(r[idx.contexto]); if (t) { ctx = t; break; } }
        }
        this.readContext(ctx);

        table.rows.forEach((r, i) => {
            const packed = idx.linha >= 0 ? asText(r[idx.linha]) : "";
            if (idx.linha >= 0 && !packed) return; // fora da lista
            // Detalhe Linha: resultado|etapa|entrada|saída|dias|candidatura|motivo (motivo por último: pode ter "|")
            const p = packed.split("|");
            const res = (p[0] || "").trim();
            const dias = num(p[4]);
            const v: Partial<Record<Key, string | number | null>> = {
                candidato: nameIdx.map(j => asText(r[j])).filter(Boolean).join(" "), vaga: asText(r[idx.vaga]), recrutador: asText(r[idx.recrutador]),
                resultado: res, etapa: (p[1] || "").trim(), entrada: (p[2] || "").trim(), saida: (p[3] || "").trim(),
                dias, candidatura: (p[5] || "").trim(), motivo: p.slice(6).join("|").trim()
            };
            const extras = extraIdx.map(j => r[j]);
            const link = idx.link >= 0 ? asText(r[idx.link]) : "";
            const text = [link, v.candidato, v.vaga, v.recrutador, v.etapa, v.motivo, ...extras.map(asText)].join(" ");
            this.rows.push({
                index: i, key: link || String(i), link, v, extras,
                seg: RES_SEG[normalize(res)] || "outro",
                jornada: idx.jornada >= 0 ? asText(r[idx.jornada]) : "",
                seguintes: idx.seguintes >= 0 ? asText(r[idx.seguintes]) : "",
                text: normalize(text),
                id: this.host.createSelectionIdBuilder().withTable(table, i).createSelectionId()
            });
        });
    }

    // Quando o contexto muda (novo Detalhar), volta para a aba indicada e limpa busca/ordem.
    private readContext(ctx: string) {
        const parts = ctx.split("||").map(x => x.trim()).filter(Boolean);
        let modo: Modo = "aplicacao";
        let aba: Seg = "todas";
        const chips: string[] = [];
        for (const t of parts) {
            const m = /^(aba|modo)\s*=\s*(.+)$/i.exec(t);
            if (m && m[1].toLowerCase() === "modo") modo = m[2].trim() === "etapa" ? "etapa" : "aplicacao";
            else if (m) aba = (SEG_LABEL[m[2].trim() as Seg] ? m[2].trim() : "todas") as Seg;
            else chips.push(t);
        }
        this.modo = modo;
        this.aba = aba;
        this.chips = chips;
        if (this.lastContext !== ctx) {
            this.lastContext = ctx;
            this.seg = SEGS[modo].indexOf(aba) >= 0 ? aba : "todas";
            this.query = "";
            this.sort = null;
            this.shown = this.pageSize();
            this.expanded.clear();
        }
        if (SEGS[this.modo].indexOf(this.seg) < 0) this.seg = "todas";
    }

    private inSeg(r: Row, s: Seg): boolean { return s === "todas" || r.seg === s; }

    private render() {
        this.renderChips();
        this.renderSegs();
        this.renderHead();
        this.renderTable();
    }

    private renderChips() {
        clear(this.chipsEl);
        for (const c of this.chips) {
            const i = c.indexOf(":");
            const chip = el("span", "xp-dt__chip");
            if (i > 0) chip.append(document.createTextNode(c.slice(0, i + 1) + " "), el("b", "", c.slice(i + 1).trim()));
            else chip.textContent = c;
            chip.title = c;
            this.chipsEl.appendChild(chip);
        }
        const reg = el("span", "xp-dt__chip xp-dt__chip--reg", "Régua: aplicações com candidatura no período");
        this.chipsEl.appendChild(reg);
    }

    private renderSegs() {
        clear(this.segEl);
        this.segEl.setAttribute("role", "tablist");
        for (const s of SEGS[this.modo]) {
            const n = this.rows.filter(r => this.inSeg(r, s)).length;
            const on = s === this.seg;
            const b = el("button", "xp-dt__seg" + (on ? " xp-dt__seg--on" : "") + (n === 0 ? " xp-dt__seg--zero" : ""));
            b.setAttribute("role", "tab");
            b.setAttribute("aria-selected", String(on));
            b.append(document.createTextNode(SEG_LABEL[s] + " "), el("b", "", INT.format(n)));
            b.addEventListener("click", () => {
                if (this.seg === s) return;
                this.seg = s;
                this.sort = null;
                this.shown = this.pageSize();
                this.expanded.clear();
                this.render();
            });
            this.segEl.appendChild(b);
        }
        if (this.seg === this.aba && this.aba !== "todas") {
            this.segEl.appendChild(el("span", "xp-dt__hint", "↳ aberta conforme o filtro recebido"));
        }
    }

    private renderHead() {
        clear(this.head);
        const search = el("label", "xp-dt__search");
        search.appendChild(el("span", "xp-dt__icon", "⌕"));
        const input = document.createElement("input");
        input.type = "search";
        input.placeholder = this.settings.textos.busca.value || "Buscar";
        input.value = this.query;
        input.setAttribute("aria-label", input.placeholder);
        input.addEventListener("input", () => { this.query = input.value; this.shown = this.pageSize(); this.renderTable(); });
        input.addEventListener("keydown", (e: KeyboardEvent) => { e.stopPropagation(); if (e.key === "Escape") { input.value = ""; this.query = ""; this.renderTable(); } });
        search.appendChild(input);
        this.head.appendChild(search);
        const exp = el("button", "xp-dt__btn", "⤓ Exportar CSV");
        exp.title = "Baixa a lista inteira desta aba (com a busca aplicada), não só as linhas visíveis";
        exp.addEventListener("click", () => this.exportCsv(exp));
        this.head.appendChild(exp);
    }

    private columns(list: Row[]): ColDef[] {
        const etapaTitle = this.modo === "etapa" ? "Etapa" : "Etapa atual";
        const saidaTitle = this.seg === "contratadas" ? "Contratada em" : "Saída";
        const all: [Key, string][] = [["candidato", "Candidato"], ["vaga", "Vaga"], ["recrutador", "Recrutador"], ["etapa", etapaTitle],
            ["resultado", this.modo === "etapa" ? "Resultado na etapa" : "Situação"], ["motivo", "Motivo"], ["candidatura", "Candidatura"],
            ["entrada", "Entrada"], ["saida", saidaTitle], ["dias", "Dias na etapa"]];
        const has = (k: Key) => list.some(r => r.v[k] !== null && r.v[k] !== undefined && r.v[k] !== "");
        const cols: ColDef[] = all.filter(([k]) => (k === "candidato" || k === "vaga" || k === "recrutador" ? this.present[k] : true) && has(k))
            .map(([k, t]) => ({ key: k, title: t }));
        this.extraNames.forEach((n, i) => cols.push({ key: "extra", title: n, extra: i }));
        return cols;
    }

    private visible(): Row[] {
        const q = normalize(this.query);
        let list = this.rows.filter(r => this.inSeg(r, this.seg) && (!q || r.text.indexOf(q) >= 0));
        const sort = this.sort || { key: "dias", desc: true };
        const get = (r: Row) => sortValue(sort.key.startsWith("x") ? r.extras[Number(sort.key.slice(1))] : r.v[sort.key as Key], DATE_KEYS.indexOf(sort.key as Key) >= 0);
        const dir = sort.desc ? -1 : 1;
        list = list.slice().sort((a, c) => {
            const x = get(a), y = get(c);
            if (x === y) return a.index - c.index;
            if (x === null) return 1;
            if (y === null) return -1;
            return (x < y ? -1 : 1) * dir;
        });
        return list;
    }

    private exportCsv(btn: HTMLElement) {
        const list = this.visible();
        const cols = this.columns(list);
        const header = [this.present.link ? (this.settings.textos.link.value || "Link") : null, ...cols.map(c => c.title)].filter((x): x is string => x !== null);
        const lines = [header];
        for (const r of list) {
            const line: string[] = [];
            if (this.present.link) line.push(this.url(r.link) || r.link);
            for (const c of cols) {
                if (c.key === "extra") line.push(fmt(r.extras[c.extra as number], false));
                else line.push(DATE_KEYS.indexOf(c.key) >= 0 ? fmt(r.v[c.key], true) : asText(r.v[c.key]));
            }
            lines.push(line);
        }
        const csv = "\uFEFF" + lines.map(l => l.map(x => /[";\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x).join(";")).join("\r\n");
        const ctx = this.chips.map(c => c.split(":").slice(1).join(":").trim()).filter(Boolean).slice(0, 3).join("-");
        const name = `detalhe-${this.seg}${ctx ? "-" + slug(ctx) : ""}.csv`;
        const fail = () => { btn.textContent = "Use ⋯ → Exportar dados"; setTimeout(() => { btn.textContent = "⤓ Exportar CSV"; }, 4000); };
        try {
            const ds = this.host.downloadService;
            if (!ds) { fail(); return; }
            ds.exportVisualsContent(csv, name, "csv", "Detalhe nominal").then(ok => { if (!ok) fail(); }).catch(fail);
        } catch { fail(); }
    }

    private renderTable() {
        const s = this.settings;
        clear(this.wrap);
        const avail = Math.max(120, this.height - this.chipsEl.offsetHeight - this.segEl.offsetHeight - this.head.offsetHeight - 56);
        this.wrap.style.height = avail + "px";
        if (!this.present.linha || (!this.present.candidato && !this.present.link)) {
            this.wrap.appendChild(el("div", "xp-dt__empty", "Arraste o Link, o Candidato e as medidas Esteira | Detalhe Linha, Jornada, Seguintes e Contexto."));
            clear(this.foot);
            return;
        }
        const all = this.visible();
        const list = all.slice(0, this.shown);
        const cols = this.columns(all);
        const sort = this.sort || { key: "dias", desc: true };

        const table = el("table", "xp-dt__table");
        const hr = el("tr", "");
        hr.appendChild(el("th", "xp-dt__th-x"));
        if (this.present.link) hr.appendChild(el("th", "", s.textos.link.value || "Link"));
        for (const c of cols) {
            const key = c.key === "extra" ? "x" + c.extra : c.key;
            const right = c.key !== "extra" && (DATE_KEYS.indexOf(c.key) >= 0 || c.key === "dias");
            const th = el("th", right ? "xp-dt__r" : "");
            const on = sort.key === key;
            const btn = el("button", "xp-dt__sort" + (on ? " xp-dt__sort--on" : ""), c.title);
            if (on) btn.appendChild(el("span", "", sort.desc ? " ↓" : " ↑"));
            btn.addEventListener("click", () => {
                if (sort.key !== key) this.sort = { key, desc: true };
                else if (sort.desc) this.sort = { key, desc: false };
                else this.sort = null;
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
            const td = el("td", "xp-dt__none", this.query ? `Ninguém encontrado para "${this.query}"` : "Nenhuma aplicação nesta aba com os filtros recebidos");
            td.setAttribute("colspan", String(span));
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        const q = normalize(this.query);
        for (const r of list) {
            const open = this.expanded.has(r.key);
            const tr = el("tr", "xp-dt__row" + (open ? " xp-dt__row--open" : ""));
            tr.tabIndex = 0;
            tr.setAttribute("aria-expanded", String(open));
            tr.appendChild(el("td", "xp-dt__x", open ? "▾" : "▸"));
            if (this.present.link) {
                const td = el("td", "");
                const url = this.url(r.link);
                if (url) {
                    const a = el("button", "xp-dt__link", "Abrir ↗");
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
                if (c.key === "resultado") {
                    const t = asText(v);
                    td.appendChild(el("span", "xp-dt__pill xp-dt__pill--" + (RES_CLS[normalize(t)] || "off"), t || "—"));
                } else if (c.key === "dias") {
                    td.className = "xp-dt__r xp-dt__num";
                    const n = num(v);
                    td.textContent = n === null ? "—" : INT.format(n);
                    if (n !== null && n > s.dias.alerta.value) td.classList.add("xp-dt__num--bad");
                } else if (DATE_KEYS.indexOf(c.key) >= 0) {
                    td.className = "xp-dt__r";
                    td.textContent = fmt(v, true) || "—";
                } else {
                    if (c.key === "candidato") td.className = "xp-dt__strong";
                    if (c.key === "motivo") td.className = "xp-dt__muted";
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
                const det = el("tr", "xp-dt__det");
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
        this.foot.appendChild(el("span", "", all.length ? `Mostrando ${INT.format(list.length)} de ${INT.format(all.length)}` : ""));
        if (all.length > list.length) {
            const more = el("button", "xp-dt__btn xp-dt__more", `Mostrar mais ${INT.format(Math.min(this.pageSize(), all.length - list.length))} ▾`);
            more.addEventListener("click", () => { this.shown += this.pageSize(); this.renderTable(); });
            this.foot.appendChild(more);
        }
        if (this.loading) this.foot.appendChild(el("span", "xp-dt__loading", "Carregando mais aplicações…"));
    }

    // Linha do tempo: etapa|entrada|saída|resultado|dias;;… e as etapas seguintes que a aplicação não alcançou.
    private journey(r: Row): HTMLElement {
        const box = el("div", "xp-dt__jr");
        const steps = r.jornada.split(";;").map(x => x.split("|")).filter(p => p[0] && p[0].trim());
        const next = r.seguintes.split(";;").map(x => x.trim()).filter(Boolean);
        if (!steps.length) { box.appendChild(el("div", "xp-dt__muted", "Sem histórico de etapas para esta aplicação.")); return box; }
        const add = (name: string, sub: string, cls: string) => {
            const st = el("div", "xp-dt__st xp-dt__st--" + cls);
            st.append(el("i", ""), el("b", "", name), el("span", "", sub));
            box.appendChild(st);
        };
        for (const p of steps) {
            const [name, ini, fim, res, dias] = p.map(x => (x || "").trim());
            const rn = normalize(res);
            const cls = rn.startsWith("rejeit") ? "bad" : rn.indexOf("andamento") >= 0 ? "now" : "ok";
            const range = `${shortDate(ini)}${fim ? " → " + shortDate(fim) : " → hoje"}`;
            const d = dias !== "" && isFinite(Number(dias)) ? ` · ${INT.format(Number(dias))} d` : "";
            const tail = cls === "bad" ? " · rejeitada" : cls === "now" ? " · em andamento" : "";
            const here = r.v.etapa && normalize(name) === normalize(String(r.v.etapa)) ? " xp-dt__st--here" : "";
            add(name, range + d + tail, cls + here);
        }
        const emAndamento = steps.some(p => normalize(p[3] || "").indexOf("andamento") >= 0);
        for (const n of next) add(n, emAndamento ? "ainda não chegou" : "não chegou", "off");
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
function num(v: powerbi.PrimitiveValue | string | undefined): number | null {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(",", "."));
    return isFinite(n) ? n : null;
}
function asText(v: powerbi.PrimitiveValue | string | number | null | undefined): string {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString();
    return String(v).trim();
}
function pad(n: number): string { return String(n).padStart(2, "0"); }
function toDate(v: powerbi.PrimitiveValue | string | number | null | undefined): Date | null {
    if (v === null || v === undefined || v === "") return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "number" && v > 20000 && v < 80000) {
        const d = new Date(Math.round((v - 25569) * 86400000));
        return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    if (typeof v === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}
function fmt(v: powerbi.PrimitiveValue | string | number | null | undefined, isDate: boolean): string {
    if (v === null || v === undefined || v === "") return "";
    if (isDate || v instanceof Date) {
        const d = toDate(v);
        if (d) return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }
    if (typeof v === "number") return INT.format(v);
    return String(v);
}
function shortDate(v: string): string {
    const d = toDate(v);
    return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : v;
}
function sortValue(v: powerbi.PrimitiveValue | string | number | null | undefined, isDate: boolean): number | string | null {
    if (v === null || v === undefined || v === "") return null;
    if (isDate) { const d = toDate(v); return d ? d.getTime() : null; }
    if (typeof v === "number") return v;
    const n = Number(v);
    if (isFinite(n) && typeof v !== "boolean") return n;
    return normalize(String(v));
}
function slug(t: string): string {
    return normalize(t).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}
function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }
function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.textContent = label; return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
