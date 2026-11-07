"""TRB 02 - Dashboard em Python (Streamlit + Plotly)

Lê as views criadas no PostgreSQL da EC2 (script sql/04_views.sql).

Instalação (uma vez):
    pip install streamlit plotly sqlalchemy "psycopg[binary]" pandas

Execução (Windows PowerShell):
    $env:DB_HOST="IP_PUBLICO_DA_EC2"; $env:DB_PASSWORD="sua_senha"
    streamlit run dashboard.py

Execução (Linux/macOS):
    DB_HOST=IP_PUBLICO_DA_EC2 DB_PASSWORD=sua_senha streamlit run dashboard.py
"""
import os

import pandas as pd
import plotly.express as px
import streamlit as st
from sqlalchemy import create_engine, text

# --- Conexão ----------------------------------------------------------------
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "recrutamento")
DB_USER = os.getenv("DB_USER", "trb02")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

# Paleta categórica (ordem fixa) e cores de texto
AZUL, LARANJA, AQUA, AMARELO, MAGENTA = "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"
CORES_SITUACAO = {"Em andamento": AZUL, "Reprovado": LARANJA,
                  "Desistiu": AMARELO, "Contratado": AQUA}
CORES_ORIGEM = {"LinkedIn": AZUL, "Site": LARANJA, "Indicação": AQUA, "Evento": AMARELO}
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


def estilo(fig, altura=340):
    fig.update_layout(height=altura, margin=dict(l=10, r=10, t=40, b=10),
                      font=dict(family="Segoe UI, Arial", size=13, color="#0b0b0b"),
                      plot_bgcolor="#fcfcfb", paper_bgcolor="#fcfcfb",
                      legend=dict(orientation="h", y=-0.15, title=None),
                      hoverlabel=dict(bgcolor="white"), separators=",.")
    fig.update_xaxes(showgrid=False, linecolor="#d9d8d3", title=None)
    fig.update_yaxes(gridcolor="#ecebe7", zeroline=False, title=None)
    return fig


def fmt_int(n):
    return f"{n:,.0f}".replace(",", ".")


def fmt_brl(n):
    return "R$ " + f"{n:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


# --- Página -------------------------------------------------------------------
st.set_page_config(page_title="TRB 02 · Processo seletivo", layout="wide")
st.title("Processo seletivo · Dashboard Python")
st.caption(f"Fonte: PostgreSQL em AWS EC2 ({DB_HOST}) · views vw_candidaturas e vw_vagas_acima_media")

try:
    base = consulta("SELECT * FROM vw_candidaturas")
except Exception as erro:  # noqa: BLE001
    st.error(f"Não foi possível conectar ao banco em {DB_HOST}:{DB_PORT}. "
             f"Confira o IP da EC2, o Security Group e a senha.\n\n{erro}")
    st.stop()

base["mes"] = pd.to_datetime(base["mes"])
base["pretensao_salarial"] = base["pretensao_salarial"].astype(float)

# Filtros em uma linha, acima dos gráficos
f1, f2, f3 = st.columns(3)
areas = f1.multiselect("Área", sorted(base["area"].unique()), placeholder="Todas")
recrutadores = f2.multiselect("Recrutador", sorted(base["recrutador"].unique()), placeholder="Todos")
senioridades = f3.multiselect("Senioridade", ["Estágio", "Júnior", "Pleno", "Sênior"], placeholder="Todas")

df = base.copy()
if areas:
    df = df[df["area"].isin(areas)]
if recrutadores:
    df = df[df["recrutador"].isin(recrutadores)]
if senioridades:
    df = df[df["senioridade"].isin(senioridades)]

if df.empty:
    st.info("Nenhuma candidatura para os filtros escolhidos.")
    st.stop()

# KPIs
k1, k2, k3, k4 = st.columns(4)
k1.metric("Candidaturas", fmt_int(len(df)))
k2.metric("Vagas", fmt_int(df["id_vaga"].nunique()))
k3.metric("Contratações", fmt_int((df["situacao"] == "Contratado").sum()))
k4.metric("Pretensão média", fmt_brl(df["pretensao_salarial"].mean()))

