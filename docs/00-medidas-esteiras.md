> ⚠️ **Documento histórico.** Substituído por `docs/24-medidas-finais.dax` (medidas em uso) e pela régua do `CONTEXTO.md`. Algumas medidas aqui (ex.: `Participantes` por `data_entrada_stage`) estão desatualizadas.

# Dash de Esteiras · tudo o que o modelo precisa

Lista completa de colunas, tabelas e medidas usadas pelo protótipo (páginas Resumo, Report e Nominal), na ordem de criação.
Todas as medidas ficam na tabela `_Medidas`, com o prefixo `Esteira | ` e a pasta de exibição indicada.

Legenda: ✅ já validada nos testes · 🆕 nova · ⚠️ precisa de validação nos seus dados

---

## 0. Colunas calculadas na `13_ETAPA_RECRUTAMENTO`

```DAX
-- ✅ etapa ativa: em processo, na última etapa em que entrou (empate no dia: maior ordem)
eh_etapa_ativa =
VAR UltimaEntrada =
    CALCULATE(
        MAX('13_ETAPA_RECRUTAMENTO'[data_entrada_stage]),
        ALLEXCEPT('13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id])
    )
VAR MaiorOrdemNoDia =
    CALCULATE(
        MAX('13_ETAPA_RECRUTAMENTO'[sort_order]),
        ALLEXCEPT('13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id]),
        '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] = UltimaEntrada
    )
RETURN
    '13_ETAPA_RECRUTAMENTO'[status] = "in_process"
        && '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] = UltimaEntrada
        && '13_ETAPA_RECRUTAMENTO'[sort_order] = MaiorOrdemNoDia
```

```DAX
-- ✅
resultado_etapa =
SWITCH(
    TRUE(),
    '13_ETAPA_RECRUTAMENTO'[saiu_na_etapa] = TRUE(), "Rejeitado",
    '13_ETAPA_RECRUTAMENTO'[eh_etapa_ativa],         "Em andamento",
    "Aprovado"
)
```

```DAX
-- 🆕 ⚠️ data de contratação = fechamento da opening
data_contratacao =
IF(
    '13_ETAPA_RECRUTAMENTO'[status] = "hired",
    '13_ETAPA_RECRUTAMENTO'[closed_at_opening]
)
```

```DAX
-- 🆕 (tipo: Número decimal)
sla_esteira_dias =
IF(
    NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_contratacao]),
    ( '13_ETAPA_RECRUTAMENTO'[data_contratacao] - '13_ETAPA_RECRUTAMENTO'[data_aplicacao] ) * 1.0
)
```

```DAX
-- 🆕 depende da tabela dEtapa (seção 1)
ordem_etapa =
LOOKUPVALUE( dEtapa[ordem], dEtapa[stage_name], '13_ETAPA_RECRUTAMENTO'[stage_name] )
```

## 0.1 Colunas calculadas na `14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS`

Antes: filtre a 14 no Power Query para `created_at >= 01/07/2026 ou start_at >= 01/07/2026`.

```DAX
-- ✅
etapa_entrevista =
VAR App    = '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id]
VAR Quando = '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at]
VAR LinhaEtapa =
    TOPN( 1,
        FILTER( '13_ETAPA_RECRUTAMENTO',
            '13_ETAPA_RECRUTAMENTO'[application_id] = App
                && '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] <= Quando ),
        '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], DESC )
RETURN MAXX( LinhaEtapa, '13_ETAPA_RECRUTAMENTO'[stage_name] )
```

```DAX
-- ✅
resultado_entrevista =
VAR App    = '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id]
VAR Quando = '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at]
VAR LinhaEtapa =
    TOPN( 1,
        FILTER( '13_ETAPA_RECRUTAMENTO',
            '13_ETAPA_RECRUTAMENTO'[application_id] = App
                && '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] <= Quando ),
        '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], DESC )
RETURN MAXX( LinhaEtapa, '13_ETAPA_RECRUTAMENTO'[resultado_etapa] )
```

---

## 1. Tabelas de apoio 🆕

### dEtapa (ordem do processo + grupo de etapas)
⚠️ Ajuste nomes e ordem para bater exatamente com `stage_name`. Para achar etapas faltando:
`EVALUATE EXCEPT( VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]), VALUES(dEtapa[stage_name]) )`

