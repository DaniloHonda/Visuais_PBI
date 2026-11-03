# 71 · Página Nominal no modo Fotografia (03/11/2026)

Decisão do Danilo: **sem Detalhamento** a partir dos gráficos (o botão "Ver aplicações ↗" do doc 50 sai do plano). A Nominal é só
o **Menu de visões** (uma visão por gráfico) e **uma Tabela nominal** com a lista da visão escolhida.

## Na Fotografia (medidas em `docs/70-fotografia-nominal.dax`)
| Visão | Lista no modo Fotografia | Número (= gráfico) |
|---|---|---|
| Aplicações · Funil · Por recrutador | aplicações que existiam em D | Foto Existentes |
| Contratadas | contratadas no período (data da contratação) | Fluxo Contratadas |
| Em andamento · Andamento por faixa | em andamento em D (dias contados até D) | Foto Em Andamento |
| Rejeitados e motivos | rejeitadas no período | Fluxo Reprovações |
| Entradas por etapa | entrou, foi aprovada ou rejeitada no período, ou estava na etapa em D | Foto Aplicações na Etapa |
| SLA por etapa | etapa concluída no período | Fluxo Aplicações com Etapa Concluída |
| Evolução · Entrevistas · Alertas | iguais nos dois modos | — |
Colunas novas na Fotografia: Situação no dia, Etapa no dia, Situação hoje; Dias na etapa e SLA (dias) contados até D.

## Troca de campos
- Alternador: copiar do Resumo e colar na Nominal → Sincronizar.
- Menu de visões: Contagem → `Esteira | Visão Contagem Modo` (tirar o campo "Visão alvo", se tiver).
- Tabela nominal: Dados da visão → `Esteira | Visão Dados Modo` · Contexto → `Esteira | Visão Contexto Modo`.

## Conferência da parte A (foto do Danilo, 03/11, Fotografia 01–25/10)
contagem = na lista em todas as visões visíveis: Aplicações 117.161 · Contratadas 208 · Em andamento 51.222 · Funil 117.161 ·
Entradas por etapa 66.114 · Rejeitados e motivos 16.622 · Andamento por faixa 51.222 · SLA por etapa 28.430 (941 ms).
Por recrutador (9ª linha) ficou fora da foto. Falta: foto da parte B e parte C.

## Conferência da parte B (fotos, 03/11)
Rodou (1,35 s). "Em andamento": 290507619002 parada > 45 d em Phone Screening (90 dias em 25/10), 287492680002 até 45 d
(Phone Screening, 4 dias), 221786095002 sem etapa no dia (lacuna). "Entradas por etapa": a 287492680002 saiu como "Triagem"
com saída 21/10 e "Em andamento" — mistura de duas passagens com a mesma entrada (21/10) no TOPN. Correção: desempate por
passagem aberta primeiro (saída vazia) e depois pela etapa (linha `VAR PassUlt` do B3).

## Conferência da parte C (foto, 03/11)
Em andamento n=51.222 "aplicações em andamento em 25/10" · Entradas por etapa n=66.114 "…de 01/10 a 25/10" ·
SLA por etapa n=28.430 "…· 38.918 passagens"; segs e ordem certos (178 ms). Falta: foto da correção do desempate (B3) e a página
depois da troca de campos.

## Números baixos na Nominal (foto, 03/11, modo Candidatura 01–25/10)
Menu: Aplicações 11.650 (Resumo: 17.642), Contratadas 73 (86), Em andamento 185, Rejeitados 174 — e o cabeçalho diz
"174 aplicações rejeitadas **em Phone Screening**" com a segmentação Etapa em "Todos". Causa: filtro escondido em dEtapa = Phone Screening,
sobra do Detalhamento (campos de Detalhamento da página com "Manter todos os filtros"). Tirar os campos de Detalhamento, os filtros
da página, o botão Voltar e o campo "Visão alvo" do menu; conferir indicadores.

## Lentidão (03/11)
Números batendo depois de tirar o filtro do Detalhamento, mas a tabela demora muito (ex.: Entrevistas, 1.057).
Causas prováveis: (1) o Contexto é calculado em cada linha e conta a visão inteira (n=, e na Entrevistas o total de entrevistas);
(2) o filtro do visual ainda é `Visão Na Lista` (Candidatura) → na Fotografia a lista sai errada; (3) na Fotografia as listas são
grandes (51 mil a 117 mil) e a tabela carrega tudo em blocos de 10 mil. Passo 1: `docs/72-nominal-desempenho.dax` (Contexto Leve),
filtro do visual → `Visão Na Lista Modo`, máximo carregado 20.000, medir no Analisador de desempenho.

## Lista não bate com o menu (foto, 03/11, Fotografia): 80 de 208 contratadas, "Carregando a lista inteira…"
A tabela estava **sem filtro do visual**. Sem `Visão Na Lista Modo` é 1, a consulta devolve todas as aplicações (jornada, seguintes,
alertas e contexto têm valor em todas), em blocos de 10 mil; a tabela descarta quem não está na visão e para no "Máximo de linhas
carregadas" → só as contratadas que caíram nos primeiros blocos (80). É também a causa principal da lentidão.
Correção: filtro do visual `Esteira | Visão Na Lista Modo` é 1. Filtros da página que sobraram do Detalhamento (data_saida_stage,
rejection_reason_name, saiu_na_etapa, todos "(Tudo)") podem sair.

## Analisador de desempenho (foto, 03/11 13:04)
Tabela nominal 50.307 ms na primeira carga e 4.537 ms depois de trocar a visão; menu 824 ms; o resto 0,1–0,6 s. A página ainda está
como **Tipo de página = Detalhamento** com "Manter todos os filtros" ligado (painel Formato da página) → trocar para Página de relatório.
Danilo: o CSV precisa baixar a lista inteira (não dá para limitar as linhas carregadas) → "Máximo de linhas carregadas" ≥ 150.000.
Proposta (2.2.0, com prévia antes): (1) a tabela calcula "Etapa no dia", "Dias na etapa" e "Resultado no dia" a partir da linha do
tempo (`jornada_txt`, que já tem etapa|entrada|saída|resultado|dias) e a data da foto vinda no contexto → a linha da Fotografia fica
tão leve quanto a da Candidatura; (2) mostra as primeiras linhas enquanto carrega o resto, e o CSV espera a lista completa.

## Tabela 2.2.0 importada (foto, 03/11): Fotografia · Contratadas 208 no cabeçalho = menu, Direto 161 + Via pool 46 + Dentro do pool 1,
CSV liberado. Próximo: parte 2 do `docs/74` (linha leve com tokens).
