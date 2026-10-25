# 27 · Homologação da tabela 13

Registro dos testes de qualidade da `13_ETAPA_RECRUTAMENTO`. Cada achado é classificado como:
**nosso** (montagem da 13 ou modelo) · **input** (preenchimento no Greenhouse) · **regra** (decisão de negócio pendente).

Consultas: `docs/27-homologacao.dax` (H1, H2, H3…). Sempre anotar a data da execução.

## Achados

| # | Achado | Evidência | Classificação | Status |
|---|---|---|---|---|
| A1 | **Etapas duplicadas por "dois jogos de etapas" na mesma vaga.** A aplicação aparece com todas as etapas em dobro: dois `job_stage_id` de famílias diferentes (ex.: `2191486…` e `2306733…`) para a mesma etapa, **com as mesmas datas**. | H1 em 281242063002 (vaga 6449060002 "Future"); H2 em 25/10/2026: **7.390 passagens duplicadas, 3.519 aplicações**, das quais só **1.329 (38%) hoje em vaga Pool**; em **604 (8%)** as cópias têm saída diferente | **nosso** (montagem da 13): datas idênticas não vêm de transferência de pool, vêm de uma junção que liga a mesma passagem a dois jogos de etapas (provavelmente pelo nome da etapa) | levar à engenharia; corrigir no modelo com `docs/23` enquanto isso |
| A2 | **A 13 tem linhas para etapas por onde a aplicação não passou**, sem entrada nem saída, com 0 dias e resultado "Aprovado". | H1: 12 linhas (Avaliação técnica, Phone Screening, Priorizados IA, Qualificação, Short List, Stand-by) | **nosso** (montagem): a 13 parece ser "todas as etapas da vaga × aplicação" | medidas novas já exigem data de entrada; faltam Jornada/Seguintes (Nominal) e as medidas de tempo |
| A3 | **`days_in_stage` não bate com saída − entrada** em algumas linhas: uma das cópias da Offer tem saída vazia e 7 dias; a outra tem saída 20/07 e 17 dias. | H1, linhas 31–32 | **nosso** (cálculo da 13) | medir o tamanho com H3 |
| A4 | **Etapas antes da candidatura: caso raro.** H7 (25/10/2026): só **47 aplicações** (23 contratadas; 40 também com duplicadas; mediana de 31 dias "escondidos"). SLA mediano candidatura → contratação **12 d** × 1ª etapa → contratação **13 d** (677 contratadas): a `data_aplicacao` **não** explica o SLA baixo. Ex.: 281242063002 tem candidatura em 15/07, Offer desde 03/07 e processo desde 26/03 (SLA de 5 d em vez de ~116). Aplicações = 122.394 = `application_id` distintos (diferença antiga resolvida) | H1, H7 | **nosso** (montagem), impacto pequeno | listar as 47 para a engenharia |
| A5 | **`job_stage_id` não é o id da etapa da vaga**: 1.900.016 valores distintos em 1.907.255 linhas; cada id aparece em 1 aplicação só (H5, H6). Funciona como id da "etapa da aplicação". Não serve para descobrir a vaga da etapa | H5, H6 (25/10/2026) | informação | a separação pool × vaga depende da engenharia |
| A6 | **88% das linhas da 13 são etapas não alcançadas** (1.676.573 de 1.907.255 sem data de entrada; nenhuma delas tem saída) | H3 (25/10/2026) | **nosso** (montagem); inofensivo para medidas que exigem entrada | pedir à engenharia para remover (desempenho) |
| A7 | **Vai-e-volta existe e é guardado em parte**: 1.740 casos do mesmo `job_stage_id` em 2+ linhas; 651 passagens da mesma etapa com entradas em datas diferentes (543 aplicações); 7.154 aplicações com a última etapa anterior à mais avançada (parte pode ser só ordem da `dEtapa` diferente da vaga) | H4 (25/10/2026) | **processo** (recrutador) | tratar como indicador de retrabalho |
| A9 | **Rejeição marcada em mais de uma etapa.** Conferido no Greenhouse (25/10/2026): as **datas da 13 batem**, mas o Greenhouse registra a rejeição numa etapa só (a "Current stage"), enquanto a 13 marca como "Rejeitado" toda etapa com saída no dia da rejeição. Ex.: 306065694002 rejeitada em Ranking Score, e a 13 também marca Entrevista Inteligente; 292329017002 (Phone Screening 04/08–17/09 → voltou para Triagem e foi rejeitada em 17/09); 292346449002 e 292343432002 (Mindsight 01–06/07 → voltaram para Revisão e foram rejeitadas em 06/07) | H1, H9, prints | **nosso** (regra do `saiu_na_etapa`) + **processo** (recrutador volta a aplicação para uma etapa anterior para rejeitar) | definir em qual etapa a rejeição conta (ver decisão pendente) |
| A10 | **Ordem das etapas varia por vaga.** No pool B2C a ordem real é Revisão → Entrevista Inteligente → Ranking Score → Phone Screening (print de 306065694002), diferente da `dEtapa`. Afeta "voltou de etapa", funil e "etapas seguintes". Usar `sort_order` (ordem da própria vaga) em vez de `dEtapa[ordem]` nas regras por aplicação | prints, H4 | **regra** | **confirmado** (25/10/2026): `sort_order` = numeração do Greenhouse (base 0) em 292329017002 e 306065694002; a `dEtapa` inverte Entrevista Inteligente (14) e Ranking Score (12) |
| A9b | **Tamanho (25/10/2026):** 70.127 rejeitadas com etapa; **3.425** com 2+ etapas "Rejeitado"; **3.529** voltaram para uma etapa anterior antes de serem rejeitadas; **275** sem nenhuma etapa "Rejeitado". Pares mais comuns (mais avançada → registrada): Mindsight → Revisão 1.019 · Priorizados IA → Mindsight 673 · Phone Screening → Revisão 453 · Senior → Avaliação técnica 298 · Senior → Phone Screening 171 · Qualificação → Phone Screening 115 · Pleno → Triagem 95 · Offer → Stand-by/Silver medalist 31 | consulta "voltaram para rejeitar" | — | — |
| A11 | **Perfis de candidato duplicados no Greenhouse** (selo "Duplicate" em 292346449002 e 292329017002): a mesma pessoa pode ter mais de um `candidate_id` | prints | **input** | medir depois |
| A12 | **Motivo "[Geral] Limpeza de Pool"**: encerramento administrativo de pool, não é decisão de avaliação. Conta como rejeição e derruba a conversão do pool | print (activity feed de 292327176002) | **regra** | decidir se vira categoria própria |
| A8 | `days_in_stage` = saída − entrada em 100% das linhas com as duas datas; 0 linhas com entrada depois da saída; 3.025 etapas sem saída em aplicações encerradas | H3 (25/10/2026) | ok / a classificar | — |

