# 36 · Etapa 6: páginas "Dados do dash" e "Alertas" (plano)

Decisões (25/10/2026), a partir dos mockups `docs/mockups/`:
- **Dados do dash = versão B** (menu lateral com ícone, descrição e contagem). `docs/mockups/34-dados-versao-B.png`.
- **Alertas = v2** (big numbers no padrão do dash com o insight embaixo, ⓘ em cada alerta), com o recorte do "Onde acontece" escolhido por **botões segmentados** (recrutador · etapa · vaga · esteira…). `docs/mockups/35-alertas-v2.png`.
- **Em TODAS as tabelas nominais:** "Mostrando 50 de N" + botão **"Mostrar mais 100"**, e **"Colunas ▾"** para escolher as colunas.
- Nome do candidato: coluna **`nome_completo`** na 13 (`first_name` + `last_name`, que estão na 13).

## Partes
| # | Parte | Entrega |
|---|---|---|
| 6.1 | **Base no modelo** | `nome_completo`, tabela `dVisao` (as visões do menu) e as medidas "está na visão" e "contagem da visão" para as visões por aplicação · `docs/36-dados-parte1.dax` |
| 6.2 | Visual **XP · Menu de visões** | menu lateral da versão B (ícone, nome, descrição, contagem), seleção filtra `dVisao` |
| 6.3 | Visual **XP · Tabela nominal 2.0** | colunas por visão, Colunas ▾, Mostrar mais 100, busca, CSV, linha do tempo com "Voltou", selos de alerta, "Só exceções", segmentos como big numbers |
| 6.4 | Visões por passagem, entrevista e movimentação | SLA por etapa, Entrevistas e Evolução com lista (1 linha por aplicação; passagens/entrevistas/movimentos viram colunas) |
| 6.5 | Botões **"Ver aplicações ↗"** | passo a passo: um indicador (bookmark) por visão + botão em cada gráfico |
| 6.6 | Página **Alertas** | big numbers (Card de KPI), tipos com ⓘ, "Onde acontece" com recorte por botões, tabela 2.0 |
| 6.7 | Página **Conceitos** | textos dos alertas, tipos de encerramento, "Voltou", "Saiu para outra vaga", origem da contratação |
| 6.8 | Demais tabelas nominais | Base nominal, Tabela nominal (Pré Offer/Offer) e Detalhe com Colunas ▾ e Mostrar mais 100 |

## Andamento
- **6.1 concluída (25/10/2026):** contagem = lista em todas as visões por aplicação (Aplicações 122.394 · Contratadas 677 · Em andamento 51.590 · Funil 122.394 · Entradas por etapa 121.929 · Rejeitados e motivos 69.903 · Andamento por faixa 51.590 · Por recrutador 122.394); SLA por etapa 172.440 passagens · Evolução 136.103 movimentações · Entrevistas 8.218.
- **6.2 pronta para instalar:** `docs/37-menu-visoes.md`, `dist/XP - Menu de visoes 1.0.0.pbiviz`.

- **6.2 instalada e aprovada (25/10/2026).**
- **6.3 pronta para instalar:** `docs/39-tabela2.md`, `docs/38-tabela2.dax`, `dist/XP - Tabela nominal 2.0.0.pbiviz`.
- **6.3 ajustes (25/10/2026):** lentidão e 1.205 linhas para 77 contratadas por causa de `fonte_contratacao` nas Colunas fixas (muda dentro da aplicação) · versão rápida em `docs/40a-colunas.dax` + `docs/40b-medidas.dax`.
- **6.4 + pedidos da homologação (25/10/2026):** `docs/41-visoes-completas.dax` e `dist/XP - Tabela nominal 2.1.0.pbiviz`:
  - SLA por etapa, Evolução e Entrevistas com lista; o número do menu dessas 3 passa a ser de aplicações (antes passagens, movimentos e entrevistas);
  - coluna **SLA (dias)** em todas as visões (início do ciclo → contratação, rejeição ou hoje);
  - dias e SLA com selo cinza / âmbar (> 30) / coral (> 45), também na linha do tempo;
  - abrir uma linha não volta mais a rolagem para o topo.

- **Páginas (decisão 25/10/2026):** Conceitos · Resumo · Report · **Nominal** · **Data Quality**. A página "Dados do dash" vira a nova **Nominal** (menu de visões + tabela 2.0); a Nominal antiga já foi apagada. "Alertas / Pontos de atenção" passa a se chamar **Data Quality**. Fundos com o 5º item no submenu: aprovados e copiados para `backgrounds/` (gerados por `tools/gen_bg_dataquality.py`).

- **Entrevistas rápida conferida (25/10/2026):** contagem 5.501 = na lista 5.501 = aplicações com coluna 5.501.
- **6.6a pronta para aplicar:** `docs/45-data-quality.md`, `docs/45-data-quality.dax` + `docs/41` com a visão "Alertas"; regra de cor âmbar/coral para tipos, cards e "Onde acontece".

## Backlog desta etapa
- **Nomes com sujeira na base** (vistos em `nome_completo`): "_Fabio", "^david nathan", nomes vazios, "[TESTE] …" e "#VALUE!". Avaliar um alerta de dado "Nome inválido" e a exclusão de candidatos de teste.
- **Botão "Limpar filtros"** da faixa de filtros ativos: redesenhar (ficou feio no mockup).
- **Faixa "Filtros ativos"**: construir depois (aprovada no mockup).
- **Filtros que bloqueiam cliques:** as caixas da barra de filtros precisam de altura para a lista abrir, e essa área invisível cobre o que está embaixo (ex.: na Evolução, o Período impede clicar em Aprovados × Entrevistas). Proposta: deixar as caixas baixas (~50 px) e abrir a lista numa **janela** (modo "janela" que a Segmentação 2.2 já tem; levar o mesmo para o Período e o Organograma). Alternativa: um botão "Filtros" que abre um painel por indicador.
