# Databricks notebook source
# MAGIC %md
# MAGIC # Funil B2C 2026 · Varejo, Future e B2C geral (por macroetapa)
# MAGIC
# MAGIC Gera um Excel com 3 abas no formato da tabela de funil (Topo de funil → macroetapas → Entraram, Declinados, Reprovados,
# MAGIC Em andamento e Aprovados), com as etapas de cada macroetapa **agrupadas**: no Excel, o **+** à esquerda abre as etapas.
# MAGIC
# MAGIC **Como rodar**
# MAGIC 1. Célula 1 (configuração): confira os nomes das tabelas, das colunas e o período.
# MAGIC 2. Célula 2 (conferência das colunas e dos valores): rode **só ela** e mande a foto.
# MAGIC 3. Depois: **Run all** (ou rode as células 3 a 6 em ordem). A célula 4 mostra a conferência do topo de funil (foto).
# MAGIC 4. A célula 6 grava o Excel e mostra onde ele ficou. Baixe pelo menu **Workspace** (botão ⋮ do arquivo → Download).
# MAGIC
# MAGIC **Regras** (as mesmas do dash de Esteiras)
# MAGIC - Aplicações com candidatura de 01/01/2026 a 31/10/2026, persona B2C **sem** B2C Expansão.
# MAGIC - Varejo = níveis Assistente e Auxiliar · Future = Analista Júnior para cima · B2C geral = todos os níveis (inclusive sem nível).
# MAGIC - Fora: rejeitadas como Duplicate, Movimentação entre vagas, Posição cancelada ou sem motivo (desconsideradas no dash).
# MAGIC - Uma passagem por aplicação + etapa + data de entrada (cópias da origem saem).
# MAGIC - Macroetapa = mesma regra da coluna `ordem_macro` do dash.
# MAGIC - Em cada macroetapa (e em cada etapa): **Entraram** = aplicações com passagem nela. Se a etapa atual da aplicação está nela,
# MAGIC   vale o status final (contratada = Aprovado, rejeitada = Reprovado ou Declinado pelo motivo, aberta = Em andamento);
# MAGIC   se a aplicação já está numa etapa seguinte, **Aprovado**.
# MAGIC - Declinado = motivo de declínio do candidato (lista do dash). Pool rejeitado com contratação da pessoa em outra vaga = Aprovado.
# MAGIC - % após R&S = aprovados ÷ aprovados de Avaliação R&S · % após qualificação = aprovados ÷ aprovados de Qualificação ·
# MAGIC   % do topo = aprovados ÷ todas as aplicações do segmento.
# MAGIC - Aba **Nominal**: uma linha por aplicação B2C do período (inclusive as que ficam fora), com o porquê de cada uma.

# COMMAND ----------

# MAGIC %md
# MAGIC ### (opcional) instalar o openpyxl
# MAGIC Só se a célula 6 disser que falta o `openpyxl`: tire o `#` da linha abaixo, rode esta célula e depois **Run all** de novo.

# COMMAND ----------

# %pip install openpyxl --quiet

# COMMAND ----------

# Célula 1 · configuração
TAB_ETAPAS = "hr.gold.greenhouse_etapa_recrutamento"
TAB_JOBS = "hr.gold.greenhouse_jobs_v3"
DATA_INI = "2026-01-01"   # candidatura a partir de (inclusive)
DATA_FIM = "2026-10-31"   # candidatura até (inclusive)

# Colunas da tabela de etapas (nome no Databricks). As marcadas "opcional" podem ficar como None.
COL = {
    "app": "application_id",
    "cand": "candidate_id",              # opcional (regra do pool → contratação em outra vaga)
    "job": "job_id",
    "etapa": "stage_name",
    "entrada": "data_entrada_stage",
    "saida": "data_saida_stage",
    "status": "status",                  # hired / rejected / (aberta)
    "motivo": "rejection_reason_name",
    "candidatura": "data_aplicacao",
    "rejeicao": "rejected_at",           # opcional
    "persona": "persona",
    "vaga": "job_name",                  # opcional (identifica vaga de pool pelo nome)
    "ordem_vaga": "sort_order",          # opcional (desempate da etapa atual e ordem das etapas)
    "link": "link_application",          # opcional (link do Greenhouse na aba Nominal)
}
OPCIONAIS = {"cand", "rejeicao", "vaga", "ordem_vaga", "link"}