## Casos conferidos no Activity Feed (25/10/2026)
| Caso | Aplicação | O que aconteceu no Greenhouse | O que a 13 mostra | Lição |
|---|---|---|---|---|
| A | 302928376002 (Assistente de BDO PcD) | Qualificação 16/10 → Pool Qualificados 22/10 16:19 → rejeitada 16:20, motivo **Duplicate** | Rejeitado em Qualificação e em Pool Qualificados | rejeição = etapa atual; "Duplicate" é encerramento administrativo |
| A | 305897329002 (Talent Pool Eng. Back-end) | **Auto-Advance** levou para "Senior" (etapa que não deveria existir) 20/10 → Phone Screening 22/10 08:14 → rejeitada 08:27 | Rejeitado em Senior e em Phone Screening | rejeição = etapa atual; "Senior" é erro de configuração do pool (input) |
| B | 306105340002 (Pool B2C Manaus) | entrou no pool 21/10 → Entrevista com supervisor 22/10 09:08 → rejeitada 10:38 (**Duplicate**) → contratada **em outra aplicação** (vaga Future) no mesmo dia | Rejeitado em 2 etapas | o pool "perde" uma pessoa que foi contratada: o desfecho real é do **candidato**, não da aplicação |
| B | 304611944002 (Pool B2C SP) | Ranking Score 22/10 09:37 → rejeitada 14:11 | Rejeitado também na etapa anterior | rejeição = etapa atual |
| C | 296107176002 (Pool B2C ABC) | criado 03/08 em outra vaga → **transferido** para o pool 01/09 → Qualificação e Phone Screening no mesmo minuto → rejeitada 04/09 → **desrejeitada** 18/09 → várias etapas → rejeitada 22/10. Short List e Phone Screening **foram apagadas da vaga** depois | etapas em dobro | duplicadas vêm de transferência e/ou de etapas apagadas/recriadas na vaga; desrejeição existe |
| C | 304354609002 (Pool Eng. Back-end PcD) | auto-rejeitada ao se candidatar 07/10 → desrejeitada 09/10 → Mindsight 13:50 → Phone Screening 13:50 (engano) → Mindsight de novo 14:07 → rejeitada 22/10 em Mindsight | Mindsight em 2 linhas no mesmo dia | sem hora, idas e voltas no mesmo dia parecem "duplicadas" e confundem a etapa atual |

