// Tabular Editor (2 ou 3) → aba C# Script → colar → Executar (F5) → Ctrl+S para salvar no modelo.
// Cria as medidas novas e substitui a fórmula das alteradas. Nada é apagado: a lista para apagar está no fim.
var t = Model.Tables["_Medidas"];
Action<string, string, string, string> Set = (nome, expr, pasta, fmt) => {
    var m = t.Measures.Contains(nome) ? t.Measures[nome] : t.AddMeasure(nome);
    m.Expression = expr;
    if (string.IsNullOrEmpty(m.DisplayFolder)) m.DisplayFolder = pasta;
    if (fmt != null) m.FormatString = fmt;
};
// A · Etapas: passam a ser só das aplicações do período
Set(@"Esteira | Participantes", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_entrada_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\01. Etapa - Volume", @"#,0");
// B · Tempo na etapa e SLA: aplicações do período
Set(@"Esteira | Dias na Etapa (Média)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    AVERAGE('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
Set(@"Esteira | Dias na Etapa (Mediana)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MEDIAN('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
Set(@"Esteira | Dias na Etapa (P90)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    PERCENTILE.INC('13_ETAPA_RECRUTAMENTO'[days_in_stage], 0.9),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
Set(@"Esteira | Base SLA", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    COUNTROWS('13_ETAPA_RECRUTAMENTO'),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | SLA da Esteira (Mediana)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN MEDIANX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
Set(@"Esteira | SLA da Esteira (Média)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN AVERAGEX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
Set(@"Esteira | Dias na Etapa (Contratações)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
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
RETURN DIVIDE( Dias, COUNTROWS( Contratadas ) )", @"98. ESTEIRAS\04. Tempo na Etapa", @"0.0");
// C · Em andamento: só as aplicações do período que seguem em processo
Set(@"Esteira | Ativos Agora", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | Ativos Acima de 45 Dias", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > 45 ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | Ativos na Faixa", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR De  = MIN( dFaixaDias[de] )
VAR Ate = MAX( dFaixaDias[ate] ) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] >= De ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] <  Ate ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | Ativos Acima da Mediana", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
SUMX(
    VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]),
    VAR Med = CALCULATE( [Esteira | Dias na Etapa (Mediana)], REMOVEFILTERS('_dCALENDARIO') )
    RETURN
        CALCULATE(
            DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > Med ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
            KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
        )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | Acima do P90 Hoje", @"VAR Ini = MIN('_dCALENDARIO'[Data])
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
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > P ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
                KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
            )
        )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"#,0");
Set(@"Esteira | Dias na Etapa Atual", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MAX('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04. Tempo na Etapa", @"0");
Set(@"Esteira | Aplicações Ativas", @"[Esteira | Ativos Agora]", @"98. ESTEIRAS\02. Conversão", @"#,0");
// D · Agenda: a exceção (atividade do time, conta entrevistas)
Set(@"Esteira | Entrevistas Marcadas", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Apps =
    CALCULATETABLE( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), REMOVEFILTERS( '_dCALENDARIO' ), REMOVEFILTERS( dEtapa ) )
VAR Etapas =
    FILTER( ALL( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] ),
        NOT ISFILTERED( dEtapa ) || '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] IN VALUES( dEtapa[stage_name] ) )
RETURN
CALCULATE(
    DISTINCTCOUNT( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[scheduled_interviews_id] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> ""to_be_scheduled"" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas na Agenda", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Apps =
    CALCULATETABLE( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), REMOVEFILTERS( '_dCALENDARIO' ), REMOVEFILTERS( dEtapa ) )
VAR Etapas =
    FILTER( ALL( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] ),
        NOT ISFILTERED( dEtapa ) || '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] IN VALUES( dEtapa[stage_name] ) )
RETURN
CALCULATE(
    DISTINCTCOUNT( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[scheduled_interviews_id] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> ""to_be_scheduled"" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas Realizadas", @"CALCULATE( [Esteira | Entrevistas na Agenda], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas a Realizar", @"COALESCE( [Esteira | Entrevistas na Agenda], 0 ) - COALESCE( [Esteira | Entrevistas Realizadas], 0 )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Marcadas Já Realizadas", @"CALCULATE( [Esteira | Entrevistas Marcadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Marcadas a Realizar", @"COALESCE( [Esteira | Entrevistas Marcadas], 0 ) - COALESCE( [Esteira | Marcadas Já Realizadas], 0 )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas Aprovados", @"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = ""Aprovado"" ) )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas Rejeitados", @"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = ""Rejeitado"" ) )", @"98. ESTEIRAS\03. Entrevistas", @"#,0");
Set(@"Esteira | Entrevistas Marcadas (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", @"98. ESTEIRAS\06. Comparações", @"#,0");
Set(@"Esteira | Entrevistas Marcadas (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", @"98. ESTEIRAS\06. Comparações", @"#,0");
Set(@"Esteira | Entrevistas Marcadas (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", @"98. ESTEIRAS\06. Comparações", @"#,0");
// E · Textos e destaques
Set(@"Esteira | Texto Contratados", @"""Das aplicações com candidatura no período""", @"98. ESTEIRAS\07. Textos", null);
Set(@"Esteira | Texto SLA", @"""Mediana da candidatura à contratação, aplicações do período""", @"98. ESTEIRAS\07. Textos", null);
Set(@"Esteira | Texto Em Andamento", @"FORMAT( COALESCE([Esteira | Ativos Acima de 45 Dias], 0), ""#,0"" ) & "" paradas há mais de 45 dias""", @"98. ESTEIRAS\07. Textos", null);
Set(@"Esteira | Texto Entrevistas", @"VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR R = COALESCE( [Esteira | Entrevistas Realizadas], 0 )
RETURN
FORMAT( A, ""#,0"" ) & "" acontecem no período: ""
    & FORMAT( R, ""#,0"" ) & "" realizadas, "" & FORMAT( A - R, ""#,0"" ) & "" a realizar""", @"98. ESTEIRAS\07. Textos", null);
Set(@"Esteira | Destaque Entrevistas", @"VAR M = [Esteira | Entrevistas Marcadas]
VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR Cv = [Esteira | Conversão Entrevista %]
VAR Atual = COALESCE( [Esteira | Entrevistas Marcadas (mês atual)], 0 )
VAR Ant = COALESCE( [Esteira | Entrevistas Marcadas (mês anterior)], 0 )
RETURN
IF(
    M > 0 || A > 0,
    FORMAT( M, ""#,0"" ) & "" || Entrevistas marcadas no período || ""
        & FORMAT( A, ""#,0"" ) & "" acontecem no período. ""
        & IF( NOT ISBLANK( Cv ), FORMAT( Cv, ""0%"" ) & "" de aprovação nas realizadas. "", """" )
        & ""Marcadas no mês: "" & FORMAT( Atual, ""#,0"" ) & "" contra "" & FORMAT( Ant, ""#,0"" )
        & "" no mesmo intervalo do mês anterior. || info""
)", @"98. ESTEIRAS\07. Textos", null);
// F · Página Nominal (até a versão 1.2.0 do visual)
Set(@"Esteira | Nominal Situação", @"VAR NoPer = NOT ISBLANK( [Esteira | Candidatos] )
VAR Ativo = NOT ISBLANK( [Esteira | Ativos Agora] )
VAR St    = LOWER( MAX( '13_ETAPA_RECRUTAMENTO'[status] ) )
VAR Dec   = CALCULATE( COUNTROWS( '13_ETAPA_RECRUTAMENTO' ), KEEPFILTERS( LEFT( '13_ETAPA_RECRUTAMENTO'[rejection_reason_name], 7 ) = ""[Offer]"" ) )
RETURN
SWITCH( TRUE(),
    NOT NoPer, BLANK(),
    Ativo, ""Em andamento"",
    St = ""hired"", ""Contratada"",
    St = ""rejected"" && Dec > 0, ""Declinou"",
    St = ""rejected"", ""Rejeitada"",
    ""Outro"" )", @"98. ESTEIRAS\08. Nominal", null);
Set(@"Esteira | Nominal Entrevista no Período", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MIN( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] ),
    REMOVEFILTERS( '_dCALENDARIO' ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> ""to_be_scheduled"" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] )
)", @"98. ESTEIRAS\08. Nominal", null);
// G · Conferência
Set(@"Esteira | Check Coorte", @"[Esteira | Candidatos] - [Esteira | Contratados] - [Esteira | Rejeitados no Processo] - COALESCE( [Esteira | Ativos Agora], 0 )", @"98. ESTEIRAS\99. Validação", @"#,0");
Set(@"Esteira | Check Funil", @"[Esteira | Candidatos] - CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 1 }, dFunil[ordem_passo] ) )", @"98. ESTEIRAS\99. Validação", @"#,0");
Set(@"Esteira | Check Agenda", @"[Esteira | Entrevistas na Agenda] - [Esteira | Entrevistas Realizadas] - [Esteira | Entrevistas a Realizar]", @"98. ESTEIRAS\99. Validação", @"#,0");
// Para apagar DEPOIS de trocar nos visuais (confira antes em INFO.CALCDEPENDENCY):
// t.Measures[@"Esteira | Entrevistas Criadas"].Delete();
// t.Measures[@"Esteira | Entrevistas Agendadas"].Delete();
// t.Measures[@"Esteira | Entrevistas Agendadas (mês atual)"].Delete();
// t.Measures[@"Esteira | Entrevistas Agendadas (mês anterior)"].Delete();
// t.Measures[@"Esteira | Entrevistas Agendadas (YTD)"].Delete();
// t.Measures[@"Esteira | Contratados por Data"].Delete();
// t.Measures[@"Esteira | Nominal Próxima Entrevista"].Delete();
Info("Medidas atualizadas. Salve com Ctrl+S.");