# Colunas da tabela de vagas
JOB = {"job": "job_id", "nivel": "job_level_final"}

NIVEIS_VAREJO = ["Assistente", "Auxiliar"]
NIVEIS_FUTURE = ["Analista Junior", "Analista Pleno", "Analista Senior", "Coord/Espec", "Superv/Assoc",
                 "Gerente/Espec II", "Gerente Executivo/Expert", "Superintendente"]

# Persona B2C: começa com "B2C" e não tem "expans" (tira B2C Expansão). Conferir na célula 2.
PERSONA_B2C_SQL = "lower(trim(persona)) like 'b2c%' and lower(persona) not like '%expans%'"

# Onde gravar o Excel. Vazio = pasta do seu usuário no Workspace.
SAIDA = ""

# COMMAND ----------

# Célula 2 · conferência das colunas e dos valores (mande a foto)
from pyspark.sql import functions as F

cols_e = set(spark.table(TAB_ETAPAS).columns)
cols_j = set(spark.table(TAB_JOBS).columns)
falta = [f"{TAB_ETAPAS}.{v}" for k, v in COL.items() if v and v not in cols_e and k not in OPCIONAIS]
falta += [f"{TAB_JOBS}.{v}" for v in JOB.values() if v not in cols_j]
opc = [f"{k} ({v})" for k, v in COL.items() if k in OPCIONAIS and (not v or v not in cols_e)]
for k in list(COL):
    if k in OPCIONAIS and (not COL[k] or COL[k] not in cols_e):
        COL[k] = None
print("Colunas obrigatórias que faltam:", falta or "nenhuma")
print("Opcionais ausentes (a regra correspondente fica desligada):", opc or "nenhuma")
if falta:
    raise ValueError("Ajuste os nomes na célula 1: " + ", ".join(falta))

c = COL
periodo = f"to_date({c['candidatura']}) between '{DATA_INI}' and '{DATA_FIM}'"
print("\nPersonas no período (marque quais são B2C):")
display(spark.sql(f"""
    select {c['persona']} as persona, count(distinct {c['app']}) as aplicacoes,
           case when {PERSONA_B2C_SQL.replace('persona', c['persona'])} then 'B2C' else '' end as entra
    from {TAB_ETAPAS} where {periodo} group by 1 order by 2 desc"""))

dup = spark.sql(f"select count(*) - count(distinct {JOB['job']}) as d from {TAB_JOBS}").collect()[0]["d"]
print(f"Vagas repetidas na {TAB_JOBS}: {dup} (o notebook usa uma linha por vaga)")
display(spark.sql(f"""
    with j as (select cast({JOB['job']} as string) as job, max({JOB['nivel']}) as nivel from {TAB_JOBS} group by 1)
    select j.nivel, count(distinct e.{c['app']}) as aplicacoes_b2c
    from {TAB_ETAPAS} e left join j on cast(e.{c['job']} as string) = j.job
    where {periodo} and {PERSONA_B2C_SQL.replace('persona', 'e.' + c['persona'])}
    group by 1 order by 2 desc"""))

# COMMAND ----------

# Célula 3 · base: passagens, macroetapa, etapa atual, status final e segmento
def col(k, alias):
    return f"e.{COL[k]} as {alias}" if COL.get(k) else f"cast(null as string) as {alias}"

NBSP = " "
spark.sql(f"""
create or replace temporary view fb_raw as
select cast(e.{COL['app']} as string) as app, {col('cand', 'cand')}, cast(e.{COL['job']} as string) as job,
       nullif(trim(replace(e.{COL['etapa']}, '{NBSP}', ' ')), '') as etapa,
       e.{COL['entrada']} as ent, e.{COL['saida']} as sai, lower(trim(e.{COL['status']})) as st,
       nullif(trim(replace(replace(replace(e.{COL['motivo']}, '{NBSP}', ' '), '\\n', ''), '\\r', '')), '') as motivo,
       to_date(e.{COL['candidatura']}) as dt_app, {col('rejeicao', 'rej')}, e.{COL['persona']} as persona,
       {col('vaga', 'vaga')}, {col('ordem_vaga', 'ordv')}, {col('link', 'link')}
from {TAB_ETAPAS} e
""")