Obs.: "Rejected from Assessoria de Investimentos: XP Future" e "Rejected from Engenheiro(a) de Software | Pleno, Sênior e Especialista" são, muito provavelmente, o **nome público (job post)** dos pools, e não outra vaga.

## Proposta de mudanças (em discussão)
**No modelo (nosso, sem depender da engenharia)**
1. `passagem_valida`: uma linha por passagem (aplicação + etapa + data de entrada); as cópias ficam de fora.
2. `eh_etapa_atual`: maior data de entrada → maior data de saída (vazia = ainda está lá) → maior `sort_order`. `eh_etapa_ativa` passa a ser `eh_etapa_atual` + in_process.
3. `resultado_etapa`: Rejeitado / Em andamento só na etapa atual; **Voltou** quando a aplicação saiu para uma etapa anterior; Aprovado no resto; vazio sem passagem.
4. `tipo_encerramento`: Declinou ([Offer]) · **Administrativo** (Duplicate, Limpeza de Pool…) · Avaliação. Administrativo sai de perdas e conversão.
5. Desfecho por **candidato**: aplicação de pool encerrada cujo candidato foi contratado em outra aplicação = "Contratado via outra vaga"; SLA total = da 1ª aplicação do ciclo até a contratação.

**Pedidos à engenharia**
- Data **e hora** de entrada e saída (idas e voltas no mesmo dia).
- Origem das famílias de etapas (transferência × etapas apagadas/recriadas) e remoção das linhas sem passagem.
- `rejected_at` em desrejeições: deve ser a última rejeição.

**Processo e configuração (áreas)**
- Auto-Advance do pool de Engenharia levando para "Senior"/"Pleno".
- Voltar a aplicação para uma etapa anterior (ou para Pool Qualificados) antes de rejeitar.
- Perfis e aplicações duplicados; movimentos por engano.

## Motivos e pool (25/10/2026)
- 70 motivos de rejeição. **"Duplicate" não aparece na 13**; há **4.195 rejeitadas sem motivo** (3.509 em pool). Hipótese: motivos padrão do Greenhouse (Duplicate…) chegam vazios.
- Candidatos a "administrativo": [Geral] Limpeza de Pool 4.451 · (vazio) 4.195 · [Geral] Posição cancelada 1.799 · [Geral] Movimentação e… 313 · [Geral] Silver Medalist 35 · [Aplicação] Move intern… 1. Candidatos a "desistência do candidato": [Geral] Desistência no m… 1.066 · Preferiu outra po… 36 · Motivos pessoais 35 · [Offer] … A confirmar com os nomes completos.
- **Pool → contratação em outra aplicação:** 36.670 aplicações de pool rejeitadas; **191** são de pessoas contratadas em outra aplicação. Das **676 pessoas contratadas, 134 (20%) passaram por pool**. Ex.: 306105340002.

## Classificação dos motivos (proposta para validar com recrutadores)
Confirmado em 25/10/2026: **"Duplicate" chega vazio na 13** (302928376002 e 306105340002 rejeitadas como Duplicate no Greenhouse, motivo vazio na 13). Pedido à engenharia: trazer os motivos padrão do Greenhouse.

| Tipo | Motivos | Aplicações |
|---|---|---|
| Avaliação (XP) | todo [Aplicação], [Avaliação], [Qualificação]; [Geral] Empresa off limits; [Geral] Candidato(a) AAI/B2B; [Geral] Background Check (Compliance); [Geral] Problemas de documentação (Certificação ou laudo) | — |
| Desistência do candidato | [Geral] Desistência no meio do processo (1.066); [Geral] Preferiu outra posição na XP (36); [Geral] Motivos pessoais (35) | 1.137 |
| Declínio da offer | todo [Offer] (Anywhere - Remuneração 114, Recebeu outra oferta 26, Composição da remuneração 25, Desistência pós hired 15, …) | ~190 |
| Administrativo | [Geral] Limpeza de Pool (4.451); [Geral] Posição cancelada (1.799); [Geral] Movimentação entre vagas (313); [Geral] Silver Medalist (35); [Aplicação] Move interno (1) | 6.599 |
| Sem motivo na base | (vazio) = provavelmente "Duplicate" e outros motivos padrão | 4.195 |

