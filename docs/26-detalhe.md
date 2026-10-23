# 26 · Detalhe nominal 1.0 (drillthrough)

Página **Detalhe**: clique direito em um ponto de um gráfico → **Detalhar → Detalhe** abre a lista das aplicações por trás daquele número, com link do Greenhouse, busca, exportar CSV, "Mostrar mais" e linha do tempo.

Prévia: `docs/26-detalhe-preview.png` (dados fictícios). Pacote: `dist/XP - Detalhe nominal 1.0.0.pbiviz`.

## 1. Medidas (4 novas)
Arquivo `docs/26-detalhe.dax`: colar na **Exibição de consulta DAX** → **Executar** → conferir a tabela do fim → **Atualizar modelo com alterações**.

| Medida | O que faz |
|---|---|
| `Esteira \| Detalhe Linha` | uma linha da lista (resultado, etapa, datas, dias, motivo). Vazia = aplicação fora da lista |
| `Esteira \| Detalhe Jornada` | linha do tempo completa (ignora os filtros de etapa/motivo/faixa) |
| `Esteira \| Detalhe Seguintes` | etapas que a aplicação não alcançou |
| `Esteira \| Detalhe Contexto` | filtros recebidos (chips), aba inicial e modo |

**Conferência (fim do arquivo):** "Rejeitados (gráfico)" = "Rejeitadas + declinaram (lista)" e "Participantes (gráfico)" = "Linhas na lista". Uma diferença pequena só pode vir das **etapas duplicadas** (doc 23): a mesma aplicação com duas passagens na etapa conta nas duas barras do gráfico e uma vez na lista.

## 2. Regras da lista
- **Régua:** aplicações com candidatura no período (igual ao dash). Só passagens **com data de entrada** (etapas puladas não contam).
- **Olhando uma etapa** (veio de `dEtapa`, `stage_name` ou faixa de dias): uma linha por aplicação, com o **resultado nessa etapa**: Aprovada, Rejeitada (pela XP), Declinou ([Offer]) ou Em andamento. Abas: Todas · Aprovadas na etapa · Rejeitadas pela XP · Declinaram · Em andamento.
- **Sem etapa** (ex.: veio só de um recrutador): a **situação atual** da aplicação. Abas: Todas · Em andamento · Contratadas · Rejeitadas · Declinaram.
- **Aba inicial:** motivo de rejeição → Rejeitadas (ou Declinaram, se o motivo começa com "[Offer]"); faixa de dias → Em andamento; resto → Todas.
- O Detalhar leva a **categoria** clicada, não a barra/medida: por isso as abas. Os números das abas conferem com o gráfico.
- Colunas vazias para todas as linhas somem sozinhas (ex.: Motivo na aba Aprovadas).

## 3. Página Detalhe (passo a passo)
1. **Nova página** → renomear para `Detalhe`. Tamanho igual às outras (1900 de largura). Fundo: o mesmo da Nominal, por enquanto.
2. Com a página selecionada (clique no fundo), painel **Visualizações → Criar visual → seção "Detalhamento" (Drill through)**:
   - Arrastar para **"Adicionar campos de detalhamento aqui"**: `dEtapa[stage_name]`, `13_ETAPA_RECRUTAMENTO[rejection_reason_name]`, `13_ETAPA_RECRUTAMENTO[recruiter_name]`, `dFaixaDias[faixa]`.
   - **Manter todos os filtros: Ativado** (leva período, barra de filtros e o botão de indicação).
   - Entre relatórios: Desativado.
   - O Power BI cria sozinho o botão **← Voltar** no canto superior esquerdo (pode mover para X 40 · Y 40).
3. **Importar o visual**: Visualizações → ⋯ → Importar um visual de um arquivo → `XP - Detalhe nominal 1.0.0.pbiviz`.
4. **Inserir o visual** → posição **X 40 · Y 110 · L 1820 · A 900** (ajustar a altura à página). Formatar → Geral: desligar Título e Plano de fundo (o fundo branco vem do SVG).
5. **Campos do visual** (os mesmos da Base nominal nos 4 primeiros):

| Campo | O que colocar |
|---|---|
| Link (1ª coluna) | a mesma coluna de link da Base nominal (`link_application`) |
| Candidato | a mesma coluna de nome da Base nominal |
| Vaga | `job_name` (ou a mesma da Base nominal) |
| Recrutador | `recruiter_name` |
| Colunas extras | opcional, até 4 (praça, sourcer…) |
| Detalhe da linha | `Esteira \| Detalhe Linha` |
| Linha do tempo | `Esteira \| Detalhe Jornada` |
| Etapas seguintes | `Esteira \| Detalhe Seguintes` |
| Contexto | `Esteira \| Detalhe Contexto` |

6. **Barra de filtros:** copiar a barra (Período e segmentações) da Report e colar na Detalhe → "Sincronizar". Assim o período aparece e pode ser trocado lá.
7. (Opcional) **Ocultar a página** (clique direito na aba → Ocultar): ela só abre pelo Detalhar.

## 4. Teste (fazer nesta ordem)
1. Report → **Motivos de saída por etapa** → escolher uma etapa → **clique direito em um motivo → Detalhar → Detalhe**.
   - Chips: Período, Etapa e Motivo. Aba "Rejeitadas pela XP" já marcada. O número da aba = número do motivo no gráfico.
2. Voltar → clique direito na **etapa** (lado esquerdo) → Detalhar. Chips só com Etapa; abas Aprovadas / Rejeitadas / Em andamento preenchidas; "Rejeitadas + Declinaram" = total da etapa no gráfico.
3. Clicar em uma linha → abre a linha do tempo completa (todas as etapas, não só a filtrada).
4. **Abrir ↗** → abre a aplicação no Greenhouse. **Exportar CSV** → baixa a aba inteira (com a busca), não só as linhas da tela.
5. Se aparecer "Detalhar" sem a opção "Detalhe": o campo clicado não está na lista do passo 3.2.

## 5. Próximas etapas
- Estender o teste para Barras com composição, Tabela por etapa, Tabela de SLA, Matriz de calor (faixa de dias) e Aprovados por recrutador (devem funcionar sem mudar os visuais: todos já mandam a seleção no clique direito).
- Funil (`dFunil`, sem relação) precisa de regra própria ("chegou até a etapa ou além").
- Botão "Ver aplicações" com ação Detalhar: testar se o botão reconhece a seleção dos visuais personalizados.
- 1.1: modo **Entrevistas** (uma linha por entrevista, tabela 14) e Evolução enviando seleção.
