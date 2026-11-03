# 67 · Modo Fotografia na página Report (plano, 03/11/2026)

Mesma régua do Resumo: **estoque** = como estava no último dia (D); **movimento** = o que aconteceu entre o início do período e D.
O funil é o único que usa "todas as aplicações existentes em D" (docs/65); a Report não tem funil.

| # | Visual | No modo Fotografia | O que precisa |
|---|---|---|---|
| 1 | Evolução da esteira | igual: já conta pela data do evento | nada |
| 2 | Entradas e aprovações por etapa | entradas na etapa no período · aprovações e reprovações no período · em andamento em D · taxa de aprovação · SLA das passagens que terminaram no período | medidas novas (entradas, SLA média/mediana) + `Etapa Aprovados/Rejeitados/Em Andamento` (já existem) |
| 3 | Em andamento por etapa × dias parado | quem estava em cada etapa em D, por dias parados em D | 1 medida nova (faixa em D) |
| 4 | Rejeitados por etapa | rejeições do período, com declínio na Offer | 2 medidas novas |
| 5 | SLA por etapa (típico e 90%) | passagens que terminaram no período; acima do P90 em D | 4 medidas novas |
| 6 | Motivos de saída por etapa | rejeições do período por motivo | trocar para `Etapa Rejeitados` (já existe) |
| 7 | Aprovados por praça em cada etapa | aprovações e reprovações do período | trocar para `Etapa Aprovados/Rejeitados` (já existem) |
| 8 | Aprovados por recrutador | existentes em D · contratadas e rejeitadas no período · em andamento em D · SLA das contratadas no período | 1 medida nova + medidas `Card …` do Resumo |
| 9 | Pré Offer e Offer (lista) | quem estava lá em D, com dias em D | por último (lista nominal; recrutador e vaga são os de hoje) |

Partes: (1) Alternador 1.1.0 sincronizado na Report · (2) medidas · (3) troca de campos visual a visual ·
(4) subtítulos do fundo neutros (hoje dizem "Aplicações do período…", errado na Fotografia) · (5) lista Pré Offer e Offer.