Todos contam na conversão (decisão de 25/10). A classificação serve para exibir e filtrar.

## Backlog
- Rejeitadas **sem nenhuma etapa "Rejeitado"** (275).
- Aplicações **sem esteira** (~75 mil; ver CONTEXTO seção 10). Preocupação principal: confiabilidade do **filtro de Esteira**, que deve ser um dos mais usados. Opções discutidas: "(Sem esteira)" visível no filtro, de-para oficial persona → esteira, de-para inferido dos dados (marcado como "inferida"), herdar a esteira da vaga final no pool → contratação.

## Decisões de 25/10/2026
- **Classificação dos motivos** aprovada como ponto de partida e precisa ser **fácil de editar** (será validada com os recrutadores). Todo [Offer] = declínio. "[Geral] Candidato(a) AAI…" = avaliação. "Preferiu outra posição" = desistência do candidato.
- **Desistência do candidato conta como rejeição na conversão** (rejeição pela XP ou desistência: as duas entram).
- **Passagem única** por etapa. Linha do tempo **ordenada por entrada e saída**, coerente com o histórico.
- **Etapas de configuração** (Senior, Pleno, Pool Qualificados, Stand-by): erro de input, mas o tempo **conta** no SLA total e nas metas, como qualquer etapa.
- **Contratação dentro de pool** não deveria acontecer: sinalizar como exceção.
- A Nominal precisa mostrar **casos de exceção** (muito vai-e-volta, contratação em pool etc.).
- O usuário só consegue mandar resultados **por foto**: consultas com poucas colunas e textos curtos.

## Decisões de 25/10/2026 (2)
- **Encerramentos administrativos contam na conversão** (por enquanto; validar com recrutadores na segunda).
- **Pool → contratação em outra aplicação:** a contratação é da vaga final (não do pool); a rejeição no pool **não conta** como rejeição; a aplicação do pool aparece como **"Contratada via outra vaga"**; o SLA conta da **entrada no pool** até a contratação.
- **"Voltou":** o tempo conta no SLA; não conta como aprovação; aparece nas exceções. **Sem indicador de retrabalho** (muitas voltas são erro manual corrigido na hora).
- **Desrejeição:** ignorar; vale a última rejeição.
- **Exceções de processo** para a Nominal: contratada dentro de pool, voltou de etapa, passou por etapa de configuração. **Problemas de dado** (sem motivo, etapa antes da candidatura, etapas em dobro) ficam para investigar.
- **Homologação no dash:** em todo gráfico, um jeito fácil (botão) de ir para uma tabela com as aplicações por trás do número, com os mesmos filtros e colunas próprias (etapa, resultado, entrada, saída, faixa de SLA…). Duas páginas separadas: **dados do dash** e **alertas (data quality)**.

## Plano de implementação
1. Colunas `passagem_valida`, `eh_etapa_atual`, `resultado_novo` (`docs/28-colunas-13.dax`) + conferência.
2. Trocar `resultado_etapa`/`eh_etapa_ativa` pelas novas; medidas de tempo só com passagens válidas; linha do tempo por entrada e saída.
3. Tabela editável de motivos (`tipo_encerramento`).
4. Pool → outra vaga (desfecho e SLA desde o pool).
5. Colunas de exceção (alertas).
6. Páginas Homologação e Alertas (mockup antes).

## Conferência da etapa 1 (25/10/2026)
passagens válidas 222.398 · cópias descartadas 8.284 · apps com etapa atual 121.929 · **apps com 2+ etapas atuais 329** · rejeitadas 70.127 · Rejeitado hoje 73.642 → **novo 70.215** · Voltou 9.351 · Em andamento (linhas) hoje 51.857 → novo 51.258 (−599, a investigar: suspeita de aplicações em processo sem nenhuma entrada, que a regra antiga punha numa etapa sem data).

