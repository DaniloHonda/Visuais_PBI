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
| A4 | **Aplicação com etapas antes da candidatura.** A 281242063002 tem etapas desde 26/03/2026, mas nenhuma aplicação da 13 tem `data_aplicacao` antes de 01/07 (H3). Hipótese: em transferências, a `data_aplicacao` vira a data da transferência e o tempo anterior some do SLA | H1 + H3 | **nosso** (montagem) ou regra de transferência, a medir com H7 | pode explicar o SLA mediano baixo |
| A5 | **`job_stage_id` não é o id da etapa da vaga**: 1.900.016 valores distintos em 1.907.255 linhas; cada id aparece em 1 aplicação só (H5, H6). Funciona como id da "etapa da aplicação". Não serve para descobrir a vaga da etapa | H5, H6 (25/10/2026) | informação | a separação pool × vaga depende da engenharia |
| A6 | **88% das linhas da 13 são etapas não alcançadas** (1.676.573 de 1.907.255 sem data de entrada; nenhuma delas tem saída) | H3 (25/10/2026) | **nosso** (montagem); inofensivo para medidas que exigem entrada | pedir à engenharia para remover (desempenho) |
| A7 | **Vai-e-volta existe e é guardado em parte**: 1.740 casos do mesmo `job_stage_id` em 2+ linhas; 651 passagens da mesma etapa com entradas em datas diferentes (543 aplicações); 7.154 aplicações com a última etapa anterior à mais avançada (parte pode ser só ordem da `dEtapa` diferente da vaga) | H4 (25/10/2026) | **processo** (recrutador) | tratar como indicador de retrabalho |
| A8 | `days_in_stage` = saída − entrada em 100% das linhas com as duas datas; 0 linhas com entrada depois da saída; 3.025 etapas sem saída em aplicações encerradas | H3 (25/10/2026) | ok / a classificar | — |

## Para a engenharia (rascunho de mensagem)
> Na tabela de etapas (13), achamos 3.519 aplicações com as etapas em dobro: a mesma etapa aparece com dois `job_stage_id` diferentes e exatamente as mesmas datas de entrada e saída. Exemplo: aplicação 281242063002, vaga 6449060002 ("Future"): ids `2191486…` e `2306733…` para cada etapa. Só 38% dessas aplicações estão em vaga de pool, então não parece transferência.
> Perguntas: (1) Como a 13 é montada (consulta/notebook)? A ligação do histórico com as etapas é feita pelo nome da etapa ou pelo `job_stage_id`? (2) A quais `job_id` pertencem os `job_stage_id` `2191486459002` e `2306733915002`? Alguma das famílias é de etapas apagadas, de outra versão do plano de entrevistas ou de outra vaga? (3) Por que existem linhas para etapas por onde a aplicação não passou (sem datas, "Aprovado", 0 dias)? (4) Como `days_in_stage` é calculado (há casos sem saída com 7 dias)? (5) Conseguem disponibilizar a tabela `job_stages` (`job_stage_id` → `job_id`)?
