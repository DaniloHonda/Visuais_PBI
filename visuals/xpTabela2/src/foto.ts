"use strict";

// Modo Fotografia: a linha chega com valores "~token" e a tabela calcula cada um a partir da linha do tempo
// da aplicação (jornada: "etapa|entrada|saída|resultado|dias;;…") e da data da foto. Assim o Power BI não precisa
// descobrir, linha por linha, em que etapa a aplicação estava no dia (era o que deixava a lista lenta).

export interface Faixa { de: number; ate: number; nome: string; }
export interface FotoCtx { d: string; ini: string; etapas: string[]; faixas: Faixa[]; }
interface Passo { etapa: string; ent: string; sai: string; res: string; dias: number | null; }

const DIA = 86400000;

export function parseFaixas(txt: string): Faixa[] {
    return (txt || "").split(";").map(p => {
        const a = p.split(":");
        if (a.length < 3) return null;
        const de = Number(a[0]), ate = Number(a[1]);
        return isFinite(de) && isFinite(ate) ? { de, ate, nome: a.slice(2).join(":").trim() } : null;
    }).filter((f): f is Faixa => f !== null);
}

function passos(jornada: string): Passo[] {
    return (jornada || "").split(";;").map(x => x.split("|")).filter(p => p[0] && p[0].trim()).map(p => ({
        etapa: p[0].trim(), ent: (p[1] || "").trim(), sai: (p[2] || "").trim(), res: (p[3] || "").trim(),
        dias: p[4] !== undefined && p[4] !== "" && isFinite(Number(p[4])) ? Number(p[4]) : null
    }));
}
function diff(a: string, b: string): number | null {
    const x = Date.parse(a + "T00:00:00Z"), y = Date.parse(b + "T00:00:00Z");
    return isFinite(x) && isFinite(y) ? Math.round((x - y) / DIA) : null;
}
// Mais recente pela entrada; empate: a que estava aberta no dia, depois a saída mais tarde, depois o nome da etapa.
function maisRecente(list: Passo[], d: string): Passo | null {
    let best: Passo | null = null;
    const k = (p: Passo) => [p.ent, !p.sai || p.sai > d ? "9999-99-99" : p.sai, p.etapa];
    for (const p of list) {
        if (!best) { best = p; continue; }
        const a = k(p), b = k(best);
        if (a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && a[2] > b[2])))) best = p;
    }
    return best;
}
const dt = (s: string) => (s ? "@" + s : "");
const nn = (n: number | null) => (n === null ? "" : "#" + n);

export function faixaDe(f: Faixa[], dias: number | null): string {
    if (dias === null) return "";
    const x = f.find(y => dias >= y.de && dias <= y.ate);
    return x ? x.nome : "";
}

// Devolve a função que troca "~token" pelo valor da linha. meta = chaves "_…" da própria linha (_rej, _aberta).
export function resolvedor(jornada: string, c: FotoCtx, meta: Record<string, string>): (token: string) => string {
    const ps = passos(jornada);
    const d = c.d, ini = c.ini;
    const ok = (p: Passo) => !c.etapas.length || c.etapas.indexOf(p.etapa) >= 0;
    const cache: Record<string, string> = {};

    const cobre = ps.filter(p => p.ent && p.ent <= d && (!p.sai || p.sai > d));
    const cob = maisRecente(cobre.filter(ok), d) || maisRecente(cobre, d);
    const diasCob = cob ? diff(d, cob.ent) : null;
    const ult = maisRecente(ps.filter(p => p.ent && p.ent <= d), d);

    const calc = (t: string): string => {
        switch (t) {
            case "etapa_dia": return cob ? cob.etapa : "(sem etapa no dia)";
            case "entrada_dia": return cob ? dt(cob.ent) : "";
            case "dias_dia": return nn(diasCob);
            case "seg45": return !cob ? "Sem etapa no dia" : (diasCob !== null && diasCob > 45 ? "Parada há mais de 45 dias" : "Até 45 dias");
            case "faixa_dia": return !cob ? "Sem etapa no dia" : faixaDe(c.faixas, diasCob);
            case "etapa_ultima": return ult ? ult.etapa : "(sem etapa)";
            case "dias_ultima": return nn(ult ? ult.dias : null);
            case "etapa_rej": case "dias_rej": {
                const r = maisRecente(ps.filter(p => p.res === "Rejeitado" && ok(p)), d) || ult;
                return t === "etapa_rej" ? (r ? r.etapa : "") : nn(r ? r.dias : null);
            }
            case "ent_etapa": case "ent_res": case "ent_entrada": case "ent_saida": case "ent_dias": {
                const rej = meta["_rej"] || "", aberta = meta["_aberta"] === "1";
                const rel = ps.filter(p => ok(p) && (
                    (p.ent >= ini && p.ent <= d)
                    || (p.res === "Aprovado" && !!p.sai && p.sai >= ini && p.sai <= d)
                    || (p.res === "Rejeitado" && !!rej && rej >= ini && rej <= d)
                    || (aberta && !!p.ent && p.ent <= d && (!p.sai || p.sai > d))));
                const p = maisRecente(rel, d);
                if (!p) return "";
                const rejNoDia = p.res === "Rejeitado" && !!rej && rej <= d;
                const saiuAteDia = !!p.sai && p.sai <= d;
                const res = rejNoDia ? "Rejeitado" : saiuAteDia ? p.res : "Em andamento";
                if (t === "ent_etapa") return p.etapa;
                if (t === "ent_res") return res;
                if (t === "ent_entrada") return dt(p.ent);
                if (t === "ent_saida") return rejNoDia ? dt(p.sai || rej) : saiuAteDia ? dt(p.sai) : "";
                return nn(res === "Em andamento" ? diff(d, p.ent) : p.dias);
            }
            case "sla_n": case "sla_dias": case "sla_entrada": case "sla_saida": case "sla_faixa": case "sla_etapa": {
                const cs = ps.filter(p => ok(p) && !!p.sai && p.sai >= ini && p.sai <= d);
                const soma = cs.reduce((s, p) => s + (p.dias || 0), 0);
                if (t === "sla_n") return nn(cs.length);
                if (t === "sla_dias") return cs.length ? nn(Math.floor(soma)) : "";
                if (t === "sla_entrada") return dt(cs.reduce((m, p) => (!m || p.ent < m ? p.ent : m), ""));
                if (t === "sla_saida") return dt(cs.reduce((m, p) => (p.sai > m ? p.sai : m), ""));
                if (t === "sla_faixa") return cs.length ? faixaDe(c.faixas, Math.floor(soma)) : "";
                return c.etapas.length === 1 ? c.etapas[0] : `(${cs.length} etapas)`;
            }
        }
        return "";
    };
    return (token: string) => (token in cache ? cache[token] : (cache[token] = calc(token)));
}
