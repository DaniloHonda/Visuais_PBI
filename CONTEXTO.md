# Contexto do projeto · Dash de Esteiras (R&S · XP Inc.)

Resumo de tudo o que foi construído e decidido até 23/10/2026, para retomar o trabalho em outra conversa.
Cole este arquivo (ou o link dele) no início de uma conversa nova.

---

## 1. Quem e o quê
- **Danilo**, People Analytics da XP Inc. Constrói no Power BI o **Dash de Esteiras** do time de R&S (Recrutamento e Seleção).
- Fonte: **Greenhouse** (ATS). Dados desde **01/07/2026**. Atualização diária (06:00).
- Páginas: **Conceitos**, **Resumo**, **Report**, **Nominal**. Página em 1900 px de largura; fundos SVG em `backgrounds/`.
- Visuais próprios (`.pbiviz`) em `visuals/` e `dist/`; guias em `docs/`.

## 2. Preferências de trabalho (importante)
- **Ver imagens/mockups antes de gerar qualquer `.pbiviz`.**
- **Ir aos poucos**: uma etapa por vez, com conferência.
- Pensar sempre no usuário final: limpar, selecionar todos, boa busca, multisseleção.
- Usar o termo **"aplicações"** (não "candidatos").
- **Sem legendas em degradê**; visual **clean**, sem poluição.
- Nas tabelas nominais, o **link (Greenhouse) é sempre a primeira coluna**.
- **Toda diferença de número precisa de justificativa clara no dash** (página Conceitos → "Por que não bate?"; registro em `docs/20-justificativas.md`).
- Números em pt-BR (separador de milhar ".", decimal ",").
- O usuário aplica tudo manualmente no Power BI Desktop: passar **passo a passo com cliques, campos, posições (X, Y, L, A) e cores**.
- Para aplicar várias medidas de uma vez: arquivo `.dax`/`.txt` com `DEFINE MEASURE ... EVALUATE ROW(...)` para colar na **Exibição de consulta DAX** → Executar (confere) → "Atualizar modelo com alterações" (grava). Tabular Editor também existe (`.csx`), mas o usuário prefere a consulta DAX.

## 3. Modelo de dados (Power BI)
### Tabelas principais
| Tabela | Grão | Observações |
|---|---|---|
| `13_ETAPA_RECRUTAMENTO` | aplicação × etapa | Base de **todas** as medidas. Colunas: application_id (texto), job_id, job_stage_id, job_name, candidate_id, stage_name, data_entrada_stage, data_saida_stage, days_in_stage, status (hired/rejected/in_process), rejection_reason_name, data_aplicacao, rejected_at, recruiter_name, esteira, persona, especialidade, link_application, sort_order… |
| `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS` | entrevista | scheduled_interview_id, application_id, status (complete, awaiting_feedback, to_be_scheduled, scheduled), start_at, end_at, created_at, interview_name, organizer_name, interviewers |
| `03_APPLICATIONS_GH` | aplicação | Gold. source_public_name, credited_to_id, credited_to_name, candidate_id, status |
| `04_CANDIDATES_GH` | candidato | referred_by |
| `02_JOBS_GH` | vaga | job_id, position_type ("Pool" = vaga de pool), chave_bk_data_ref, especialidade… |
| `12_GE` | cadeira (Gestão de Estruturas) | N2_email, N3_email… (organograma). Ligada à Jobs por chave_bk_data_ref |
| `_dCALENDARIO` | data | **Sem relação com a 13**: medidas usam `MIN/MAX('_dCALENDARIO'[Data])` |
| `_Medidas` | — | Todas as medidas `Esteira | …` (pasta `98. ESTEIRAS\…`) |

### Colunas calculadas na 13
- `eh_etapa_ativa` (status in_process + última etapa por entrada; empate = maior ordem), `resultado_etapa` (Rejeitado / Em andamento / Aprovado), `data_contratacao` (= closed_at_opening se hired), `sla_esteira_dias`, `ordem_etapa`.
- `indicacao` ("Indicação" / "Sem indicação") via LOOKUPVALUE da `03_APPLICATIONS_GH[indicacao]`.
### Colunas calculadas na 14
- `etapa_entrevista` e `resultado_entrevista` (etapa da 13 em que a aplicação estava no início da entrevista).
### Tabelas de apoio
- `dEtapa` (stage_name, ordem, grupo, ordem_grupo) → relação com 13[stage_name].
- `dFunil` (passos = etapas + "Contratadas", sem relação).
- `dFaixaDias` (faixas de dias parados).
- `dEsteiraEtapa` (etapas de cada esteira, para a linha do tempo).
- `dFiltroIndicacao` (opcao "Todas"/"Só indicações" × indicacao) → relação **muitos-para-muitos** com 13[indicacao], filtro único.
- `dOrganograma` = SELECTCOLUMNS('02_JOBS_GH', job_id, tipo_vaga, eh_pool, N2…N7 via RELATED('12_GE'[Nx_email]) com COALESCE "-") → relação **13[job_id] (*) → dOrganograma[job_id] (1)**, única, ativa.
### Relações: cuidados
- A 13 é **isolada** de Jobs/Applications/GE (só dEtapa, dFiltroIndicacao e dOrganograma a filtram).
- **Nunca ativar 13 → 03 nem 13 → 02_JOBS_GH**: a Jobs está ligada ao calendário por data de fechamento; o período passaria a filtrar a 13 pela data de fechamento da vaga.
- Filtros da barra precisam usar colunas da 13 (ou tabelas ligadas a ela) para afetar os números.

