# Gera os blocos DAX do fim de docs/18-padronizacao-conceitos.md (18-medidas.md.part, colado à mão) e docs/18-padronizacao.csx (Tabular Editor)
import os
T13 = "'13_ETAPA_RECRUTAMENTO'"
T14 = "'14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'"
PER = "VAR Ini = MIN('_dCALENDARIO'[Data])\nVAR Fim = MAX('_dCALENDARIO'[Data]) + 1\n"
COORTE = (f"    KEEPFILTERS( {T13}[data_aplicacao] >= Ini ),\n"
          f"    KEEPFILTERS( {T13}[data_aplicacao] <  Fim )")
FIN = f"    KEEPFILTERS( NOT ISBLANK({T13}[stage_name]) ),\n    KEEPFILTERS( NOT ISBLANK({T13}[data_saida_stage]) ),\n"
ATIVO = f"    KEEPFILTERS( {T13}[resultado_etapa] = \"Em andamento\" ),\n"

F_VOL = r"98. ESTEIRAS\01. Etapa - Volume"
F_CONV = r"98. ESTEIRAS\02. Conversão"
F_ENT = r"98. ESTEIRAS\03. Entrevistas"
F_SLA = r"98. ESTEIRAS\04. Tempo na Etapa"
F_CMP = r"98. ESTEIRAS\06. Comparações"
F_TXT = r"98. ESTEIRAS\07. Textos"
F_NOM = r"98. ESTEIRAS\08. Nominal"
F_VAL = r"98. ESTEIRAS\99. Validação"

def agenda(col):
    return (PER +
f"""VAR Apps =
    CALCULATETABLE( VALUES( {T13}[application_id] ), REMOVEFILTERS( '_dCALENDARIO' ), REMOVEFILTERS( dEtapa ) )
VAR Etapas =
    FILTER( ALL( {T14}[etapa_entrevista] ),
        NOT ISFILTERED( dEtapa ) || {T14}[etapa_entrevista] IN VALUES( dEtapa[stage_name] ) )
RETURN
CALCULATE(
    DISTINCTCOUNT( {T14}[scheduled_interviews_id] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( {T14}[status] <> "to_be_scheduled" ),
    KEEPFILTERS( {T14}[{col}] >= Ini ),
    KEEPFILTERS( {T14}[{col}] <  Fim ),
    TREATAS( Apps, {T14}[application_id] ),
    Etapas
)""")

def trio(base, rot):
    return [
        ("nova", F_CMP, f"Esteira | {rot} (mês atual)", "VAR Hoje = TODAY()\nRETURN CALCULATE( [" + base + "], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", "#,0"),
        ("nova", F_CMP, f"Esteira | {rot} (mês anterior)", "VAR Hoje = TODAY()\nRETURN CALCULATE( [" + base + "], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", "#,0"),
        ("nova", F_CMP, f"Esteira | {rot} (YTD)", "VAR Hoje = TODAY()\nRETURN CALCULATE( [" + base + "], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", "#,0"),
    ]

# (tipo, pasta, nome, expressão, formato)  tipo: alterada | nova
GRUPOS = []

GRUPOS.append(("A · Etapas: passam a ser só das aplicações do período", [
("alterada", F_VOL, "Esteira | Participantes", PER + f"""RETURN
CALCULATE(
    DISTINCTCOUNT({T13}[application_id]),
    KEEPFILTERS( NOT ISBLANK({T13}[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK({T13}[data_entrada_stage]) ),
{COORTE}
)""", "#,0"),
]))

