# 57 · Painel de filtros (página Resumo primeiro)

Prévia: `docs/mockups/55-painel-filtros-v2.png` · chips: `docs/57-resumo-filtros-preview.png`.
Pacote novo: `dist/XP - Barra de filtros 1.1.0.pbiviz`. Medidas: `docs/56-filtros-chips.dax` (já criadas).
Fundos novos (faixa de 64 px, conteúdo 139 px acima): `backgrounds/BG - Esteiras_Resumo|Report|Nominal|DataQuality.svg`
(gerados por `tools/gen_bg_faixa_filtros.py`). Alturas: Resumo 2011 · Report 4305 · Nominal 1581 · Data Quality 1581.

Ideia: fechado, a página só tem a faixa (botão Filtros + chips + Limpar). Aberto, um grupo "Painel de filtros" aparece por cima.
Visual oculto não ocupa espaço nem bloqueia clique. Os indicadores só mostram/escondem: **não mexem nos filtros**.

## 1. Subir o conteúdo e trocar o fundo
1. Formatar página → Plano de fundo da tela → imagem `BG - Esteiras_Resumo.svg` (Ajustar). Configurações da tela → Altura **2011**.
2. Selecione todos os visuais abaixo dos filtros (cards, funil, barras…) → **Ctrl+G** (agrupar) → Formatar → Propriedades → **Y = Y atual − 139**
   (ex.: 362 → 223) → **Ctrl+Shift+G** (desagrupar).

## 2. Faixa (sempre visível) · XP · Barra de filtros 1.1.0
Um visual nosso desenha tudo: botão "☰ Filtros (n)", pílulas dos filtros em uso e "Limpar filtros".
Visual personalizado não aciona indicadores, então os cliques vêm de **2 botões nativos transparentes** por cima.
| Item | Como criar | X | Y | L | A | Formatar |
|---|---|---|---|---|---|---|
| Barra de filtros | visual XP · Barra de filtros | 316 | 141 | 1540 | 52 | Campos: Filtros ativos = `Esteira \| Filtros Ativos` · Quantidade = `Esteira \| Filtros Qtde` · Título e Plano de fundo desligados · Layout: botão 150, limpar 126 |
| Clique "Filtros" | Botão → Em branco | 316 | 147 | 150 | 40 | Preenchimento **desligado**, borda desligada · Ao passar o mouse: preenchimento branco, transparência 85% · Ação: Indicador → **Filtros · aberto** · Dica: "Abrir filtros" |
| Clique "Limpar" | Botão → Em branco | 1730 | 147 | 126 | 40 | igual · Ação: Indicador → **Filtros · limpar** · Dica: "Limpar todos os filtros" |
Os dois botões ficam **acima** da barra na Seleção (Organizar → Trazer para frente).

## 3. Painel (grupo "Painel de filtros")
| Item | Como criar | X | Y | L | A | Formatar |
|---|---|---|---|---|---|---|
| Fundo escuro (fecha ao clicar fora) | Botão → Em branco | 273 | 199 | 1627 | 1812 | Preenchimento #121212 com **transparência 78%**, sem borda · Ação: Indicador → **Filtros · fechado** |
| Painel | Inserir → Formas → Retângulo arredondado | 292 | 211 | 1588 | 560 | Branco, sem borda, cantos 18, sombra ligada |
| Título | Caixa de texto "Filtros" | 316 | 223 | 300 | 28 | Segoe UI Semibold 16, #1F1F1F |
| Subtítulo | Caixa de texto "Cada clique já filtra. Clique fora do painel ou em Ver resultado para fechar." | 316 | 249 | 700 | 24 | 11, #6B6B6B |
| Período (XP · Período, o de hoje) | mover o atual | 316 | 283 | 260 | 440 | igual a hoje |
| Ver resultado | Botão → Em branco | 1700 | 727 | 156 | 36 | "Ver resultado" Semibold 13 branco, #067D84, cantos 10 · Ação: Indicador → **Filtros · fechado** |

Listas (XP · Segmentação de hoje): **Formatar → Comportamento → Formato: "Lista sempre aberta"**, L **242**, A **210**.
Mover as que já existem; Hiring Manager e Vaga = copiar uma lista (Ctrl+C/V) e trocar o campo e o título.
| Linha | Y | 596 | 850 | 1104 | 1358 | 1612 |
|---|---|---|---|---|---|---|
| 1 | 283 | Esteira `esteira` | Recrutador `recruiter_name` | Hiring Manager `hiring_manager_name` | Sourcer `sourcer_name` | Vaga `job_name` |
| 2 | 505 | Etapa `dEtapa[stage_name]` | Praça `office_name` | BK `requisition_id` | Especialidade `department_name` | Persona `persona` |
(colunas da `13_ETAPA_RECRUTAMENTO`, menos a Etapa.) Contagem de cada lista: a mesma de hoje (`Esteira | Candidatos`; Etapa: `Participantes`).

Agrupar: Exibição → **Seleção** → Ctrl+clique em fundo escuro, painel, título, subtítulo, Período, 10 listas e Ver resultado →
**Ctrl+G** → renomear para **Painel de filtros**. Na Seleção, arraste o grupo para o **topo** da lista (fica por cima de tudo).
Dentro do grupo, a ordem de cima para baixo: listas/Período/botão → títulos → painel → fundo escuro.

## 4. Indicadores (Exibição → Indicadores)
Para os três: ⋯ do indicador → **desmarcar "Página atual"** (fica só na página) e marcar **"Visuais selecionados"**.
| Indicador | Antes de criar | Dados | Exibir | Visuais selecionados (na Seleção) |
|---|---|---|---|---|
| **Filtros · aberto** | olho do grupo **ligado** | **desligado** | ligado | o grupo Painel de filtros |
| **Filtros · fechado** | olho do grupo **desligado** | **desligado** | ligado | o grupo Painel de filtros |
| **Filtros · limpar** | limpar todos os filtros (✕ do Período e "Limpar" de cada lista) | **ligado** | **desligado** | só os 11 filtros (Período + 10 listas) |

Depois de mudar as opções: ⋯ → **Atualizar**. Antes de salvar o arquivo, clique em **Filtros · fechado**.
⚠️ "Dados" ligado em aberto/fechado faz o painel zerar os filtros ao abrir e fechar. Só o "limpar" tem Dados.

## 5. Teste (Ctrl+clique nos botões no Desktop)
1. Fechado: clicar num card / botão que ficava embaixo dos filtros antigos → responde.
2. Filtros → painel abre; escolher Esteira e 2 recrutadores → chips "Esteira …" e "Recrutador 2 selecionados", botão "Filtros (2)".
3. Clicar fora do painel → fecha e os filtros continuam. Ver resultado → idem.
4. Limpar filtros → chips "Sem filtros…", todas as listas sem seleção.
5. Report/Nominal: os filtros sincronizados continuam valendo (depois replicamos o painel nelas).

## 6. Outras páginas (depois do teste)
Copiar a faixa e o grupo (Ctrl+C / Ctrl+V → "Sincronizar"), trocar o fundo e a altura (tabela acima), ajustar a altura do fundo
escuro (altura da página − 199) e criar os 3 indicadores da página (indicador vale por página).
