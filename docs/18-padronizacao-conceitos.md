# 18 · Padronização de conceitos: uma régua só para o dash

## A regra
**Todo número do dash fala das aplicações com candidatura no período.**
Sobre essas aplicações perguntamos: quantas avançaram, quantas foram contratadas, quantas foram rejeitadas, quantas seguem em processo e quanto tempo levou.

**Exceções: a agenda e as movimentações da Evolução.** Entrevistas medem a atividade do time. Contam **entrevistas**, não aplicações, e entram pela data da própria entrevista, seja qual for a data de candidatura.

## Dicionário

| Conceito | O que conta | Data que decide se entra no período | Medida |
|---|---|---|---|
| Aplicações | aplicações recebidas | candidatura | `Esteira \| Candidatos` |
| Contratadas | aplicações do período com status hired | candidatura | `Esteira \| Contratados` |
| Rejeitadas | aplicações do período com status rejected | candidatura | `Esteira \| Rejeitados no Processo` |
| Declinaram | rejeitadas com motivo "[Offer]…" (recusa do candidato) | candidatura | `Esteira \| Declinados (Offer)` |
| Em andamento | aplicações do período que seguem em processo hoje | candidatura | `Esteira \| Ativos Agora` |
| Paradas | em andamento há mais de 45 dias na etapa atual | candidatura | `Esteira \| Ativos Acima de 45 Dias` |
| Conversão da esteira | contratadas ÷ (contratadas + rejeitadas) | candidatura | `Esteira \| Conversão Esteira %` |
| Participantes da etapa | aplicações do período que entraram na etapa | candidatura | `Esteira \| Participantes` |
| Conversão da etapa | aprovados ÷ (aprovados + rejeitados) na etapa | candidatura | `Esteira \| Conversão Geral %` |
| Funil | aplicações do período que chegaram até a etapa (ou além) | candidatura | `Esteira \| Funil Aplicações` |
| Tempo na etapa | média, mediana e P90 dos dias nas etapas já concluídas | candidatura | `Esteira \| Dias na Etapa (…)` |
| SLA da esteira | mediana de dias da candidatura à contratação | candidatura | `Esteira \| SLA da Esteira (Mediana)` |
| **Entrevistas marcadas** | entrevistas que o time colocou na agenda no período | **Created At** | `Esteira \| Entrevistas Marcadas` |
| **Entrevistas na agenda** | entrevistas que acontecem no período: realizadas + a realizar | **Started At** | `Esteira \| Entrevistas na Agenda` |
| **Movimentações** (só no gráfico de Evolução) | aprovações e rejeições em etapas, pela data em que aconteceram | data do evento | `Esteira \| Aprovados por Data` / `Rejeitados por Data` |
| Quem marcou | organizador da entrevista | — | `14_…[organizer_name]` |

Na agenda, entram os status scheduled, awaiting feedback e complete. "to be scheduled" fica de fora, porque a entrevista ainda não foi marcada.

**Leitura:** Aplicações = Contratadas + Rejeitadas + Em andamento (a medida `Esteira | Check Coorte` mostra a diferença, que deve ficar perto de 0).

**Cuidado ao ler períodos curtos ou recentes:** a régua da candidatura mostra o processo **ainda em curso**. Em um período recente, poucas aplicações já terminaram. Por isso a conversão e o SLA tendem a parecer menores, e o número de aplicações em andamento, maior. Os números se acomodam conforme as aplicações terminam.

---

## O que fazer, em ordem

### Passo 1 · Conferir duas colunas da tabela 14 (2 min)
1. Abra a 14 na exibição de dados.
2. Confira o nome da coluna do ID da entrevista. O script usa `scheduled_interview_id`. Se for outro, troque no script (Ctrl+H) antes de rodar.
3. Confira o texto exato do status "to be scheduled". O script usa `to_be_scheduled`.
4. Confira se Created At é a data em que a entrevista foi marcada (veja a consulta no fim deste guia).

### Passo 2 · Rodar o script (5 min)
1. Ferramentas externas → **Tabular Editor**.
2. Abra a aba **C# Script**.
3. Cole o conteúdo de [`18-padronizacao.csx`](18-padronizacao.csx) e aperte **F5**.
4. Salve com **Ctrl+S**. O Power BI atualiza o modelo.

O script:
- substitui a fórmula de 24 medidas;
- cria 12 medidas novas;
- não apaga nada.

