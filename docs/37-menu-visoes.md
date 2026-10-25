# 37 · XP · Menu de visões 1.0 (página "Dados do dash")

Menu lateral da versão B (`docs/mockups/34-dados-versao-B.png`): ícone, nome, descrição e contagem de cada visão. Clicar numa visão **filtra `dVisao[visao]`**; as medidas `Esteira | Visão Contagem` e `Esteira | Visão Na Lista` (parte 6.1, `docs/36-dados-parte1.dax`) leem essa escolha. Sem nada escolhido, vale a visão do campo "Visão sem seleção" (padrão: Aplicações).

Prévia (dados fictícios): `docs/37-menu-visoes-preview.png` · Pacote: `dist/XP - Menu de visoes 1.0.2.pbiviz` (1.0.1: campo **Ordem**, cada grupo aparece uma vez só · 1.0.2: Formatar → Menu → **Ordem dos grupos** = `Resumo;Report`, o Resumo vem sempre primeiro).

## Passo a passo
1. **Nova página** → renomear para `Dados do dash`. Tamanho igual à Nominal (1900 de largura). Fundo: o mesmo da Nominal por enquanto (`BG - Esteiras_Nominal.svg`).
2. **Barra de filtros:** copiar da Report e colar → "Sincronizar".
3. **Importar o visual:** Visualizações → ⋯ → Importar um visual de um arquivo → `XP - Menu de visoes 1.0.0.pbiviz`.
4. **Inserir** → posição **X 300 · Y 370 · L 260 · A 720** (dentro do cartão branco grande, à esquerda). Formatar → Geral: desligar Título e Plano de fundo.
5. **Campos:**

| Campo do visual | O que colocar |
|---|---|
| Visão | `dVisao[visao]` |
| Grupo | `dVisao[grupo]` |
| Descrição | `dVisao[descricao]` |
| Ícone | `dVisao[icone]` |
| Ordem | `dVisao[ordem]` (1.0.1) |
| Contagem | `Esteira \| Visão Contagem` |

6. **Formatar → Menu:** "Visão sem seleção" = `Aplicações`; descrição e contagem ligadas. **Cores:** destaque `#067D84`, fundo `#FFFFFF`.
7. **Interações:** o menu não deve ser filtrado por nada da própria página além da barra de filtros (padrão do Power BI: ok).

## Teste
- A contagem de cada visão muda com a barra de filtros (ex.: escolher um recrutador).
- Clicar em "Contratadas" destaca a linha. Até a tabela 2.0 (parte 6.3) chegar, dá para conferir com um cartão simples com `Esteira | Visão Contagem` na página: ele mostra o número da visão escolhida.
- A escolha fica salva no indicador (bookmark): é assim que os botões "Ver aplicações" vão abrir a página na visão certa (parte 6.5).

## 1.1.0 · Formato horizontal (cards em cima da tabela)
Prévia: `docs/37-menu-horizontal-preview.png`. Pacote: `dist/XP - Menu de visoes 1.1.0.pbiviz`.
Formatar → Menu → **Formato: Horizontal (cards em cima da tabela)**. Um bloco por grupo (Resumo | Report) e um card clicável
por visão com nome, número grande (Visão Contagem) e descrição.

Página Nominal (1900 × 1720):
| Item | X | Y | L | A |
|---|---|---|---|---|
| Menu de visões (horizontal) | 310 | 372 | 1552 | 140 |
| Tabela nominal 2.x | 310 | 524 | 1552 | 1156 |
A linha divisória vertical (X 566) sai.