# Macroetapa: mesma regra da coluna ordem_macro do dash (comparação sem diferença de maiúsculas, como no DAX).
MACRO_SQL = """
case
  when etapa is null then 99
  when lower(etapa) in ('pré offer','offer','recusou a offer','em negociação') then 8
  when lower(etapa) in ('background check','análise de crédito','reference check','comitê de contratação','executive review') then 7
  when lower(etapa) in ('avaliação técnica','take home test - tech') then 6
  when lower(etapa) = 'entrevista inteligente' then 2
  when lower(etapa) in ('etapa com recrutamento','entrevista r&s','apresentação pessoal')
       or lower(etapa) like '%dinâmica%' or lower(etapa) like '%xday%'
       or lower(etapa) like 'aprovados - recrut%' or lower(etapa) like 'em avaliação%' then 4
  when lower(etapa) like 'entrevista com %' or lower(etapa) like 'avaliação - %'
       or lower(etapa) in ('entrevista líder','bar raiser','aprovados - líder') then 5
  when lower(etapa) like 'pool %' or lower(etapa) like 'banking%'
       or lower(etapa) in ('júnior','junior','pleno','sênior/espec','senior','assistente','ams operations','clients operations',
                           'operations plataform','middle operations','offshore','candidatos internos') then 3
  when lower(etapa) in ('qualificação','longlist','on hold')
       or lower(etapa) like '%phone%' or lower(etapa) like '%short%' or lower(etapa) like '%stand%'
       or lower(etapa) like '%vídeo entrevista%' or lower(etapa) like '%video entrevista%' then 2
  when lower(etapa) in ('revisão de aplicação','priorizados ia','triagem','testes online','testgorilla','validação de laudo',
                        'teste pi realizado','declinou do processo','reprovados')
       or lower(etapa) like '%mindsight%' or lower(etapa) like 'ranking score%' then 1
  else 9
end"""
NOME_MACRO = """
case om when 1 then 'Triagem' when 2 then 'Qualificação' when 3 then 'Pool' when 4 then 'Avaliação R&S'
        when 5 then 'Entrevistas de liderança' when 6 then 'Avaliação técnica' when 7 then 'Checagem' when 8 then 'Offer'
        when 9 then 'Sem macro' else 'Etapa sem nome' end"""

# Uma passagem por aplicação + etapa + data de entrada (fica a de maior saída), como a passagem_valida do dash.
spark.sql(f"""
create or replace temporary view fb_pass as
select *, {MACRO_SQL} as om from (
  select *, row_number() over (partition by app, coalesce(etapa, '∅'), ent order by sai desc nulls last, ordv desc) as rn
  from fb_raw where ent is not null
) x where rn = 1
""")

# Tipo de encerramento pelo motivo (lista do dash, docs/51): a primeira regra que bate vale.
TIPO_SQL = """
case
  when motivo is null then 'Desconsiderada'
  when lower(motivo) like '%duplicate%' or lower(motivo) like '%movimentação entre vagas%'
       or lower(motivo) like '%posição cancelada%' then 'Desconsiderada'
  when lower(motivo) like '%anywhere%' or lower(motivo) like '%remuneração%' or lower(motivo) like '%desconfortável com a meta%'
       or lower(motivo) like '%recebeu outra oferta%' or lower(motivo) like '%sem interesse%' or lower(motivo) like '%desistência%'
       or lower(motivo) like '%motivos pessoais%' or lower(motivo) like '%preferiu outra posição%' then 'Declínio do candidato'
  when lower(motivo) like '%silver medalist%' then 'Avaliação'
  when lower(motivo) like '%limpeza de pool%' or lower(motivo) like '%move interno%' then 'Administrativo'
  when lower(motivo) like '%off limits%' or lower(motivo) like '%aai/b2b%' or lower(motivo) like '%background check%'
       or lower(motivo) like '%problemas de documentação%' then 'Avaliação'
  when lower(motivo) like '[offer]%' then 'Declínio do candidato'
  when lower(motivo) like '[aplicação]%' or lower(motivo) like '[avaliação]%' or lower(motivo) like '[qualificação]%' then 'Avaliação'
  else 'A classificar'
end"""

# Uma linha por aplicação (base inteira: a regra do pool procura a contratação em qualquer vaga).
spark.sql(f"""
create or replace temporary view fb_app_all as
select *, {TIPO_SQL} as tipo from (
  select app, max(cand) as cand, max(job) as job, max(st) as st, max(motivo) as motivo, min(dt_app) as dt_app,
         max(rej) as rej, max(persona) as persona, max(vaga) as vaga, max(link) as link
  from fb_raw group by app
) x
""")