Todas as fórmulas estão no fim deste guia, se preferir colar uma a uma.

Duas edições à mão, pequenas:
- **`Esteira | Destaque Conversão`**: troque `" seguem em andamento hoje. || bom"` por `" seguem em andamento. || bom"`.
- **`Esteira | Nominal Etapa da Entrevista`**: troque `[Esteira | Nominal Próxima Entrevista]` por `[Esteira | Nominal Entrevista no Período]`, se ainda não trocou na 1.1.0.

### Passo 3 · Trocar os fundos
Os subtítulos agora dizem "Aplicações do período". Reimporte em cada página: Formatar página → Plano de fundo → imagem.
- `BG - Esteiras_Resumo.svg`
- `BG - Esteiras_Report.svg`

### Passo 4 · Ajustar os visuais (abaixo, página por página)

---

## Página Resumo

### Cards de KPI
| Card | Valor | Comparações (atual / anterior / YTD) | Texto de contexto | Período do valor |
|---|---|---|---|---|
| Aplicações | Candidatos | Candidatos (…) | Texto Candidatos | Período Selecionado |
| Contratadas | Contratados | Contratados (…) | Texto Contratados | Período Selecionado |
| Conversão | Conversão Esteira % | Conversão Esteira % (…) | Texto Conversão | Período Selecionado |
| **Em andamento** | Ativos Agora | — | Texto Em Andamento | **Período Selecionado** (era "hoje") |
| **Entrevistas** | **Entrevistas Marcadas** | **Entrevistas Marcadas (…)** | **Texto Entrevistas** | Período Selecionado |
| SLA | SLA da Esteira (Mediana) | SLA (…) | Texto SLA | Período Selecionado |

Em **Em andamento**:
- campo Período do valor: tire `Esteira | Período Hoje` e ponha `Esteira | Período Selecionado`;
- Formatar → Períodos → Estilo do selo → **Destaque**.

Em **Entrevistas**:
- troque o título para **Entrevistas marcadas**;
- o texto de contexto mostra a outra visão: "312 acontecem no período: 240 realizadas, 72 a realizar".

### Outros visuais do Resumo
- **Funil, Onde a esteira perde, Destaques, Consumo do SLA, Onde estão as aplicações em andamento:** nada muda nos campos. As medidas já trazem a régua nova.
- **Gráfico de contratadas por mês:** se algum visual usa `Esteira | Contratados por Data`, troque por `Esteira | Contratados`.

## Página Report
| Visual | O que muda |
|---|---|
| Evolução | campos e textos (abaixo) |
| Entradas e aprovações por etapa | nada (Participantes, Aprovados… já mudaram) |
| Aplicações em andamento por etapa | nada |
| Rejeitados por etapa | Formatar → Resumo → Texto após o total: `rejeitadas` (era "rejeitados no período") |
| SLA por etapa | nada |
| Motivos de saída | nada |
| Aprovados por praça | nada |
| Aprovados por recrutador | nada (`Esteira \| Aplicações Ativas` passou a ser igual a Ativos Agora) |
| Pré Offer e Offer | nada (`Esteira \| Dias na Etapa Atual` já filtra o período) |

### Evolução
A série 1 continua como está: é **atividade** (exceção, como a agenda). Pela data de candidatura, os períodos recentes sempre sairiam baixos, porque as aplicações ainda não terminaram.

| Campo | Antes | Agora |
|---|---|---|
| Série 1: primeira linha | Aprovados por Data | **igual** (`Esteira \| Aprovados por Data`) |
| Série 1: segunda linha | Rejeitados por Data | **igual** (`Esteira \| Rejeitados por Data`) |
| Série 2: primeira linha | Entrevistas Criadas | `Esteira \| Entrevistas Marcadas` |
| Série 2: segunda linha | Entrevistas Agendadas | `Esteira \| Entrevistas na Agenda` |

Formatar → Textos: série 1 → botão `Movimentações`, linhas `Aprovações` / `Rejeições`, taxa `Aprovação nas etapas`; série 2 → botão `Agenda`, linhas `Marcadas` / `Na agenda`.

### Novo (opcional): Entrevistas marcadas por quem marcou
Ainda não tem lugar no fundo. Se quiser, eu desenho onde entra antes. Visual: **XP · Barras com composição 1.1.0**.

