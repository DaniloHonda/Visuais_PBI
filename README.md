# XP · Visuais Power BI

Biblioteca de visuais personalizados (.pbiviz) no padrão visual da XP, para todos os dashboards do time.

| Visual | Pasta | Status | Uso típico |
|---|---|---|---|
| XP · Card de KPI | `visuals/xpKpiCard` | v1.2.1 | Big numbers com comparação, acumulado, meta e selo de período |
| XP · Funil | `visuals/xpFunnel` | v1.2.0 | Etapas com número, % do total e % da etapa anterior |
| XP · Barras com composição | `visuals/xpCompositeBars` | v1.1.0 | Barras empilhadas por linha com busca, ordem, indicador, resumo, parte em destaque e ranking (Pareto) |
| XP · Lista de destaques | `visuals/xpHighlights` | v1.0.0 | Faixas com número grande e cor por status, vindas de medidas de texto |
| XP · Consumo da meta | `visuals/xpGoalUsage` | v1.1.0 | Régua do total contra a meta, repartida por item, com lista |
| XP · Segmentação | `visuals/xpSlicer` | v2.2.0 | Caixa com lista suspensa (padrão), janela de seleção ou lista aberta; busca, contagem, todos, limpar |
| XP · Período | `visuals/xpPeriod` | v2.2.0 | Caixa com calendário suspenso: atalhos (mês, trimestre atual e anterior), De/Até digitável, intervalo em dois cliques, datas futuras, limpar |
| XP · Evolução | `visuals/xpTrend` | v1.0.0 | Linhas no tempo com troca de série e granularidade, período parcial e datas futuras tracejadas |
| XP · Tabela por etapa | `visuals/xpStageTable` | v1.1.0 | Tabela por linha (etapa, recrutador…) com composição, conversão (fixa ou vs. média), SLA, busca, ordenação, total e modo compacto |
| XP · Matriz de calor | `visuals/xpHeatmap` | v1.2.0 | Matriz linhas × colunas com cor por volume, coluna de alerta, % da linha, taxa vs. média e ⓘ com detalhe da coluna |
| XP · Tabela de SLA | `visuals/xpSlaTable` | v1.0.0 | Típico (mediana) e 90% saem até (P90) por etapa, base e casos acima hoje |
| XP · Etapa e motivos | `visuals/xpMasterDetail` | v1.0.0 | Lista à esquerda; ao escolher, os itens mais frequentes à direita (top N, destaque por prefixo) |
| XP · Tabela nominal | `visuals/xpNominal` | v1.1.0 | Lista nominal com link, até 30 colunas, situação, dias com alerta, busca, botões por segmento, contadores, "Mostrar mais" e exportar CSV |
| XP · Base nominal | `visuals/xpBaseNominal` | v1.1.0 | Big numbers clicáveis que trocam a base da lista, colunas por base, linha do tempo por aplicação e exportação |
| XP · Organograma | `visuals/xpOrg` | v1.0.0 | Segmentação em árvore por níveis (N2, N3, N4…), com busca em qualquer nível e contagem |

Próximos: Tabela com link, Botões de número, Série temporal, Mapa de calor, Média x mediana.

## Padrões de todos os visuais
- Paleta e fonte XP (`src/xpTheme.ts` em cada visual; vai virar o pacote `core`).
- Números formatados em pt-BR e respeitando o formato da medida no modelo.
- Painel de formatação em português.
- Estado vazio explicando qual campo preencher.
- Menu de contexto (botão direito) e suporte a alto contraste.

## Como gerar o .pbiviz
```bash
cd visuals/xpKpiCard
npm install
npx pbiviz package      # gera dist/*.pbiviz
```
Os pacotes prontos ficam em `dist/` na raiz.

## Publicação na XP
Para uso em relatórios publicados, o .pbiviz precisa ser cadastrado pela TI como **visual organizacional** (Portal de administração do Power BI → Visuais organizacionais).

## Estrutura do repositório
| Pasta | Conteúdo |
|---|---|
| `visuals/` | Código-fonte de cada visual (TypeScript + LESS, pbiviz tools 7.2.1, API 5.11.1) |
| `dist/` | Pacotes `.pbiviz` prontos para importar no Power BI |
| `docs/` | Guias de cada visual, medidas DAX, dicionário, justificativas, roteiro e prévias |
| `backgrounds/` | Fundos de página (SVG 1900 px) do dash de Esteiras |
| `tools/` | Geradores das medidas da padronização e da página Conceitos |
| `CONTEXTO.md` | Resumo completo do projeto e das decisões, para retomar em outras conversas |

## Guias
- [00 · Todas as medidas do dash de Esteiras](docs/00-medidas-esteiras.md)
- [01 · Card de KPI](docs/01-card-kpi.md) · [02 · Funil](docs/02-funil.md) · [03 · Barras com composição](docs/03-barras-composicao.md) · [04 · Destaques](docs/04-destaques.md) · [05 · Consumo da meta](docs/05-consumo-meta.md) · [06 · Aplicações em andamento](docs/06-andamento.md) · [07 · Filtros](docs/07-filtros.md)
- [08 · Evolução](docs/08-evolucao.md) · [09 · Tabela por etapa](docs/09-tabela-etapas.md) · [10 · Matriz de andamento](docs/10-matriz-andamento.md) · [11 · Rejeitados](docs/11-rejeitados.md) · [12 · Tabela de SLA](docs/12-tabela-sla.md) · [13 · Motivos](docs/13-motivos.md) · [14 · Praça](docs/14-praca.md) · [15 · Recrutador](docs/15-recrutador.md) · [16 · Pré Offer e Offer](docs/16-nominal-offer.md) · [17 · Base nominal](docs/17-base-nominal.md)
- [18 · Padronização de conceitos](docs/18-padronizacao-conceitos.md) · [19 · Botão de indicação](docs/19-botao-indicacao.md) · [20 · Justificativas](docs/20-justificativas.md) · [21 · Roteiro de apresentação](docs/21-roteiro-apresentacao.md) · [22 · Organograma e filtros](docs/22-organograma-e-filtros.md) · `23-etapas-duplicadas.dax` (correção em avaliação)
