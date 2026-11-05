# 80 · Nominal mais fácil de ler (05/11/2026) · proposta, aguardando o Danilo

Prévia: `docs/80-nominal-usabilidade-preview.png` (HTML em `docs/mockups/80-nominal-usabilidade.html`).
Números da foto de 05/11 (Fotografia em 25/10, B2C); nomes e vagas fictícios; Aplicações com número ilustrativo.

## O que dificulta hoje (foto de 05/11)
1. **12 cards parecidos, com nomes cortados** ("Em andamen…", "Contrata…", "aprovou, rejeito…"). O mesmo número aparece em mais de um card:
   12.963 em Aplicações, Funil e Por recrutador, e 3.147 em Em andamento e Andamento por faixa. Não dá para saber o que muda entre eles.
2. **Duas colunas de situação** com o mesmo selo laranja ("Resultado no dia" × "Situação hoje"), **duas colunas de dias** em coral
   (Dias na etapa × SLA) e duas datas iguais (Entrada × Candidatura). Nada diz qual coluna responde a pergunta da visão.
3. **A ordem padrão contradiz a visão:** "Entradas por etapa" abre por Dias na etapa ↓, então as primeiras linhas são as que estão
   em Revisão de aplicação desde 01/07 (116 dias), ou seja, justamente as que **não** entraram no período.
4. "no dia" não diz qual dia; "job name" e "recruiter name" com nome de campo; "Só exceções (812)" × card Alertas (98) parecem a mesma
   coisa com números diferentes (Alertas conta só as aplicações criadas no período; o botão conta a lista da tela).
5. Evolução, Entrevistas e Alertas não mudam na Fotografia, e o card não avisa.

## Proposta
| # | Mudança | Onde |
|---|---|---|
| 1 | 10 cards: "Por recrutador" entra em Aplicações (mesma lista; o recrutador é filtro da barra) e "Andamento por faixa" entra em Em andamento (abas por faixa: 0–2 d … > 45 d). Descrições curtas e etiqueta "igual nos 2 modos". | filtro do menu + texto da dVisao |
| 2 | Linha "de onde vem o número" (= gráfico X) e "como ler" abaixo da frase. | tabela 2.3 + Contexto |
| 3 | Coluna em destaque = a que as abas contam. Só ela tem cor; as outras ficam neutras. "no dia" vira a data ("Resultado até 25/10"). | tabela 2.3 |
| 4 | Ordem padrão de acordo com a pergunta (tabela abaixo). | Contexto (DAX) |
| 5 | Colunas de apoio ocultas por padrão (em "Colunas"), CSV sempre com todas. "Só exceções" → "Só com alerta". | tabela 2.3 + Contexto |
| 6 | "Vaga" e "Recrutador" no lugar de "job name" e "recruiter name". | renomear o campo no visual (sem código) |

### Cada visão: pergunta, coluna em destaque e ordem
| Visão | Pergunta | Destaque (abas) | Ordem padrão |
|---|---|---|---|
| Aplicações | quais foram criadas no período | Situação | Candidatura ↓ |
| Funil | até onde chegaram | Chegou até (abas por macroetapa) | ordem da etapa ↓ |
| Em andamento | onde está parada e há quanto tempo | Faixa de dias | Dias na etapa ↓ |
| Contratadas | de onde vieram e quanto levou | Origem | Contratação ↓ |
| Entradas por etapa | o que aconteceu em cada etapa | Resultado até D | Entrada ↓ |
| Rejeitados e motivos | onde e por quê | Tipo + Motivo | Rejeitada em ↓ |
| SLA por etapa | quanto tempo levou | Faixa / Dias nas etapas | Dias nas etapas ↓ |
| Evolução | quem aprovou ou rejeitou | Movimento | Último movimento ↓ |
| Entrevistas | como foram as entrevistas | Resultado da entrevista | Última entrevista ↓ |
| Alertas | o que está errado no dado | Alertas | — |

## Decisões pendentes
- Juntar as visões (12 → 10)?
- Funil com abas por macroetapa (até onde chegou)?
- Aplicações na Fotografia = criadas no período (igual ao card do Resumo e à tabela de recrutadores); Funil continua com as que existiam em D.