| Campo | O que colocar |
|---|---|
| Linhas | `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS[organizer_name]` |
| Partes da barra | 1) `Esteira \| Marcadas Já Realizadas` 2) `Esteira \| Marcadas a Realizar` |
| Total da linha | `Esteira \| Entrevistas Marcadas` |

Formatar:
- **Nomes:** parte 1 `Já aconteceram`; parte 2 `A realizar`; texto após o total `marcadas`.
- **Ranking (Pareto):** ligado; itens `pessoas`; ordem `Maior total`.

## Página Nominal (visual 1.1.0, até a próxima versão)
Os campos continuam os mesmos e as medidas já trazem a régua nova:
- **Em andamento:** só aplicações do período (vai bater com o card do Resumo).
- **Entrevistas agendadas:** aplicações com entrevista **na agenda** do período.

**Diferença conhecida:** o card do Resumo conta **entrevistas**, mas a lista da Nominal tem uma linha por **aplicação**. Por isso os números de entrevista ainda não batem. A versão 1.2.0 do visual resolve isso com duas bases:
- "Marcadas no período";
- "Na agenda".

Nas duas, o card vai contar entrevistas, e a lista vai ter uma coluna com a quantidade e as colunas Organizador e Entrevistadores. Te mando a imagem antes de gerar.

---

## Depois de tudo funcionando: apagar
Pelo Tabular Editor ou clicando com o botão direito → Excluir. Antes, confira se nenhum visual usa a medida: Exibição de consulta DAX → `EVALUATE INFO.CALCDEPENDENCY()`.

- `Esteira | Entrevistas Criadas`, `Esteira | Entrevistas Agendadas` e o trio `Entrevistas Agendadas (mês atual / mês anterior / YTD)`
- `Esteira | Contratados por Data` (as de Aprovados/Rejeitados por Data **ficam**: são usadas na Evolução)
- `Esteira | Nominal Próxima Entrevista`
- `Esteira | Período Hoje` (se nenhum card usar mais)

## Conferência (página oculta, ou cartões numa página de rascunho)
| Medida | Esperado |
|---|---|
| `Esteira \| Check Coorte` | perto de 0. O que sobrar são aplicações com status diferente de hired, rejected e em processo |
| `Esteira \| Check Funil` | 0, ou o número de aplicações que nunca entraram em etapa |
| `Esteira \| Check Agenda` | 0 |
| Card Em andamento (Resumo) = card Em andamento (Nominal) | iguais |
| Contratadas, Rejeitadas, Todas (Nominal) = Resumo | iguais |

Consulta para o Created At (Exibição de consulta DAX):
```DAX
EVALUATE
SUMMARIZECOLUMNS(
    '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status],
    "qtd", COUNTROWS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS' ),
    "dias da criação até a entrevista (média)",
        AVERAGEX( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS',
            DATEDIFF( [created_at], [start_at], DAY ) ),
    "criadas depois da entrevista",
        COUNTROWS( FILTER( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS', [created_at] > [start_at] ) )
)
```
Se "to_be_scheduled" tiver muitas linhas com Created At antigo, o Created At marca a entrada na fila e não o agendamento. Nesse caso, me avise que eu troco a régua de "marcadas" para Updated At.

---

## Todas as fórmulas
Geradas por `tools/gen_conceitos.py`, as mesmas do script.

### A · Etapas: passam a ser só das aplicações do período

**Esteira | Participantes** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Participantes =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_entrada_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

### B · Tempo na etapa e SLA: aplicações do período

**Esteira | Dias na Etapa (Média)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | Dias na Etapa (Média) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    AVERAGE('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Dias na Etapa (Mediana)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | Dias na Etapa (Mediana) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MEDIAN('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Dias na Etapa (P90)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | Dias na Etapa (P90) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    PERCENTILE.INC('13_ETAPA_RECRUTAMENTO'[days_in_stage], 0.9),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Base SLA** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Base SLA =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    COUNTROWS('13_ETAPA_RECRUTAMENTO'),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | SLA da Esteira (Mediana)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | SLA da Esteira (Mediana) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN MEDIANX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )
```

**Esteira | SLA da Esteira (Média)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | SLA da Esteira (Média) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN AVERAGEX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )
```

**Esteira | Dias na Etapa (Contratações)** · ✏️ alterada · formato `0.0`

