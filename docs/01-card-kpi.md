# 01 · Card de KPI no dash de Esteiras

Visual: **XP · Card de KPI** (`dist/XP - Card de KPI 1.2.1.pbiviz`).
Onde entra: a fileira de 6 big numbers da página **Resumo** (caixas brancas logo abaixo dos filtros no fundo SVG).

## 1. Importar o visual

1. No Power BI Desktop, painel **Visualizações** → `...` → **Importar um visual de um arquivo**.
2. Escolha `XP - Card de KPI 1.2.1.pbiviz`.
3. O ícone aparece no fim da lista de visuais.

> Para publicar no serviço, a TI precisa cadastrar o arquivo como visual organizacional.

## 2. Campos do visual

| Campo | O que colocar | Obrigatório |
|---|---|---|
| Valor do período | A medida principal (respeita os filtros da página) | Sim |
| Comparação: valor atual | A medida "(mês atual)" | Não |
| Comparação: valor anterior | A medida "(mês anterior)" | Não |
| Acumulado (YTD) | A medida "(YTD)" | Não |
| Meta | Uma medida com a meta (ex.: 45 dias) | Não |
| Texto de contexto | Uma medida que retorna texto | Não |
| Período do valor | Texto do selo ao lado do número (ex.: "01/jul – 18/out" ou "hoje") | Não |
| Rótulo da comparação | Texto que substitui "vs mês anterior" (ex.: "1–18 out vs set") | Não |
| Rótulo do acumulado | Texto que substitui "YTD" (ex.: "Desde 01/jul") | Não |

Campos vazios simplesmente não aparecem no card.

## 3. Medidas de apoio

Pasta sugerida: `98. ESTEIRAS\06. Comparações`. Todas usam o mesmo padrão:

- **Mês atual**: do dia 1 do mês corrente até hoje.
- **Mês anterior**: os mesmos dias, no mês anterior (ex.: 01–17/10 contra 01–17/09).
- **YTD**: de 1º de janeiro até hoje (na prática, desde 01/07/2026, início dos dados).

Elas ignoram o segmentador de período de propósito: a comparação é sempre sobre o mês corrente.

### Candidatos
```DAX
Esteira | Candidatos (mês atual) =
VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje))

Esteira | Candidatos (mês anterior) =
VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)))

Esteira | Candidatos (YTD) =
VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje))
```

Repita o mesmo trio trocando a medida base para:
`Esteira | Contratados`, `Esteira | Conversão Esteira %`, `Esteira | Entrevistas Agendadas` e `Esteira | SLA da Esteira (Mediana)`.

### Textos de contexto
```DAX
Esteira | Texto Candidatos = "Aplicações com candidatura no período"

Esteira | Texto Contratados = "Status hired no Greenhouse"

Esteira | Texto Conversão =
FORMAT([Esteira | Contratados], "#,0") & " contratados de "
    & FORMAT([Esteira | Contratados] + [Esteira | Rejeitados no Processo], "#,0") & " decididos"

Esteira | Ativos Acima de 45 Dias =
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = "Em andamento" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > 45 )
)

Esteira | Texto Em Andamento =
FORMAT(COALESCE([Esteira | Ativos Acima de 45 Dias], 0), "#,0") & " parados há mais de 45 dias"

Esteira | Texto Entrevistas =
"Conversão em entrevista: " & FORMAT([Esteira | Conversão Entrevista %], "0%")

Esteira | Texto SLA = "Mediana da candidatura à contratação"
```

### Períodos (textos)
Padrão XP: cada card diz o próprio período, sem nada fora dele. O visual não calcula datas, só mostra o texto das medidas; cada dash define as próprias regras. Sem as medidas, o card usa os rótulos fixos e esconde o selo.

