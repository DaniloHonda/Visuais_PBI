# 60 · Modo "Fotografia" (como estava cada aplicação numa data)

Pedido (03/11/2026): além da régua por candidatura, um botão para ver o filtro de data como **fotografia**: todas as aplicações
que existiam no último dia do período, em que situação e em que etapa estavam naquele dia, sem importar quando foram criadas.

Regra testada (consultas em `docs/60-fotografia-viabilidade.dax`), para o fim do dia D:
existia = candidatura ≤ D · contratada = data_contratacao ≤ D · rejeitada = rejected_at ≤ D · senão em andamento,
na passagem válida com entrada ≤ D e saída > D (ou sem saída).

## Viabilidade (03/11/2026)
- **F1:** 1ª candidatura **01/07/2026** (a base só tem aplicações criadas a partir de 01/07) · 1ª entrada em etapa 08/08/2024
  (passagens anteriores à candidatura, caso já conhecido) · 0 rejeitadas sem data · 0 contratadas sem data · ativos agora 50.202.
- **F2:** | foto | existiam | em andamento | c/ etapa | linhas cobrindo |
  |---|---|---|---|---|
  | 31/07 | 30.117 | 21.170 | 20.530 (97%) | 20.810 |
  | 31/08 | 67.211 | 40.377 | 38.804 (96%) | 39.293 |
  | 30/09 | 99.519 | 50.456 | 49.225 (98%) | 49.909 |
  | hoje | 118.018 | **50.202 = ativos agora** | 48.107 (96%) | 48.695 |
  A regra reproduz exatamente o "em andamento" de hoje. 2–4% ficam sem etapa identificada; ~1% em duas etapas no mesmo dia.
- **F3 (30/09):** Mindsight e PI Cognitivo 22.787 (mediana 28 d; 6.204 > 45 d) · Revisão de aplicação 16.688 (42 d; 3.615) ·
  Mindsight - Fit cultural 1.609 (46 d; 806) · Entrevista Inteligente 1.162 (6 d) · Phone Screening 1.039 (24 d; 133) ·
  Stand-by | Silver medalist 638 · Vídeo Entrevista 625 (29 d) · Triagem 505 (28 d) · Qualificação 474 · Priorizados IA 468 ·
  Junior 369 (54,5 d) · Banking & Financial 303 (51 d) · Etapa com Recrutamento 299 · Assistente 263 · sem etapa na dEtapa 330.

## Limitação principal
A 13 só traz aplicações **criadas a partir de 01/07/2026**. A fotografia não enxerga aplicações mais antigas que ainda estavam
abertas (pools guardam candidatos por meses). Julho fica muito incompleto; de setembro em diante, menos. Pedido à engenharia:
incluir na 13 as aplicações abertas criadas antes de 01/07 (o histórico de etapas existe: há entradas desde 2024).
Outras: atributos (recrutador, vaga, esteira, praça) são os de hoje; desrejeição usa a última rejeição; datas sem hora.

## Situação em 03/11/2026 (para a apresentação)
Feito no **Resumo**: botão Candidatura | Fotografia (XP · Alternador 1.0.0), cabeçalho novo, cards (Aplicações existentes, Em andamento
e paradas em D, Contratadas no período, Taxa de aprovação do período, SLA das contratadas no período, Entrevistas igual), Onde a esteira
perde (decisões do período + estoque em D), Destaques, Consumo do SLA (contratações do período), Onde estão (estoque em D),
Funil e "por contratação" acinzentados (Funil 1.3.0, Card de KPI 1.5.0, Barras 1.2.0). Medidas: `docs/62`, `63`, `63b`, `63c`.
Visto em foto do Danilo: botão, Aplicações 117.161 em 25/10, 25.028 paradas há mais de 45 dias em 25/10, taxa com 17.884 aprovações
e 16.622 reprovações (01–25/10). Falta conferir em foto os gráficos depois da troca de campos.
Não feito: Report, Nominal, Data Quality, página Conceitos; comparação "foto × foto" (vs 30 dias antes).

## Funil na Fotografia (decidido em 03/11/2026: caso A)
Funil **congelado no último dia**: o mesmo grupo do modo Candidatura (aplicações que entraram no período), contando só o que tinha
acontecido até D (entrada na etapa ≤ D; contratada até D). É funil de verdade (mesmo grupo do início ao fim), então "aplicações por
contratação" também vale, com o texto "… contratações até dd/mmm". O cinza sai (avisos voltam vazios). Medidas: `docs/64-funil-fotografia.dax`.
Pontos a deixar claros na tela: (1) período que termina hoje → igual ao modo Candidatura; (2) quem entrou nos últimos dias do período
ainda não teve tempo de avançar, então o funil e a relação por contratação parecem piores do que vão ficar.
Alternativa descartada (B · chegadas por etapa no período): grupos diferentes em cada barra, não é funil.
Visto em foto do Danilo (01–25/10, depois do docs/64): Fotografia ≤ Candidatura em todas as etapas (Mindsight Fit 10.961 × 11.032,
Testes Online 4.667 × 4.842, recrutador 2.763 × 2.924, contratadas 81 × 86; 217,8 × 205,1 por contratação). Diferença pequena porque
o período termina perto do fim da base (só uma semana a mais de andamento). Das 208 contratações de 01–25/10, 81 vieram do grupo de outubro.
A conferir: relógio do cabeçalho mostra 23/10 12:26, mas há movimento depois de 25/10; topo do funil (17.488) × Aplicações (17.642).

## Funil na Fotografia, versão final (03/11/2026: caso C, substitui o A)
O Danilo pediu que o funil da Fotografia olhe **todas as aplicações que existiam em D** (o mesmo grupo do card Aplicações, 117.161 em 25/10)
e mostre até onde tinham chegado até D; contratadas = contratadas até D. Continua funil de verdade (grupo fixo, um momento só) e fica
coerente com o resto da página. Pontos a deixar claros: só o último dia importa (o início do período não muda o funil); o grupo é o
acumulado da base desde 01/07; mistura aplicações antigas e novas. Medidas: `docs/65-funil-fotografia-existentes.dax`.
Nos 2 cards "por contratação", o selo passa a `Esteira | Card Período Estoque` ("em 25/out"). Subtítulo fixo do fundo
("Aplicações do período que chegaram…") fica errado na Fotografia: trocar por texto dinâmico (parte seguinte).

## 04/11/2026 · Card Aplicações igual nos dois modos
Pedido do Danilo: o big number Aplicações do Resumo mostra as **criadas no período** também na Fotografia (Candidatos, 17.642 em
01–25/10), com texto, selo do período e comparações da Candidatura. Medidas: `docs/76-aplicacoes-criadas-no-periodo.dax`.
O funil da Fotografia segue com as existentes em D. Efeito junto: coluna Aplicações do "Aprovados por recrutador".
Pendente de decisão: alinhar as visões Aplicações e Por recrutador da Nominal (hoje, na Fotografia, listam as existentes em D).
