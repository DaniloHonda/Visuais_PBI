# 39 · XP · Tabela nominal 2.0 (página "Dados do dash")

A lista nominal da visão escolhida no **Menu de visões** (doc 37): colunas próprias de cada visão, **Colunas ▾** (escolher as colunas; fica salvo no relatório, por visão), **Mostrar mais 100** e **Mostrar todas**, busca sem acento, **Só exceções**, exportar CSV, linha do tempo ao clicar na linha (com "Voltou" em âmbar e a soma dos dias) e selos de alerta. No topo, o número da lista e o selo **"✓ igual ao gráfico"** (ou o aviso da diferença).

Prévias (dados fictícios): `docs/39-tabela2-preview.png`, `docs/39-tabela2-colunas.png` · Pacote: `dist/XP - Tabela nominal 2.0.0.pbiviz` · Medidas: `docs/38-tabela2.dax`.

## Passo a passo
1. **Medidas:** colar `docs/38-tabela2.dax` na Exibição de consulta DAX → Executar → "Atualizar o modelo com alterações" (cria `Esteira | Visão Dados` e `Esteira | Visão Contexto`).
2. **Link:** usar a coluna de link no formato novo (`link_greenhouse`, doc da conversa de 25/10). Se ainda não existir, criar na 13:
   `link_greenhouse = "https://xpi.greenhouse.io/people/" & FORMAT( [candidate_id], "0" ) & "/applications/" & [application_id] & "/redesign?src=search"`
3. **Importar** `XP - Tabela nominal 2.0.0.pbiviz` e inserir na página Dados do dash, à direita do menu: **X 572 · Y 370 · L 1290 · A 900**. Formatar → Geral: desligar Título e Plano de fundo.
4. **Campos:**

| Campo do visual | O que colocar |
|---|---|
| Link (1ª coluna) | `13_ETAPA_RECRUTAMENTO[link_greenhouse]` |
| Candidato | `13_ETAPA_RECRUTAMENTO[nome_completo]` |
| Colunas fixas | `job_name`, `esteira`, `especialidade`, `recruiter_name` (e, se quiser, praça, persona…) |
| Dados da visão | `Esteira \| Visão Dados` |
| Linha do tempo | `Esteira \| Nominal Jornada` |
| Etapas seguintes | `Esteira \| Nominal Etapas Seguintes` |
| Alertas | `Esteira \| Nominal Alertas` |
| Contexto | `Esteira \| Visão Contexto` |

   Renomear as colunas fixas no próprio visual (seta do campo → "Renomear para este visual"): Vaga, Esteira, Especialidade, Recrutador.
5. **Filtro do visual (obrigatório, desempenho):** painel Filtros → "Filtros neste visual" → arrastar `Esteira | Visão Na Lista` → "é" `1` → Aplicar.
6. **Formatar → Comportamento:** Linhas na tela 50 · "Mostrar mais" adiciona 100 · Máximo de linhas carregadas 60.000.

## Teste
1. Menu → **Rejeitados e motivos**, com Etapa = Phone Screening na barra: o número do topo = o gráfico de motivos dessa etapa, com "✓".
2. Abas (Avaliação, Desistência…) somam o total; **Só exceções** mostra só quem tem alerta.
3. **Colunas ▾** → desmarcar "Especialidade" → trocar de visão e voltar: a escolha continua.
4. Clicar numa linha → linha do tempo; **Abrir ↗** abre o Greenhouse; **Exportar CSV** baixa a aba inteira.
5. SLA por etapa, Evolução e Entrevistas ainda mostram a lista vazia: entram na parte 6.4.
