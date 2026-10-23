# Contexto do projeto · Dash de Esteiras (R&S · XP Inc.)

Documento de referência para retomar o trabalho em qualquer conversa. Cole este arquivo (ou peça para lê-lo) no início de uma sessão nova.
Última atualização: 23/10/2026.

**Índice**
1. [Objetivo do dashboard](#1-objetivo-do-dashboard)
2. [Quem é o usuário e como trabalhar com ele](#2-quem-é-o-usuário-e-como-trabalhar-com-ele)
3. [A régua dos números](#3-a-régua-dos-números)
4. [Dicionário de métricas](#4-dicionário-de-métricas)
5. [Cada página e cada gráfico: o que queremos ver](#5-cada-página-e-cada-gráfico-o-que-queremos-ver)
6. [Filtros](#6-filtros)
7. [Modelo de dados](#7-modelo-de-dados)
8. [Biblioteca de visuais](#8-biblioteca-de-visuais)
9. [Por que um número pode não bater](#9-por-que-um-número-pode-não-bater)
10. [Achados nos dados (homologação)](#10-achados-nos-dados-homologação)
11. [Pendências](#11-pendências)
12. [Arquivos do repositório](#12-arquivos-do-repositório)
13. [DAX final das medidas em uso](#13-dax-final-das-medidas-em-uso)
14. [Valores de referência](#14-valores-de-referência)
15. [Relações do modelo](#15-relações-do-modelo-cardinalidade-e-direção)
16. [Origem das tabelas e colunas calculadas](#16-origem-das-tabelas-e-colunas-calculadas)

---

## 1. Objetivo do dashboard
O dash de Esteiras mostra **como está o processo de recrutamento**: quantas aplicações entram, onde elas avançam, onde se perdem, quanto tempo levam e quem está por trás de cada número.

O foco é o **conceito de esteira de recrutamento**, e não um relatório de contratações. As perguntas que ele responde, uma por página:

| Página | Pergunta | Público e uso |
|---|---|---|
| **Resumo** | A esteira está saudável? | Liderança: visão executiva, big numbers, funil, perdas e SLA |
| **Report** | Onde e com quem está o problema? | Time de R&S e People Analytics: detalhe por etapa, praça, recrutador, motivo e SLA |
| **Nominal** | Quais aplicações estão por trás do número? | Recrutadores e usuários: **conferir** qualquer número do dash nome a nome, com link para o Greenhouse |
| **Conceitos** | O que cada número significa e por que pode não bater? | Todos: dicionário, "de-para" e justificativas |

Princípios:
- **Confiança nos números:** todo número do dash pode ser conferido na Nominal com os mesmos filtros. Ex.: ao filtrar um recrutador, as rejeições dele no Report são as mesmas da Nominal.
- **Nenhum número sem explicação:** toda diferença conhecida tem justificativa clara no próprio dash (página Conceitos → "Por que este número não bate?"; registro em `docs/20-justificativas.md`).
- **Uma régua só** para os números (seção 3), com duas exceções explícitas.

---

## 2. Quem é o usuário e como trabalhar com ele
**Danilo**, People Analytics da XP Inc. Constrói o dash no Power BI Desktop. Fonte: **Greenhouse** (ATS). Dados desde **01/07/2026**, atualização diária às 06:00. O B2C e a Engenharia de Software usam muito **pools** de talentos.

Preferências (seguir sempre):
- **Ver imagens/mockups antes de gerar qualquer `.pbiviz`.**
- **Ir aos poucos:** uma etapa por vez, com conferência no meio.
- Pensar no usuário final: limpar, selecionar todos, boa busca, multisseleção.
- Usar o termo **"aplicações"** (não "candidatos").
- **Sem legendas em degradê.** Visual **clean**, sem poluição.
- Nas tabelas nominais, o **link (Greenhouse) fica sempre na primeira coluna**.
- Números em **pt-BR** (milhar com ponto, decimal com vírgula).
- **Justificar toda diferença** de número no dash.
- O usuário aplica tudo à mão no Power BI Desktop: passar **passo a passo** com cliques, campos, posições (X, Y, largura, altura) e cores.
- Para aplicar várias medidas: arquivo `.dax`/`.txt` com `DEFINE MEASURE … EVALUATE ROW(…)` para colar na **Exibição de consulta DAX** → Executar (confere) → "Atualizar modelo com alterações" (grava). Tabular Editor (`.csx`) existe, mas o usuário prefere a consulta DAX.
- Nunca pedir token ou senha no chat.

---

## 3. A régua dos números
**Regra única:** todo número fala das **aplicações com candidatura no período filtrado** (coorte pela `data_aplicacao`).

Ao filtrar "setembro", o dash olha **as aplicações criadas em setembro** e mostra **a situação de cada uma hoje**, não como estavam em setembro.

| Aplicação | Candidatura | O que aconteceu depois | Onde conta com o filtro "setembro" |
|---|---|---|---|
| A | 05/09 | contratada em 20/10 | **Contratadas** (mesmo com a contratação em outubro) |
| B | 12/09 | rejeitada em 18/09 | **Rejeitadas** |
| C | 25/09 | segue em entrevistas hoje | **Em andamento** |
| D | 20/08 | contratada em 10/09 | **não aparece** em setembro (conta em agosto) |

Consequências:
- **Aplicações = contratadas + rejeitadas + em andamento**, sempre (`Esteira | Check Coorte` ≈ 0).
- Os números de um período **mudam com o tempo**: aplicações de setembro vão saindo de "em andamento" para contratadas ou rejeitadas.
- Num período **recente ou curto**, a conversão parece baixa, o SLA parece curto e "paradas há mais de 45 dias" fica zerado, porque o processo ainda não terminou. Para leitura gerencial, usar períodos com mais de 45 dias ou já fechados.

**As duas exceções** medem a **atividade do time**, pela data em que as coisas aconteceram (e não pela candidatura):
1. **Agenda de entrevistas:** *Entrevistas marcadas* (data de criação) e *Entrevistas na agenda* (data em que acontecem).
2. **Movimentações** no gráfico de Evolução: aprovações e rejeições pela data em que a aplicação saiu da etapa.

Por que não contratados pela data de contratação? Porque misturaria populações: um card falaria de quem entrou em outubro e outro de quem saiu em outubro, e os números nunca fechariam.

---

## 4. Dicionário de métricas

### 4.1 Situação da aplicação
| Conceito | O que significa | Regra técnica |
|---|---|---|
| **Aplicação** | A candidatura de uma pessoa a uma vaga. Uma pessoa pode ter várias. Sempre contamos aplicações únicas | `DISTINCTCOUNT(application_id)`; entra no período pela `data_aplicacao` |
| **Contratada** | Aplicação concluída com contratação | status `hired` no Greenhouse; conta no período da candidatura |
| **Rejeitada** | Aplicação encerrada **pela XP** em alguma etapa | status `rejected`, sem motivo "[Offer]" |
| **Declinou** | Aplicação encerrada **pelo candidato**, que recusou a proposta. É um tipo de rejeição, típico de Pré Offer e Offer | rejeitada com `rejection_reason_name` começando por "[Offer]" |
| **Rejeição × declínio** | Rejeição é decisão da XP; declínio é decisão do candidato. No **Report**, "Rejeitados" soma os dois; na **Nominal** são dois cards separados | |
| **Em andamento** | Aplicação do período que ainda está em processo, parada na etapa mais recente em que entrou | status `in_process`; etapa atual = última entrada (empate no dia: a de maior ordem) |
| **Parada** | Em andamento há mais de **45 dias** na etapa atual | `days_in_stage > 45`; em períodos < 45 dias é sempre zero |

### 4.2 Resultado por etapa (a base da tabela por etapa, funil e perdas)
Para cada etapa por onde a aplicação passou (**com data de entrada**), o resultado é um de três:

| Resultado na etapa | Significado | Regra |
|---|---|---|
| **Rejeitado** | a aplicação foi **encerrada nessa etapa** (pela XP ou o candidato declinou) | `saiu_na_etapa = verdadeiro` |
| **Em andamento** | a aplicação **está nessa etapa agora** | `eh_etapa_ativa` |
| **Aprovado** | passou pela etapa, **não saiu do processo nela** e já foi para a seguinte | todos os outros casos |

Pontos importantes sobre **aprovado**:
- **Aprovado ≠ contratado.** É uma decisão por etapa: a aplicação seguiu adiante no Greenhouse.
- **Uma mesma aplicação conta como aprovada em várias etapas** (aprovada na triagem, na entrevista R&S…). Por isso os aprovados de cada etapa não se somam a um total de aplicações.
- Não é o parecer do entrevistador (scorecard Yes/No): é o **movimento** da aplicação.
- **Etapas puladas** (sem data de entrada, 0 dias, aparecem como "Aprovado" na tabela de origem) **não contam**: a aplicação nunca passou por elas.
- Se o recrutador **volta** a aplicação para uma etapa anterior, a etapa de onde saiu também conta como aprovada (raro).

**Participantes da etapa** = aplicações do período que entraram na etapa = aprovados + rejeitados + em andamento.

### 4.3 Conversão
Só entram casos **já decididos**, para não penalizar quem ainda está em andamento.
| Métrica | Fórmula |
|---|---|
| **Conversão da etapa** | aprovados ÷ (aprovados + rejeitados) na etapa |
| **Conversão da esteira** | contratadas ÷ (contratadas + rejeitadas) |
| **Conversão de entrevista** | aprovadas ÷ (aprovadas + rejeitadas), só entrevistas já realizadas, pela etapa da entrevista |
| **Aplicações por contratação** | aplicações ÷ contratadas (ex.: 25 = a cada 25 aplicações, 1 contratação) |
| **No recrutador, por contratação** | aplicações que chegaram à "Etapa com Recrutamento" (ou além) ÷ contratadas |

### 4.4 Tempo
| Métrica | O que é |
|---|---|
| **SLA da esteira** | Mediana de dias entre a candidatura e a contratação, das contratadas do período. **Meta: 45 dias** |
| **SLA da etapa** | Dias entre a entrada e a saída da etapa, em **dias inteiros**. Só etapas concluídas. Etapas resolvidas no mesmo dia (automáticas) ficam com 0 |
| **Típico (mediana)** | Metade das aplicações sai da etapa em até X dias |
| **P90 ("90% saem até")** | 9 de cada 10 aplicações saem da etapa em até Y dias. É o **SLA realista** da etapa. **O P90 é sempre ≥ o típico**: para cobrir 90% é preciso esperar mais dias que para cobrir 50% |
| **Média × mediana** | A mediana é o caso típico; média bem acima da mediana indica poucos casos muito demorados |
| **Base (SLA por etapa)** | Número de passagens pela etapa que **já saíram dela**, entre as aplicações do período. Quem ainda está na etapa não entra |
| **Acima hoje** | Aplicações **em andamento** nessa etapa há mais dias que o P90 da etapa: a lista de ação do momento |
| **Mês atual × anterior** | Compara o mês corrente até hoje com os mesmos dias do mês anterior (ex.: 01–19/10 × 01–19/09) |
| **YTD** | Acumulado do ano até hoje; começa em 01/07/2026 |

### 4.5 Entrevistas (exceção: atividade do time)
Contam **entrevistas** (`scheduled_interview_id`), não aplicações. Uma pessoa com 3 entrevistas conta 3. O status `to_be_scheduled` **não** entra (ainda não foi marcada). Status existentes: scheduled, awaiting feedback, complete, to be scheduled.
| Métrica | O que é | Data |
|---|---|---|
| **Entrevistas marcadas** | Entrevistas que o time colocou na agenda no período: mede a produtividade de quem agenda | `created_at` |
| **Entrevistas na agenda** | Entrevistas que acontecem no período: **já realizadas** (início antes de agora) + **a realizar** | `start_at` |
| **Quem marcou** | Organizador da entrevista | `organizer_name` |
| **Etapa da entrevista** | Etapa em que a aplicação estava quando a entrevista aconteceu | última etapa com entrada antes do início |

Uma entrevista marcada em setembro para outubro conta em setembro em "marcadas" e em outubro em "na agenda".

### 4.6 Movimentações (exceção: atividade do time)
Cada aprovação ou rejeição em cada etapa, no dia em que aconteceu. Uma aplicação aprovada em 5 etapas conta 5 vezes, uma em cada dia. Só existe no gráfico de Evolução (medidas `Aprovados por Data` e `Rejeitados por Data`).

### 4.7 Indicação
- **Regra 1 (Applications):** `source_public_name = "Referral"` **e** `credited_to_id` preenchido → "Pela aplicação".
- **Regra 2 (Candidates), se a 1ª não vale:** `referred_by` preenchido → "Pelo candidato". Vale para **todas** as aplicações do candidato (decisão de negócio).
- Botão **Todas | Só indicações** filtra o dash inteiro.

### 4.8 Pool e organograma
- **Pool:** vaga com `02_JOBS_GH[position_type] = "Pool"`. No B2C e na Engenharia, o candidato fica um tempo no pool e é **transferido** (mesma aplicação) para uma vaga pontual, onde é contratado. Quase ninguém é contratado dentro do pool.
- **Organograma (N):** N2 responde ao CEO, N3 ao N2, e assim por diante. Cada vaga tem uma cadeira na Gestão de Estruturas. Escolher um nome inclui toda a estrutura abaixo dele.

---

## 5. Cada página e cada gráfico: o que queremos ver

### 5.1 Resumo · "A esteira está saudável?"
| Visual | O que queremos ver | Campos principais |
|---|---|---|
| **6 cards de KPI** | Aplicações, Contratadas, Em andamento, Conversão da esteira, SLA mediano e Entrevistas marcadas, cada um com comparação com os mesmos dias do mês anterior e acumulado desde julho. O de Entrevistas traz no contexto a outra visão: "X acontecem no período: Y realizadas, Z a realizar" | `Esteira \| Candidatos`, `Contratados`, `Ativos Agora`, `Conversão Esteira %`, `SLA da Esteira (Mediana)`, `Entrevistas Marcadas` + trio mês atual/anterior/YTD |
| **Funil "Quantas aplicações precisamos para contratar"** | Quantas aplicações do período chegaram até cada etapa (ou além) e o % sobre o total; ao lado, aplicações por contratação e "no recrutador, por contratação" | `dFunil[passo]`, `Funil Aplicações`, base `Candidatos` |
| **"Onde a esteira perde aplicações"** (barras com composição) | Por etapa, em ordem de processo: aprovados, rejeitados e em andamento, com a conversão da etapa e a etapa de maior perda em destaque | `dEtapa[stage_name]`, `Aprovados/Rejeitados/Em Andamento`, `Conversão Geral %` |
| **Destaques do período** | O que merece atenção agora: maior perda, paradas há mais de 45 dias, conversão, SLA e entrevistas | 5 medidas `Esteira \| Destaque …` (texto "N \|\| título \|\| texto \|\| status") |
| **Consumo do SLA por etapa** | A mediana do SLA repartida pelo tempo em cada etapa das contratações, contra a meta de 45 dias | `Dias na Etapa (Contratações)`, `SLA (sem etapa)` |
| **Onde estão as aplicações em andamento** | Aplicações do período ainda em processo, por etapa atual; âmbar = paradas há mais de 45 dias | `Ativos Até 45 Dias`, `Ativos Acima de 45 Dias`, `% Parados` |

### 5.2 Report · "Onde e com quem está o problema?"
| Visual | O que queremos ver | Campos principais |
|---|---|---|
| **Evolução da esteira** | Atividade do time ao longo do tempo (dia, semana, mês, trimestre ou ano). Série **Movimentações**: aprovações × rejeições por data do evento, com a taxa de aprovação nas etapas. Série **Agenda**: entrevistas marcadas × na agenda, inclusive futuras (tracejadas) | `Aprovados por Data`, `Rejeitados por Data`, `Entrevistas Marcadas`, `Entrevistas na Agenda` |
| **Entradas e aprovações por etapa** | Para cada etapa, em ordem de processo: participantes, aprovados, rejeitados, em andamento, conversão (selo verde/âmbar/coral) e SLA média e mediana; alerta ▲ quando a média passa de 2× a mediana | `Participantes`, `Aprovados`, `Rejeitados`, `Em Andamento`, `Dias na Etapa (Média/Mediana)` |
| **Aplicações em andamento por etapa** | Matriz etapa × faixas de dias parado, para ver onde as aplicações envelhecem; contorno acima de 45 dias | `dFaixaDias[faixa]`, `Ativos na Faixa` |
| **Rejeitados por etapa** | Onde a esteira encerra aplicações; na Offer, destaque para quem **declinou**; ranking Pareto (quais etapas somam 80% das rejeições) | `Rejeitados (Empresa)`, `Declinados (Offer)` |
| **SLA por etapa: típico e 90%** | **Típico** (mediana) e **90% saem até** (P90) por etapa; **Base** (passagens já concluídas) e **Acima hoje** (em andamento além do P90). Mostra etapas lentas, imprevisíveis (típico baixo e P90 alto) e onde agir hoje | `Dias na Etapa (Mediana/P90)`, `Base SLA`, `Acima do P90 Hoje` |
| **Motivos de saída por etapa** | Escolhendo uma etapa, os motivos de rejeição mais frequentes (Top 5, 8, 10 ou Todos), com quantidade e % da etapa; motivos "[Offer]" em destaque | `dEtapa[stage_name]`, `rejection_reason_name`, `Rejeitados` |
| **Aprovados por praça em cada etapa** | Taxa de aprovação por praça, comparada à média de cada etapa por grupo de etapas: verde acima, coral abaixo, cinza na média | matriz praça × `dEtapa[grupo]`, `Aprovados` e `Rejeitados` (base da taxa) |
| **Aprovados por recrutador** | Volume, conversão e SLA por responsável | `Candidatos`, `Contratados`, `Rejeitados no Processo`, `Aplicações Ativas`, `SLA da Esteira (Mediana)` |
| **Aplicações em Pré Offer e Offer** | A reta final: quem está em Pré Offer e Offer, ordenado por dias na etapa (âmbar > 30, coral > 45) | `Dias na Etapa Atual`, filtro `dEtapa` = Pré Offer e Offer |

### 5.3 Nominal · "Quais aplicações estão por trás do número?"
Visual **Base nominal**: 6 cards clicáveis, cada um é uma **lista** de aplicações com link para o Greenhouse, busca, exportar CSV e linha do tempo por aplicação (etapas com datas, dias e resultado; as próximas, em cinza, "não chegou").

| Card | Regra | Confere com |
|---|---|---|
| **Em andamento** | aplicações do período que seguem em processo | card Em andamento (Resumo) |
| **Entrevistas agendadas** | aplicações com entrevista na agenda do período (conta aplicações, não entrevistas, até a versão 1.2.0) | Resumo, com diferença conhecida |
| **Contratadas** | candidatura no período, status hired | card Contratadas |
| **Rejeitadas** | rejeitadas **pela XP** | Report "Rejeitados" = Rejeitadas + Declinaram |
| **Declinaram** | recusaram a offer | Report "Declinaram a offer" |
| **Todas** | todas as aplicações do período | card Aplicações |

Teste de confiança: filtrar um recrutador e comparar Aplicações, Contratados, Rejeitados e Andamento entre o Report e a Nominal (já validado, recrutador por recrutador).

### 5.4 Conceitos
Cobertura, fonte e atualização; descrição das páginas; **a regra e as duas exceções**; dicionário; "Como conferir um número na Nominal" (de-para); **"Por que este número não bate?"** (13 perguntas e respostas); limitações conhecidas. Fundo: 1900 × 5095.

---

## 6. Filtros
Barra única (Y 225), com sincronização entre as páginas: **Período · Organograma (N) · Esteira · BK · Recrutador · Sourcer · Persona · Especialidade · Etapa · Praça**, mais o botão **Todas | Só indicações** no topo (X 1000 · Y 40) e o selo "Só indicações" ao lado do título.

| Filtro | Visual | Posição (X · largura) |
|---|---|---|
| Período | XP · Período 2.2 | 316 · 200 |
| Organograma (N) | XP · Organograma 1.0 (altura 440) | 526 · 270 |
| Esteira, BK, Sourcer, Persona, Etapa, Praça | XP · Segmentação | 806 / 934 / 1200 / 1328 / 1606 / 1734 · 118 |
| Recrutador | XP · Segmentação | 1062 · 128 |
| Especialidade | XP · Segmentação | 1456 · 140 |

- O **Período** tem atalhos (mês atual/anterior, **trimestre atual e anterior**, últimos 30 dias, desde 01/jul), digitação De/Até e a caixa mostra "T3 2026 · 01/07 – 30/09" quando o intervalo é um trimestre.
- Cada lista abre **dentro da própria largura**: visuais da barra não podem se sobrepor.
- Persona e Especialidade são colunas da tabela 13.

---

## 7. Modelo de dados

### 7.1 Tabelas
| Tabela | Grão | Observações |
|---|---|---|
| `13_ETAPA_RECRUTAMENTO` | aplicação × etapa | **Base de todas as medidas.** application_id (texto), job_id, job_stage_id, job_name, candidate_id, stage_name, data_entrada_stage, data_saida_stage, days_in_stage, status (hired/rejected/in_process), rejection_reason_name, data_aplicacao, rejected_at, recruiter_name, esteira, persona, especialidade, link_application… |
| `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS` | entrevista | scheduled_interview_id, application_id, status, start_at, end_at, created_at, interview_name, organizer_name, interviewers |
| `03_APPLICATIONS_GH` | aplicação | Gold: source_public_name, credited_to_id, credited_to_name, candidate_id, job_id, status |
| `04_CANDIDATES_GH` | candidato | referred_by |
| `02_JOBS_GH` | vaga | job_id, position_type, chave_bk_data_ref |
| `12_GE` | cadeira (Gestão de Estruturas) | N2_email, N3_email… ligada à Jobs por chave_bk_data_ref |
| `_dCALENDARIO` | data | **sem relação com a 13**: as medidas usam `MIN/MAX('_dCALENDARIO'[Data])` |
| `_Medidas` | — | todas as medidas `Esteira \| …` (pastas `98. ESTEIRAS\…`) |

### 7.2 Colunas calculadas
- **13:** `eh_etapa_ativa`, `resultado_etapa` (Rejeitado / Em andamento / Aprovado), `data_contratacao` (= closed_at_opening se hired), `sla_esteira_dias`, `ordem_etapa`, `indicacao`.
- **03:** `indicacao` ("Pela aplicação" / "Pelo candidato" / "Sem indicação").
- **14:** `etapa_entrevista`, `resultado_entrevista`.

### 7.3 Tabelas de apoio
`dEtapa` (ordem e grupo das etapas) · `dFunil` (etapas + "Contratadas", sem relação) · `dFaixaDias` · `dEsteiraEtapa` · `dFiltroIndicacao` (botão; muitos-para-muitos com 13[indicacao], filtro único) · `dOrganograma` (uma linha por vaga: job_id, tipo_vaga, eh_pool, N2…N7 via `RELATED('12_GE')` com `"-"` nos vazios; relação 13[job_id] muitos → 1 dOrganograma, única, ativa).

### 7.4 Cuidados com as relações
- A 13 é **isolada**: só `dEtapa`, `dFiltroIndicacao` e `dOrganograma` a filtram.
- **Nunca ativar 13 → 03 nem 13 → 02_JOBS_GH**: a Jobs se liga ao calendário pela data de fechamento da vaga, e o período passaria a filtrar a 13 por essa data, mudando a régua de todas as medidas.
- Todo filtro da barra precisa usar colunas da 13 ou de tabela ligada a ela, senão não afeta os números.

---

## 8. Biblioteca de visuais
Código em `visuals/`, pacotes em `dist/`, guias em `docs/`. Build: `cd visuals/<visual> && npm install && npx pbiviz package` (pbiviz tools 7.2.1, API 5.11.1).

| Visual | Versão | Onde usa | Notas |
|---|---|---|---|
| Card de KPI | 1.2.1 | Resumo | comparação, YTD, meta, texto de contexto, selo de período |
| Funil | 1.2.0 | Resumo | |
| Barras com composição | 1.1.0 | Resumo e Report | resumo, parte em destaque, Pareto |
| Lista de destaques | 1.0.0 | Resumo | |
| Consumo da meta | 1.1.0 | Resumo | |
| Segmentação | 2.2.0 | barra de filtros | lista suspensa, janela ou lista aberta |
| Período | 2.2.0 | barra de filtros | trimestre atual/anterior |
| Evolução | 1.0.0 | Report | |
| Tabela por etapa | 1.1.0 | Report | etapas e recrutador |
| Matriz de calor | 1.2.0 | Report | andamento × faixa; praça × grupo |
| Tabela de SLA | 1.0.0 | Report | típico, P90, base, acima hoje |
| Etapa e motivos | 1.0.0 | Report | Top 5/8/10/Todos |
| Tabela nominal | 1.1.0 | Report (Pré Offer e Offer) | até 30 colunas, "Mostrar mais", exportar CSV; campo Dias = **medida** `Dias na Etapa Atual` |
| Base nominal | 1.1.0 | Nominal | campo "No período" = `Nominal No Período`; filtro do visual `Nominal Na Base` = 1 |
| Organograma | 1.0.0 | barra de filtros | árvore N2→N3→…; Níveis = `dOrganograma[N2…N7]` |

Detalhes técnicos: o nome do card de settings não pode ser `cards` (conflita com `Model.cards`); o `valueFormatter` cai em en-US, então números usam `Intl` pt-BR; exportação exige o privilégio `ExportContent` e "downloads de visuais personalizados" liberado no tenant; testes eram feitos extraindo js/css do `.pbiviz` e simulando o host no Chromium.

---

## 9. Por que um número pode não bater
Registro completo em `docs/20-justificativas.md` (também na página Conceitos).

| O que parece errado | Por quê |
|---|---|
| Período recente: conversão baixa, SLA curto, 0 paradas | as aplicações ainda não terminaram o processo |
| Entrevistas: Resumo > Nominal | o Resumo conta entrevistas, a Nominal (1.1) conta aplicações com entrevista |
| Marcadas ≠ Na agenda | uma usa a data de criação, a outra a data da entrevista |
| Evolução maior que os cards | a Evolução conta eventos (movimentações), os cards contam aplicações |
| 1ª etapa da tabela < Aplicações | nem toda aplicação passa pela 1ª etapa |
| Soma dos recrutadores < total | aplicações de vagas sem recrutador |
| "Rejeitados" (Report) > "Rejeitadas" (Nominal) | no Report soma rejeitadas pela XP + declinaram |
| SLA da etapa 0,0 d | dias inteiros; etapa resolvida no mesmo dia |
| Contratação de julho não aparece | dados começam em 01/07/2026 |
| Pessoa indicada em vaga para a qual não foi indicada | a regra 2 (Referred By) é do candidato |
| "(Sem organograma)" no filtro de N | a vaga não tem cadeira na Gestão de Estruturas (~38% das vagas) |
| Nominal "Todas" ≠ soma das listas | a lista inclui aplicações de antes do período com entrevista no período |
| Diferença de 1 dia vs. Greenhouse | datas da 13 em UTC; eventos após 21h caem no dia seguinte |

---

## 10. Achados nos dados (homologação)
- **Etapas puladas** aparecem na 13 sem data de entrada (0 dias, "Aprovado"): as medidas novas exigem data de entrada.
- **Etapas duplicadas** (3.646 aplicações, ~3%): a mesma passagem aparece com dois `job_stage_id` (duas versões das etapas da vaga, provavelmente pool + vaga real). Afeta só medidas de tempo, a Base do SLA e a linha do tempo. Correção proposta em `docs/23-etapas-duplicadas.dax`, **em espera** até decidir o tratamento de pool.
- **Transferência de pool**: a aplicação mantém o `application_id` e muda de vaga; a 13 guarda só a vaga atual. Em 48 aplicações (0,04%) a `data_aplicacao` virou a data da transferência (régua mantida).
- **Aplicações sem esteira** (~75 mil de ~119 mil): Pool 62.535 · vaga 9.361 · vaga fora da Jobs 3.816. **Todas têm persona**: especialidade → persona funciona; quebra em **persona → esteira** (as esteiras têm "sobrenome", ex.: Atacado - Técnico, e parecem depender de persona + especialidade). A persona "Geral" concentra 16.495 aplicações em pools. Ao filtrar uma esteira, só ~37% das aplicações aparecem.
- Vaga **"[TESTE TESTANDO]"** com 5.146 aplicações; também há "Cópia de…" e "[Template…]": avaliar exclusão.
- **SLA mediano baixo** (11 dias no geral): ainda sem causa confirmada. A data de contratação correta é `closed_at_opening`: conferir se o modelo usa essa coluna e, depois, reavaliar o número.
- 422 aplicações não aparecem no primeiro passo do funil (`Esteira | Check Funil`).

---

## 11. Pendências (ordem sugerida)

### 11.1 Pendências do modelo (a fazer pelo Danilo)
| # | O que fazer | Por quê |
|---|---|---|
| 1 | ~~Capturar os valores de setembro/2026~~ **feito em 23/10/2026** (seção 14). Repetir a captura em outros meses, sempre anotando a data | os números da coorte mudam com o tempo |
| 2 | **Conferir `data_contratacao` na 13**: deve usar `closed_at_opening` (não `resolved_at`); depois reavaliar o **SLA mediano baixo** (11 d) | principal suspeita do SLA baixo |
| 3 | **Rodar `docs/24-medidas-finais.dax`** (F5) e só então gravar | o arquivo ainda não foi executado no Power BI |
| 4 | **Esteira dos pools e das vagas sem esteira**: localizar o de-para **persona → esteira** (Services é a fonte da verdade; tabela no banco ou regra na engenharia?); definir a esteira da persona "Geral"; criar `esteira_dash` = esteira da vaga ou o de-para | sem isso, ao filtrar uma esteira só ~37% das aplicações aparecem (75 mil sem esteira: 62.535 em pool, 9.361 em vaga, 3.816 fora da Jobs) |
| 5 | **Obter `job_stages`** (`job_stage_id` → `job_id`) | separar tempo no pool × na vaga, origem "Direto / Via pool" e funil do pool por esteira |
| 6 | **Decidir sobre vagas de teste/cópia/template** ("[TESTE TESTANDO]" com 5.146 aplicações; "Cópia de…"; "[Template…]") | excluir do dash inteiro, se confirmado |
| 7 | **Perguntar à engenharia a origem da tabela 13** e as **etapas duplicadas** (3% das aplicações; exemplo: aplicação 281242063002) | origem não documentada; duplicidade afeta tempo e linha do tempo |
| 8 | **Relação `dFiltroIndicacao → 13`**: deixar a direção **Única** | na captura parecia nos dois sentidos |
| 9 | **Apagar as medidas antigas** e a tabela `dBase` (lista no item 10 de 11.2), depois de rodar a consulta de dependências | limpeza |
| 10 | **Trocar o fundo da Conceitos** (1900 × 5095) e conferir os fundos de Resumo e Report | os subtítulos antigos ainda dizem "no período" sem a régua nova |
| 11 | Investigar a diferença **119.397 × 117.477** (`application_id` distintos na 13 × aplicações com `data_aplicacao`) | não explicada |

**Concluído:** instalação dos visuais novos (Período 2.2, Tabela nominal 1.1, Organograma 1.0, Base nominal 1.1); token do GitHub apagado; repositório publicado em `DaniloHonda/Visuais_PBI` (privado).

### 11.2 Pendências de desenvolvimento (Claude)
1. ~~Preencher a tabela de setembro~~ (feito). Atualizar a seção 14 quando houver novas capturas.
2. **Pool**: com `job_stages`, criar tempo no pool × na vaga, origem "Direto / Via pool" e funil do pool por esteira (**mostrar imagens antes**).
3. Aplicar a correção das **etapas duplicadas** (`docs/23`) e da **linha do tempo** da Nominal, depois da decisão sobre o pool.
4. **Nominal 1.2.0:** bases "Marcadas no período" e "Na agenda" contando entrevistas, com Organizer Name e Interviewers (imagem antes).
5. Visual "Entrevistas marcadas por quem marcou" (Barras com composição + `organizer_name`); falta lugar no fundo.
6. Página Conceitos: incluir Talent Pool, etapas puladas, UTC e pool sem esteira (`tools/gen_conceitos_svg.py` regera o SVG).
7. Sugestões de uso das tabelas nominais: escolher colunas na tela, linha do tempo na tabela de Offer, drill do Report para a Nominal, CSV com nome descritivo, lembrar a ordenação.
8. Visual de **filtros aplicados** abaixo da barra (imagens antes) e botões de navegação para a Nominal (sem ação por enquanto).
9. Aviso discreto nos cards quando o período tem menos de 45 dias.
10. Apagar as medidas antigas: `Entrevistas Criadas`, `Entrevistas Agendadas` (+ trio mês/YTD), `Contratados por Data`, `Nominal Próxima Entrevista`, `Período Hoje`, `Contagem da Base`, `Mostrar na Base`, tabela `dBase`.

---

## 12. Arquivos do repositório
| Caminho | Conteúdo |
|---|---|
| `README.md` | lista dos visuais e como gerar o `.pbiviz` |
| `docs/00-medidas-esteiras.md` | todas as medidas originais |
| `docs/01` a `17` | guia de cada visual, com campos, posições e formatação |
| `docs/18-padronizacao-conceitos.md`, `18-padronizacao.dax` | a régua nova e as medidas (já aplicadas) |
| `docs/19-botao-indicacao.md` | botão Todas \| Só indicações |
| `docs/20-justificativas.md` | registro de "por que não bate" |
| `docs/21-roteiro-apresentacao.md` | roteiro de apresentação (20 min) |
| `docs/22-organograma-e-filtros.md` | organograma, persona/especialidade e período 2.2 |
| `docs/23-etapas-duplicadas.dax` | correção das etapas duplicadas (em espera) |
| `docs/24-medidas-finais.dax` (+ `.csx` para o Tabular Editor) | **todas as medidas em uso**, num arquivo só (104 medidas) |
| `docs/25-valores-referencia.dax` | consulta que devolve os números de referência de um período |
| `backgrounds/` | fundos SVG: Conceitos (1900 × 5095), Resumo, Report e Nominal |
| `tools/` | `gen_conceitos.py` (medidas da régua nova), `gen_conceitos_svg.py` (página Conceitos), `build_medidas_finais.py` (gera o `24-medidas-finais.dax` a partir dos guias) |
| `dist/` | pacotes `.pbiviz` prontos |
| `visuals/` | código-fonte |

---

## 13. DAX final das medidas em uso
**Arquivo único: [`docs/24-medidas-finais.dax`](docs/24-medidas-finais.dax)** (104 medidas `Esteira | …`, tabela `_Medidas`).
- Formato `DEFINE MEASURE … EVALUATE`: colar na **Exibição de consulta DAX** → Executar → "Atualizar modelo com alterações" (cria ou substitui).
- Consolidado por `tools/build_medidas_finais.py`: vale a **última definição** dos guias 00 a 17, sobrescrita pela régua nova (guia 18) e pelo botão de indicação (guia 19). Parênteses e colchetes foram conferidos por script; **o arquivo inteiro ainda não foi executado no Power BI**: rodar e conferir antes de gravar.
- **Fora do arquivo, de propósito:** (a) medidas aposentadas (`Entrevistas Criadas`, `Entrevistas Agendadas` e trio mês/YTD, `Contratados por Data`, `Nominal Próxima Entrevista`, `Período Hoje`, `Contagem da Base`, `Mostrar na Base`); (b) a correção das etapas duplicadas (`docs/23`, em espera); (c) `Esteira | Data Referência` (placeholder: o modelo não tem a tabela de última atualização; as medidas de comparação usam `TODAY()`).
- Pastas de exibição: `01` volume · `02` conversão e funil · `03` entrevistas · `04` tempo e SLA · `05` evolução · `06` comparações · `07` textos e destaques · `08` nominal · `99` validação (todas sob `98. ESTEIRAS\`).
- Medidas de conferência: `Check Coorte` (aplicações − contratadas − rejeitadas − em andamento ≈ 0), `Check Funil`, `Check Agenda` (= 0), `Check Fechamento`.
- Medidas de **evolução** (`Aprovados por Data`, `Rejeitados por Data`) ficam: usam a data do evento, não a coorte.

---

## 14. Valores de referência
Os números da coorte **mudam com o tempo** (aplicações em andamento viram contratadas ou rejeitadas). Sempre anotar a **data da captura**. Consulta para capturar qualquer período: [`docs/25-valores-referencia.dax`](docs/25-valores-referencia.dax).

### Setembro/2026 (candidatura de 01/09 a 30/09) — capturado em 23/10/2026
Capturado com `docs/25-valores-referencia.dax`, depois de aplicar a régua nova. Os números de setembro ainda **vão mudar** (as 16.534 em andamento viram contratadas ou rejeitadas).

| Métrica | Valor (23/10/2026) |
|---|---|
| Aplicações | **33.756** |
| Contratadas | **172** |
| Rejeitadas (total) | **17.050** (das quais **26** declinaram) |
| Em andamento | **16.534** (paradas há mais de 45 dias: **8**) |
| Conversão da esteira | **1,0%** (172 ÷ (172 + 17.050)) |
| SLA mediano | **12 dias** |
| Check coorte | **0** (172 + 17.050 + 16.534 = 33.756) |
| Entrevistas marcadas em setembro | 2.386 |
| Entrevistas na agenda em setembro | 2.380 (2.380 realizadas, 0 a realizar) |

Leitura: quase metade da coorte de setembro (49%) ainda está em processo, e só 1% foi contratada; por isso a conversão é baixa e o SLA mostra só as contratações rápidas (a janela de observação vai de 23 a 52 dias). Em setembro, "a realizar" é 0 porque o mês já passou.

### Valores já observados no modelo (conferidos nas capturas de tela)
| Recorte | Aplicações | Contratadas | Rejeitadas | Em andamento | Conversão | SLA mediano | Captura |
|---|---|---|---|---|---|---|---|
| **Desde 01/07/2026** (sem filtro de período) | 117.477 | 603 | 65.002 | 51.872 | 0,9% | 11 d | ~19/10/2026, após aplicar a régua nova |
| **01/10 a 19/10/2026** | 12.260 | 39 | 3.346 | 8.875 | 1,2% (39 de 3.385 decididos) | 4 d | ~19/10/2026 |

Outros valores de conferência:
- Sem filtro de período: Check Coorte = 0; Check Funil = 422; entrevistas marcadas = na agenda = 7.857 (7.743 realizadas + 114 a realizar; Check Agenda = 0).
- Outubro (01–19): entrevistas marcadas 1.106; 1.328 acontecem no período; aplicações por contratação 314; Declinaram 0; "paradas há mais de 45 dias" 0 (esperado: o período tem 19 dias).
- Dos 12.260 de outubro, a Nominal "Todas" mostrava 12.820 antes de preencher o campo "No período" (efeito das aplicações de antes do período com entrevista no período).
- Validação por recrutador: Rejeitadas + Declinaram (Nominal) = Rejeitados (Report) e Contratadas (Nominal) = Contratados (Report), linha a linha. Sem recrutador: 8.979 rejeitadas e 45 contratadas.
- Por tipo de vaga (aplicações): Pool 62.547 (62.535 sem esteira) · vaga 53.034 (9.369 sem esteira) · vaga fora da Jobs 3.816 = 119.397 `application_id` distintos na 13. Os 117.477 de "Aplicações" são os que têm `data_aplicacao` (a diferença não foi investigada).
- Os valores de outubro são de período recente: conversão e SLA baixos são esperados (o processo não terminou).

---

## 15. Relações do modelo (cardinalidade e direção)
Reconstruído das capturas da tela "Gerenciar relações" e das relações criadas nesta conversa. `*` = muitos, `1` = um. Direção: **Única** = filtra do lado 1 para o lado `*`; **Ambas** = filtra nos dois sentidos.

### Ativas
| De (lado `*`) | Para (lado `1`) | Card. | Direção | Observação |
|---|---|---|---|---|
| `13_ETAPA_RECRUTAMENTO[stage_name]` | `dEtapa[stage_name]` | *:1 | Única | única ligação da 13 com etapas |
| `13_ETAPA_RECRUTAMENTO[job_id]` | `dOrganograma[job_id]` | *:1 | Única | criada nesta conversa; conferida na tela |
| `dFiltroIndicacao[indicacao]` | `13_ETAPA_RECRUTAMENTO[indicacao]` | *:* | **Única recomendada** (dFiltroIndicacao → 13) | na captura o ícone aparece nos dois sentidos: **conferir e deixar única** |
| `02_JOBS_GH[chave_bk_data_ref]` | `12_GE[chave_bk_data_ref]` | *:1 | Ambas | vaga → cadeira (base do organograma) |
| `02_JOBS_GH[closed_at_join]` | `_dCALENDARIO[Data]` | *:1 | Única | calendário filtra a vaga pela data de fechamento |
| `03_APPLICATIONS_GH[job_id]` | `02_JOBS_GH[job_id]` | *:1 | Ambas | |
| `03_APPLICATIONS_GH[candidate_id]` | `04_CANDIDATES_GH[candidate_id]` | *:1 | Ambas | |
| `03_APPLICATIONS_GH[org_ch…]` | `01_ORG[chave_data_ref_key]` | *:1 | Ambas | |
| `05_OFFERS_GH[application_id]` | `03_APPLICATIONS_GH[application_id]` | *:1 | Ambas | |

### Inativas (existem, mas **não** devem ser ativadas)
| De | Para | Por que não ativar |
|---|---|---|
| `13_ETAPA_RECRUTAMENTO[application_id]` | `03_APPLICATIONS_GH[application_id]` | ligaria a 13 à Jobs e ao calendário por data de fechamento: o período passaria a filtrar a 13 por essa data e **todas as medidas mudariam de régua** |
| `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS[application_id]` | `03_APPLICATIONS_GH[application_id]` | as medidas de entrevista usam `TREATAS` sobre a lista de aplicações da 13 |
| várias datas → `_dCALENDARIO[Data]` | `01_ORG[Data_Referência, primeira_entrada]`, `02_JOBS_GH[closed_at_opening, opened_at_join, opened_at_open, data_envio_previ…, data_fechament…]`, `03_APPLICATIONS_GH[resolved_at, starts_at]`, `05_OFFERS_GH[resolved_at, starts_at]` | só uma relação com o calendário pode ser ativa |
| `01_ORG[greenhouse_applicat…]` | `03_APPLICATIONS_GH[applica…]` | |
| `05_OFFERS_GH[candidate_id]` | `04_CANDIDATES_GH[candidate_id]` | |

### Sem relação (uso por `TREATAS`, `LOOKUPVALUE` ou independente)
`_dCALENDARIO` ↔ 13 (as medidas usam `MIN/MAX` da data) · `dFunil` · `dFaixaDias` · `dEsteiraEtapa` · `_Medidas`.

### Regras de ouro
1. A 13 só é filtrada por `dEtapa`, `dFiltroIndicacao` e `dOrganograma`. Todo filtro da barra precisa vir da 13 ou de tabela ligada a ela.
2. Nunca ativar 13 → 03 nem 13 → 02_JOBS_GH. Nunca ligar `dOrganograma` à Jobs em "Ambos".
3. `application_id` e `job_id` são **texto** na 13 (usar aspas nas consultas; os dois lados de uma relação precisam do mesmo tipo).

---

## 16. Origem das tabelas e colunas calculadas

### 16.1 Origem das tabelas
| Tabela | Origem | Observações |
|---|---|---|
| `03_APPLICATIONS_GH` | Greenhouse, camada **Gold** | já traz `credited_to_id` e `credited_to_name` (a **Silver** é a usada no código do programa de indicação) |
| `04_CANDIDATES_GH` | Greenhouse | `referred_by` preenchido = indicação confirmada |
| `02_JOBS_GH` | Greenhouse | `position_type`; `especialidade` vem do **Services (fonte da verdade)** |
| `05_OFFERS_GH` | Greenhouse | ofertas, por `application_id` |
| `12_GE` | Gestão de Estruturas (cadeiras da empresa) | colunas `N1…Nn` e `N2_email…`; ligada à Jobs por `chave_bk_data_ref`; nem toda vaga tem cadeira |
| `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS` | Greenhouse (agendamentos) | filtrada no Power Query para `created_at` ou `start_at` ≥ 01/07/2026; "Número Participação" é coluna de organização da engenharia |
| `13_ETAPA_RECRUTAMENTO` | **construída pela engenharia** a partir do histórico de etapas | **a origem exata não está documentada nesta conversa** (perguntar à engenharia); traz `esteira`, `persona`, `especialidade`, `link_application`, `status`, `days_in_stage` já prontos |
| `01_ORG` | tabela de organização com chaves de data de referência | ligada ao modelo, mas **não usada pelas medidas do dash** |
| `_dCALENDARIO` | tabela de datas do modelo | |
| `dEtapa`, `dFunil`, `dFaixaDias`, `dFiltroIndicacao`, `dEsteiraEtapa`, `dOrganograma` | **tabelas DAX** do modelo | DAX abaixo |

**Cadeia de classificação das vagas:** `especialidade` (Jobs, vinda do Services) → **persona** (de-para de especialidades) → **esteira** (definida pela persona). O de-para persona → esteira ainda não foi localizado (pendência 1).
**Regra dos pools:** `02_JOBS_GH[position_type] = "Pool"`.

### 16.2 Colunas calculadas
**`13_ETAPA_RECRUTAMENTO`**
```DAX
eh_etapa_ativa =   -- em processo, na última etapa em que entrou (empate no dia: maior ordem)
VAR UltimaEntrada = CALCULATE( MAX([data_entrada_stage]), ALLEXCEPT('13_ETAPA_RECRUTAMENTO', [application_id]) )
VAR MaiorOrdemNoDia = CALCULATE( MAX([sort_order]), ALLEXCEPT('13_ETAPA_RECRUTAMENTO', [application_id]), [data_entrada_stage] = UltimaEntrada )
RETURN [status] = "in_process" && [data_entrada_stage] = UltimaEntrada && [sort_order] = MaiorOrdemNoDia

resultado_etapa = SWITCH( TRUE(), [saiu_na_etapa] = TRUE(), "Rejeitado", [eh_etapa_ativa], "Em andamento", "Aprovado" )

data_contratacao = IF( [status] = "hired", [closed_at_opening] )        -- ver ressalva abaixo
sla_esteira_dias = IF( NOT ISBLANK([data_contratacao]), ([data_contratacao] - [data_aplicacao]) * 1.0 )
ordem_etapa      = LOOKUPVALUE( dEtapa[ordem], dEtapa[stage_name], [stage_name] )
indicacao        = VAR R = LOOKUPVALUE( '03_APPLICATIONS_GH'[indicacao], '03_APPLICATIONS_GH'[application_id], [application_id] )
                   RETURN IF( R IN { "Pela aplicação", "Pelo candidato" }, "Indicação", "Sem indicação" )
```
**Decisão (SLA):** a data de contratação é **`closed_at_opening`** (fechamento da opening da vaga), e **não** `resolved_at` da `03_APPLICATIONS_GH` (definição antiga do guia 01, já corrigida). Se o modelo ainda usar `resolved_at`, trocar a coluna `data_contratacao` da 13. O **SLA mediano baixo** (11 dias) continua sem causa confirmada: reavaliar depois de conferir essa coluna. `saiu_na_etapa`, `sort_order`, `closed_at_opening`, `days_in_stage` e `data_aplicacao` vêm da tabela de origem (não são calculadas no modelo).

**`03_APPLICATIONS_GH`**
```DAX
indicacao =
VAR Cand = [candidate_id]
VAR RegraApp  = [source_public_name] = "Referral" && NOT ISBLANK( [credited_to_id] )
VAR RegraCand = CALCULATE( COUNTROWS('04_CANDIDATES_GH'), REMOVEFILTERS('03_APPLICATIONS_GH'), '04_CANDIDATES_GH'[candidate_id] = Cand, '04_CANDIDATES_GH'[referred_by] <> "" ) > 0
RETURN SWITCH( TRUE(), RegraApp, "Pela aplicação", RegraCand, "Pelo candidato", "Sem indicação" )
```
**`14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS`**
```DAX
etapa_entrevista    = etapa da 13 com a maior data_entrada_stage <= start_at da entrevista (TOPN 1 por application_id)
resultado_entrevista = resultado_etapa dessa mesma linha da 13
```
(DAX completo no guia `docs/00`, seção 0.1.)

### 16.3 Tabelas DAX
```DAX
dEtapa     = DATATABLE( "stage_name",STRING,"ordem",INTEGER,"grupo",STRING,"ordem_grupo",INTEGER, { … 29 etapas em 5 grupos: Triagem, Avaliações, Entrevistas, Checagens, Offer … } )   -- lista completa: docs/00
dFunil     = UNION( SELECTCOLUMNS(dEtapa,"passo",[stage_name],"ordem_passo",[ordem],"grupo",[grupo]), ROW("passo","Contratadas","ordem_passo",999,"grupo","Contratação") )
dFaixaDias = DATATABLE( "faixa",STRING,"ordem",INTEGER,"de",INTEGER,"ate",INTEGER, { {"0–2 d",1,0,2},{"3–7 d",2,3,7},{"8–15 d",3,8,15},{"16–30 d",4,16,30},{"31–45 d",5,31,45},{"> 45 d",6,46,99999} } )
dFiltroIndicacao = DATATABLE( "opcao",STRING,"ordem",INTEGER,"indicacao",STRING, { {"Todas",1,"Indicação"},{"Todas",1,"Sem indicação"},{"Só indicações",2,"Indicação"} } )
dEsteiraEtapa    = SUMMARIZE( '13_ETAPA_RECRUTAMENTO', [esteira], dEtapa[stage_name], dEtapa[ordem] )
dOrganograma     = SELECTCOLUMNS( '02_JOBS_GH',
                       "job_id", [job_id], "tipo_vaga", [position_type], "eh_pool", IF([position_type]="Pool","Pool","Vaga"),
                       "N2", COALESCE(RELATED('12_GE'[N2_email]),"-"), "N3", COALESCE(RELATED('12_GE'[N3_email]),"-"), … "N7", COALESCE(RELATED('12_GE'[N7_email]),"-") )
```
Classificações: `dEtapa[stage_name]` por `ordem`; `dEtapa[grupo]` por `ordem_grupo`; `dFunil[passo]` por `ordem_passo`; `dFaixaDias[faixa]` por `ordem`; `dFiltroIndicacao[opcao]` por `ordem`.
