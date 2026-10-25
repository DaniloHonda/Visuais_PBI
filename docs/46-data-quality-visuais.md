# 6.6b · Data Quality: visuais e posições

Prévia com os números reais da conferência: `docs/mockups/46-data-quality-visuais.png` (desenho aprovado: `docs/mockups/44-data-quality.png`).
Pacotes: `dist/XP - Card de KPI 1.3.0.pbiviz` · `dist/XP - Tipos de alerta 1.0.0.pbiviz` (novo) · `dist/XP - Tabela nominal 2.1.1.pbiviz`.

Página **Data Quality** · 1900 × 1720 · fundo `BG - Esteiras_DataQuality.svg` · barra de filtros copiada da Nominal.

## 0. Importar
Visualizações → ⋯ → Importar um visual de um arquivo → os 3 arquivos. O Card de KPI 1.3.0 substitui o 1.2.1 em todas as páginas (os cards atuais não mudam).

## 1. Cards (XP · Card de KPI 1.3.0) · Y 380 · L 372 · A 180
| Card | X | Valor | Texto de contexto | Linha de insight | Status |
|---|---|---|---|---|---|
| Com algum alerta | 310 | DQ Com Alerta | DQ Com Alerta Texto | DQ Com Alerta Insight | DQ Com Alerta Status |
| Voltou de etapa | 700 | DQ Voltou | DQ Voltou Texto | DQ Voltou Insight | DQ Voltou Status |
| Sem motivo na base | 1090 | DQ Sem Motivo | DQ Sem Motivo Texto | DQ Sem Motivo Insight | DQ Sem Motivo Status |
| Contratada no pool | 1480 | DQ No Pool | DQ No Pool Texto | DQ No Pool Insight | DQ No Pool Status |

(todas as medidas começam com `Esteira | `). Período do valor: `Esteira | Período Selecionado` (igual aos cards do Resumo).

Formatar: Cabeçalho → Título (o nome da tabela acima) · Valor → Unidades de exibição **Nenhum** · Comparação e Acumulado **desligados** ·
**Explicação (ⓘ)** → colar o texto:
- Com algum alerta: "Aplicações do período com pelo menos um alerta de processo ou de dado. Uma aplicação pode ter mais de um. Use os Tipos de alerta para ver cada um."
- Voltou de etapa: "A aplicação saiu de uma etapa e foi para uma etapa anterior do fluxo. O tempo conta no SLA e a etapa de onde voltou não conta como aprovação."
- Sem motivo na base: "Aplicação rejeitada sem motivo na base. Na maioria dos casos é o 'Duplicate' do Greenhouse, que chega vazio."
- Contratada no pool: "A contratação foi registrada na própria vaga de pool, em vez de mover a pessoa para a vaga final. A origem e o SLA da contratação ficam errados."

Cor: Status = critico → coral, atencao → âmbar (Formatar → Status muda as cores).

## 2. Tipos de alerta (XP · Tipos de alerta 1.0.0)
1. Fundo: Inserir → Formas → Retângulo arredondado · X 310 · Y 580 · L 770 · A 430 · branco, borda #E6E6E6 1 px, cantos 22.
2. Visual por cima: **X 334 · Y 600 · L 722 · A 392**, fundo desligado.
3. Campos: Alerta `dAlerta[alerta]` · Grupo `dAlerta[grupo]` · Ordem `dAlerta[ordem]` · Explicação `dAlerta[descricao]` · Onde corrigir `dAlerta[onde_corrigir]` ·
   Aplicações `Esteira | Aplicações com Alerta` · % `Esteira | % com Alerta` · Status `Esteira | DQ Status`.
4. Clicar num tipo filtra a página (Onde acontece e a tabela). Clicar de novo, ou em "× Ver todos os alertas", tira o filtro. Os cards não mudam.

## 3. Onde acontece
1. Fundo: retângulo arredondado · X 1100 · Y 580 · L 752 · A 430 (mesmo estilo).
2. **Título** (muda com o tipo escolhido): Cartão (novo) com `Esteira | DQ Onde Título` · X 1124 · Y 596 · L 700 · A 34 · rótulo da categoria desligado, valor Segoe UI 20 negrito #121212, alinhado à esquerda, sem fundo.
3. **Subtítulo:** caixa de texto · X 1124 · Y 628 · L 700 · A 22 · 12,5 cinza #6B6B6B: "aplicações com o alerta · % sobre as aplicações de cada um · âmbar/coral = bem acima da média".
4. **Botões:** Segmentação de dados · campo `pOnde` · X 1124 · Y 660 · L 560 · A 38 · Formatar → Configurações da segmentação → Estilo **Bloco**,
   seleção única ligada, orientação horizontal · cabeçalho desligado · cor de seleção #067D84, texto branco.
5. **Barras:** Gráfico de barras clusterizado · X 1124 · Y 708 · L 704 · A 286
   - Eixo Y `pOnde` · Eixo X `Esteira | Aplicações com Alerta` · classificar por Aplicações com Alerta, decrescente;
   - Barras → Cor → **fx** → Valor do campo → `Esteira | DQ Onde Cor`;
   - Rótulos de dados ligados · Detalhes do rótulo: `Esteira | DQ Onde %`;
   - Eixo X desligado, linhas de grade desligadas, título desligado.

Regra da cor: com 20+ aplicações, taxa de alerta ≥ 1,5× a geral = âmbar; ≥ 2× = coral; resto cinza.

## 4. Tabela (XP · Tabela nominal 2.1.1)
1. Copiar a tabela da página Nominal (Ctrl+C) e colar aqui (Ctrl+V): mesmos campos e o filtro do visual `Visão Na Lista = 1`.
2. Posição: **X 310 · Y 1030 · L 1542 · A 650**.
3. **Filtro da página:** Filtros nesta página → `dVisao[visao]` → só **Alertas**.
4. Selos na coluna Alertas: dado = cinza, processo = âmbar, coral para "Contratada dentro do pool" e "Voltou de etapa (3× ou mais)".

## Teste
1. Os 4 números = conferência D2/D1 (16.867 · 8.023 · 4.162 · 1), com as cores âmbar e coral.
2. Clicar "Voltou de etapa" → título "Onde acontece: "Voltou de etapa"" e a tabela com 8.023 e "✓ igual ao gráfico".
3. Trocar Recrutador → Etapa → Vaga nos botões; as barras mais fora da média ficam âmbar/coral.