```DAX
Esteira | Período Selecionado =
VAR Ini = MAX( MIN('_dCALENDARIO'[Data]), DATE(2026, 7, 1) )
VAR Fim = MIN( MAX('_dCALENDARIO'[Data]), TODAY() )
RETURN FORMAT(Ini, "dd/mmm", "pt-BR") & " – " & FORMAT(Fim, "dd/mmm", "pt-BR")

Esteira | Rótulo Comparação =
VAR Hoje = TODAY()
RETURN "1–" & DAY(Hoje) & " " & FORMAT(Hoje, "mmm", "pt-BR") & " vs " & FORMAT(EDATE(Hoje, -1), "mmm", "pt-BR")

Esteira | Rótulo Acumulado =
VAR Ini = MAX( DATE(YEAR(TODAY()), 1, 1), DATE(2026, 7, 1) )
RETURN "Desde " & FORMAT(Ini, "dd/mmm", "pt-BR")

Esteira | Período Hoje = "hoje"
```

Selo: **Formatar → Períodos → Estilo do selo**: *Destaque* (teal) quando o número segue o filtro; *Neutro* (cinza) para foto do momento, como "hoje".

### SLA da esteira (novo)
Precisa da data de contratação. Duas colunas calculadas na `13_ETAPA_RECRUTAMENTO`:

```DAX
data_contratacao =   -- fechamento da opening (closed_at_opening); NÃO usar resolved_at
IF(
    '13_ETAPA_RECRUTAMENTO'[status] = "hired",
    '13_ETAPA_RECRUTAMENTO'[closed_at_opening]
)

sla_esteira_dias =
IF(
    NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_contratacao]),
    ( '13_ETAPA_RECRUTAMENTO'[data_contratacao] - '13_ETAPA_RECRUTAMENTO'[data_aplicacao] ) * 1.0
)
```

```DAX
Esteira | SLA da Esteira (Mediana) =
VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE('13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_contratacao] <  Fim )
    )
RETURN MEDIANX(Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias])

Esteira | Meta SLA = 45
```

Valide antes: `resolved_at` da `03_APPLICATIONS_GH` precisa ser a data em que a aplicação foi marcada como contratada. Se o tipo de `application_id` for diferente entre as tabelas, o `LOOKUPVALUE` dá erro.

## 4. Montar os 6 cards

Coloque cada card exatamente sobre uma caixa branca do fundo (248 × 190 px, a partir de x = 292, a cada 268 px, y = 362).

| Card | Valor do período | Comparação atual / anterior | YTD | Meta | Texto | Formatação |
|---|---|---|---|---|---|---|
| Candidatos | Esteira \| Candidatos | (mês atual) / (mês anterior) | (YTD) | – | Texto Candidatos | padrão |
| Contratados | Esteira \| Contratados | (mês atual) / (mês anterior) | (YTD) | – | Texto Contratados | padrão |
| Em andamento | Esteira \| Ativos Agora | – | – | – | Texto Em Andamento | Unidade: `hoje` |
| Conversão da esteira | Esteira \| Conversão Esteira % | (mês atual) / (mês anterior) | (YTD) | – | Texto Conversão | Comparação → Automático (vira p.p. sozinho) |
| SLA da esteira | Esteira \| SLA da Esteira (Mediana) | (mês atual) / (mês anterior) | (YTD) | Meta SLA | Texto SLA | Unidade: `dias`; Comparação → **Menor é melhor** e **Diferença absoluta** |
| Entrevistas agendadas | Esteira \| Entrevistas Agendadas | (mês atual) / (mês anterior) | (YTD) | – | Texto Entrevistas | padrão |

Em todos:
- **Formatar visual → Geral → Título: desligado** (o título já está no card).
- **Formatar visual → Geral → Plano de fundo: desligado** (o fundo branco vem do SVG). Se preferir o fundo do visual, use o cartão **Aparência** e ajuste a transparência para 0.
- **Cabeçalho → Título**: escreva o nome curto (ex.: "Candidatos"); se vazio, usa o nome da medida.

## 5. Conferência
- O valor principal muda ao trocar o período; a comparação e o YTD **não** mudam (são sobre o mês corrente).
- Na Conversão, a variação aparece em "p.p.".
- No SLA, queda de dias aparece em verde (menor é melhor) e a barra mostra o consumo da meta de 45 dias.