## 4. A régua dos números (decisão do usuário)
- **Regra única:** todo número fala das **aplicações com candidatura no período** (coorte por `data_aplicacao`): aplicações, contratadas, rejeitadas, declinaram, em andamento, paradas, conversão, funil, participantes por etapa, tempo na etapa, SLA.
- **Exceções (atividade do time, pela data do evento):**
  1. **Agenda**: *Entrevistas marcadas* (created_at) e *Entrevistas na agenda* (start_at; realizadas + a realizar). Contam **entrevistas** (scheduled_interview_id), excluindo `to_be_scheduled`. Quem marcou = organizer_name.
  2. **Movimentações** no gráfico de Evolução: `Aprovados por Data` × `Rejeitados por Data` (cada aprovação/rejeição em cada etapa, pela data do evento).
- **Declinou** = rejeição com motivo começando por "[Offer]". No Report "Rejeitados" = rejeitadas pela XP + declinaram; na Nominal são dois cards.
- **Conversão da esteira** = contratadas ÷ (contratadas + rejeitadas). **Conversão da etapa** = aprovados ÷ (aprovados + rejeitados).
- **Indicação:** regra 1 (Applications) Source = "Referral" e credited_to_id preenchido; senão regra 2 (Candidates) referred_by preenchido. Regra 2 vale para todas as aplicações do candidato (decisão de negócio).
- Medidas e fórmulas: `docs/18-padronizacao-conceitos.md` (+ `.dax`), geradas por `tools/gen_conceitos.py`.

## 5. Visuais (`dist/`)
| Visual | Versão | Onde | Notas |
|---|---|---|---|
| Card de KPI | 1.2.1 | Resumo (6 cards) | valor, comparação mês atual × anterior, YTD, meta, texto de contexto, selo de período |
| Funil | 1.2.0 | Resumo | dFunil[passo] + Funil Aplicações |
| Barras com composição | 1.1.0 | Resumo/Report | resumo, parte em destaque, Pareto |
| Lista de destaques | 1.0.0 | Resumo | medidas de texto "N || título || texto || status" |
| Consumo da meta | 1.1.0 | Resumo | SLA por etapa contra meta 45 |
| Segmentação | 2.2.0 | barra de filtros | lista suspensa, janela ou lista aberta |
| Período | **2.2.0** | barra de filtros | atalhos: mês atual/anterior, **trimestre atual e anterior**, últimos 30, desde 01/jul; caixa mostra "T3 2026 · 01/07 – 30/09" |
| Evolução | 1.0.0 | Report | 2 séries × 2 linhas; dia/semana/mês/trimestre/ano; futuro tracejado |
| Tabela por etapa | 1.1.0 | Report (etapas e recrutador) | conversão fixa ou vs média, compacto < 1000 px |
| Matriz de calor | 1.2.0 | Report (andamento × faixa, praça × grupo) | modo taxa vs média, ⓘ por coluna |
| Tabela de SLA | 1.0.0 | Report | típico (mediana), P90, base, acima hoje |
| Etapa e motivos | 1.0.0 | Report | Top 5/8/10/Todos, "[Offer]" em destaque |
| Tabela nominal | **1.1.0** | Report (Pré Offer e Offer) | até 30 colunas, "Mostrar mais" (100/vez), carrega 100 mil, exportar CSV. Campo Dias = **medida** `Esteira | Dias na Etapa Atual` |
| Base nominal | 1.1.0 | Nominal | cards = bases (andamento, agendadas, contratadas, rejeitadas, declinaram, todas), linha do tempo, exportar; campo "No período (1/vazio)" = `Esteira | Nominal No Período`; filtro do visual `Esteira | Nominal Na Base` = 1 |
| Organograma | **1.0.0** | barra de filtros | árvore N2→N3→…; Níveis = dOrganograma[N2…N7]; e-mail vira nome; filtro simples (mesmo nível) ou por tupla (níveis misturados) |

