# TRB 02 · Bancos de Dados na Nuvem

Integração entre Serviços em Nuvem e Tópicos em Banco de Dados. Tema: **processo seletivo** (dados fictícios).
Prazo: **14/11/2026, 23:59**.

Arquitetura: AWS Academy Learner Lab → EC2 Ubuntu 24.04 (t3.micro) → PostgreSQL 16 → Power BI Desktop e Python (Streamlit).

## Arquivos

| Pasta / arquivo | Conteúdo |
|---|---|
| `sql/01_create.sql` | CREATE das 4 tabelas (PK, FK, CHECK) |
| `sql/02_insert.sql` | INSERTs: 6 recrutadores, 20 vagas, 180 candidatos, 320 candidaturas |
| `sql/03_selects.sql` | Selects: exibição, JOIN 2 tabelas, JOIN + GROUP BY + HAVING, JOIN + sub select |
| `sql/04_views.sql` | Views que alimentam os dashboards |
| `python/dashboard.py` | Dashboard Python (Streamlit + Plotly) |
| `python/gerar_inserts.py` | Gerador do `02_insert.sql` (semente fixa) |
| `docs/01_GUIA_AWS_ACADEMY.md` | Passo a passo: Learner Lab, EC2, PostgreSQL, execução dos scripts e prints |
| `docs/02_GUIA_POWER_BI.md` | Passo a passo do dashboard no Power BI |
| `docs/03_GUIA_PYTHON.md` | Como rodar o dashboard Python |

## Modelo

```
recrutador (id_recrutador PK, nome, area)
    1 ── N
vaga (id_vaga PK, titulo, area, senioridade, data_abertura, status, id_recrutador FK)
    1 ── N
candidatura (id_candidatura PK, id_vaga FK, id_candidato FK, data_candidatura, etapa, situacao, pretensao_salarial)
    N ── 1
candidato (id_candidato PK, nome, cidade, origem)
```

## Checklist da entrega

- [ ] Prints da EC2 (lista, detalhes, Security Group) e do terminal conectado
- [ ] Print do PostgreSQL instalado (serviço e versão)
- [ ] Prints da execução de CREATE, INSERT e de cada SELECT, com resultado
- [ ] Consulta com JOIN de 2 tabelas (1.1 e 1.2)
- [ ] Consulta com JOIN de 2 ou mais tabelas, GROUP BY e HAVING (2.1 e 2.2)
- [ ] Consulta com JOIN e sub select (3.1, 3.2 e 3.3)
- [ ] Dashboard Power BI (2 ou mais tipos de gráfico) lendo as views do banco
- [ ] Dashboard Python (2 ou mais tipos de gráfico) e o código `dashboard.py`
- [ ] Relatório Word ou PDF com todos os scripts e prints
- [ ] Arquivos anexados **sem compactar**: relatório, `.pbix`, `dashboard.py`
- [ ] Nenhuma tabela da aula usada (Peca, Fornecedor, Projeto, Fornece_para)
- [ ] Senha do banco fora dos prints e do código
