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
