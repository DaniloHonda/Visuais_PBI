# Consolida as medidas "Esteira | …" em uso num arquivo só (docs/24-medidas-finais.dax).
# Ordem de precedência: guias 00..17 (a última definição vence) → 18-padronizacao.dax (régua nova) → seções do guia 19.
import re, os, glob
ROOT = os.path.join(os.path.dirname(__file__), "..")
DOCS = os.path.join(ROOT, "docs")
APOSENTADAS = {  # substituídas pela padronização (guia 18) ou apagadas
    "Esteira | Entrevistas Criadas", "Esteira | Entrevistas Agendadas", "Esteira | Entrevistas Agendadas (mês atual)",
    "Esteira | Entrevistas Agendadas (mês anterior)", "Esteira | Entrevistas Agendadas (YTD)", "Esteira | Contratados por Data",
    "Esteira | Nominal Próxima Entrevista", "Esteira | Período Hoje", "Esteira | Contagem da Base", "Esteira | Mostrar na Base"}
HEAD = re.compile(r"^(Esteira \| [^=\n]+?)\s*=\s*(?:--.*)?(.*)$")
def blocks(text):
    return re.findall(r"```DAX\n(.*?)```", text, re.S)
def split_measures(code):
    out, cur, name = [], [], None
    for line in code.split("\n"):
        m = HEAD.match(line)
        if m and not line.startswith(" "):
            if name: out.append((name, "\n".join(cur).rstrip()))
            name, cur = m.group(1).strip(), [m.group(2)] if m.group(2).strip() else []
        elif name is not None:
            if line.startswith("--") and not cur: continue
            cur.append(line)
    if name: out.append((name, "\n".join(cur).rstrip()))
    return out
defs, origem = {}, {}
for f in sorted(glob.glob(os.path.join(DOCS, "[01][0-9]-*.md"))):
    num = os.path.basename(f)[:2]
    if num in ("18",): continue
    for code in blocks(open(f, encoding="utf-8").read()):
        for name, expr in split_measures(code):
            if "BASE" in name or "Data Referência" in name or not expr.strip(): continue
            defs[name] = expr; origem[name] = "guia " + num
# régua nova (guia 18)
for name, expr in re.findall(r"MEASURE '_Medidas'\[(Esteira \| [^\]]+)\] =\n((?:        .*\n?|\n)+?)(?=    MEASURE|    //|\nEVALUATE)", open(os.path.join(DOCS, "18-padronizacao.dax"), encoding="utf-8").read()):
    body = "\n".join(l[8:] if l.startswith("        ") else l for l in expr.rstrip().split("\n"))
    defs[name] = body; origem[name] = "guia 18"
for n in APOSENTADAS: defs.pop(n, None)
# ajustes do guia 17 (1.1.0) descritos em texto: a base da Nominal passa a ser "Na Base"
NB = "[Esteira | Nominal Na Base]"
for n in ("Etapa Atual", "Dias na Etapa", "Motivo", "Candidatura", "Jornada"):
    k = "Esteira | Nominal " + n
    defs[k] = defs[k].replace("ISBLANK( [Esteira | Nominal Situação] )", "ISBLANK( " + NB + " )")
k = "Esteira | Nominal Etapa da Entrevista"
defs[k] = defs[k].replace("[Esteira | Nominal Próxima Entrevista]", "[Esteira | Nominal Entrevista no Período]")
# trio de comparação das demais medidas base (o guia 01 só traz o de Candidatos)
for base in ("Contratados", "Conversão Esteira %", "SLA da Esteira (Mediana)"):
    for suf, rng in (("mês atual", "DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje"),
                     ("mês anterior", "EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)"),
                     ("YTD", "DATE(YEAR(Hoje), 1, 1), Hoje")):
        kk = f"Esteira | {base} ({suf})"
        defs[kk] = f"VAR Hoje = TODAY()\nRETURN CALCULATE( [Esteira | {base}], DATESBETWEEN('_dCALENDARIO'[Data], {rng}) )"
        origem[kk] = "guia 01"

# comparações das medidas novas de entrevista (trio) e destaques já vêm do guia 18; ordem por pasta
def pasta(n):
    for k, v in [("Nominal", "08"), ("Texto", "07"), ("Destaque", "07"), ("Selo", "07"), ("Rótulo", "07"), ("Período", "07"), ("(mês", "06"), ("(YTD)", "06"), ("Check", "99"),
                 ("Entrevistas", "03"), ("Marcadas", "03"), ("Dias na Etapa", "04"), ("SLA", "04"), ("Ativos", "04"), ("Acima", "04"), ("Flag", "04"), ("Meta", "04"),
                 ("Aprovados por Data", "05"), ("Rejeitados por Data", "05"), ("Funil", "02"), ("Chegaram", "02"), ("Conversão", "02"), ("Candidatos", "02"), ("Contratados", "02"),
                 ("Rejeitados no Processo", "02"), ("Aplicações", "02"), ("Recrutador por", "02")]:
        if k in n: return v
    return "01"
ordem = sorted(defs, key=lambda n: (pasta(n), n))
out = ["// Dash de Esteiras · todas as medidas em uso (consolidado por tools/build_medidas_finais.py)",
       "// Colar na Exibição de consulta DAX → Executar → \"Atualizar modelo com alterações\". Cria ou substitui as medidas na tabela '_Medidas'.",
       "// Não inclui as medidas aposentadas nem a correção das etapas duplicadas (docs/23, em espera).",
       "DEFINE"]
for n in ordem:
    body = "\n".join("        " + l if l.strip() else "" for l in defs[n].split("\n"))
    out.append(f"    // pasta 98. ESTEIRAS\\{pasta(n)} · {origem[n]}\n    MEASURE '_Medidas'[{n}] =\n{body.rstrip()}\n")
out.append("EVALUATE ROW( \"medidas\", " + str(len(ordem)) + " )")
open(os.path.join(DOCS, "24-medidas-finais.dax"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print(len(ordem), "medidas")
for n in ordem: print(" ", origem[n], "|", n)