GRUPOS.append(("B · Tempo na etapa e SLA: aplicações do período", [
("alterada", F_SLA, "Esteira | Dias na Etapa (Média)", PER + f"RETURN\nCALCULATE(\n    AVERAGE({T13}[days_in_stage]),\n{FIN}{COORTE}\n)", "0.0"),
("alterada", F_SLA, "Esteira | Dias na Etapa (Mediana)", PER + f"RETURN\nCALCULATE(\n    MEDIAN({T13}[days_in_stage]),\n{FIN}{COORTE}\n)", "0.0"),
("alterada", F_SLA, "Esteira | Dias na Etapa (P90)", PER + f"RETURN\nCALCULATE(\n    PERCENTILE.INC({T13}[days_in_stage], 0.9),\n{FIN}{COORTE}\n)", "0.0"),
("alterada", F_SLA, "Esteira | Base SLA", PER + f"RETURN\nCALCULATE(\n    COUNTROWS({T13}),\n{FIN}{COORTE}\n)", "#,0"),
("alterada", F_SLA, "Esteira | SLA da Esteira (Mediana)", PER + f"""VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( {T13}, {T13}[application_id], {T13}[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK({T13}[sla_esteira_dias]) ),
    {COORTE.replace(chr(10), chr(10) + '    ')}
    )
RETURN MEDIANX( Contratacoes, {T13}[sla_esteira_dias] )""", "0.0"),
("alterada", F_SLA, "Esteira | SLA da Esteira (Média)", PER + f"""VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( {T13}, {T13}[application_id], {T13}[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK({T13}[sla_esteira_dias]) ),
    {COORTE.replace(chr(10), chr(10) + '    ')}
    )
RETURN AVERAGEX( Contratacoes, {T13}[sla_esteira_dias] )""", "0.0"),
("alterada", F_SLA, "Esteira | Dias na Etapa (Contratações)", PER + f"""VAR Contratadas =
    CALCULATETABLE(
        VALUES( {T13}[application_id] ),
        REMOVEFILTERS( dEtapa ),
        REMOVEFILTERS( {T13}[stage_name] ),
        KEEPFILTERS( NOT ISBLANK({T13}[data_contratacao]) ),
    {COORTE.replace(chr(10), chr(10) + '    ')}
    )
VAR Dias =
    CALCULATE(
        SUMX(
            SUMMARIZE( {T13}, {T13}[application_id], {T13}[stage_name], {T13}[data_entrada_stage], {T13}[days_in_stage] ),
            {T13}[days_in_stage]
        ),
        TREATAS( Contratadas, {T13}[application_id] )
    )
RETURN DIVIDE( Dias, COUNTROWS( Contratadas ) )""", "0.0"),
]))

GRUPOS.append(("C · Em andamento: só as aplicações do período que seguem em processo", [
("alterada", F_SLA, "Esteira | Ativos Agora", PER + f"RETURN\nCALCULATE(\n    DISTINCTCOUNT({T13}[application_id]),\n{ATIVO}{COORTE}\n)", "#,0"),
("alterada", F_SLA, "Esteira | Ativos Acima de 45 Dias", PER + f"RETURN\nCALCULATE(\n    DISTINCTCOUNT({T13}[application_id]),\n{ATIVO}    KEEPFILTERS( {T13}[days_in_stage] > 45 ),\n{COORTE}\n)", "#,0"),
("alterada", F_SLA, "Esteira | Ativos na Faixa", PER + f"""VAR De  = MIN( dFaixaDias[de] )
VAR Ate = MAX( dFaixaDias[ate] ) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT({T13}[application_id]),
{ATIVO}    KEEPFILTERS( {T13}[days_in_stage] >= De ),
    KEEPFILTERS( {T13}[days_in_stage] <  Ate ),
{COORTE}
)""", "#,0"),
("alterada", F_SLA, "Esteira | Ativos Acima da Mediana", PER + f"""RETURN
SUMX(
    VALUES({T13}[stage_name]),
    VAR Med = CALCULATE( [Esteira | Dias na Etapa (Mediana)], REMOVEFILTERS('_dCALENDARIO') )
    RETURN
        CALCULATE(
            DISTINCTCOUNT({T13}[application_id]),
            KEEPFILTERS( {T13}[resultado_etapa] = "Em andamento" ),
            KEEPFILTERS( {T13}[days_in_stage] > Med ),
            KEEPFILTERS( {T13}[data_aplicacao] >= Ini ),
            KEEPFILTERS( {T13}[data_aplicacao] <  Fim )
        )
)""", "#,0"),
("alterada", F_SLA, "Esteira | Acima do P90 Hoje", PER + f"""RETURN
SUMX(
    VALUES( dEtapa[stage_name] ),
    VAR P = [Esteira | Dias na Etapa (P90)]
    RETURN
        IF(
            NOT ISBLANK( P ),
            CALCULATE(
                DISTINCTCOUNT({T13}[application_id]),
                KEEPFILTERS( {T13}[resultado_etapa] = "Em andamento" ),
                KEEPFILTERS( {T13}[days_in_stage] > P ),
                KEEPFILTERS( {T13}[data_aplicacao] >= Ini ),
                KEEPFILTERS( {T13}[data_aplicacao] <  Fim )
            )
        )
)""", "#,0"),
("alterada", F_SLA, "Esteira | Dias na Etapa Atual", PER + f"RETURN\nCALCULATE(\n    MAX({T13}[days_in_stage]),\n{ATIVO}{COORTE}\n)", "0"),
("alterada", F_CONV, "Esteira | Aplicações Ativas", "[Esteira | Ativos Agora]", "#,0"),
]))

