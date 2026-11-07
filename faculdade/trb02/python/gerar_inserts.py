"""Gera faculdade/trb02/sql/02_insert.sql com dados fictícios e coerentes.

Semente fixa: rodar de novo produz exatamente o mesmo arquivo.
Uso:  python gerar_inserts.py
"""
import random
from datetime import date, timedelta
from pathlib import Path

random.seed(2026)
SAIDA = Path(__file__).resolve().parent.parent / "sql" / "02_insert.sql"
HOJE = date(2026, 10, 31)

recrutadores = [
    ("R01", "Ana Souza", "Tecnologia"),
    ("R02", "Bruno Lima", "Tecnologia"),
    ("R03", "Carla Mendes", "Dados"),
    ("R04", "Diego Rocha", "Comercial"),
    ("R05", "Elisa Prado", "Financeiro"),
    ("R06", "Fábio Nunes", "Operações"),
]

# (titulo, area, senioridade, recrutador, peso de atratividade)
vagas_base = [
    ("Desenvolvedor Back-end", "Tecnologia", "Pleno", "R01", 1.6),
    ("Desenvolvedor Front-end", "Tecnologia", "Júnior", "R01", 1.8),
    ("Engenheiro de Software", "Tecnologia", "Sênior", "R02", 0.9),
    ("Analista de QA", "Tecnologia", "Pleno", "R02", 0.8),
    ("Estagiário de TI", "Tecnologia", "Estágio", "R02", 2.2),
    ("Analista de Dados", "Dados", "Júnior", "R03", 1.9),
    ("Cientista de Dados", "Dados", "Sênior", "R03", 1.0),
    ("Engenheiro de Dados", "Dados", "Pleno", "R03", 1.1),
    ("Analista de BI", "Dados", "Pleno", "R03", 1.3),
    ("Executivo de Contas", "Comercial", "Pleno", "R04", 0.9),
    ("Assistente Comercial", "Comercial", "Júnior", "R04", 1.2),
    ("Gerente Comercial", "Comercial", "Sênior", "R04", 0.5),
    ("Analista Financeiro", "Financeiro", "Pleno", "R05", 0.8),
    ("Assistente Contábil", "Financeiro", "Júnior", "R05", 0.7),
    ("Controller", "Financeiro", "Sênior", "R05", 0.4),
    ("Estagiário Financeiro", "Financeiro", "Estágio", "R05", 1.4),
    ("Analista de Operações", "Operações", "Pleno", "R06", 0.7),
    ("Assistente de Logística", "Operações", "Júnior", "R06", 0.9),
    ("Coordenador de Operações", "Operações", "Sênior", "R06", 0.4),
    ("Analista de Processos", "Operações", "Pleno", "R06", 0.6),
]

faixa_salarial = {
    "Estágio": (1800, 2600),
    "Júnior": (3200, 5200),
    "Pleno": (6000, 9500),
    "Sênior": (11000, 18000),
}
premio_area = {"Tecnologia": 1.10, "Dados": 1.12, "Comercial": 0.95,
               "Financeiro": 1.0, "Operações": 0.90}

nomes = ["Lucas", "Mariana", "Pedro", "Juliana", "Rafael", "Camila", "Gustavo",
         "Beatriz", "Thiago", "Larissa", "Felipe", "Amanda", "Rodrigo", "Letícia",
         "Mateus", "Isabela", "Vinícius", "Gabriela", "André", "Natália",
         "Caio", "Priscila", "Leonardo", "Bianca", "Henrique"]
sobrenomes = ["Silva", "Santos", "Oliveira", "Costa", "Pereira", "Almeida",
              "Ferreira", "Ribeiro", "Carvalho", "Gomes", "Martins", "Araújo",
              "Barbosa", "Cardoso", "Teixeira"]
cidades = (["São Paulo"] * 9 + ["Campinas"] * 3 + ["Santo André"] * 2 +
           ["Guarulhos"] * 2 + ["Osasco", "Sorocaba", "Rio de Janeiro",
                                "Belo Horizonte", "Curitiba"])
origens = ["LinkedIn"] * 45 + ["Site"] * 25 + ["Indicação"] * 20 + ["Evento"] * 10
etapas = ["Triagem", "Entrevista RH", "Teste técnico", "Entrevista gestor", "Proposta"]


def q(texto: str) -> str:
    return "'" + texto.replace("'", "''") + "'"


linhas = ["-- =====================================================================",
          "-- TRB 02 - Script 02: inserção dos dados (fictícios)",
          "-- Gerado por python/gerar_inserts.py (semente fixa)",
          "-- =====================================================================",
          "", "BEGIN;", "", "-- Recrutadores"]