```DAX
dEtapa =
DATATABLE(
    "stage_name", STRING, "ordem", INTEGER, "grupo", STRING, "ordem_grupo", INTEGER,
    {
        { "Revisão de aplicação",              1, "Triagem",     1 },
        { "Priorizados IA",                    2, "Triagem",     1 },
        { "Mindsight e PI Cognitivo",          3, "Triagem",     1 },
        { "Qualificação",                      4, "Triagem",     1 },
        { "Phone Screening",                   5, "Triagem",     1 },
        { "Phone Interview",                   6, "Triagem",     1 },
        { "Short List",                        7, "Triagem",     1 },
        { "Entrevista Inteligente",            8, "Triagem",     1 },
        { "Stand-by | Silver medalist",        9, "Triagem",     1 },
        { "Confirmados na dinâmica",          10, "Avaliações",  2 },
        { "Avaliação técnica",                11, "Avaliações",  2 },
        { "Avaliação - Líder",                12, "Avaliações",  2 },
        { "Avaliação - Pares ou Stakeholders",13, "Avaliações",  2 },
        { "Etapa com Recrutamento",           14, "Entrevistas", 3 },
        { "Entrevista R&S",                   15, "Entrevistas", 3 },
        { "Entrevista com supervisor",        16, "Entrevistas", 3 },
        { "Entrevista com coordenador",       17, "Entrevistas", 3 },
        { "Entrevista com Head",              18, "Entrevistas", 3 },
        { "Entrevista com Hiring Team",       19, "Entrevistas", 3 },
        { "Entrevista com líder",             20, "Entrevistas", 3 },
        { "Entrevista com os Líderes",        21, "Entrevistas", 3 },
        { "Entrevista com Bar Raiser",        22, "Entrevistas", 3 },
        { "Bar Raiser",                       23, "Entrevistas", 3 },
        { "Análise de Crédito",               24, "Checagens",   4 },
        { "Background Check",                 25, "Checagens",   4 },
        { "Comitê de contratação",            26, "Checagens",   4 },
        { "Executive Review",                 27, "Checagens",   4 },
        { "Pré Offer",                        28, "Offer",       5 },
        { "Offer",                            29, "Offer",       5 }
    }
)
```
- `dEtapa[stage_name]` → Classificar por coluna → `ordem`; `dEtapa[grupo]` → Classificar por → `ordem_grupo`.
- Relação: `13_ETAPA_RECRUTAMENTO[stage_name]` (muitos) → `dEtapa[stage_name]` (um), filtro em um sentido.
- Nos visuais, use sempre `dEtapa[stage_name]` / `dEtapa[grupo]` no eixo.

### dFunil (passos do funil = etapas reais + "Contratadas")
```DAX
dFunil =
UNION(
    SELECTCOLUMNS( dEtapa, "passo", dEtapa[stage_name], "ordem_passo", dEtapa[ordem], "grupo", dEtapa[grupo] ),
    ROW( "passo", "Contratadas", "ordem_passo", 999, "grupo", "Contratação" )
)
```
`dFunil[passo]` → Classificar por coluna → `ordem_passo` (obrigatório: sem isso o funil fica em ordem alfabética). Sem relação com nada.

### dBase (botões da página Nominal)
```DAX
dBase =
DATATABLE(
    "base", STRING, "ordem", INTEGER,
    { { "Ativas", 1 }, { "Todas", 2 }, { "Entrevistas", 3 }, { "Contratadas", 4 }, { "Rejeitadas", 5 }, { "Declinadas", 6 } }
)
```
`dBase[base]` → Classificar por coluna → `ordem`. Sem relação com nada.

---

## 2. Volume e resultado por etapa — pasta `98. ESTEIRAS\01. Etapa - Volume` ✅

```DAX
Esteira | Participantes =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] <  Fim )
)

Esteira | Aprovados =
CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Aprovado" ) )

Esteira | Rejeitados =
CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Rejeitado" ) )

Esteira | Em Andamento =
CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ) )

Esteira | Declinados (Offer) =
CALCULATE( [Esteira | Rejeitados], KEEPFILTERS( LEFT('13_ETAPA_RECRUTAMENTO'[rejection_reason_name], 7) = "[Offer]" ) )

Esteira | Rejeitados (Empresa) =
[Esteira | Rejeitados] - [Esteira | Declinados (Offer)]

Esteira | % das Rejeições da Etapa =   -- 🆕 participação do motivo dentro da etapa
DIVIDE(
    [Esteira | Rejeitados],
    CALCULATE( [Esteira | Rejeitados], REMOVEFILTERS('13_ETAPA_RECRUTAMENTO'[rejection_reason_name]) )
)
```

## 3. Conversão — pasta `98. ESTEIRAS\02. Conversão`

```DAX
Esteira | Conversão Geral % =                 -- ✅ por etapa
DIVIDE( [Esteira | Aprovados], [Esteira | Aprovados] + [Esteira | Rejeitados] )

Esteira | Candidatos =                        -- ✅ pela data de candidatura
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)

Esteira | Contratados =
CALCULATE( [Esteira | Candidatos], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[status] = "hired" ) )

Esteira | Rejeitados no Processo =
CALCULATE( [Esteira | Candidatos], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[status] = "rejected" ) )

Esteira | Conversão Esteira % =
DIVIDE( [Esteira | Contratados], [Esteira | Contratados] + [Esteira | Rejeitados no Processo] )
```