GRUPOS.append(("D · Agenda: a exceção (atividade do time, conta entrevistas)", [
("nova", F_ENT, "Esteira | Entrevistas Marcadas", agenda("created_at"), "#,0"),
("nova", F_ENT, "Esteira | Entrevistas na Agenda", agenda("start_at"), "#,0"),
("nova", F_ENT, "Esteira | Entrevistas Realizadas", f"CALCULATE( [Esteira | Entrevistas na Agenda], KEEPFILTERS( {T14}[start_at] < NOW() ) )", "#,0"),
("nova", F_ENT, "Esteira | Entrevistas a Realizar", "COALESCE( [Esteira | Entrevistas na Agenda], 0 ) - COALESCE( [Esteira | Entrevistas Realizadas], 0 )", "#,0"),
("nova", F_ENT, "Esteira | Marcadas Já Realizadas", f"CALCULATE( [Esteira | Entrevistas Marcadas], KEEPFILTERS( {T14}[start_at] < NOW() ) )", "#,0"),
("nova", F_ENT, "Esteira | Marcadas a Realizar", "COALESCE( [Esteira | Entrevistas Marcadas], 0 ) - COALESCE( [Esteira | Marcadas Já Realizadas], 0 )", "#,0"),
("alterada", F_ENT, "Esteira | Entrevistas Aprovados", f"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( {T14}[resultado_entrevista] = \"Aprovado\" ) )", "#,0"),
("alterada", F_ENT, "Esteira | Entrevistas Rejeitados", f"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( {T14}[resultado_entrevista] = \"Rejeitado\" ) )", "#,0"),
] + trio("Esteira | Entrevistas Marcadas", "Entrevistas Marcadas")))

GRUPOS.append(("E · Textos e destaques", [
("alterada", F_TXT, "Esteira | Texto Contratados", "\"Das aplicações com candidatura no período\"", None),
("alterada", F_TXT, "Esteira | Texto SLA", "\"Mediana da candidatura à contratação, aplicações do período\"", None),
("alterada", F_TXT, "Esteira | Texto Em Andamento", "FORMAT( COALESCE([Esteira | Ativos Acima de 45 Dias], 0), \"#,0\" ) & \" paradas há mais de 45 dias\"", None),
("alterada", F_TXT, "Esteira | Texto Entrevistas", """VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR R = COALESCE( [Esteira | Entrevistas Realizadas], 0 )
RETURN
FORMAT( A, "#,0" ) & " acontecem no período: "
    & FORMAT( R, "#,0" ) & " realizadas, " & FORMAT( A - R, "#,0" ) & " a realizar\"""", None),
("alterada", F_TXT, "Esteira | Destaque Entrevistas", """VAR M = [Esteira | Entrevistas Marcadas]
VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR Cv = [Esteira | Conversão Entrevista %]
VAR Atual = COALESCE( [Esteira | Entrevistas Marcadas (mês atual)], 0 )
VAR Ant = COALESCE( [Esteira | Entrevistas Marcadas (mês anterior)], 0 )
RETURN
IF(
    M > 0 || A > 0,
    FORMAT( M, "#,0" ) & " || Entrevistas marcadas no período || "
        & FORMAT( A, "#,0" ) & " acontecem no período. "
        & IF( NOT ISBLANK( Cv ), FORMAT( Cv, "0%" ) & " de aprovação nas realizadas. ", "" )
        & "Marcadas no mês: " & FORMAT( Atual, "#,0" ) & " contra " & FORMAT( Ant, "#,0" )
        & " no mesmo intervalo do mês anterior. || info"
)""", None),
]))

GRUPOS.append(("F · Página Nominal (até a versão 1.2.0 do visual)", [
("alterada", F_NOM, "Esteira | Nominal Situação", f"""VAR NoPer = NOT ISBLANK( [Esteira | Candidatos] )
VAR Ativo = NOT ISBLANK( [Esteira | Ativos Agora] )
VAR St    = LOWER( MAX( {T13}[status] ) )
VAR Dec   = CALCULATE( COUNTROWS( {T13} ), KEEPFILTERS( LEFT( {T13}[rejection_reason_name], 7 ) = "[Offer]" ) )
RETURN
SWITCH( TRUE(),
    NOT NoPer, BLANK(),
    Ativo, "Em andamento",
    St = "hired", "Contratada",
    St = "rejected" && Dec > 0, "Declinou",
    St = "rejected", "Rejeitada",
    "Outro" )""", None),
("alterada", F_NOM, "Esteira | Nominal Entrevista no Período", PER + f"""RETURN
CALCULATE(
    MIN( {T14}[start_at] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( {T14}[status] <> "to_be_scheduled" ),
    KEEPFILTERS( {T14}[start_at] >= Ini ),
    KEEPFILTERS( {T14}[start_at] <  Fim ),
    TREATAS( VALUES( {T13}[application_id] ), {T14}[application_id] )
)""", None),
]))