# Linha 1: evolução mensal (linha) + origem (rosca)
c1, c2 = st.columns([2, 1])
por_mes = df.groupby("mes").size().reset_index(name="candidaturas").sort_values("mes")
por_mes["rotulo"] = por_mes["mes"].dt.month.map(MESES) + "/" + por_mes["mes"].dt.strftime("%y")
fig = px.line(por_mes, x="rotulo", y="candidaturas", markers=True,
              title="Candidaturas por mês", color_discrete_sequence=[AZUL])
fig.update_traces(line_width=2, marker_size=8,
                  hovertemplate="%{x}<br>%{y} candidaturas<extra></extra>")
fig.update_yaxes(rangemode="tozero")
c1.plotly_chart(estilo(fig), width="stretch")

por_origem = df.groupby("origem").size().reset_index(name="candidaturas")
fig = px.pie(por_origem, names="origem", values="candidaturas", hole=0.55,
             title="Participação por origem", color="origem",
             color_discrete_map=CORES_ORIGEM)
fig.update_traces(textinfo="percent", textfont_color="#0b0b0b",
                  marker_line_color="#fcfcfb", marker_line_width=2,
                  hovertemplate="%{label}<br>%{value} candidaturas (%{percent})<extra></extra>")
c2.plotly_chart(estilo(fig), width="stretch")

# Linha 2: candidaturas por vaga (barras) + situação por área (100% empilhado)
c3, c4 = st.columns(2)
por_vaga = df.groupby("vaga").size().reset_index(name="candidaturas").sort_values("candidaturas")
fig = px.bar(por_vaga, x="candidaturas", y="vaga", orientation="h",
             title="Candidaturas por vaga", color_discrete_sequence=[AZUL], text="candidaturas")
fig.update_traces(textposition="outside", textfont_color="#52514e",
                  hovertemplate="%{y}<br>%{x} candidaturas<extra></extra>")
c3.plotly_chart(estilo(fig, altura=520), width="stretch")

sit = df.groupby(["area", "situacao"]).size().reset_index(name="n")
sit["pct"] = sit["n"] / sit.groupby("area")["n"].transform("sum") * 100
fig = px.bar(sit, x="area", y="pct", color="situacao", title="Situação das candidaturas por área (%)",
             color_discrete_map=CORES_SITUACAO,
             category_orders={"situacao": list(CORES_SITUACAO)}, custom_data=["situacao", "n"])
fig.update_traces(marker_line_color="#fcfcfb", marker_line_width=2,
                  hovertemplate="%{x} · %{customdata[0]}<br>%{y:.1f}% (%{customdata[1]})<extra></extra>")
fig.update_yaxes(ticksuffix="%", range=[0, 100])
c4.plotly_chart(estilo(fig, altura=520), width="stretch")

# Linha 3: distribuição da pretensão (histograma) + consulta 3.1 (tabela)
c5, c6 = st.columns(2)
fig = px.histogram(df, x="pretensao_salarial", nbins=20, title="Distribuição da pretensão salarial",
                   color_discrete_sequence=[AZUL])
fig.update_traces(marker_line_color="#fcfcfb", marker_line_width=2,
                  hovertemplate="R$ %{x}<br>%{y} candidaturas<extra></extra>")
fig.update_xaxes(tickprefix="R$ ", tickformat=",.0f")
c5.plotly_chart(estilo(fig), width="stretch")

c6.subheader("Vagas acima da média de candidaturas")
c6.caption("Consulta 3.1 (JOIN + sub select) · view vw_vagas_acima_media")
acima = consulta("SELECT * FROM vw_vagas_acima_media ORDER BY total_candidaturas DESC")
c6.dataframe(acima.rename(columns={"titulo": "Vaga", "recrutador": "Recrutador",
                                   "total_candidaturas": "Candidaturas"}),
             hide_index=True, width="stretch")

with st.expander("Ver dados (tabela)"):
    st.dataframe(df.drop(columns=["mes"]), hide_index=True, width="stretch")