### Funil 🆕
```DAX
Esteira | Funil Aplicações =
VAR Ordem = SELECTEDVALUE( dFunil[ordem_passo] )
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
SWITCH(
    TRUE(),
    ISBLANK(Ordem), BLANK(),
    Ordem = 999, [Esteira | Contratados],
    CALCULATE(
        DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_entrada_stage]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[ordem_etapa] >= Ordem ),
        REMOVEFILTERS( dEtapa ),
        REMOVEFILTERS( '13_ETAPA_RECRUTAMENTO'[stage_name] )
    ) + 0
)

Esteira | Funil % do Total =
DIVIDE( [Esteira | Funil Aplicações], [Esteira | Candidatos] )

Esteira | Chegaram ao Recrutador =
CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 14 }, dFunil[ordem_passo] ) )   -- 14 = Etapa com Recrutamento

Esteira | Aplicações por Contratação =
DIVIDE( [Esteira | Candidatos], [Esteira | Contratados] )

Esteira | Recrutador por Contratação =
DIVIDE( [Esteira | Chegaram ao Recrutador], [Esteira | Contratados] )
```
Formato das duas últimas: decimal com 1 casa (ex.: 1,6).

## 4. Entrevistas — pasta `98. ESTEIRAS\03. Entrevistas` ✅

```DAX
Esteira | Entrevistas Criadas =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id]),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> "to_be_scheduled" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] <  Fim ),
    TREATAS( VALUES('13_ETAPA_RECRUTAMENTO'[application_id]), '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    TREATAS( VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]),     '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] )
)

Esteira | Entrevistas Agendadas =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id]),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> "to_be_scheduled" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( VALUES('13_ETAPA_RECRUTAMENTO'[application_id]), '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    TREATAS( VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]),     '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] )
)

Esteira | Entrevistas Aprovados =
CALCULATE(
    [Esteira | Entrevistas Agendadas],
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[end_at] < NOW() ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = "Aprovado" )
)

Esteira | Entrevistas Rejeitados =
CALCULATE(
    [Esteira | Entrevistas Agendadas],
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[end_at] < NOW() ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = "Rejeitado" )
)

Esteira | Conversão Entrevista % =
DIVIDE( [Esteira | Entrevistas Aprovados], [Esteira | Entrevistas Aprovados] + [Esteira | Entrevistas Rejeitados] )
```

## 5. Tempo e SLA — pasta `98. ESTEIRAS\04. Tempo na Etapa`

```DAX
Esteira | Dias na Etapa (Média) =                -- ✅
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    AVERAGE('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] <  Fim )
)

Esteira | Dias na Etapa (Mediana) =              -- ✅
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MEDIAN('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage] <  Fim )
)

Esteira | Ativos Agora =                         -- ✅
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" )
)

Esteira | Ativos Acima da Mediana =              -- 🆕 laranja em "Ativos por etapa"
SUMX(
    VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]),
    VAR Med = CALCULATE( [Esteira | Dias na Etapa (Mediana)], REMOVEFILTERS('_dCALENDARIO') )
    RETURN
        CALCULATE(
            DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > Med )
        )
)

Esteira | Ativos Acima de 45 Dias =              -- 🆕
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > 45 )
)

Esteira | Flag Acima da Mediana =                -- ✅ formatação condicional da tabela nominal
VAR Dias =
    CALCULATE( MAX('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
               KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ) )
VAR MedianaEtapa =
    CALCULATE( [Esteira | Dias na Etapa (Mediana)],
               REMOVEFILTERS('13_ETAPA_RECRUTAMENTO'), REMOVEFILTERS('_dCALENDARIO'),
               VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]), VALUES('13_ETAPA_RECRUTAMENTO'[esteira]) )
RETURN IF( NOT ISBLANK(Dias) && NOT ISBLANK(MedianaEtapa), IF( Dias > MedianaEtapa, 1, 0 ) )

Esteira | SLA da Esteira (Mediana) =             -- 🆕 ⚠️
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] <  Fim )
    )
RETURN MEDIANX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )

Esteira | Meta SLA = 45

Esteira | SLA do Grupo (dias) =                  -- 🆕 barra "Consumo do SLA por grupo de etapas"
SUMX( VALUES(dEtapa[stage_name]), [Esteira | Dias na Etapa (Mediana)] )

Esteira | SLA % da Meta =
DIVIDE( [Esteira | SLA da Esteira (Mediana)], [Esteira | Meta SLA] )
```

## 6. Evolução no tempo — pasta `98. ESTEIRAS\05. Evolução` (eixo: `_dCALENDARIO[Data]`)