# Pool rejeitado cuja pessoa foi contratada numa vaga que não é pool, aberta até 1 dia depois da rejeição do pool.
TEM_POOL = COL.get("cand") is not None and COL.get("vaga") is not None and COL.get("rejeicao") is not None
spark.sql(f"""
create or replace temporary view fb_saiu as
select p.app from fb_app_all p
where {'true' if TEM_POOL else 'false'} and p.st = 'rejected' and lower(p.vaga) like '%pool%'
  and exists (select 1 from fb_app_all h
              where h.cand = p.cand and h.st = 'hired' and lower(coalesce(h.vaga, '')) not like '%pool%'
                and h.dt_app <= date_add(to_date(p.rej), 1))
""")

jobs_sql = f"select cast({JOB['job']} as string) as job, max({JOB['nivel']}) as nivel from {TAB_JOBS} group by 1"
niv = lambda xs: ", ".join("'" + x.replace("'", "''") + "'" for x in xs)
spark.sql(f"""
create or replace temporary view fb_app as
select a.*, j.nivel,
       case when a.st = 'hired' then 'Aprovado'
            when s.app is not null then 'Aprovado'
            when a.st = 'rejected' and a.tipo = 'Declínio do candidato' then 'Declinado'
            when a.st = 'rejected' then 'Reprovado'
            else 'Em andamento' end as final,
       s.app is not null as saiu_para_vaga
from fb_app_all a
left join ({jobs_sql}) j on a.job = j.job
left join fb_saiu s on a.app = s.app
where a.dt_app between '{DATA_INI}' and '{DATA_FIM}'
  and {PERSONA_B2C_SQL.replace('persona', 'a.persona')}
  and not (a.st = 'rejected' and s.app is null and a.tipo = 'Desconsiderada')
""")

# Segmentos: B2C geral (todas) + Varejo (Assistente) + Future (Júnior para cima)
spark.sql(f"""
create or replace temporary view fb_seg as
select 'B2C geral' as seg, app from fb_app
union all select 'Varejo', app from fb_app where nivel in ({niv(NIVEIS_VAREJO)})
union all select 'Future', app from fb_app where nivel in ({niv(NIVEIS_FUTURE)})
""")

# Etapa atual: maior entrada → a que ainda está aberta → maior saída → maior ordem da vaga → nome.
spark.sql("""
create or replace temporary view fb_atual as
select app, etapa as etapa_atual, om as om_atual from (
  select p.*, row_number() over (partition by app
         order by ent desc, case when sai is null then 0 else 1 end, sai desc, ordv desc, etapa desc) as rn_atual
  from fb_pass p
) x where rn_atual = 1
""")

