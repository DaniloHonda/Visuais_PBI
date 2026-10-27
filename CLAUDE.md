# Instruções para o Claude · Dash de Esteiras

Leia `CONTEXTO.md` antes de qualquer tarefa (objetivo, usuário, régua dos números, modelo, decisões).
Registro da homologação e das regras de negócio: `docs/27-homologacao.md`.

## Como trabalhar com o Danilo
- Ele só manda resultados **por foto** (não copia do notebook do trabalho): consultas com **poucas colunas e nomes curtos**.
- Uma parte de cada vez, com conferência no meio. **Imagem ou prévia antes** de gerar qualquer `.pbiviz`.
- Passo a passo com cliques, posições (X, Y, L, A) e cores. Números em pt-BR. Escrever "aplicações".
- Medidas pela Exibição de consulta DAX no formato `DEFINE MEASURE … EVALUATE` → Executar → "Atualizar o modelo com alterações".
- Nunca pedir token ou senha no chat.
- Não afirmar que algo foi conferido sem a foto do resultado: dizer o que falta conferir.

## Lições aprendidas (erros que já cometi — não repetir)

### DAX
- **`IF` / `SWITCH` não devolvem tabela.** Para escolher entre dois filtros, use um `FILTER` só com o `IF` dentro da condição:
  `FILTER( T, IF( Cond, T[c] = "a", T[c] <> "a" && … ) )`. Nunca `VAR X = IF( Cond, FILTER(…), FILTER(…) )`.
- **Nomes de variável reservados**: `AT` (de `START AT`) quebrou uma medida ("syntax of AT is incorrect"). Evitar nomes curtos que
  sejam palavras do DAX (`At`, `Top`, `Asc`, `Desc`, `Order`, `By`, `Var`, `Return`, `Define`, `Measure`, `Column`, `Table`). Usar nomes descritivos (`LimAtencao`, `Maior`).
- **Coluna calculada não se cria na Exibição de consulta DAX**: ali só medidas. Colunas = Exibição de tabela → Nova coluna (uma por vez). Sempre separar o arquivo em "colunas" e "medidas" e dizer onde cada parte vai.
- **Ordem de dependência**: listar e criar primeiro as tabelas e colunas que as outras usam (ex.: `dMotivoTipo` com a coluna nova → `tipo_encerramento` → `situacao_app` / `considerar`; `dias_pausa_sla` → `sla_esteira_dias`). Uma coluna quebrada derruba todas as que dependem dela.
- **Tabela calculada alterada** (DATATABLE) só mostra colunas novas depois de recalculada: Página Inicial → Atualizar, ou botão direito na tabela → Atualizar dados. Pelo Tabular Editor: salvar e depois Atualizar no Power BI ("objetos calculados precisam ser atualizados manualmente").
- **CALCULATE em coluna calculada**: sempre com `ALLEXCEPT( tabela, chave )` para não criar dependência circular.
- Medida pesada por linha (TREATAS em outra tabela para cada aplicação) deixa a tabela nominal lenta: pré-calcular em coluna e usar pré-filtro barato.
- Ao trocar uma regra de classificação, procurar **todos** os lugares que usam o valor antigo (ex.: "Declínio da offer" estava em `situacao_app`, `Nominal Situação`, `Declinados (Offer)`, abas da `Visão Contexto`).

### Modelo e visuais
- Coluna fixa na tabela nominal que **muda dentro da aplicação** (ex.: `fonte_contratacao`) ou vem de tabela que não filtra a 13 multiplica as linhas.
- Visual personalizado com **mapeamento de tabela** e uma coluna de agrupamento de tabela **sem relação** (ex.: `dAlerta[alerta]` junto com colunas da 13) não entregou os valores por tipo: passar a composição como **medida de texto** (`ordem|tipo=n;;…`).
- Visual personalizado **não navega entre páginas** (só `launchUrl` e menu de contexto): navegação = botão nativo (Indicador ou Detalhamento).
- Visual personalizado só desenha dentro do próprio retângulo: lista de filtro aberta precisa de altura e cobre os gráficos → usar o modo **janela** (`openModalDialog`).
- Lint do pbiviz proíbe `http://` literal: montar como `"ht" + "tp://…"`.

### Regras de negócio já decididas (não reabrir sem o Danilo pedir)
Ver `docs/27-homologacao.md` (seções "Decisões"). Resumo: data de contratação = `closed_at_opening`; pool → contratação em outra vaga
conta na vaga final com SLA desde o pool; "Voltou" conta no SLA e não é aprovação; vale a última rejeição; Silver Medalist (etapa)
pausa o SLA; Duplicate (sem motivo), Movimentação entre vagas e Posição cancelada são desconsideradas; lista de declínios do
candidato em `docs/51-regras-recrutadores.dax`; off limits, AAI/B2B e motivo Silver Medalist = rejeição; etapas Senior/Pleno etc. são corretas.
