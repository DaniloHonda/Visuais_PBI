"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;

import { TrendSettings, granItems } from "./settings";
import { xpFont } from "./xpTheme";

type Gran = "dia" | "semana" | "mes" | "trimestre" | "ano";
type State = "past" | "current" | "future";

interface Line {
    name: string;
    color: string;
    days: Map<number, number>;
    hasFuture: boolean;
    area: boolean;
}

interface Bucket {
    start: Date;
    end: Date;
    vals: number[];
    state: State;
}

const SVG = "http://www.w3.org/2000/svg";
const DAY = 86400000;
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const NUM = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

export class Visual implements IVisual {
    private host: IVisualHost;
    private root: HTMLElement;
    private settings: TrendSettings;
    private formattingSettingsService: FormattingSettingsService;
    private lastView: DataView | undefined;
    private viewport: powerbi.IViewport = { width: 0, height: 0 };
    private gran: Gran | null = null;
    private serie: 1 | 2 | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.root = el("div", "xp-tr");
        options.element.appendChild(this.root);
    }

    public update(options: VisualUpdateOptions) {
        this.host.eventService.renderingStarted(options);
        try {
            this.lastView = options.dataViews && options.dataViews[0];
            this.viewport = options.viewport;
            this.settings = this.formattingSettingsService.populateFormattingSettingsModel(TrendSettings, this.lastView);
            if (this.gran === null) this.gran = String(this.settings.comportamento.granularidade.value.value) as Gran;
            if (this.serie === null) this.serie = String(this.settings.comportamento.serieInicial.value.value) === "2" ? 2 : 1;
            this.render();
            this.host.eventService.renderingFinished(options);
        } catch (e) {
            this.host.eventService.renderingFailed(options, String(e));
        }
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.settings);
    }

    // Lê as quatro medidas por dia. Linhas sem medida ficam de fora.
    private read(): { dates: Date[]; series: Record<"1" | "2", Line[]> } | null {
        const cat = this.lastView && this.lastView.categorical;
        const column = cat && cat.categories && cat.categories[0];
        if (!column) return null;
        const s = this.settings;
        const today = startOfDay(new Date()).getTime();
        const dates = column.values.map(asDate);
        const defs: [string, string, string, string][] = [
            ["s1a", s.textos.nome1a.value, s.cores.c1a.value.value, "1"],
            ["s1b", s.textos.nome1b.value, s.cores.c1b.value.value, "1"],
            ["s2a", s.textos.nome2a.value, s.cores.c2a.value.value, "2"],
            ["s2b", s.textos.nome2b.value, s.cores.c2b.value.value, "2"]
        ];
        const series: Record<"1" | "2", Line[]> = { "1": [], "2": [] };
        for (const [role, name, color, group] of defs) {
            const col = (cat.values || []).find(v => v.source.roles && v.source.roles[role]);
            if (!col) continue;
            const days = new Map<number, number>();
            let hasFuture = false;
            col.values.forEach((v, i) => {
                const d = dates[i];
                if (!d || v === null || v === undefined || v === "") return;
                const n = Number(v);
                if (!isFinite(n)) return;
                const k = d.getTime();
                days.set(k, (days.get(k) || 0) + n);
                if (k > today && n !== 0) hasFuture = true;
            });
            const areaSetting = String((group === "1" ? s.area.area1 : s.area.area2).value.value);
            const isA = role.endsWith("a");
            series[group].push({
                name: (name || "").trim() || col.source.displayName,
                color, days, hasFuture,
                area: (areaSetting === "a" && isA) || (areaSetting === "b" && !isA)
            });
        }
        return { dates: dates.filter((d): d is Date => d !== null), series };
    }

    private render() {
        clear(this.root);
        this.root.style.fontFamily = xpFont;
        const data = this.read();
        if (!data || (!data.series["1"].length && !data.series["2"].length)) {
            this.root.appendChild(el("div", "xp-tr__empty", "Arraste a coluna de data para \"Data\" e as medidas para as séries."));
            return;
        }
        const s = this.settings;
        const has1 = data.series["1"].length > 0, has2 = data.series["2"].length > 0;
        if (this.serie === 1 && !has1) this.serie = 2;
        if (this.serie === 2 && !has2) this.serie = 1;
        const lines = data.series[String(this.serie) as "1" | "2"];
        const gran = this.gran as Gran;

        // Barra: série (se houver duas) e granularidade.
        const bar = el("div", "xp-tr__bar");
        if (has1 && has2) {
            bar.appendChild(this.segmented([["1", s.textos.serie1.value], ["2", s.textos.serie2.value]], String(this.serie), v => { this.serie = v === "2" ? 2 : 1; this.render(); }, "Série"));
        }
        bar.appendChild(el("span", "xp-tr__spacer"));
        bar.appendChild(this.segmented(granItems.map(g => [g.value, g.displayName] as [string, string]), gran, v => { this.gran = v as Gran; this.render(); }, "Granularidade"));
        this.root.appendChild(bar);

        const today = startOfDay(new Date());
        const buckets = this.buckets(lines, gran, today);
        const kpis = this.kpis(lines, buckets, gran, today);
        this.root.appendChild(kpis);

        const chart = el("div", "xp-tr__chart");
        this.root.appendChild(chart);
        const height = Math.max(120, this.viewport.height - bar.offsetHeight - kpis.offsetHeight - 16);
        chart.style.height = height + "px";
        if (!buckets.length) {
            chart.appendChild(el("div", "xp-tr__empty", "Sem dados no período."));
            return;
        }
        this.drawChart(chart, lines, buckets, gran, today, this.viewport.width, height);
    }

    private segmented(items: [string, string][], active: string, onPick: (v: string) => void, label: string): HTMLElement {
        const seg = el("div", "xp-tr__seg");
        seg.setAttribute("role", "group");
        seg.setAttribute("aria-label", label);
        for (const [value, text] of items) {
            const b = el("button", "xp-tr__opt" + (value === active ? " xp-tr__opt--on" : ""), text);
            b.setAttribute("aria-pressed", String(value === active));
            b.addEventListener("click", e => { e.stopPropagation(); if (value !== active) onPick(value); });
            seg.appendChild(b);
        }
        return seg;
    }

    // Agrupa os dias em períodos contínuos, do primeiro ao último dia com valor.
    private buckets(lines: Line[], gran: Gran, today: Date): Bucket[] {
        let min = Infinity, max = -Infinity;
        for (const l of lines) for (const k of l.days.keys()) { if (k < min) min = k; if (k > max) max = k; }
        if (!isFinite(min)) return [];
        const out: Bucket[] = [];
        const index = new Map<number, Bucket>();
        let cur = bucketStart(new Date(min), gran);
        const last = bucketStart(new Date(max), gran).getTime();
        while (cur.getTime() <= last) {
            const next = nextStart(cur, gran);
            const end = new Date(next.getTime() - DAY / 2);
            const b: Bucket = {
                start: cur, end: startOfDay(end), vals: lines.map(() => 0),
                state: next.getTime() <= today.getTime() ? "past" : cur.getTime() > today.getTime() ? "future" : "current"
            };
            out.push(b);
            index.set(cur.getTime(), b);
            cur = next;
        }
        lines.forEach((l, li) => {
            for (const [k, v] of l.days) {
                const b = index.get(bucketStart(new Date(k), gran).getTime());
                if (b) b.vals[li] += v;
            }
        });
        return out;
    }

    private kpis(lines: Line[], buckets: Bucket[], gran: Gran, today: Date): HTMLElement {
        const s = this.settings;
        const row = el("div", "xp-tr__kpis");
        const t = today.getTime();
        const totals = lines.map(l => {
            let past = 0, future = 0;
            for (const [k, v] of l.days) { if (k > t) future += v; else past += v; }
            return { past, future };
        });
        lines.forEach((l, i) => {
            row.appendChild(this.kpi(l.color, NUM.format(totals[i].past), l.hasFuture ? `${l.name.toLowerCase()} até hoje` : l.name.toLowerCase()));
            if (l.hasFuture) row.appendChild(this.kpi(null, NUM.format(totals[i].future), `${l.name.toLowerCase()} ${s.textos.rotuloFuturo.value}`));
        });
        if (this.serie === 1 && lines.length === 2 && s.comportamento.mostrarTaxa.value) {
            const a = totals[0].past, b = totals[1].past;
            if (a + b > 0) row.appendChild(this.kpi(null, Math.round((a / (a + b)) * 100) + "%", s.textos.rotuloTaxa.value));
        }
        const current = buckets.find(b => b.state === "current");
        if (current && buckets.some(b => b.state === "past")) {
            const name = { dia: "Hoje", semana: "Semana atual", mes: "Mês atual", trimestre: "Trimestre atual", ano: "Ano atual" }[gran];
            const range = gran === "dia" ? "" : current.start.getTime() === today.getTime() ? ` (${shortDate(today)})` : ` (${shortDate(current.start)} – ${shortDate(today)})`;
            row.appendChild(el("span", "xp-tr__note", `${name}${range} ainda parcial`));
        }
        return row;
    }

    private kpi(color: string | null, value: string, label: string): HTMLElement {
        const k = el("span", "xp-tr__kpi");
        if (color) { const d = el("span", "xp-tr__dot"); d.style.background = color; k.appendChild(d); }
        k.appendChild(el("strong", "", value));
        k.appendChild(document.createTextNode(" " + label));
        return k;
    }

    private drawChart(chart: HTMLElement, lines: Line[], buckets: Bucket[], gran: Gran, today: Date, width: number, height: number) {
        const s = this.settings;
        const n = buckets.length;
        const curIdx = buckets.findIndex(b => b.state === "current");
        let lastReal = curIdx >= 0 ? curIdx : -1;
        if (lastReal < 0) for (let i = 0; i < n; i++) if (buckets[i].state === "past") lastReal = i;
        const anyFuture = lines.some(l => l.hasFuture) && buckets.some(b => b.state === "future");

        // Até onde cada linha vai: sem datas futuras, para no período atual.
        const reach = lines.map(l => (l.hasFuture ? n - 1 : lastReal));
        let maxV = 0;
        lines.forEach((l, li) => { for (let i = 0; i <= reach[li]; i++) maxV = Math.max(maxV, buckets[i].vals[li]); });
        const top = niceMax(maxV);

        const pad = { l: 52, r: 18, t: anyFuture ? 30 : 14, b: 26 };
        const pw = Math.max(10, width - pad.l - pad.r), ph = Math.max(10, height - pad.t - pad.b);
        const xs = (i: number) => pad.l + (n === 1 ? pw / 2 : (pw * i) / (n - 1));
        const ys = (v: number) => pad.t + ph - (ph * v) / top;
        const y0 = pad.t + ph;

        const svg = svgEl("svg", { width, height, class: "xp-tr__svg" });
        chart.appendChild(svg);

        // Região futura e marcador de hoje.
        if (anyFuture && s.comportamento.mostrarHoje.value && lastReal >= 0 && lastReal < n - 1) {
            const xh = (xs(lastReal) + xs(lastReal + 1)) / 2;
            svg.appendChild(svgEl("rect", { x: xh, y: pad.t - 6, width: pad.l + pw - xh, height: ph + 6, fill: "#F4F6F6" }));
            svg.appendChild(svgEl("line", { x1: xh, x2: xh, y1: pad.t - 10, y2: y0, stroke: "#8A8A8A", "stroke-dasharray": "3 3" }));
            const tl = svgEl("text", { x: xh + 8, y: pad.t - 14, class: "xp-tr__today" });
            tl.textContent = `hoje · ${shortDate(today)}`;
            svg.appendChild(tl);
        }

        // Grade e eixo Y.
        for (let k = 0; k <= 4; k++) {
            const v = (top * k) / 4, y = ys(v);
            svg.appendChild(svgEl("line", { x1: pad.l, x2: pad.l + pw, y1: y, y2: y, stroke: k ? "#EDEFEF" : "#C9CFD0" }));
            const t = svgEl("text", { x: pad.l - 8, y: y + 4, class: "xp-tr__ytick" });
            t.textContent = NUM.format(Math.round(v));
            svg.appendChild(t);
        }

        // Eixo X com rótulos espaçados.
        const step = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(pw / 64))));
        for (let i = 0; i < n; i += step) {
            const t = svgEl("text", { x: xs(i), y: y0 + 18, class: "xp-tr__xtick" });
            t.textContent = axisLabel(buckets[i].start, gran);
            svg.appendChild(t);
        }

        // Áreas, linhas e pontos.
        const path = (li: number, from: number, to: number) => {
            let d = "";
            for (let i = from; i <= to; i++) d += (i === from ? "M" : "L") + xs(i).toFixed(1) + "," + ys(buckets[i].vals[li]).toFixed(1);
            return d;
        };
        // Linha cheia só nos períodos fechados; período atual e futuro ficam tracejados.
        let lastPast = -1;
        for (let i = 0; i < n; i++) if (buckets[i].state === "past") lastPast = i;
        const solidEnd = (li: number) => Math.min(reach[li], lastPast);
        lines.forEach((l, li) => {
            const end = solidEnd(li);
            if (l.area && end > 0) {
                svg.appendChild(svgEl("path", { d: `${path(li, 0, end)}L${xs(end)},${y0}L${xs(0)},${y0}Z`, fill: l.color, "fill-opacity": 0.1 }));
            }
        });
        const labels: { x: number; y: number; text: string; color: string }[] = [];
        lines.forEach((l, li) => {
            const end = solidEnd(li);
            if (end > 0) svg.appendChild(svgEl("path", { d: path(li, 0, end), fill: "none", stroke: l.color, "stroke-width": 2.5, "stroke-linejoin": "round", "stroke-linecap": "round" }));
            const from = Math.max(end, 0);
            if (reach[li] > from) {
                svg.appendChild(svgEl("path", { d: path(li, from, reach[li]), fill: "none", stroke: l.color, "stroke-width": 2.5, "stroke-dasharray": "6 4", "stroke-opacity": 0.8 }));
            }
            for (let i = end + 1; i <= reach[li]; i++) {
                svg.appendChild(svgEl("circle", { cx: xs(i), cy: ys(buckets[i].vals[li]), r: 4, fill: "#FFFFFF", stroke: l.color, "stroke-width": 2 }));
            }
            if (end === 0 && reach[li] === 0) svg.appendChild(svgEl("circle", { cx: xs(0), cy: ys(buckets[0].vals[li]), r: 4, fill: l.color }));
            if (reach[li] >= 0) labels.push({ x: xs(reach[li]), y: ys(buckets[reach[li]].vals[li]) - 10, text: l.name, color: l.color });
        });

        // Rótulo direto no fim de cada linha, sem sobrepor.
        labels.sort((a, b) => a.y - b.y);
        for (let i = 1; i < labels.length; i++) {
            if (Math.abs(labels[i].x - labels[i - 1].x) < 90 && labels[i].y - labels[i - 1].y < 14) labels[i].y = labels[i - 1].y + 14;
        }
        for (const lb of labels) {
            const t = svgEl("text", { x: Math.min(lb.x, pad.l + pw), y: Math.max(lb.y, 11), class: "xp-tr__end" });
            t.textContent = lb.text;
            svg.appendChild(t);
        }

        // Camada de hover: linha vertical, pontos e dica.
        const hover = svgEl("g", { class: "xp-tr__hover" });
        hover.style.display = "none";
        const vline = svgEl("line", { y1: pad.t, y2: y0, stroke: "#121212", "stroke-opacity": 0.35 });
        hover.appendChild(vline);
        const dots = lines.map(l => {
            const c = svgEl("circle", { r: 5, fill: l.color, stroke: "#FFFFFF", "stroke-width": 2 });
            hover.appendChild(c);
            return c;
        });
        svg.appendChild(hover);
        const tip = el("div", "xp-tr__tip");
        tip.style.display = "none";
        chart.appendChild(tip);

        const show = (i: number) => {
            const b = buckets[i];
            hover.style.display = "";
            vline.setAttribute("x1", String(xs(i)));
            vline.setAttribute("x2", String(xs(i)));
            clear(tip);
            const head = el("div", "xp-tr__tip-head", tipLabel(b, gran));
            if (b.state !== "past") head.appendChild(el("span", "xp-tr__tag", b.state === "current" ? "parcial" : "futuro"));
            tip.appendChild(head);
            lines.forEach((l, li) => {
                const visible = i <= reach[li];
                dots[li].style.display = visible ? "" : "none";
                if (!visible) return;
                dots[li].setAttribute("cx", String(xs(i)));
                dots[li].setAttribute("cy", String(ys(b.vals[li])));
                const r = el("div", "xp-tr__tip-row");
                const d = el("span", "xp-tr__dot");
                d.style.background = l.color;
                r.append(d, document.createTextNode(`${l.name} `), el("strong", "", NUM.format(b.vals[li])));
                tip.appendChild(r);
            });
            if (this.serie === 1 && lines.length === 2 && s.comportamento.mostrarTaxa.value && i <= Math.min(reach[0], reach[1])) {
                const a = b.vals[0], c = b.vals[1];
                if (a + c > 0) tip.appendChild(el("div", "xp-tr__tip-row", `${capitalize(s.textos.rotuloTaxa.value)} ${Math.round((a / (a + c)) * 100)}%`));
            }
            tip.style.display = "";
            const tw = tip.offsetWidth;
            const left = xs(i) + 14 + tw > width ? xs(i) - 14 - tw : xs(i) + 14;
            tip.style.left = Math.max(0, left) + "px";
            tip.style.top = Math.max(0, pad.t + 4) + "px";
        };
        const overlay = svgEl("rect", { x: pad.l - 10, y: 0, width: pw + 20, height: y0, fill: "transparent" });
        overlay.addEventListener("mousemove", (e: MouseEvent) => {
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((x - pad.l) / pw) * (n - 1))));
            show(i);
        });
        overlay.addEventListener("mouseleave", () => { hover.style.display = "none"; tip.style.display = "none"; });
        svg.appendChild(overlay);
    }
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
    const node = document.createElementNS(SVG, tag);
    for (const k of Object.keys(attrs)) node.setAttribute(k, String(attrs[k]));
    return node;
}
function clear(node: Node) { while (node.firstChild) node.removeChild(node.firstChild); }
function capitalize(t: string): string { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
function startOfDay(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function pad2(n: number): string { return String(n).padStart(2, "0"); }
function shortDate(d: Date): string { return pad2(d.getDate()) + "/" + MONTHS[d.getMonth()]; }

function bucketStart(d: Date, g: Gran): Date {
    const y = d.getFullYear(), m = d.getMonth();
    switch (g) {
        case "dia": return startOfDay(d);
        case "semana": return new Date(y, m, d.getDate() - ((d.getDay() + 6) % 7));
        case "mes": return new Date(y, m, 1);
        case "trimestre": return new Date(y, Math.floor(m / 3) * 3, 1);
        default: return new Date(y, 0, 1);
    }
}
function nextStart(d: Date, g: Gran): Date {
    const y = d.getFullYear(), m = d.getMonth();
    switch (g) {
        case "dia": return new Date(y, m, d.getDate() + 1);
        case "semana": return new Date(y, m, d.getDate() + 7);
        case "mes": return new Date(y, m + 1, 1);
        case "trimestre": return new Date(y, m + 3, 1);
        default: return new Date(y + 1, 0, 1);
    }
}
function axisLabel(d: Date, g: Gran): string {
    const yy = String(d.getFullYear()).slice(2);
    switch (g) {
        case "dia": case "semana": return shortDate(d);
        case "mes": return `${MONTHS[d.getMonth()]}/${yy}`;
        case "trimestre": return `T${Math.floor(d.getMonth() / 3) + 1}/${yy}`;
        default: return String(d.getFullYear());
    }
}
function tipLabel(b: Bucket, g: Gran): string {
    const dm = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}`;
    switch (g) {
        case "dia": return `${WEEKDAYS[b.start.getDay()]}, ${dm(b.start)}/${b.start.getFullYear()}`;
        case "semana": return `Semana de ${dm(b.start)} a ${dm(b.end)}`;
        case "mes": return `${MONTHS_LONG[b.start.getMonth()]} de ${b.start.getFullYear()}`;
        case "trimestre": return `${Math.floor(b.start.getMonth() / 3) + 1}º trimestre de ${b.start.getFullYear()}`;
        default: return String(b.start.getFullYear());
    }
}
function niceMax(v: number): number {
    if (!(v > 0)) return 4;
    const raw = v / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * mag >= raw) return Math.max(4, m * mag * 4);
    return v;
}

// Aceita Date, texto ISO ou número de série do Excel/DAX (dias desde 30/12/1899).
function asDate(v: unknown): Date | null {
    if (v instanceof Date) return isNaN(v.getTime()) ? null : startOfDay(v);
    if (typeof v === "number" && v > 20000 && v < 80000) return new Date(1899, 11, 30 + Math.floor(v));
    if (typeof v === "string" && v) {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : startOfDay(d);
    }
    return null;
}