Investigação (25/10/2026): das 329 com 2+ etapas atuais, **313 são linhas idênticas** e 16 são etapas diferentes com a **mesma `sort_order`** (ex.: 302350009002, Qualificação e Phone Screening, ambas 3). As **465 sem etapa atual** (370 em processo, 91 rejeitadas, 4 contratadas) têm passagens em **etapas sem nome** (`stage_name` e `sort_order` vazios, `job_stage_id` preenchido; ex.: 306170782002, entradas em 22/10). Provável etapa nova que ainda não está na tabela de etapas da engenharia → pedido à engenharia. Correção no modelo: etapa sem nome conta como passagem; desempate final pelo maior `job_stage_id`; "Voltou" só quando a etapa atual tem ordem.

**Etapa 1 fechada (25/10/2026):** 122.394 apps com entrada · 0 sem etapa atual · 313 com 2 atuais (linhas idênticas) · em andamento 51.590 = em processo · Rejeitado 70.127 = rejeitadas · 0 rejeitadas em 2 etapas · Voltou 9.336 passagens · **484 aplicações com etapa atual sem nome** (pedido à engenharia).
Etapa 2: `docs/29-etapa2.dax`. Pendência no visual Base nominal: mostrar "Voltou" com estilo próprio na linha do tempo (hoje cai como aprovado).

**Conferência da etapa 2 (25/10/2026):** Check Coorte 0 · Check Fechamento (soma das etapas) **−192** (aplicações que entraram 2× na mesma etapa em dias diferentes contam em dois resultados) · Rejeitados nas etapas 70.034 × rejeitadas 70.127 (93 = rejeitadas em etapa sem nome) · em andamento 51.590 · Voltaram 9.269 · mediana geral por etapa 0 d (etapas automáticas resolvidas no mesmo dia) · P90 30 d · base SLA 172.440 · conversão de entrevista 36%.

Linha do tempo do Diego conferida (25/10/2026): Revisão 01/07 (Aprovado, 0 d) → Mindsight 01/07–04/08 (Aprovado, 34 d) → Phone Screening 04/08–17/09 (**Voltou**, 44 d) → Triagem 17/09 (**Rejeitado**). Igual ao Greenhouse (que mostra 43 d no Phone Screening: datas da 13 sem hora). **Etapa 2 fechada.** Etapa 3: `docs/30-motivos.dax`.

**Etapa 3 fechada (25/10/2026):** Avaliação 58.027 · Administrativo 6.595 · Sem motivo na base 4.185 · Desistência do candidato 1.132 · Declínio da offer 188 = **70.127** · nenhum "A classificar". O motivo "[Geral] Silver Medalist" vem da base com 1 caractere invisível (24 × 23): a tabela de exceções passou a comparar por "contém". 52 aplicações têm motivo preenchido só em parte das linhas: a coluna usa um motivo por aplicação.

**Etapa 4 fechada (25/10/2026):** 131 aplicações de pool "saíram para outra vaga" (Felipe 306105340002 confere) · contratadas: **Direto 587 · Via pool 89 · Dentro do pool 1** (= 677) · Check Coorte 0 · rejeitadas 69.996 (= 70.127 − 131) · conversão ~1% · **SLA mediano geral 15 d** (antes 12) · **via pool 42 d** · direto 13 d.

## Decisões pendentes
- **Em qual etapa a rejeição conta** quando o recrutador volta a aplicação para uma etapa anterior antes de rejeitar: (A) a etapa registrada no Greenhouse ("Current stage" na rejeição) ou (B) a etapa mais avançada a que a aplicação chegou (pela ordem da vaga).

## Para a engenharia (rascunho de mensagem)
> Na tabela de etapas (13), achamos 3.519 aplicações com as etapas em dobro: a mesma etapa aparece com dois `job_stage_id` diferentes e exatamente as mesmas datas de entrada e saída. Exemplo: aplicação 281242063002, vaga 6449060002 ("Future"): ids `2191486…` e `2306733…` para cada etapa. Só 38% dessas aplicações estão em vaga de pool, então não parece transferência.
> Perguntas: (1) Como a 13 é montada (consulta/notebook)? A ligação do histórico com as etapas é feita pelo nome da etapa ou pelo `job_stage_id`? (2) A quais `job_id` pertencem os `job_stage_id` `2191486459002` e `2306733915002`? Alguma das famílias é de etapas apagadas, de outra versão do plano de entrevistas ou de outra vaga? (3) Por que existem linhas para etapas por onde a aplicação não passou (sem datas, "Aprovado", 0 dias)? (4) Como `days_in_stage` é calculado (há casos sem saída com 7 dias)? (5) Conseguem disponibilizar a tabela `job_stages` (`job_stage_id` → `job_id`)?