```DAX
Esteira | Dias na Etapa (Contratações) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratadas =
    CALCULATETABLE(
        VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ),
        REMOVEFILTERS( dEtapa ),
        REMOVEFILTERS( '13_ETAPA_RECRUTAMENTO'[stage_name] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_contratacao]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
VAR Dias =
    CALCULATE(
        SUMX(
            SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[stage_name], '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], '13_ETAPA_RECRUTAMENTO'[days_in_stage] ),
            '13_ETAPA_RECRUTAMENTO'[days_in_stage]
        ),
        TREATAS( Contratadas, '13_ETAPA_RECRUTAMENTO'[application_id] )
    )
RETURN DIVIDE( Dias, COUNTROWS( Contratadas ) )
```

### C · Em andamento: só as aplicações do período que seguem em processo

**Esteira | Ativos Agora** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Ativos Agora =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Ativos Acima de 45 Dias** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Ativos Acima de 45 Dias =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > 45 ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Ativos na Faixa** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Ativos na Faixa =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR De  = MIN( dFaixaDias[de] )
VAR Ate = MAX( dFaixaDias[ate] ) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] >= De ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] <  Ate ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Ativos Acima da Mediana** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Ativos Acima da Mediana =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
SUMX(
    VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]),
    VAR Med = CALCULATE( [Esteira | Dias na Etapa (Mediana)], REMOVEFILTERS('_dCALENDARIO') )
    RETURN
        CALCULATE(
            DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > Med ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
        )
)
```

**Esteira | Acima do P90 Hoje** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Acima do P90 Hoje =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
SUMX(
    VALUES( dEtapa[stage_name] ),
    VAR P = [Esteira | Dias na Etapa (P90)]
    RETURN
        IF(
            NOT ISBLANK( P ),
            CALCULATE(
                DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > P ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
            )
        )
)
```

**Esteira | Dias na Etapa Atual** · ✏️ alterada · formato `0`

```DAX
Esteira | Dias na Etapa Atual =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MAX('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)
```

**Esteira | Aplicações Ativas** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Aplicações Ativas =
[Esteira | Ativos Agora]
```

### D · Agenda: a exceção (atividade do time, conta entrevistas)

**Esteira | Entrevistas Marcadas** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas Marcadas =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Apps =
    CALCULATETABLE( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), REMOVEFILTERS( '_dCALENDARIO' ), REMOVEFILTERS( dEtapa ) )
VAR Etapas =
    FILTER( ALL( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] ),
        NOT ISFILTERED( dEtapa ) || '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] IN VALUES( dEtapa[stage_name] ) )
RETURN
CALCULATE(
    DISTINCTCOUNT( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[scheduled_interview_id] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> "to_be_scheduled" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)
```

**Esteira | Entrevistas na Agenda** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas na Agenda =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Apps =
    CALCULATETABLE( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), REMOVEFILTERS( '_dCALENDARIO' ), REMOVEFILTERS( dEtapa ) )
VAR Etapas =
    FILTER( ALL( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] ),
        NOT ISFILTERED( dEtapa ) || '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] IN VALUES( dEtapa[stage_name] ) )
RETURN
CALCULATE(
    DISTINCTCOUNT( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[scheduled_interview_id] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> "to_be_scheduled" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)
```

**Esteira | Entrevistas Realizadas** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas Realizadas =
CALCULATE( [Esteira | Entrevistas na Agenda], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )
```

**Esteira | Entrevistas a Realizar** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas a Realizar =
COALESCE( [Esteira | Entrevistas na Agenda], 0 ) - COALESCE( [Esteira | Entrevistas Realizadas], 0 )
```

**Esteira | Marcadas Já Realizadas** · 🆕 nova · formato `#,0`

```DAX
Esteira | Marcadas Já Realizadas =
CALCULATE( [Esteira | Entrevistas Marcadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )
```

**Esteira | Marcadas a Realizar** · 🆕 nova · formato `#,0`

```DAX
Esteira | Marcadas a Realizar =
COALESCE( [Esteira | Entrevistas Marcadas], 0 ) - COALESCE( [Esteira | Marcadas Já Realizadas], 0 )
```

**Esteira | Entrevistas Aprovados** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Entrevistas Aprovados =
CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = "Aprovado" ) )
```

**Esteira | Entrevistas Rejeitados** · ✏️ alterada · formato `#,0`

```DAX
Esteira | Entrevistas Rejeitados =
CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = "Rejeitado" ) )
```

