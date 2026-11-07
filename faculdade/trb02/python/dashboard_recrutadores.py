"""TRB 02 - Dashboard 2 em Python: recrutadores, funil e evolução

Lê as views vw_candidaturas e vw_vagas_mais_15 do PostgreSQL da EC2
(script sql/04_views.sql).

Instalação (uma vez):
    pip install streamlit plotly sqlalchemy "psycopg[binary]" pandas

Execução (Windows PowerShell):
    $env:DB_HOST="IP_PUBLICO_DA_EC2"; $env:DB_PASSWORD="sua_senha"
    streamlit run dashboard_recrutadores.py

Execução (Linux/macOS):
    DB_HOST=IP_PUBLICO_DA_EC2 DB_PASSWORD=sua_senha streamlit run dashboard_recrutadores.py
"""
import os

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from sqlalchemy import create_engine, text

# --- Conexão ----------------------------------------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "recrutamento")
DB_USER = os.getenv("DB_USER", "trb02")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Paleta categórica (ordem fixa)
AZUL, LARANJA, AQUA, AMARELO = "#2a78d6", "#eb6834", "#1baf7a", "#eda100"
CORES_SITUACAO = {"Em andamento": AZUL, "Reprovado": LARANJA,
                  "Desistiu": AMARELO, "Contratado": AQUA}
ETAPAS = ["Triagem", "Entrevista RH", "Teste técnico", "Entrevista gestor", "Proposta"]
MESES = {1: "jan", 2: "fev", 3: "mar", 4: "abr", 5: "mai", 6: "jun",
         7: "jul", 8: "ago", 9: "set", 10: "out", 11: "nov", 12: "dez"}


@st.cache_resource
def conexao():
    url = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(url)


@st.cache_data(ttl=300)
def consulta(sql: str) -> pd.DataFrame:
    with conexao().connect() as c:
        return pd.read_sql(text(sql), c)


def estilo(fig, altura=360):
    fig.update_layout(height=altura, margin=dict(l=10, r=10, t=40, b=10),
                      font=dict(family="Segoe UI, Arial", size=13, color="#0b0b0b"),
                      plot_bgcolor="#fcfcfb", paper_bgcolor="#fcfcfb",
                      legend=dict(orientation="h", y=-0.15, title=None),
                      hoverlabel=dict(bgcolor="white"), separators=",.")
    fig.update_xaxes(showgrid=False, linecolor="#d9d8d3", title=None)
    fig.update_yaxes(gridcolor="#ecebe7", zeroline=False, title=None)
    return fig


def fmt_pct(x):
    return f"{x:.1f}%".replace(".", ",")


def fmt_num(x, casas=1):
    return f"{x:,.{casas}f}".replace(",", "X").replace(".", ",").replace("X", ".")


# --- Página -------------------------------------------------------------------
st.set_page_config(page_title="TRB 02 · Recrutadores e funil", layout="wide")
st.title("Recrutadores e funil · Dashboard Python 2")
st.caption(f"Fonte: PostgreSQL em AWS EC2 ({DB_HOST}) · views vw_candidaturas e vw_vagas_mais_15")

try:
    base = consulta("SELECT * FROM vw_candidaturas")
except Exception as erro:  # noqa: BLE001
    st.error(f"Não foi possível conectar ao banco em {DB_HOST}:{DB_PORT}. "
             f"Confira o IP da EC2, o Security Group e a senha.\n\n{erro}")
    st.stop()

base["mes"] = pd.to_datetime(base["mes"])
base["pretensao_salarial"] = base["pretensao_salarial"].astype(float)

# Filtros em uma linha, acima dos gráficos
f1, f2 = st.columns(2)
recrutadores = f1.multiselect("Recrutador", sorted(base["recrutador"].unique()), placeholder="Todos")
status_vaga = f2.multiselect("Status da vaga", ["Aberta", "Fechada", "Congelada"], placeholder="Todos")

df = base.copy()
if recrutadores:
    df = df[df["recrutador"].isin(recrutadores)]
if status_vaga:
    df = df[df["status_vaga"].isin(status_vaga)]

if df.empty:
    st.info("Nenhuma candidatura para os filtros escolhidos.")
    st.stop()

# KPIs
contratados = (df["situacao"] == "Contratado").sum()
k1, k2, k3, k4 = st.columns(4)
k1.metric("Recrutadores", df["recrutador"].nunique())
k2.metric("Candidaturas por vaga", fmt_num(len(df) / df["id_vaga"].nunique()))
k3.metric("Taxa de contratação", fmt_pct(contratados / len(df) * 100))
k4.metric("Em andamento", int((df["situacao"] == "Em andamento").sum()))

