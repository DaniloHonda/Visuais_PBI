# 20 · Registro de justificativas: tudo o que pode parecer "não bater"

Regra do dash: **nenhum número sem explicação**. Cada diferença conhecida tem:
- uma causa;
- um lugar no dash onde a explicação aparece;
- um jeito de conferir.

Ao encontrar uma nova diferença, ela entra aqui antes de virar texto no dash.

Legenda do status: ✅ já explicada no dash · 🟡 explicação definida, falta colocar no dash · 🔧 vai ser corrigida (deixa de divergir)

| # | O que parece errado | Por que acontece | Onde a explicação aparece no dash | Como conferir | Status |
|---|---|---|---|---|---|
| 1 | **Entrevistas**: o Resumo mostra mais do que a Nominal | O Resumo conta entrevistas; a Nominal (1.1.0) conta aplicações. Uma pessoa com 3 entrevistas = 3 × 1 | Nominal 1.2.0 passa a contar entrevistas | card Resumo = card Nominal 1.2.0 | 🔧 |
| 2 | **Marcadas ≠ Na agenda** | Marcadas = criadas no período (Created At). Na agenda = acontecem no período (Started At). Uma entrevista marcada em setembro para outubro conta em setembro numa e em outubro na outra | subtítulo do card + Conceitos | sem filtro de período, as duas são iguais | 🟡 |
| 3 | **Evolução** com números maiores que os cards | As movimentações contam eventos: uma aplicação aprovada em 5 etapas = 5 aprovações. São pela data em que aconteceram, não pela candidatura | subtítulo do gráfico ✅ + Conceitos | — | ✅/🟡 |
| 4 | **Período curto ou recente**: conversão baixa, SLA curto, muitas "aplicações por contratação", 0 paradas | Pela data de candidatura, aplicações recentes ainda não terminaram o processo | aviso discreto nos cards quando o período tem < 45 dias + Conceitos | o mesmo período, olhado de novo daqui a 45 dias, sobe | 🟡 |
| 5 | **1ª etapa da tabela** (ex.: 11.489) < **Aplicações** (12.260) | Nem toda aplicação passa pela primeira etapa: algumas começam em outra etapa e outras ainda não têm entrada registrada | rodapé da tabela "Entradas e aprovações por etapa" | `Esteira \| Check Funil` | 🟡 |
| 6 | **Funil**: 422 aplicações não aparecem no 1º passo | aplicações sem data de entrada em etapa, ou com etapa fora da `dEtapa` | rodapé do funil + Conceitos | `Esteira \| Check Funil`; `EXCEPT` da dEtapa | 🟡 (investigar) |
| 7 | **Soma por recrutador < total** | Aplicações sem recrutador na vaga (ex.: 8.979 rejeitadas no histórico) entram no total, mas não em nenhum recrutador | linha "Sem recrutador" visível na tabela de recrutadores + Conceitos | filtro Recrutador = (Em branco) na Nominal | 🟡 |
| 8 | **"Rejeitados" no Report ≠ "Rejeitadas" na Nominal** | No Report, Rejeitados = pela XP + declinaram a offer. Na Nominal são dois cards | renomear o card da Nominal para "Rejeitadas pela XP" + Conceitos ("de-para") | Report = Rejeitadas + Declinaram ✅ conferido | 🟡 |
| 9 | **SLA mediana 0,0 d** em várias etapas | Etapas automáticas ou resolvidas no mesmo dia: o tempo é contado em dias inteiros | rodapé da tabela: "0,0 d = resolvida no mesmo dia" | distribuição de `days_in_stage` por etapa | 🟡 (investigar) |
| 10 | **Nominal "Todas" ≠ soma das listas** | A lista também traz aplicações de antes do período que têm entrevista no período (base de entrevistas); "Todas" conta só as do período | Conceitos | "Todas" = card Aplicações ✅ | 🟡 |
| 11 | **Indicação**: uma pessoa indicada uma vez aparece como indicação em todas as aplicações dela | Regra 2 (Referred By) é do candidato, não da aplicação. Decisão do negócio | Conceitos | `03_APPLICATIONS_GH[indicacao]` = "Pelo candidato" | 🟡 |
| 12 | **Contratações de julho "faltando"** | Os dados começam em 01/07/2026. Quem se candidatou antes não entra, mesmo que tenha sido contratado depois | selo "Dados disponíveis desde 01/07/2026" ✅ + Conceitos | — | ✅/🟡 |
| 14 | **(Sem organograma)** no filtro de N; soma dos N2 < total | A vaga não tem cadeira na Gestão de Estruturas (lacuna conhecida do cadastro; ~38% das vagas do Greenhouse) | Conceitos ("Por que não bate?") | `dOrganograma[N2] = "-"` | ✅ |
| 13 | **Linha do tempo da Nominal** com etapas sem data ("→ hoje · 0 d") | Linhas da tabela 13 para etapas não alcançadas (hipótese) | corrigir a medida Jornada | consulta de uma aplicação | 🔧 (investigar) |

## Onde cada tipo de explicação vive (sem poluir)
1. **Página Conceitos:** o dicionário, o "de-para" (qual card da Nominal confere qual número) e um "Por que não bate?" com os itens acima.
2. **Rodapé ou ⓘ do visual:** só a frase curta do item que afeta aquele visual (os visuais já têm campo de rodapé).
3. **Aviso dinâmico:** só para o item 4 (período recente), porque depende do filtro.
