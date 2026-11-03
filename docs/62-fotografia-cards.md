# 62 · Cabeçalho novo e cards do Resumo no modo Fotografia (parte 2)

Prévia (visuais reais, números fictícios): `docs/62-cabecalho-fotografia-preview.png` (em cima Candidatura, embaixo Fotografia).
Pacotes: `dist/XP - Card de KPI 1.4.0.pbiviz` (esconde comparação e acumulado quando a medida vem vazia) · `dist/XP - Alternador 1.0.0.pbiviz`.
Fundos: `backgrounds/BG - Esteiras_*.svg` (cabeçalho novo; os fundos com a faixa do painel de filtros ficaram em `backgrounds/painel-filtros/`).

## Cabeçalho (todas as páginas)
| Item | X | Y | L | A | Observação |
|---|---|---|---|---|---|
| Alternador de modo (`dModo[modo]`) | 600 | 40 | 640 | 44 | Texto de contexto → **Ao lado** |
| Alternador de indicação (`dFiltroIndicacao[opcao]`) | 1252 | 40 | 256 | 44 | Texto de contexto → Não mostrar · padrão "Todas" · dicas `Todas as aplicações|Só as aplicações indicadas (pela aplicação ou pelo candidato)` |
| Data/hora da atualização (visual atual) | 1756 | 44 | 120 | 36 | texto 14 |
O selo "Dados desde 01/07/2026" e a caixa do relógio estão no fundo. Apagar o botão nativo "Todas | Só indicações" antigo.

## Medidas
Ver o texto do DAX na conversa de 03/11 (mesmo conteúdo): medidas `Foto …` (estoque em D), `Fluxo …` (no período),
`Card …` (valor de cada card nos dois modos) e reescrita das medidas de texto e de comparação dos cards (vazias na Fotografia).
Data da fotografia D = `Esteira | Data da Fotografia` (último dia do período, no máximo hoje); fluxo = de max(início do período, 01/07) a D.

## Troca nos cards (Formatar não muda)
| Card | Valor do período | Período do valor |
|---|---|---|
| Aplicações | `Esteira | Card Aplicações` | `Esteira | Card Período Estoque` |
| Contratados | `Esteira | Card Contratados` | (igual) |
| Em andamento | `Esteira | Card Em Andamento` | `Esteira | Card Período Estoque` |
| Conversão (título: **CONVERSÃO**) | `Esteira | Card Conversão` (formato %, 1 casa) | (igual) |
| SLA da esteira | `Esteira | Card SLA` (decimal, 1 casa) | (igual) |
| Entrevistas | igual | igual |
