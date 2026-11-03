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
