# 85 · XP · Menu de visões 1.3.0 (05/11/2026) · "De qual gráfico?"

Prévias: `docs/85-menu-1.3-preview.png` (Entradas por etapa › Aprovados por praça) e `docs/85-menu-1.3-preview-b.png`
(Em andamento, com o card Em andamento escolhido). Números das conferências da Fotografia (01–25/10, sem filtro de persona).
Pacote (depois da aprovação): `dist/XP - Menu de visoes 1.3.0.pbiviz`.

## O que muda
- Campos novos: **Gráfico** (`dVisao[grafico]`), **Página do gráfico** (`dVisao[pagina]`), **Ordem do gráfico** (`dVisao[ordem_grafico]`).
  Em **Visão** vai `dVisao[card]`. Com o campo Gráfico, o menu filtra `dVisao[grafico]`.
- Um card por `card`. O card mostra nome, grupo, descrição, ícone e número do **1º gráfico** (decisão de 05/11).
- Clicar no card escolhe o 1º gráfico. Embaixo dos cards: **"De qual gráfico?"** com os gráficos do card e o número de cada um.
- Vertical: os gráficos aparecem recuados embaixo do card ativo.
- Formatar → Menu: "Título da escolha de gráfico" e "Mostrar a escolha quando o card tem 1 gráfico".
- Sem o campo Gráfico, funciona como a 1.2.1.

## Conferências da parte 2 (docs/84) · todas por foto, 05/11
Fotografia e Candidatura: graf = lista = menu nos 20 gráficos (Agenda fora até ter lista própria).

## Instalação (aprovada em 05/11)
1. DAX 2I-1 e 2I-2 (`docs/84`): primeira abertura sem clique = Card Aplicações.
2. Importar `dist/XP - Menu de visoes 1.3.0.pbiviz` por cima da 1.2.1. Campos: Visão = `dVisao[card]` · Grupo · Descrição · Ícone ·
   Ordem (iguais) · Gráfico = `dVisao[grafico]` · Página do gráfico = `dVisao[pagina]` · Ordem do gráfico = `dVisao[ordem_grafico]` ·
   Contagem = `Esteira | Gráfico Contagem`. Filtros neste visual: `dVisao[grafico]` sem "Evolução da esteira · Agenda".
3. Posições: menu X 310 · Y 372 · L 1552 · A 210; tabela X 310 · Y 594 · L 1552 · A 1086.
4. Tabela nominal: Dados da visão → `Gráfico Dados` · Contexto → `Gráfico Contexto` · filtro do visual → `Gráfico Na Lista` é 1.