for r in recrutadores:
    linhas.append(f"INSERT INTO recrutador VALUES ({q(r[0])}, {q(r[1])}, {q(r[2])});")

# Vagas: abertas entre fev e set/2026
linhas += ["", "-- Vagas"]
vagas = []
for i, (titulo, area, sen, rec, peso) in enumerate(vagas_base, start=1):
    vid = f"V{i:02d}"
    abertura = date(2026, 2, 2) + timedelta(days=random.randint(0, 220))
    vagas.append(dict(id=vid, titulo=titulo, area=area, sen=sen, rec=rec,
                      abertura=abertura, peso=peso))
    # status definido depois, conforme houver contratação

# Candidatos
candidatos = []
usados = set()
for i in range(1, 181):
    while True:
        nome = f"{random.choice(nomes)} {random.choice(sobrenomes)}"
        if nome not in usados or len(usados) > 350:
            break
    usados.add(nome)
    candidatos.append((f"C{i:04d}", nome, random.choice(cidades), random.choice(origens)))

# Candidaturas: ~320, distribuídas pelo peso de cada vaga
candidaturas = []
pares = set()
total_alvo = 320
pesos = [v["peso"] for v in vagas]
cid = 0
while len(candidaturas) < total_alvo:
    v = random.choices(vagas, weights=pesos)[0]
    c = random.choice(candidatos)
    if (v["id"], c[0]) in pares:
        continue
    pares.add((v["id"], c[0]))
    dias_max = max((HOJE - v["abertura"]).days, 1)
    # mais candidaturas logo após a abertura
    dias = int(min(dias_max, random.expovariate(1 / 25)))
    data = v["abertura"] + timedelta(days=dias)
    idade = (HOJE - data).days
    # quanto mais antiga a candidatura, mais longe ela anda (ou é encerrada)
    nivel = min(4, int(random.random() ** 1.6 * 5))
    etapa = etapas[nivel]
    if idade < 20:
        situacao = "Em andamento"
    else:
        situacao = random.choices(["Reprovado", "Desistiu", "Em andamento"],
                                  weights=[70, 12, 18])[0]
    lo, hi = faixa_salarial[v["sen"]]
    pret = round(random.uniform(lo, hi) * premio_area[v["area"]] / 50) * 50
    cid += 1
    candidaturas.append(dict(id=cid, vaga=v, cand=c[0], data=data, etapa=etapa,
                             situacao=situacao, pret=pret))

# Uma contratação por vaga fechada: candidatura mais avançada vira "Contratado"
for v in vagas:
    da_vaga = [x for x in candidaturas if x["vaga"] is v]
    idade_vaga = (HOJE - v["abertura"]).days
    if idade_vaga > 90 and da_vaga and random.random() < 0.8:
        escolhido = max(da_vaga, key=lambda x: (etapas.index(x["etapa"]), -x["data"].toordinal()))
        escolhido["etapa"], escolhido["situacao"] = "Proposta", "Contratado"
        v["status"] = "Fechada"
    else:
        v["status"] = "Congelada" if random.random() < 0.1 else "Aberta"
    # vaga fechada: quem ainda estava em andamento é encerrado
    if v["status"] == "Fechada":
        for x in da_vaga:
            if x["situacao"] == "Em andamento":
                x["situacao"] = "Reprovado"

for v in vagas:
    linhas.append(
        f"INSERT INTO vaga VALUES ({q(v['id'])}, {q(v['titulo'])}, {q(v['area'])}, "
        f"{q(v['sen'])}, DATE {q(v['abertura'].isoformat())}, {q(v['status'])}, {q(v['rec'])});")

linhas += ["", "-- Candidatos"]
for c in candidatos:
    linhas.append(f"INSERT INTO candidato VALUES ({q(c[0])}, {q(c[1])}, {q(c[2])}, {q(c[3])});")

linhas += ["", "-- Candidaturas"]
for novo_id, x in enumerate(sorted(candidaturas, key=lambda x: (x["data"], x["id"])), start=1):
    linhas.append(
        f"INSERT INTO candidatura VALUES ({novo_id}, {q(x['vaga']['id'])}, {q(x['cand'])}, "
        f"DATE {q(x['data'].isoformat())}, {q(x['etapa'])}, {q(x['situacao'])}, {x['pret']:.2f});")

linhas += ["", "COMMIT;", ""]
SAIDA.write_text("\n".join(linhas), encoding="utf-8")
print(f"Gerado {SAIDA} ({len(candidaturas)} candidaturas)")