```DAX
Esteira | Aprovados por Data =                   -- ✅
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Aprovado" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_saida_stage] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_saida_stage] <  Fim )
)

Esteira | Rejeitados por Data =                  -- ✅
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Rejeitado" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[rejected_at] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[rejected_at] <  Fim )
)

Esteira | Contratados por Data =                 -- 🆕 gráfico mensal do Resumo
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[status] = "hired" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] <  Fim )
)
```

## 7. Comparações dos cards — pasta `98. ESTEIRAS\06. Comparações` 🆕

Para cada medida base abaixo, crie o trio (troque `[BASE]` pelo nome):
`Esteira | Candidatos`, `Esteira | Contratados`, `Esteira | Conversão Esteira %`, `Esteira | Entrevistas Agendadas`, `Esteira | SLA da Esteira (Mediana)`.

```DAX
Esteira | BASE (mês atual) =
VAR Hoje = TODAY()
RETURN CALCULATE( [BASE], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )

Esteira | BASE (mês anterior) =
VAR Hoje = TODAY()
RETURN CALCULATE( [BASE], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )

Esteira | BASE (YTD) =
VAR Hoje = TODAY()
RETURN CALCULATE( [BASE], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )
```

## 8. Textos — pasta `98. ESTEIRAS\07. Textos` 🆕

```DAX
Esteira | Texto Candidatos   = "Aplicações com candidatura no período"
Esteira | Texto Contratados  = "Status hired no Greenhouse"
Esteira | Texto SLA          = "Mediana da candidatura à contratação"

Esteira | Texto Em Andamento =
FORMAT( COALESCE([Esteira | Ativos Acima de 45 Dias], 0), "#,0" ) & " parados há mais de 45 dias"

Esteira | Texto Conversão =
FORMAT( [Esteira | Contratados], "#,0" ) & " contratados de "
    & FORMAT( [Esteira | Contratados] + [Esteira | Rejeitados no Processo], "#,0" ) & " decididos"

Esteira | Texto Entrevistas =
"Conversão em entrevista: " & FORMAT( [Esteira | Conversão Entrevista %], "0%" )
```

## 9. Página Nominal — pasta `98. ESTEIRAS\08. Nominal` 🆕

```DAX
Esteira | Contagem da Base =
SWITCH(
    SELECTEDVALUE( dBase[base] ),
    "Ativas",      [Esteira | Ativos Agora],
    "Todas",       [Esteira | Participantes],
    "Entrevistas", [Esteira | Entrevistas Agendadas],
    "Contratadas", [Esteira | Contratados],
    "Rejeitadas",  [Esteira | Rejeitados no Processo],
    "Declinadas",  [Esteira | Declinados (Offer)]
)

-- Filtro da tabela nominal: coloque no painel de filtros do visual com "é 1"
Esteira | Mostrar na Base =
VAR Base = SELECTEDVALUE( dBase[base], "Ativas" )
VAR Valor =
    SWITCH(
        Base,
        "Ativas",      [Esteira | Ativos Agora],
        "Todas",       [Esteira | Participantes],
        "Entrevistas", [Esteira | Entrevistas Agendadas],
        "Contratadas", [Esteira | Contratados],
        "Rejeitadas",  [Esteira | Rejeitados no Processo],
        "Declinadas",  [Esteira | Declinados (Offer)]
    )
RETURN IF( Valor > 0, 1 )
```
A coluna `link_application` da 13 deve estar com **Categoria de dados = URL da Web** para virar link clicável.

## 10. Validação — pasta `98. ESTEIRAS\99. Validação`

```DAX
Esteira | Check Fechamento =
[Esteira | Participantes] - [Esteira | Aprovados] - [Esteira | Rejeitados] - [Esteira | Em Andamento]
```

---

## Medidas antigas (Stage …, Report … HTML)
Depois que os visuais estiverem usando as medidas `Esteira | …`, as 51 medidas antigas da pasta `98. ESTEIRAS` podem ser removidas.
Antes, confira dependências com `INFO.CALCDEPENDENCY()` na exibição de consulta DAX.


## Data de referência (última atualização) 🆕
Todas as medidas que usavam `TODAY()` passam a usar a data da última atualização do dash.
```DAX
Esteira | Data Referência =
INT( MAX( '<tabela da última atualização>'[<coluna data/hora>] ) )
```
Script para o Tabular Editor (troca `TODAY()` em todas as medidas "Esteira |"):
```csharp
foreach (var m in Model.AllMeasures.Where(m => m.Name.StartsWith("Esteira |") && m.Name != "Esteira | Data Referência" && m.Expression.Contains("TODAY()")))
    m.Expression = m.Expression.Replace("TODAY()", "[Esteira | Data Referência]");
```
