# 77 · Macroetapas (04/11/2026) · rascunho para validar

Pedido: os gráficos por etapa mostram muitas etapas. Agrupar em **7 macroetapas**, mostrar só a macro e, ao clicar, abrir as etapas dela.
Ordem das macros: Triagem → Qualificação → Avaliação R&S → Entrevistas de liderança → Avaliação técnica → Checagem → Offer.
✓ = definido pelo Danilo (validado com liderança B2C/B2B) · ? = sugestão, alinhar com os recrutadores.

| Macroetapa | Etapas |
|---|---|
| Triagem | ✓ Revisão de aplicação · ✓ Priorizados IA · ✓ Mindsight e PI Cognitivo · ✓ Mindsight - Fit cultural · ✓ Ranking Score · ? Testes Online · ? Validação de laudo |
| Qualificação | ✓ Entrevista Inteligente · ✓ Qualificação · ✓ Phone Screening · ? Phone Interview · ? Vídeo Entrevista- Jovem Aprendiz · ? Aprovados - Recrutamento · ? Pool Qualificados · ? Longlist · ? Short List · ? Stand-by \| Silver medalist |
| Avaliação R&S | ✓ Etapa com Recrutamento · ✓ Confirmados na dinâmica · ? Entrevista R&S |
| Entrevistas de liderança | ✓ Entrevista com supervisor · ✓ Entrevista com coordenador · ✓ Entrevista com Head · ? Entrevista com líder · ? Entrevista com os Líderes · ? Entrevista com Hiring Team · ? Avaliação - Líder · ? Avaliação - Pares ou Stakeholders · ? Entrevista com Bar Raiser · ? Bar Raiser |
| Avaliação técnica | ✓ Avaliação técnica |
| Checagem | ✓ Background Check · ✓ Análise de Crédito · ? Comitê de contratação · ? Executive Review |
| Offer | ✓ Pré Offer · ✓ Offer |

## Como entra no modelo
- A `dEtapa` já tem `grupo` / `ordem_grupo` (hoje: Triagem, Avaliações, Entrevistas, Checagens, Offer). A macroetapa **substitui o grupo**:
  mesmo nome de coluna, então a Matriz de calor (linhas de grupo e botão Etapa | Grupo) e `Esteira | Etapas do Grupo` passam a usar as macros.
- A `ordem` das etapas é renumerada para seguir a ordem das macros (cada macro em sequência). Atenção: `Esteira | Chegaram ao Recrutador`
  usa a ordem 14 fixa (Etapa com Recrutamento) → trocar para buscar a ordem pelo nome.
- Falta a lista completa de etapas da `dEtapa` atual (tem mais etapas que a versão do repositório) e das etapas fora dela: consulta M1.

## Visuais (depois da tabela)
Linha da macro com o total; clique abre as etapas. Começar por "Aprovados por praça em cada etapa" (Matriz de calor) e
"Entradas e aprovações por etapa" (Tabela por etapa); depois Onde perde, SLA por etapa, Rejeitados e Em andamento × faixa. Prévia antes.

## Lista real (foto do Danilo, 04/11): 115 etapas na dEtapa + 1 linha com nome de etapa vazio
- Todas as etapas da base estão na dEtapa. As "477 aplicações com etapa sem ordem" (docs/66) são linhas da 13 com **stage_name vazio**
  (579 aplicações têm alguma linha assim): não é etapa faltando na dEtapa, é dado sem nome de etapa → Data Quality / engenharia.
- Grupos antigos: Triagem, Avaliações, Entrevistas, Pools, Outros, Checagens, Offer. "Outros" e "Pools" são etapas de vagas de pool
  (Pool Varejo, Pool Tecnologia…, Júnior/Pleno/Sênior, AMS/Clients/Middle Operations, Offshore…).
- Macro por regra de nome: `docs/77-macroetapas-colunas.dax` (colunas `macro` e `ordem_macro` na dEtapa). Proposta de 8ª macro "Pool".
- Atenção: a coluna "apps" da consulta M1 conta aplicações com **linha** na etapa, inclusive etapas não alcançadas (a 13 tem linha
  para todas as etapas da vaga). Ex.: 8.770 em vários Pools = todas as aplicações daquela vaga de pool.

## Conferência M2 (foto, 04/11): Triagem 14 · Qualificação 18 · Pool 32 · Avaliação R&S 10 · Liderança 30 · Avaliação técnica 2 ·
Checagem 5 · Offer 4 = 115 (todas). Como Triagem era o "resto" da regra, a regra passou a listar a Triagem e o resto vira
"Sem macro" (ordem 9): etapa nova no Greenhouse aparece como "Sem macro" em vez de cair na Triagem sem ninguém ver. Consulta M4.

## M4 (foto, 04/11): nenhuma etapa da dEtapa sem macro · na base, só o nome vazio (579 aplicações) fica fora → engenharia.

## Passo 2 · Matriz "Aprovados por praça em cada etapa" por macro (sem visual novo)
`Esteira | Grupo da Etapa` = macro e `Esteira | Ordem da Etapa` = ordem_macro × 1000 + ordem (as etapas de cada macro ficam juntas).
Formatar → Textos → Botão de grupo = "Macroetapa". Não classificar `dEtapa[stage_name]` por coluna derivada dele (dependência
circular): a ordem por macro vai pelas medidas de ordem dos visuais.