**Esteira | Entrevistas Marcadas (mês atual)** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas Marcadas (mês atual) =
VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )
```

**Esteira | Entrevistas Marcadas (mês anterior)** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas Marcadas (mês anterior) =
VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )
```

**Esteira | Entrevistas Marcadas (YTD)** · 🆕 nova · formato `#,0`

```DAX
Esteira | Entrevistas Marcadas (YTD) =
VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )
```

### E · Textos e destaques

**Esteira | Texto Contratados** · ✏️ alterada

```DAX
Esteira | Texto Contratados =
"Das aplicações com candidatura no período"
```

**Esteira | Texto SLA** · ✏️ alterada

```DAX
Esteira | Texto SLA =
"Mediana da candidatura à contratação, aplicações do período"
```

**Esteira | Texto Em Andamento** · ✏️ alterada

```DAX
Esteira | Texto Em Andamento =
FORMAT( COALESCE([Esteira | Ativos Acima de 45 Dias], 0), "#,0" ) & " paradas há mais de 45 dias"
```

**Esteira | Texto Entrevistas** · ✏️ alterada

```DAX
Esteira | Texto Entrevistas =
VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR R = COALESCE( [Esteira | Entrevistas Realizadas], 0 )
RETURN
FORMAT( A, "#,0" ) & " acontecem no período: "
    & FORMAT( R, "#,0" ) & " realizadas, " & FORMAT( A - R, "#,0" ) & " a realizar"
```

**Esteira | Destaque Entrevistas** · ✏️ alterada

```DAX
Esteira | Destaque Entrevistas =
VAR M = [Esteira | Entrevistas Marcadas]
VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR Cv = [Esteira | Conversão Entrevista %]
VAR Atual = COALESCE( [Esteira | Entrevistas Marcadas (mês atual)], 0 )
VAR Ant = COALESCE( [Esteira | Entrevistas Marcadas (mês anterior)], 0 )
RETURN
IF(
    M > 0 || A > 0,
    FORMAT( M, "#,0" ) & " || Entrevistas marcadas no período || "
        & FORMAT( A, "#,0" ) & " acontecem no período. "
        & IF( NOT ISBLANK( Cv ), FORMAT( Cv, "0%" ) & " de aprovação nas realizadas. ", "" )
        & "Marcadas no mês: " & FORMAT( Atual, "#,0" ) & " contra " & FORMAT( Ant, "#,0" )
        & " no mesmo intervalo do mês anterior. || info"
)
```

### F · Página Nominal (até a versão 1.2.0 do visual)

**Esteira | Nominal Situação** · ✏️ alterada

```DAX
Esteira | Nominal Situação =
VAR NoPer = NOT ISBLANK( [Esteira | Candidatos] )
VAR Ativo = NOT ISBLANK( [Esteira | Ativos Agora] )
VAR St    = LOWER( MAX( '13_ETAPA_RECRUTAMENTO'[status] ) )
VAR Dec   = CALCULATE( COUNTROWS( '13_ETAPA_RECRUTAMENTO' ), KEEPFILTERS( LEFT( '13_ETAPA_RECRUTAMENTO'[rejection_reason_name], 7 ) = "[Offer]" ) )
RETURN
SWITCH( TRUE(),
    NOT NoPer, BLANK(),
    Ativo, "Em andamento",
    St = "hired", "Contratada",
    St = "rejected" && Dec > 0, "Declinou",
    St = "rejected", "Rejeitada",
    "Outro" )
```

**Esteira | Nominal Entrevista no Período** · ✏️ alterada

```DAX
Esteira | Nominal Entrevista no Período =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MIN( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> "to_be_scheduled" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] )
)
```

### G · Conferência

**Esteira | Check Coorte** · 🆕 nova · formato `#,0`

```DAX
Esteira | Check Coorte =
[Esteira | Candidatos] - [Esteira | Contratados] - [Esteira | Rejeitados no Processo] - COALESCE( [Esteira | Ativos Agora], 0 )
```

**Esteira | Check Funil** · 🆕 nova · formato `#,0`

```DAX
Esteira | Check Funil =
[Esteira | Candidatos] - CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 1 }, dFunil[ordem_passo] ) )
```

**Esteira | Check Agenda** · 🆕 nova · formato `#,0`

```DAX
Esteira | Check Agenda =
[Esteira | Entrevistas na Agenda] - [Esteira | Entrevistas Realizadas] - [Esteira | Entrevistas a Realizar]
```
