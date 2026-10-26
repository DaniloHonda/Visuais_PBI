# 6.5 · Botão "Ver aplicações ↗" (gráfico → Nominal)

Imagem: `docs/mockups/50-botao-ver-aplicacoes.png`. Pacote: `dist/XP - Menu de visoes 1.2.1.pbiviz` (campo novo "Visão alvo").

## Como funciona
1. Clica num ponto do gráfico (ex.: barra "Phone Screening") → o botão acende.
2. Clica em "Ver aplicações ↗" → Detalhamento para a Nominal com **todos os filtros**: o ponto clicado, os filtros da página
   e um filtro do próprio gráfico em `dVisaoAlvo` (a visão que aquele gráfico deve abrir).
3. Na Nominal, o menu lê a medida `Esteira | Visão Alvo` e seleciona o card sozinho (uma vez; depois dá para trocar).
4. Botão "← Voltar" (o Power BI cria na página de Detalhamento) volta para o gráfico.

## Passo 1 · Modelo (uma vez)
- Modelagem → Nova tabela: `dVisaoAlvo = SELECTCOLUMNS( dVisao, "visao", dVisao[visao] )` → conferir em Modelo que **não** criou relação.
- Medida: `Esteira | Visão Alvo = SELECTEDVALUE( dVisaoAlvo[visao] )`.

## Passo 2 · Página Nominal (uma vez)
1. Importar o Menu de visões 1.2.1 → campo **Visão alvo (Detalhamento)** ← `Esteira | Visão Alvo`.
2. Clicar no fundo da página → Visualizações → **Detalhamento**: arrastar `dEtapa[stage_name]`, `recruiter_name`,
   `rejection_reason_name` e a coluna de praça · **Manter todos os filtros: ligado**.
3. Mover o botão "← Voltar" que o Power BI cria para o topo (X 310 · Y 330 · L 120 · A 32).

## Passo 3 · Em cada gráfico
1. Filtro do visual: arrastar `dVisaoAlvo[visao]` para "Filtros neste visual" → marcar a visão da tabela abaixo.
2. Inserir → Botões → **Em branco** · posição: canto superior direito do bloco (X = X do bloco + L − 186 · Y = Y do bloco + 18 · L 166 · A 34).
3. Ação → Tipo **Detalhamento** → Destino **Nominal** · Dica: "Clique num ponto do gráfico para ver as aplicações".
4. Estilo (o texto "Ver aplicações ↗" fica no fundo SVG):
   - Padrão: preenchimento transparente, sem borda, sem texto;
   - Ao passar o mouse: preenchimento #067D84 com 90% de transparência;
   - Desabilitado: preenchimento branco com 40% de transparência.

| Página | Gráfico | Tipo | Visão alvo |
|---|---|---|---|
| Resumo | Onde a esteira perde aplicações | Detalhamento | Entradas por etapa |
| Resumo | Onde estão as aplicações em andamento | Detalhamento | Em andamento |
| Resumo | Consumo do SLA por etapa | Detalhamento | SLA por etapa |
| Resumo | Funil | Indicador | Funil |
| Report | Evolução da esteira | Indicador | Evolução |
| Report | Entradas e aprovações por etapa | Detalhamento | Entradas por etapa |
| Report | Aplicações em andamento por etapa | Detalhamento | Andamento por faixa |
| Report | Rejeitados por etapa | Detalhamento | Rejeitados e motivos |
| Report | SLA por etapa: típico e 90% | Detalhamento | SLA por etapa |
| Report | Motivos de saída por etapa | Detalhamento | Rejeitados e motivos |
| Report | Aprovados por praça | Detalhamento | Entradas por etapa |
| Report | Aprovados por recrutador | Detalhamento | Por recrutador |
| Report | Pré Offer e Offer | Detalhamento | Em andamento |

**Indicador** (Funil e Evolução não têm etapa/recrutador para levar): um indicador por visão, criado na Nominal com o card
escolhido, Exibir → Indicadores → ⋯ → **Visuais selecionados** (só o menu) e **Dados** ligado; o botão usa Ação → Indicador.

## Teste antes de espalhar
Fazer só "Onde a esteira perde aplicações": clicar em Phone Screening → botão → a Nominal deve abrir em "Entradas por etapa"
com Etapa = Phone Screening e o "✓ igual ao gráfico".
Depois de aprovado: gerar os fundos com a pílula "Ver aplicações ↗" em cada bloco.