# Resultado em cada etapa e em cada macroetapa
spark.sql(f"""
create or replace temporary view fb_etapa as
select distinct s.seg, p.app, p.om, coalesce(p.etapa, '(etapa sem nome)') as etapa,
       case when coalesce(p.etapa, '∅') = coalesce(t.etapa_atual, '∅') then a.final else 'Aprovado' end as res,
       a.motivo
from fb_seg s join fb_app a on s.app = a.app join fb_pass p on p.app = a.app join fb_atual t on t.app = a.app
""")
spark.sql("""
create or replace temporary view fb_macro as
select distinct s.seg, p.app, p.om,
       case when p.om = t.om_atual then a.final else 'Aprovado' end as res, a.motivo
from fb_seg s join fb_app a on s.app = a.app join fb_pass p on p.app = a.app join fb_atual t on t.app = a.app
""")
# Aba Nominal: todas as aplicações B2C do período (as que entram e as desconsideradas), com o porquê.
spark.sql(f"""
create or replace temporary view fb_jornada as
select app, concat_ws(' → ', transform(sort_array(collect_list(struct(ent, txt))), x -> x.txt)) as jornada
from (select p.app, p.ent, coalesce(p.etapa, '(etapa sem nome)') || ' [' || {NOME_MACRO} || ']' as txt from fb_pass p) y
group by app
""")
spark.sql(f"""
create or replace temporary view fb_resmacro as
select app, concat_ws(' · ', transform(sort_array(collect_list(struct(om, txt))), x -> x.txt)) as por_macro
from (select app, om, {NOME_MACRO} || ': ' || res as txt from fb_macro where seg = 'B2C geral') y
group by app
""")
spark.sql(f"""
create or replace temporary view fb_nominal as
select a.app, a.link, a.cand, a.job, a.vaga, a.persona, j.nivel,
       case when a.st = 'rejected' and s.app is null and a.tipo = 'Desconsiderada' then 'Fora do funil'
            when j.nivel in ({niv(NIVEIS_VAREJO)}) then 'Varejo · B2C geral'
            when j.nivel in ({niv(NIVEIS_FUTURE)}) then 'Future · B2C geral'
            else 'B2C geral' end as segmentos,
       a.dt_app, a.st, a.motivo, case when a.st = 'rejected' then a.tipo end as tipo,
       case when a.st = 'rejected' and s.app is null and a.tipo = 'Desconsiderada' then 'Não' else 'Sim' end as entra,
       f.final, t.etapa_atual, t.om_atual,
       case
         when a.st = 'rejected' and s.app is null and a.tipo = 'Desconsiderada'
           then 'Fora do funil: rejeitada como "' || coalesce(a.motivo, 'sem motivo') || '" (desconsiderada no dash).'
         when a.st = 'hired' then 'Contratada: conta como aprovada em todas as macroetapas por onde passou.'
         when s.app is not null then 'Pool rejeitado, mas a pessoa foi contratada em outra vaga: conta como aprovada.'
         else (case f.final
                 when 'Declinado' then 'Rejeitada por declínio do candidato ("' || a.motivo || '")'
                 when 'Reprovado' then 'Rejeitada pela XP ("' || a.motivo || '", tipo ' || a.tipo || ')'
                 else 'Aberta' end)
              || ' com a etapa atual em ' || coalesce(t.etapa_atual, '(etapa sem nome)') || ': '
              || case f.final when 'Reprovado' then 'reprovada' when 'Declinado' then 'declinada' else 'em andamento' end
              || ' nessa macroetapa (nas macroetapas anteriores, aprovada).'
       end as porque,
       rm.por_macro, jo.jornada
from fb_app_all a
left join ({jobs_sql}) j on a.job = j.job
left join fb_saiu s on a.app = s.app
left join fb_app f on a.app = f.app
left join fb_atual t on a.app = t.app
left join fb_resmacro rm on a.app = rm.app
left join fb_jornada jo on a.app = jo.app
where a.dt_app between '{DATA_INI}' and '{DATA_FIM}'
  and {PERSONA_B2C_SQL.replace('persona', 'a.persona')}
""")
print("Base pronta.")

# COMMAND ----------

# Célula 4 · conferência (mande a foto): topo de funil e status final por segmento
display(spark.sql("""
select s.seg, count(*) as aplicacoes,
       sum(case when a.final = 'Aprovado' and a.st = 'hired' then 1 else 0 end) as contratadas,
       sum(case when a.saiu_para_vaga then 1 else 0 end) as pool_outra_vaga,
       sum(case when a.final = 'Reprovado' then 1 else 0 end) as reprovadas,
       sum(case when a.final = 'Declinado' then 1 else 0 end) as declinadas,
       sum(case when a.final = 'Em andamento' then 1 else 0 end) as em_andamento
from fb_seg s join fb_app a on s.app = a.app
group by s.seg order by aplicacoes desc
"""))

# COMMAND ----------

# Célula 5 · números para o Excel
topo = spark.sql("select seg, count(distinct app) as n from fb_seg group by seg").toPandas()
macro = spark.sql(f"""
select seg, om, {NOME_MACRO} as macro, res, count(distinct app) as n from fb_macro group by seg, om, res
""").toPandas()
etapa = spark.sql(f"""
select e.seg, e.om, {NOME_MACRO} as macro, e.etapa, e.res, count(distinct e.app) as n, o.ordem
from fb_etapa e
left join (select coalesce(etapa, '(etapa sem nome)') as etapa, avg(cast(ordv as double)) as ordem from fb_pass group by 1) o
  on e.etapa = o.etapa
group by e.seg, e.om, e.etapa, e.res, o.ordem
""").toPandas()
mot_m = spark.sql(f"""
select seg, om, res, coalesce(motivo, '(sem motivo)') as motivo, count(distinct app) as n
from fb_macro where res in ('Reprovado', 'Declinado') group by seg, om, res, coalesce(motivo, '(sem motivo)')
""").toPandas()
mot_e = spark.sql(f"""
select seg, om, etapa, res, coalesce(motivo, '(sem motivo)') as motivo, count(distinct app) as n
from fb_etapa where res in ('Reprovado', 'Declinado') group by seg, om, etapa, res, coalesce(motivo, '(sem motivo)')
""").toPandas()
NOME_ATUAL = NOME_MACRO.replace("case om", "case om_atual")
nominal = spark.sql(f"select *, {NOME_ATUAL} as macro_atual from fb_nominal order by dt_app, app").toPandas()
print(f"nominal: {len(nominal)} aplicações")
print(f"macro: {len(macro)} linhas · etapa: {len(etapa)} linhas · motivos: {len(mot_m)} + {len(mot_e)}")

