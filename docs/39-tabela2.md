# 39 · XP · Tabela nominal 2.0 (página "Dados do dash")

A lista nominal da visão escolhida no **Menu de visões** (doc 37): colunas próprias de cada visão, **Colunas ▾** (escolher as colunas; fica salvo no relatório, por visão), **Mostrar mais 100** e **Mostrar todas**, busca sem acento, **Só exceções**, exportar CSV, linha do tempo ao clicar na linha (com "Voltou" em âmbar e a soma dos dias) e selos de alerta. No topo, o número da lista e o selo **"✓ igual ao gráfico"** (ou o aviso da diferença).

Prévias (dados fictícios): `docs/39-tabela2-preview.png`, `docs/39-tabela2-colunas.png` · Pacote: `dist/XP - Tabela nominal 2.1.0.pbiviz` (2.0.1: ignora linhas repetidas da mesma aplicação e avisa no rodapé · 2.1.0: selos de dias/SLA, rolagem mantida ao abrir uma linha) · Medidas: `docs/41-visoes-completas.dax` (+ colunas de `docs/40a-colunas.dax`).

## Versão rápida (obrigatória) · `docs/40a-colunas.dax` (colunas) e `docs/40b-medidas.dax` (medidas)
A primeira versão das medidas recalculava a linha do tempo e as medidas "Nominal …" (que buscam entrevistas na tabela 14) em cada uma das ~22 mil linhas e travava. Agora:
1. **3 colunas novas na 13:** `situacao_app`, `jornada_txt` e `seguintes_txt` (calculadas uma vez, na atualização).
2. **Medidas:** `Esteira | Visão Na Lista` e `Esteira | Visão Dados` reescritas (só leem colunas) e 3 novas: `Esteira | Tabela Jornada`, `Esteira | Tabela Seguintes`, `Esteira | Tabela Alertas`.
3. **No visual:** Linha do tempo → `Esteira | Tabela Jornada` · Etapas seguintes → `Esteira | Tabela Seguintes` · Alertas → `Esteira | Tabela Alertas`.

## Onde fica
Página **Dados do dash** (a mesma do Menu de visões, doc 37), **não** na Nominal: a Nominal antiga (Base nominal) continua como está até a página nova ser validada.

| Elemento | X | Y | Largura | Altura |
|---|---|---|---|---|
| Página (Configurações → Tamanho personalizado) | — | — | 1900 | 1720 |
| Barra de filtros (copiada da Report, sincronizada) | mesmas posições da Report | 225 | — | — |
| XP · Menu de visões | 300 | 370 | 260 | 720 |
| Linha divisória (Inserir → Formas → Linha, vertical, cor #ECECEC, 1 px) | 566 | 380 | 1 | 1300 |
| **XP · Tabela nominal 2.0** | **572** | **370** | **1290** | **1310** |

## Passo a passo
1. **Medidas:** colar `docs/38-tabela2.dax` na Exibição de consulta DAX → Executar → "Atualizar o modelo com alterações" (cria `Esteira | Visão Dados` e `Esteira | Visão Contexto`).
2. **Link:** usar a coluna de link no formato novo (`link_greenhouse`, doc da conversa de 25/10). Se ainda não existir, criar na 13:
   `link_greenhouse = "https://xpi.greenhouse.io/people/" & FORMAT( [candidate_id], "0" ) & "/applications/" & [application_id] & "/redesign?src=search"`
3. **Importar** `XP - Tabela nominal 2.0.0.pbiviz` e inserir na página Dados do dash, à direita do menu: **X 572 · Y 370 · L 1290 · A 1310**. Formatar → Geral: desligar Título e Plano de fundo.
4. **Campos:**

| Campo do visual | O que colocar |
|---|---|
| Link (1ª coluna) | `13_ETAPA_RECRUTAMENTO[link_greenhouse]` |
| Candidato | `13_ETAPA_RECRUTAMENTO[nome_completo]` |
| Colunas fixas | `job_name`, `esteira`, `especialidade`, `recruiter_name` (e, se quiser, praça, persona…). **Só colunas da 13** (ou de `dEtapa`/`dOrganograma`): coluna de outra tabela (ex.: `fonte_contratacao` da 03) cruza as linhas, multiplica cada aplicação ~16× e deixa a tabela lenta. Se precisar dela, trazer para a 13 com `LOOKUPVALUE` |
| Dados da visão | `Esteira \| Visão Dados` |
| Linha do tempo | `Esteira \| Tabela Jornada` |
| Etapas seguintes | `Esteira \| Tabela Seguintes` |
| Alertas | `Esteira \| Tabela Alertas` |
| Contexto | `Esteira \| Visão Contexto` |

   Renomear as colunas fixas no próprio visual (seta do campo → "Renomear para este visual"): Vaga, Esteira, Especialidade, Recrutador.
5. **Filtro do visual (obrigatório, desempenho):** painel Filtros → "Filtros neste visual" → arrastar `Esteira | Visão Na Lista` → "é" `1` → Aplicar.
6. **Formatar → Comportamento:** Linhas na tela 50 · "Mostrar mais" adiciona 100 · Máximo de linhas carregadas 60.000.

## Teste
1. Menu → **Rejeitados e motivos**, com Etapa = Phone Screening na barra: o número do topo = o gráfico de motivos dessa etapa, com "✓".
2. Abas (Avaliação, Desistência…) somam o total; **Só exceções** mostra só quem tem alerta.
3. **Colunas ▾** → desmarcar "Especialidade" → trocar de visão e voltar: a escolha continua.
4. Clicar numa linha → linha do tempo; **Abrir ↗** abre o Greenhouse; **Exportar CSV** baixa a aba inteira.
5. SLA por etapa, Evolução e Entrevistas: número do menu = lista, com "✓" (desde `docs/41-visoes-completas.dax`).
6. Formatar → **Dias**: âmbar acima de 30, coral acima de 45 (vale para Dias na etapa, Dias nas etapas, SLA e a linha do tempo).