GRUPOS.append(("G · Conferência", [
("nova", F_VAL, "Esteira | Check Coorte", "[Esteira | Candidatos] - [Esteira | Contratados] - [Esteira | Rejeitados no Processo] - COALESCE( [Esteira | Ativos Agora], 0 )", "#,0"),
("nova", F_VAL, "Esteira | Check Funil", "[Esteira | Candidatos] - CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 1 }, dFunil[ordem_passo] ) )", "#,0"),
("nova", F_VAL, "Esteira | Check Agenda", "[Esteira | Entrevistas na Agenda] - [Esteira | Entrevistas Realizadas] - [Esteira | Entrevistas a Realizar]", "#,0"),
]))

APAGAR = ["Esteira | Entrevistas Criadas", "Esteira | Entrevistas Agendadas",
          "Esteira | Entrevistas Agendadas (mês atual)", "Esteira | Entrevistas Agendadas (mês anterior)", "Esteira | Entrevistas Agendadas (YTD)",
          "Esteira | Contratados por Data",
          "Esteira | Nominal Próxima Entrevista"]

def md():
    out = []
    for titulo, ms in GRUPOS:
        out.append(f"### {titulo}\n")
        for tipo, pasta, nome, expr, fmt in ms:
            tag = "🆕 nova" if tipo == "nova" else "✏️ alterada"
            out.append(f"**{nome}** · {tag}" + (f" · formato `{fmt}`" if fmt else "") + "\n")
            out.append("```DAX\n" + nome + " =\n" + expr + "\n```\n")
    return "\n".join(out)

def cs(s):
    return '@"' + s.replace('"', '""') + '"'

def csx():
    L = ["// Tabular Editor (2 ou 3) → aba C# Script → colar → Executar (F5) → Ctrl+S para salvar no modelo.",
         "// Cria as medidas novas e substitui a fórmula das alteradas. Nada é apagado: a lista para apagar está no fim.",
         'var t = Model.Tables["_Medidas"];',
         "Action<string, string, string, string> Set = (nome, expr, pasta, fmt) => {",
         "    var m = t.Measures.Contains(nome) ? t.Measures[nome] : t.AddMeasure(nome);",
         "    m.Expression = expr;",
         "    if (string.IsNullOrEmpty(m.DisplayFolder)) m.DisplayFolder = pasta;",
         "    if (fmt != null) m.FormatString = fmt;",
         "};"]
    for titulo, ms in GRUPOS:
        L.append(f"// {titulo}")
        for tipo, pasta, nome, expr, fmt in ms:
            L.append(f"Set({cs(nome)}, {cs(expr)}, {cs(pasta)}, {cs(fmt) if fmt else 'null'});")
    L.append("// Para apagar DEPOIS de trocar nos visuais (confira antes em INFO.CALCDEPENDENCY):")
    for n in APAGAR:
        L.append(f"// t.Measures[{cs(n)}].Delete();")
    L.append('Info("Medidas atualizadas. Salve com Ctrl+S.");')
    return "\n".join(L) + "\n"

base = os.path.join(os.path.dirname(__file__), "..", "docs")
open(os.path.join(base, "18-medidas.md.part"), "w").write(md())
open(os.path.join(base, "18-padronizacao.csx"), "w").write(csx())

# Versão para a Exibição de consulta DAX do Power BI (sem Tabular Editor):
# rodar valida as fórmulas; o botão "Atualizar modelo com alterações" grava as medidas.
def dax():
    L = ["// Dash de Esteiras · padronização de conceitos",
         "// 1) Executar (F5): confere se as fórmulas funcionam e mostra os números de conferência.",
         "// 2) Botão \"Atualizar modelo com alterações\" (acima do DEFINE): grava as medidas no modelo.",
         "DEFINE"]
    for titulo, ms in GRUPOS:
        L.append(f"    // {titulo}")
        for tipo, pasta, nome, expr, fmt in ms:
            corpo = "\n".join("        " + l for l in expr.split("\n"))
            L.append(f"    MEASURE '_Medidas'[{nome}] =\n{corpo}")
    L.append("""
EVALUATE
ROW(
    "Aplicações",            [Esteira | Candidatos],
    "Contratadas",           [Esteira | Contratados],
    "Rejeitadas",            [Esteira | Rejeitados no Processo],
    "Em andamento",          [Esteira | Ativos Agora],
    "Check Coorte (≈0)",     [Esteira | Check Coorte],
    "Check Funil (≈0)",      [Esteira | Check Funil],
    "Entrevistas marcadas",  [Esteira | Entrevistas Marcadas],
    "Entrevistas na agenda", [Esteira | Entrevistas na Agenda],
    "Realizadas",            [Esteira | Entrevistas Realizadas],
    "A realizar",            [Esteira | Entrevistas a Realizar],
    "Check Agenda (=0)",     [Esteira | Check Agenda],
    "SLA mediano",           [Esteira | SLA da Esteira (Mediana)]
)""")
    return "\n".join(L) + "\n"

open(os.path.join(base, "18-padronizacao.dax"), "w").write(dax())