# COMMAND ----------

# Célula 6 · Excel (3 abas formatadas + base + motivos + regras)
import os, datetime
try:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.worksheet.properties import Outline
    from openpyxl.utils import get_column_letter
except ImportError:
    raise ImportError("Falta o openpyxl: rode a célula '(opcional) instalar o openpyxl' e depois Run all.")


def gerar_excel(topo, macro, etapa, mot_m, mot_e, caminho, ini=DATA_INI, fim=DATA_FIM, nominal=None):
    TEAL, ESC, CLARO, LINHA = "067D84", "03474C", "E3F1F0", "DDE2E3"
    thin = Side(style="thin", color=LINHA)
    borda = Border(top=thin, bottom=thin, left=thin, right=thin)
    STATUS = ["Declinado", "Reprovado", "Em andamento", "Aprovado"]
    ROTULO = {"Declinado": "Declinados", "Reprovado": "Reprovados", "Em andamento": "Em andamento", "Aprovado": "Aprovados"}
    dt = lambda s: datetime.date.fromisoformat(s).strftime("%d/%m/%Y")
    wb = Workbook()
    wb.remove(wb.active)

    def top_motivos(df, res, total):
        d = df[df["res"] == res].sort_values("n", ascending=False)
        if total <= 0 or d.empty:
            return ""
        partes = [f"{r.motivo} ({r.n / total:.0%})".replace(".", ",") for r in d.head(3).itertuples()]
        resto = len(d) - 3
        return " · ".join(partes) + (f" · outros {resto} motivos" if resto > 0 else "")

    for seg in ["Varejo", "Future", "B2C geral"]:
        ws = wb.create_sheet(seg)
        ws.sheet_properties.outlinePr = Outline(summaryBelow=False, summaryRight=False)
        regra = {"Varejo": "níveis Assistente e Auxiliar", "Future": "Analista Júnior para cima",
                 "B2C geral": "todos os níveis"}[seg]
        ws["A1"] = f"Funil B2C · {seg} ({regra})"
        ws["A1"].font = Font(bold=True, size=14, color=ESC)
        ws["A2"] = (f"Candidaturas de {dt(ini)} a {dt(fim)} · persona B2C sem B2C Expansão · "
                    "clique no + à esquerda para abrir as etapas de cada macroetapa")
        ws["A2"].font = Font(size=10, color="6B6B6B")
        cab = ["Macroetapa / etapa", "Status", "Total", "% na etapa", "% após R&S", "% após qualificação",
               "% do topo de funil", "Motivos (top 3)"]
        for j, t in enumerate(cab, 1):
            cel = ws.cell(row=4, column=j, value=t)
            cel.font = Font(bold=True, color="FFFFFF")
            cel.fill = PatternFill("solid", fgColor=TEAL)
            cel.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cel.border = borda
        ws.row_dimensions[4].height = 32
        r = 5
        t_topo = int(topo.loc[topo["seg"] == seg, "n"].sum())
        for j, v in enumerate(["Topo de funil", "Todas as aplicações", t_topo, 1.0], 1):
            cel = ws.cell(row=r, column=j, value=v)
            cel.font = Font(bold=True, color=ESC)
            cel.border = borda
        ws.cell(row=r, column=3).number_format = "#,##0"
        ws.cell(row=r, column=4).number_format = "0%"
        r += 1

        m = macro[macro["seg"] == seg]
        e = etapa[etapa["seg"] == seg]
        apr = lambda om: int(m[(m["om"] == om) & (m["res"] == "Aprovado")]["n"].sum())
        base_rs, base_q = apr(4), apr(2)

        def bloco(nome, df_n, om, df_mot, nivel):
            """Escreve Entraram + status. nivel 0 = macroetapa (visível), 1 = etapa (dentro do +)."""
            nonlocal r
            total = int(df_n["n"].sum())
            if total == 0:
                return
            linhas = [("Entraram", total)] + [(s, int(df_n[df_n["res"] == s]["n"].sum())) for s in STATUS]
            for k, (s, n) in enumerate(linhas):
                if nivel == 1 and s not in ("Entraram", "Aprovado") and n == 0:
                    continue
                pct = n / total if total else None
                vals = [nome if k == 0 else "", ROTULO.get(s, s), n, pct]
                if s == "Aprovado":
                    vals += [n / base_rs if (om in (5, 6, 7, 8) and base_rs) else None,
                             n / base_q if (om in (3, 4, 5, 6, 7, 8) and base_q) else None,
                             n / t_topo if t_topo else None, ""]
                else:
                    vals += [None, None, None, top_motivos(df_mot, s, n) if s in ("Reprovado", "Declinado") else ""]
                for j, v in enumerate(vals, 1):
                    cel = ws.cell(row=r, column=j, value=v)
                    cel.border = borda
                    cel.alignment = Alignment(vertical="center", wrap_text=(j == 8), indent=(2 if nivel and j == 1 else 0))
                    if j == 3:
                        cel.number_format = "#,##0"
                    elif 4 <= j <= 7:
                        cel.number_format = "0%" if j == 4 else "0.0%"
                    if nivel == 0 and j == 1 and k == 0:
                        cel.font = Font(bold=True, color=ESC, size=12)
                    elif nivel == 1:
                        cel.font = Font(size=10, color="3C3C3C", italic=(j == 1 and k == 0))
                    if s == "Aprovado":
                        cel.fill = PatternFill("solid", fgColor=CLARO if nivel == 0 else "F3FAFA")
                        if j in (2, 3, 4, 5, 6, 7):
                            cel.font = Font(bold=True, color=ESC, size=(10 if nivel else 11))
                    elif s == "Entraram" and nivel == 0 and j > 1:
                        cel.font = Font(bold=True)
                if nivel == 1:
                    ws.row_dimensions[r].outlineLevel = 1
                    ws.row_dimensions[r].hidden = True
                r += 1

        for om in sorted(m["om"].unique()):
            dm = m[m["om"] == om]
            nome = dm["macro"].iloc[0]
            bloco(nome, dm, om, mot_m[(mot_m["seg"] == seg) & (mot_m["om"] == om)], 0)
            de = e[e["om"] == om]
            tot_et = de.groupby("etapa")["n"].sum()
            ordem = de.groupby("etapa")["ordem"].first().fillna(1e9)
            for et in sorted(tot_et.index, key=lambda x: (ordem[x], -tot_et[x], x)):
                bloco("↳ " + et, de[de["etapa"] == et], om,
                      mot_e[(mot_e["seg"] == seg) & (mot_e["om"] == om) & (mot_e["etapa"] == et)], 1)
        for j, w in enumerate([36, 20, 11, 11, 12, 14, 14, 90], 1):
            ws.column_dimensions[get_column_letter(j)].width = w
        ws.freeze_panes = "C5"

    # Abas de apoio: números longos (para tabela dinâmica) e regras
    b = wb.create_sheet("Base")
    b.append(["segmento", "nivel", "ordem_macro", "macroetapa", "etapa", "status", "aplicacoes"])
    for x in macro.sort_values(["seg", "om"]).itertuples():
        b.append([x.seg, "macroetapa", int(x.om), x.macro, "", ROTULO[x.res], int(x.n)])
    for x in etapa.sort_values(["seg", "om", "etapa"]).itertuples():
        b.append([x.seg, "etapa", int(x.om), x.macro, x.etapa, ROTULO[x.res], int(x.n)])
    mo = wb.create_sheet("Motivos")
    mo.append(["segmento", "ordem_macro", "etapa", "status", "motivo", "aplicacoes"])
    for x in mot_e.sort_values(["seg", "om", "etapa", "res", "n"], ascending=[True, True, True, True, False]).itertuples():
        mo.append([x.seg, int(x.om), x.etapa, ROTULO[x.res], x.motivo, int(x.n)])
    if nominal is not None:
        nm = wb.create_sheet("Nominal", 3)
        cab = [("Aplicação", "app", 14), ("Greenhouse", "link", 14), ("Candidato (id)", "cand", 14), ("Vaga", "vaga", 40),
               ("Persona", "persona", 12), ("Nível", "nivel", 18), ("Segmentos", "segmentos", 20),
               ("Candidatura", "dt_app", 12), ("Status no Greenhouse", "st", 12), ("Motivo", "motivo", 40),
               ("Tipo do motivo", "tipo", 20), ("Entra no funil", "entra", 10), ("Status no funil", "final", 14),
               ("Etapa atual", "etapa_atual", 28), ("Macroetapa atual", "macro_atual", 20), ("Por quê", "porque", 80),
               ("Resultado por macroetapa", "por_macro", 70), ("Jornada (etapa [macroetapa], em ordem)", "jornada", 90)]
        for j, (t, _, w) in enumerate(cab, 1):
            cel = nm.cell(row=1, column=j, value=t)
            cel.font = Font(bold=True, color="FFFFFF")
            cel.fill = PatternFill("solid", fgColor=TEAL)
            cel.alignment = Alignment(vertical="center", wrap_text=True)
            nm.column_dimensions[get_column_letter(j)].width = w
        for x in nominal.itertuples(index=False):
            linha = []
            for _, k, _ in cab:
                v = getattr(x, k)
                if v is None or (isinstance(v, float) and v != v):
                    v = None
                elif k == "dt_app":
                    v = v if isinstance(v, datetime.date) else datetime.date.fromisoformat(str(v)[:10])
                elif not isinstance(v, (int, float)):
                    v = str(v)
                linha.append(v)
            nm.append(linha)
        for c in nm["H"][1:]:
            c.number_format = "dd/mm/yyyy"
        nm.freeze_panes = "B2"
        nm.auto_filter.ref = f"A1:{get_column_letter(len(cab))}{nm.max_row}"
    rg = wb.create_sheet("Regras")
    for linha in [
        "Período: candidatura de " + dt(ini) + " a " + dt(fim) + ". Persona B2C sem B2C Expansão.",
        "Varejo = níveis Assistente e Auxiliar. Future = Analista Júnior, Pleno, Sênior, Coord/Espec, Superv/Assoc, Gerente/Espec II, "
        "Gerente Executivo/Expert, Superintendente. B2C geral = todos os níveis (inclusive sem nível).",
        "Fora: rejeitadas como Duplicate, Movimentação entre vagas, Posição cancelada ou sem motivo.",
        "Entraram = aplicações com passagem na macroetapa (ou na etapa).",
        "Se a etapa atual está nela: contratada = Aprovado; rejeitada = Reprovado ou Declinado (pelo motivo); aberta = Em andamento.",
        "Se a aplicação já está numa etapa seguinte: Aprovado. Pool rejeitado com contratação em outra vaga: Aprovado.",
        "% após R&S = aprovados ÷ aprovados de Avaliação R&S (de Entrevistas de liderança em diante).",
        "% após qualificação = aprovados ÷ aprovados de Qualificação (de Pool em diante).",
        "% do topo de funil = aprovados ÷ todas as aplicações do segmento.",
        "Motivos: os 3 mais frequentes, com % sobre os reprovados (ou declinados) daquela linha.",
        "Nominal: uma linha por aplicação B2C do período, inclusive as que ficam fora do funil (coluna Entra no funil), "
        "com o porquê, o resultado em cada macroetapa e a jornada.",
    ]:
        rg.append([linha])
    rg.column_dimensions["A"].width = 140
    wb.save(caminho)
    return caminho


if not SAIDA:
    user = spark.sql("select current_user() as u").collect()[0]["u"]
    SAIDA = f"/Workspace/Users/{user}/funil_b2c_2026.xlsx"
try:
    gerar_excel(topo, macro, etapa, mot_m, mot_e, SAIDA, nominal=nominal)
except OSError:
    tmp = "/tmp/funil_b2c_2026.xlsx"
    gerar_excel(topo, macro, etapa, mot_m, mot_e, tmp, nominal=nominal)
    raise OSError(f"Não consegui gravar em {SAIDA}. O arquivo ficou em {tmp}: mude SAIDA (célula 1) para um Volume, "
                  "ex.: /Volumes/<catálogo>/<schema>/<volume>/funil_b2c_2026.xlsx")
print("Excel gravado em:", SAIDA)
print("Para baixar: Workspace → Users → sua pasta → funil_b2c_2026.xlsx → ⋮ → Download.")
