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
