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

## Parte 2 · medidas (`docs/68-fotografia-report-medidas.dax`) e troca de campos
| Visual | Campo | Passa a ser |
|---|---|---|
| Entradas e aprovações por etapa | Participantes · Aprovados · Rejeitados · Em andamento · SLA média · SLA mediana | Etapa Entradas · Etapa Aprovados · Etapa Rejeitados · Etapa Em Andamento · Etapa SLA Média · Etapa SLA Mediana (Textos → Coluna participantes = "Entradas") |
| Em andamento por etapa (matriz) | Valor | Etapa Ativos na Faixa |
| Rejeitados por etapa | Partes 1 e 2 | Etapa Rejeitados (Empresa) · Etapa Declinados (Offer) |
| SLA por etapa | Típico · P90 · Base · Acima hoje | Etapa SLA Mediana · Etapa SLA P90 · Etapa Base SLA · Etapa Acima do P90 |
| Motivos de saída | Valor | Etapa Rejeitados |
| Aprovados por praça | Valor · Base da taxa | Etapa Aprovados · Etapa Rejeitados |
| Aprovados por recrutador | Participantes · Aprovados · Rejeitados · Em andamento · SLA mediana | Card Aplicações · Card Contratados · Recrutador Rejeitados · Recrutador Em Andamento · Card SLA |
Achado na foto do Resumo (03/11): "Onde a esteira perde" mostra as mesmas partes nos dois modos (2.436 · 2.197 · 3.447 no Mindsight e PI
Cognitivo): as partes da barra ainda não foram trocadas para Etapa Aprovados / Rejeitados / Em Andamento.
Pendente (parte 4): título "Acima hoje" é fixo no XP · Tabela de SLA 1.0.0.

## Parte 5 · Pré Offer e Offer (`docs/69-fotografia-reta-final.dax`)
Dias → `Esteira | Reta Final Dias na Etapa` · SLA total → `Esteira | Reta Final SLA (dias)`. Na Fotografia: quem estava lá em D,
com dias e SLA até D. (`Esteira | Nominal Dias na Etapa` já existe na página Nominal: não reaproveitar o nome.)
Situação em 03/11: Danilo trocou os campos dos visuais 2 a 8 (sem foto das conferências da parte 2 ainda).