# Linha 1: funil de etapas + situação por mês (colunas empilhadas)
c1, c2 = st.columns([1, 1.4])
nivel = df["etapa"].map({e: i for i, e in enumerate(ETAPAS)})
funil = pd.DataFrame({
    "etapa": ETAPAS + ["Contratado"],
    "qtd": [int((nivel >= i).sum()) for i in range(len(ETAPAS))] + [int(contratados)],
})
fig = go.Figure(go.Funnel(
    y=funil["etapa"], x=funil["qtd"], textinfo="value+percent initial",
    marker=dict(color=AZUL, line=dict(color="#fcfcfb", width=2)),
    connector=dict(fillcolor="#e4eefb"),
    hovertemplate="%{y}<br>%{x} candidaturas<br>%{percentInitial:.1%} do total<extra></extra>"))
fig.update_layout(title="Funil: candidaturas que chegaram a cada etapa")
c1.plotly_chart(estilo(fig, 420), width="stretch")

por_mes = df.groupby(["mes", "situacao"]).size().reset_index(name="candidaturas").sort_values("mes")
por_mes["rotulo"] = por_mes["mes"].dt.month.map(MESES) + "/" + por_mes["mes"].dt.strftime("%y")
fig = px.bar(por_mes, x="rotulo", y="candidaturas", color="situacao",
             title="Candidaturas por mês e situação", color_discrete_map=CORES_SITUACAO,
             category_orders={"situacao": list(CORES_SITUACAO),
                              "rotulo": list(dict.fromkeys(por_mes["rotulo"]))},
             custom_data=["situacao"])
fig.update_traces(marker_line_color="#fcfcfb", marker_line_width=2,
                  hovertemplate="%{x} · %{customdata[0]}<br>%{y} candidaturas<extra></extra>")
c2.plotly_chart(estilo(fig, 420), width="stretch")

# Linha 2: consulta 2.1 (barras) + dispersão vaga (candidaturas x pretensão)
c3, c4 = st.columns(2)
mais15 = consulta("SELECT * FROM vw_vagas_mais_15 ORDER BY total_candidaturas")
if recrutadores:
    mais15 = mais15[mais15["recrutador"].isin(recrutadores)]
mais15["rotulo"] = mais15["titulo"] + " · " + mais15["recrutador"]
fig = px.bar(mais15, x="total_candidaturas", y="rotulo", orientation="h", text="total_candidaturas",
             title="Vagas com mais de 15 candidaturas (consulta 2.1)",
             color_discrete_sequence=[AZUL])
fig.update_traces(textposition="outside", textfont_color="#52514e",
                  hovertemplate="%{y}<br>%{x} candidaturas<extra></extra>")
c3.plotly_chart(estilo(fig, 420), width="stretch")

por_vaga = (df.groupby(["vaga", "senioridade"])
              .agg(candidaturas=("id_candidatura", "count"),
                   pretensao=("pretensao_salarial", "mean"))
              .reset_index())
fig = px.scatter(por_vaga, x="candidaturas", y="pretensao", hover_name="vaga",
                 title="Vagas: volume de candidaturas × pretensão média",
                 color_discrete_sequence=[AZUL], custom_data=["senioridade"])
fig.update_traces(marker=dict(size=11, line=dict(color="#fcfcfb", width=2)),
                  hovertemplate="<b>%{hovertext}</b> (%{customdata[0]})<br>"
                                "%{x} candidaturas<br>pretensão média R$ %{y:,.0f}<extra></extra>")
fig.update_yaxes(tickprefix="R$ ", tickformat=",.0f", rangemode="tozero")
fig.update_xaxes(rangemode="tozero", showgrid=True, gridcolor="#ecebe7")
c4.plotly_chart(estilo(fig, 420), width="stretch")

# Linha 3: resumo por recrutador
st.subheader("Resumo por recrutador")
resumo = (df.groupby("recrutador")
            .agg(vagas=("id_vaga", "nunique"),
                 candidaturas=("id_candidatura", "count"),
                 contratacoes=("situacao", lambda s: int((s == "Contratado").sum())),
                 em_andamento=("situacao", lambda s: int((s == "Em andamento").sum())))
            .reset_index()
            .sort_values("candidaturas", ascending=False))
resumo["Taxa de contratação"] = (resumo["contratacoes"] / resumo["candidaturas"] * 100).map(fmt_pct)
st.dataframe(resumo.rename(columns={"recrutador": "Recrutador", "vagas": "Vagas",
                                    "candidaturas": "Candidaturas", "contratacoes": "Contratações",
                                    "em_andamento": "Em andamento"}),
             hide_index=True, width="stretch")