Build: `cd visuals/<visual> && npm install && npx pbiviz package`. Testes eram feitos extraindo js/css do `.pbiviz` e simulando o host no Chromium (Playwright).

## 6. Barra de filtros (uma linha, Y 225)
Período (X 316 · L 200) · Organograma (526 · 270, altura 440) · Esteira (806 · 118) · BK (934 · 118) · Recrutador (1062 · 128) · Sourcer (1200 · 118) · Persona (1328 · 118) · Especialidade (1456 · 140) · Etapa (1606 · 118) · Praça (1734 · 118). Altura 320 (lista abre dentro do próprio visual; visuais não podem se sobrepor na horizontal).
Botão **Todas | Só indicações** no topo (X 1000 · Y 40 · 290 × 40) + selo "Só indicações" ao lado do título.

## 7. Achados nos dados (homologação)
- **Etapas puladas** aparecem na 13 sem data de entrada (0 dias, "Aprovado"): medidas novas exigem data de entrada.
- **Etapas duplicadas** (3.646 aplicações, ~3%): mesma passagem com dois `job_stage_id` (duas famílias de etapas da vaga, provavelmente pool + vaga real após transferência). Afeta só medidas de tempo e a linha do tempo. Correção proposta em `docs/23-etapas-duplicadas.dax` (contar cada passagem uma vez) — **em espera** até decidir o tratamento de pool.
- **Datas em UTC**: eventos após 21h caem no dia seguinte (±1 dia vs. Greenhouse).
- **Transferência de Talent Pool**: em 48 aplicações (0,04%) a data de candidatura virou a data da transferência (régua mantida; explicar na Conceitos).
- **Vagas sem cadeira na GE**: ~38% das vagas da Jobs; aparecem como "(Sem organograma)".
- **Aplicações sem esteira** (~75 mil de ~119 mil): Pool 62.535 · vaga 9.361 · vaga fora da Jobs 3.816. **Todas têm persona**: a cadeia especialidade → persona funciona; quebra em **persona → esteira** (esteiras têm "sobrenome", ex.: Atacado - Técnico / Atacado - Comercial, então provavelmente dependem de persona + especialidade). Persona "Geral" tem 16.495 aplicações em pools.
- Vaga **"[TESTE TESTANDO]"** com 5.146 aplicações: avaliar exclusão (e cópias/templates).
- **Pool**: `02_JOBS_GH[position_type] = "Pool"`. No B2C e Engenharia o candidato fica no pool e é **transferido** (mesma aplicação) para a vaga real, onde é contratado. Hoje a 13 só guarda a vaga atual.

## 8. Pendências (ordem sugerida)
1. **Esteira para pools e vagas sem esteira**: rodar as consultas de persona × especialidade × esteira; descobrir onde está o de-para persona → esteira (fonte da verdade: Services); criar `esteira_dash` = esteira ou de-para; decidir esteira da persona "Geral".
2. **Pool**: obter tabela `job_stages` (job_stage_id → job_id) para separar tempo no pool × tempo na vaga, origem "Direto / Via pool", funil do pool por esteira (mostrar imagens antes).
3. Aplicar (ou ajustar) a correção das **etapas duplicadas** e da **linha do tempo**.
4. **SLA mediano baixo** (11 dias geral): investigar data de contratação (closed_at_opening).
5. **Nominal 1.2.0**: bases "Marcadas no período" e "Na agenda" contando entrevistas (imagem antes).
6. Visual "Entrevistas marcadas por quem marcou" (Barras com composição + organizer_name) — falta lugar no fundo.
7. Página Conceitos: incluir Talent Pool, etapas puladas, UTC, pool sem esteira (`tools/gen_conceitos_svg.py` regera o SVG; altura atual 5095).
8. Sugestões de uso da Tabela/Base nominal: escolher colunas, linha do tempo na tabela de Offer, drill do Report para a Nominal, nome do CSV com filtros, lembrar ordenação.
9. Visual de "filtros aplicados" abaixo da barra (imagens antes).

## 9. Arquivos-chave
- `docs/00-medidas-esteiras.md` — todas as medidas originais.
- `docs/18-padronizacao-conceitos.md` / `.dax` — régua nova (aplicada).
- `docs/20-justificativas.md` — registro de "por que não bate".
- `docs/21-roteiro-apresentacao.md` — roteiro de apresentação.
- `docs/22-organograma-e-filtros.md` — organograma, persona/especialidade, período 2.2.
- `backgrounds/` — fundos (Conceitos 1900 × 5095; demais 1900 de largura).
