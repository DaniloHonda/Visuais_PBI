// Tabular Editor (2 ou 3) → aba C# Script → colar → F5 → Ctrl+S. Cria/substitui as medidas na tabela _Medidas.
var t = Model.Tables["_Medidas"];
Action<string, string, string> Set = (nome, expr, pasta) => {
    var m = t.Measures.Contains(nome) ? t.Measures[nome] : t.AddMeasure(nome);
    m.Expression = expr;
    if (string.IsNullOrEmpty(m.DisplayFolder)) m.DisplayFolder = pasta;
};
Set(@"Esteira | % Parados", @"DIVIDE( [Esteira | Ativos Acima de 45 Dias], [Esteira | Ativos Agora] )", @"98. ESTEIRAS\01");
Set(@"Esteira | % das Rejeições da Etapa", @"DIVIDE(
    [Esteira | Rejeitados],
    CALCULATE( [Esteira | Rejeitados], REMOVEFILTERS('13_ETAPA_RECRUTAMENTO'[rejection_reason_name]) )
)", @"98. ESTEIRAS\01");
Set(@"Esteira | Aprovados", @"CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Aprovado"" ) )", @"98. ESTEIRAS\01");
Set(@"Esteira | Declinados (Offer)", @"CALCULATE( [Esteira | Rejeitados], KEEPFILTERS( LEFT('13_ETAPA_RECRUTAMENTO'[rejection_reason_name], 7) = ""[Offer]"" ) )", @"98. ESTEIRAS\01");
Set(@"Esteira | Em Andamento", @"CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ) )", @"98. ESTEIRAS\01");
Set(@"Esteira | Etapa Maior Perda", @"VAR T = ADDCOLUMNS( VALUES( dEtapa[stage_name] ), ""@rej"", [Esteira | Rejeitados] )
RETURN MAXX( TOPN( 1, FILTER( T, [@rej] > 0 ), [@rej], DESC ), dEtapa[stage_name] )", @"98. ESTEIRAS\01");
Set(@"Esteira | Etapas do Grupo", @"CONCATENATEX(
    VALUES( dEtapa[stage_name] ),
    dEtapa[stage_name],
    UNICHAR(10),
    CALCULATE( MIN( dEtapa[ordem] ) ), ASC
)", @"98. ESTEIRAS\01");
Set(@"Esteira | Participantes", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_entrada_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\01");
Set(@"Esteira | Rejeitados", @"CALCULATE( [Esteira | Participantes], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Rejeitado"" ) )", @"98. ESTEIRAS\01");
Set(@"Esteira | Rejeitados (Empresa)", @"[Esteira | Rejeitados] - [Esteira | Declinados (Offer)]", @"98. ESTEIRAS\01");
Set(@"Esteira | Aplicações Ativas", @"[Esteira | Ativos Agora]", @"98. ESTEIRAS\02");
Set(@"Esteira | Aplicações por Contratação", @"DIVIDE( [Esteira | Candidatos], [Esteira | Contratados] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Candidatos", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\02");
Set(@"Esteira | Chegaram ao Recrutador", @"CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 14 }, dFunil[ordem_passo] ) )   -- 14 = Etapa com Recrutamento", @"98. ESTEIRAS\02");
Set(@"Esteira | Contratados", @"CALCULATE( [Esteira | Candidatos], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[status] = ""hired"" ) )", @"98. ESTEIRAS\02");
Set(@"Esteira | Conversão Entrevista %", @"DIVIDE( [Esteira | Entrevistas Aprovados], [Esteira | Entrevistas Aprovados] + [Esteira | Entrevistas Rejeitados] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Conversão Esteira %", @"DIVIDE( [Esteira | Contratados], [Esteira | Contratados] + [Esteira | Rejeitados no Processo] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Conversão Geral %", @"DIVIDE( [Esteira | Aprovados], [Esteira | Aprovados] + [Esteira | Rejeitados] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Funil % do Total", @"DIVIDE( [Esteira | Funil Aplicações], [Esteira | Candidatos] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Funil Aplicações", @"VAR Ordem = SELECTEDVALUE( dFunil[ordem_passo] )
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
)", @"98. ESTEIRAS\02");
Set(@"Esteira | Recrutador por Contratação", @"DIVIDE( [Esteira | Chegaram ao Recrutador], [Esteira | Contratados] )", @"98. ESTEIRAS\02");
Set(@"Esteira | Rejeitados no Processo", @"CALCULATE( [Esteira | Candidatos], KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[status] = ""rejected"" ) )", @"98. ESTEIRAS\02");
Set(@"Esteira | Entrevistas Aprovados", @"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = ""Aprovado"" ) )", @"98. ESTEIRAS\03");
Set(@"Esteira | Entrevistas Marcadas", @"VAR Ini = MIN('_dCALENDARIO'[Data])
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
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> ""to_be_scheduled"" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[created_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)", @"98. ESTEIRAS\03");
Set(@"Esteira | Entrevistas Realizadas", @"CALCULATE( [Esteira | Entrevistas na Agenda], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )", @"98. ESTEIRAS\03");
Set(@"Esteira | Entrevistas Rejeitados", @"CALCULATE( [Esteira | Entrevistas Realizadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[resultado_entrevista] = ""Rejeitado"" ) )", @"98. ESTEIRAS\03");
Set(@"Esteira | Entrevistas a Realizar", @"COALESCE( [Esteira | Entrevistas na Agenda], 0 ) - COALESCE( [Esteira | Entrevistas Realizadas], 0 )", @"98. ESTEIRAS\03");
Set(@"Esteira | Entrevistas na Agenda", @"VAR Ini = MIN('_dCALENDARIO'[Data])
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
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[status] <> ""to_be_scheduled"" ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] >= Ini ),
    KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] <  Fim ),
    TREATAS( Apps, '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] ),
    Etapas
)", @"98. ESTEIRAS\03");
Set(@"Esteira | Marcadas Já Realizadas", @"CALCULATE( [Esteira | Entrevistas Marcadas], KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] < NOW() ) )", @"98. ESTEIRAS\03");
Set(@"Esteira | Marcadas a Realizar", @"COALESCE( [Esteira | Entrevistas Marcadas], 0 ) - COALESCE( [Esteira | Marcadas Já Realizadas], 0 )", @"98. ESTEIRAS\03");
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
)", @"98. ESTEIRAS\04");
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
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Ativos Acima de 45 Dias", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[days_in_stage] > 45 ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Ativos Agora", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Ativos Até 45 Dias", @"COALESCE( [Esteira | Ativos Agora], 0 ) - COALESCE( [Esteira | Ativos Acima de 45 Dias], 0 )", @"98. ESTEIRAS\04");
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
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Base SLA", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    COUNTROWS('13_ETAPA_RECRUTAMENTO'),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
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
RETURN DIVIDE( Dias, COUNTROWS( Contratadas ) )", @"98. ESTEIRAS\04");
Set(@"Esteira | Dias na Etapa (Mediana)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MEDIAN('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Dias na Etapa (Média)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    AVERAGE('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Dias na Etapa (P90)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    PERCENTILE.INC('13_ETAPA_RECRUTAMENTO'[days_in_stage], 0.9),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[stage_name]) ),
    KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[data_saida_stage]) ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Dias na Etapa Atual", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    MAX('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | Flag Acima da Mediana", @"VAR Dias =
    CALCULATE( MAX('13_ETAPA_RECRUTAMENTO'[days_in_stage]),
               KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Em andamento"" ) )
VAR MedianaEtapa =
    CALCULATE( [Esteira | Dias na Etapa (Mediana)],
               REMOVEFILTERS('13_ETAPA_RECRUTAMENTO'), REMOVEFILTERS('_dCALENDARIO'),
               VALUES('13_ETAPA_RECRUTAMENTO'[stage_name]), VALUES('13_ETAPA_RECRUTAMENTO'[esteira]) )
RETURN IF( NOT ISBLANK(Dias) && NOT ISBLANK(MedianaEtapa), IF( Dias > MedianaEtapa, 1, 0 ) )", @"98. ESTEIRAS\04");
Set(@"Esteira | Meta SLA", @"45", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA % da Meta", @"DIVIDE( [Esteira | SLA da Esteira (Mediana)], [Esteira | Meta SLA] )", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA (sem etapa)", @"CALCULATE(
    [Esteira | SLA da Esteira (Mediana)],
    REMOVEFILTERS( dEtapa ),
    REMOVEFILTERS( '13_ETAPA_RECRUTAMENTO'[stage_name] )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA Média (sem etapa)", @"CALCULATE(
    [Esteira | SLA da Esteira (Média)],
    REMOVEFILTERS( dEtapa ),
    REMOVEFILTERS( '13_ETAPA_RECRUTAMENTO'[stage_name] )
)", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA da Esteira (Mediana)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN MEDIANX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA da Esteira (Média)", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
VAR Contratacoes =
    CALCULATETABLE(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[application_id], '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ),
        KEEPFILTERS( NOT ISBLANK('13_ETAPA_RECRUTAMENTO'[sla_esteira_dias]) ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] >= Ini ),
        KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] <  Fim )
    )
RETURN AVERAGEX( Contratacoes, '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] )", @"98. ESTEIRAS\04");
Set(@"Esteira | SLA do Grupo (dias)", @"SUMX( VALUES(dEtapa[stage_name]), [Esteira | Dias na Etapa (Mediana)] )", @"98. ESTEIRAS\04");
Set(@"Esteira | Aprovados por Data", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Aprovado"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_saida_stage] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[data_saida_stage] <  Fim )
)", @"98. ESTEIRAS\05");
Set(@"Esteira | Rejeitados por Data", @"VAR Ini = MIN('_dCALENDARIO'[Data])
VAR Fim = MAX('_dCALENDARIO'[Data]) + 1
RETURN
CALCULATE(
    DISTINCTCOUNT('13_ETAPA_RECRUTAMENTO'[application_id]),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[resultado_etapa] = ""Rejeitado"" ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[rejected_at] >= Ini ),
    KEEPFILTERS( '13_ETAPA_RECRUTAMENTO'[rejected_at] <  Fim )
)", @"98. ESTEIRAS\05");
Set(@"Esteira | Candidatos (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje))", @"98. ESTEIRAS\06");
Set(@"Esteira | Candidatos (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)))", @"98. ESTEIRAS\06");
Set(@"Esteira | Candidatos (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE([Esteira | Candidatos], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje))", @"98. ESTEIRAS\06");
Set(@"Esteira | Contratados (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Contratados], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Contratados (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Contratados], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Contratados (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Contratados], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Conversão Esteira % (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Conversão Esteira %], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Conversão Esteira % (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Conversão Esteira %], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Conversão Esteira % (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Conversão Esteira %], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Entrevistas Marcadas (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Entrevistas Marcadas (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Entrevistas Marcadas (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | Entrevistas Marcadas], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | SLA da Esteira (Mediana) (YTD)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | SLA da Esteira (Mediana)], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), 1, 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | SLA da Esteira (Mediana) (mês anterior)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | SLA da Esteira (Mediana)], DATESBETWEEN('_dCALENDARIO'[Data], EDATE(DATE(YEAR(Hoje), MONTH(Hoje), 1), -1), EDATE(Hoje, -1)) )", @"98. ESTEIRAS\06");
Set(@"Esteira | SLA da Esteira (Mediana) (mês atual)", @"VAR Hoje = TODAY()
RETURN CALCULATE( [Esteira | SLA da Esteira (Mediana)], DATESBETWEEN('_dCALENDARIO'[Data], DATE(YEAR(Hoje), MONTH(Hoje), 1), Hoje) )", @"98. ESTEIRAS\06");
Set(@"Esteira | Cor Selo Indicação", @"IF( SELECTEDVALUE( dFiltroIndicacao[opcao] ) = ""Só indicações"", ""#E6F3F3"", ""#FFFFFF"" )", @"98. ESTEIRAS\07");
Set(@"Esteira | Destaque Conversão", @"VAR C = [Esteira | Contratados]
VAR D = C + [Esteira | Rejeitados no Processo]
VAR A = COALESCE( [Esteira | Ativos Agora], 0 )
RETURN
IF(
    D > 0,
    FORMAT( DIVIDE( C, D ), ""0%"" ) & "" || Conversão da esteira || ""
        & FORMAT( C, ""#,0"" ) & "" contratados de "" & FORMAT( D, ""#,0"" ) & "" aplicações decididas. ""
        & FORMAT( A, ""#,0"" ) & "" seguem em andamento hoje. || bom""
)", @"98. ESTEIRAS\07");
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
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Destaque Maior Perda", @"VAR Nome = [Esteira | Etapa Maior Perda]
VAR Rej = CALCULATE( [Esteira | Rejeitados], TREATAS( { Nome }, dEtapa[stage_name] ) )
VAR Total = [Esteira | Rejeitados]
VAR Conv = CALCULATE( [Esteira | Conversão Geral %], TREATAS( { Nome }, dEtapa[stage_name] ) )
RETURN
IF(
    NOT ISBLANK( Nome ),
    FORMAT( Rej, ""#,0"" ) & "" rej. || Maior perda em "" & Nome & "" || ""
        & FORMAT( DIVIDE( Rej, Total ), ""0%"" ) & "" dos "" & FORMAT( Total, ""#,0"" )
        & "" rejeitados do período. Conversão da etapa: "" & FORMAT( Conv, ""0%"" ) & "". || ruim""
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Destaque Parados", @"VAR N = COALESCE( [Esteira | Ativos Acima de 45 Dias], 0 )
VAR T = ADDCOLUMNS( VALUES( dEtapa[stage_name] ), ""@p"", [Esteira | Ativos Acima de 45 Dias] )
VAR Top1 = TOPN( 1, FILTER( T, [@p] > 0 ), [@p], DESC )
VAR Etapa = MAXX( Top1, dEtapa[stage_name] )
VAR NEtapa = MAXX( Top1, [@p] )
RETURN
IF(
    N > 0,
    FORMAT( N, ""#,0"" ) & "" || Aplicações paradas há mais de 45 dias || Maior concentração: ""
        & Etapa & "" ("" & FORMAT( NEtapa, ""#,0"" ) & ""). Lista na página Nominal. || atencao"",
    ""0 || Nenhuma aplicação parada há mais de 45 dias || Todas as aplicações em processo avançaram nos últimos 45 dias. || bom""
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Destaque SLA", @"VAR S = [Esteira | SLA da Esteira (Mediana)]
VAR M = [Esteira | Meta SLA]
RETURN
IF(
    NOT ISBLANK( S ),
    FORMAT( S, ""0"" ) & "" dias || ""
        & IF( S <= M, ""SLA dentro da meta de "", ""SLA acima da meta de "" ) & FORMAT( M, ""0"" )
        & "" dias || Mediana da candidatura à contratação. "" & FORMAT( DIVIDE( S, M ), ""0%"" )
        & "" da meta consumida. || "" & IF( S <= M, ""bom"", ""ruim"" )
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Período Selecionado", @"VAR Ini = MAX( MIN('_dCALENDARIO'[Data]), DATE(2026, 7, 1) )
VAR Fim = MIN( MAX('_dCALENDARIO'[Data]), TODAY() )
RETURN FORMAT(Ini, ""dd/mmm"", ""pt-BR"") & "" – "" & FORMAT(Fim, ""dd/mmm"", ""pt-BR"")", @"98. ESTEIRAS\07");
Set(@"Esteira | Rótulo Acumulado", @"VAR Ini = MAX( DATE(YEAR(TODAY()), 1, 1), DATE(2026, 7, 1) )
RETURN ""Desde "" & FORMAT(Ini, ""dd/mmm"", ""pt-BR"")", @"98. ESTEIRAS\07");
Set(@"Esteira | Rótulo Comparação", @"VAR Hoje = TODAY()
RETURN ""1–"" & DAY(Hoje) & "" "" & FORMAT(Hoje, ""mmm"", ""pt-BR"") & "" vs "" & FORMAT(EDATE(Hoje, -1), ""mmm"", ""pt-BR"")", @"98. ESTEIRAS\07");
Set(@"Esteira | Selo Indicação", @"IF( SELECTEDVALUE( dFiltroIndicacao[opcao] ) = ""Só indicações"", ""Só indicações"", "" "" )", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Aplicações por Contratação", @"FORMAT([Esteira | Candidatos], ""#,0"") & "" aplicações para ""
    & FORMAT([Esteira | Contratados], ""#,0"") & "" contratações""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Candidatos", @"""Aplicações com candidatura no período""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Contratados", @"""Das aplicações com candidatura no período""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Conversão", @"FORMAT([Esteira | Contratados], ""#,0"") & "" contratados de ""
    & FORMAT([Esteira | Contratados] + [Esteira | Rejeitados no Processo], ""#,0"") & "" decididos""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Em Andamento", @"FORMAT( COALESCE([Esteira | Ativos Acima de 45 Dias], 0), ""#,0"" ) & "" paradas há mais de 45 dias""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Entrevistas", @"VAR A = COALESCE( [Esteira | Entrevistas na Agenda], 0 )
VAR R = COALESCE( [Esteira | Entrevistas Realizadas], 0 )
RETURN
FORMAT( A, ""#,0"" ) & "" acontecem no período: ""
    & FORMAT( R, ""#,0"" ) & "" realizadas, "" & FORMAT( A - R, ""#,0"" ) & "" a realizar""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Maior Perda", @"VAR T =
    CALCULATETABLE(
        ADDCOLUMNS( VALUES( dEtapa[stage_name] ), ""@rej"", [Esteira | Rejeitados] ),
        ALLSELECTED( dEtapa )
    )
VAR TotalRej = SUMX( T, [@rej] )
VAR Top1 = TOPN( 1, T, [@rej], DESC )
VAR Nome = MAXX( Top1, dEtapa[stage_name] )
VAR Rej = MAXX( Top1, [@rej] )
RETURN
IF(
    TotalRej > 0,
    ""Maior perda: **"" & Nome & ""** concentra "" & FORMAT( Rej, ""#,0"" ) & "" dos ""
        & FORMAT( TotalRej, ""#,0"" ) & "" rejeitados ("" & FORMAT( DIVIDE( Rej, TotalRej ), ""0%"" ) & "")."",
    ""Nenhuma rejeição no período.""
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Parados", @"VAR N = CALCULATE( [Esteira | Ativos Agora], ALLSELECTED( dEtapa ) )
VAR P = COALESCE( CALCULATE( [Esteira | Ativos Acima de 45 Dias], ALLSELECTED( dEtapa ) ), 0 )
VAR T =
    CALCULATETABLE(
        ADDCOLUMNS( VALUES( dEtapa[stage_name] ), ""@p"", [Esteira | Ativos Acima de 45 Dias] ),
        ALLSELECTED( dEtapa )
    )
VAR Top1 = TOPN( 1, FILTER( T, [@p] > 0 ), [@p], DESC )
VAR Etapa = MAXX( Top1, dEtapa[stage_name] )
VAR NE = MAXX( Top1, [@p] )
RETURN
IF(
    P > 0,
    ""**"" & FORMAT( P, ""#,0"" ) & "" das "" & FORMAT( N, ""#,0"" ) & ""** aplicações em andamento estão paradas há mais de 45 dias. **""
        & FORMAT( NE, ""#,0"" ) & "" estão em "" & Etapa & "".**"",
    ""Nenhuma aplicação parada há mais de 45 dias.""
)", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto Recrutador por Contratação", @"FORMAT([Esteira | Chegaram ao Recrutador], ""#,0"") & "" chegaram ao recrutador para ""
    & FORMAT([Esteira | Contratados], ""#,0"") & "" contratações""", @"98. ESTEIRAS\07");
Set(@"Esteira | Texto SLA", @"""Mediana da candidatura à contratação, aplicações do período""", @"98. ESTEIRAS\07");
Set(@"Esteira | Nominal Candidatura", @"IF( ISBLANK( [Esteira | Nominal Na Base] ), BLANK(), MIN( '13_ETAPA_RECRUTAMENTO'[data_aplicacao] ) )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Data de Saída", @"VAR Sit = [Esteira | Nominal Situação]
RETURN
SWITCH( Sit,
    ""Contratada"", MAX( '13_ETAPA_RECRUTAMENTO'[data_contratacao] ),
    ""Rejeitada"",  MAX( '13_ETAPA_RECRUTAMENTO'[rejected_at] ),
    ""Declinou"",   MAX( '13_ETAPA_RECRUTAMENTO'[rejected_at] ) )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Dias na Etapa", @"IF( ISBLANK( [Esteira | Nominal Na Base] ), BLANK(),
    MAXX( TOPN( 1, '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], DESC ), '13_ETAPA_RECRUTAMENTO'[days_in_stage] ) )", @"98. ESTEIRAS\08");
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
)", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Etapa Atual", @"IF( ISBLANK( [Esteira | Nominal Na Base] ), BLANK(),
    MAXX( TOPN( 1, '13_ETAPA_RECRUTAMENTO', '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], DESC ), '13_ETAPA_RECRUTAMENTO'[stage_name] ) )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Etapa da Entrevista", @"VAR Prox = [Esteira | Nominal Entrevista no Período]
RETURN
IF( NOT ISBLANK( Prox ),
    CALCULATE(
        MAX( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[etapa_entrevista] ),
        KEEPFILTERS( '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[start_at] = Prox ),
        TREATAS( VALUES( '13_ETAPA_RECRUTAMENTO'[application_id] ), '14_WD_GREENHOUSE_SCHEDULED_INTERVIEWS'[application_id] )
    ) )

-- Linha do tempo: etapa|entrada|saída|resultado|dias;;… (em ordem de entrada)", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Etapas Seguintes", @"VAR Sit = [Esteira | Nominal Situação]
VAR Est = MAX( '13_ETAPA_RECRUTAMENTO'[esteira] )
VAR Ult = MAXX( '13_ETAPA_RECRUTAMENTO', RELATED( dEtapa[ordem] ) )
RETURN
IF( Sit IN { ""Em andamento"", ""Rejeitada"", ""Declinou"" },
    CONCATENATEX(
        FILTER( dEsteiraEtapa, dEsteiraEtapa[esteira] = Est && dEsteiraEtapa[ordem] > Ult ),
        dEsteiraEtapa[stage_name], "";;"", dEsteiraEtapa[ordem], ASC ) )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Jornada", @"IF( ISBLANK( [Esteira | Nominal Na Base] ), BLANK(),
    CONCATENATEX(
        SUMMARIZE( '13_ETAPA_RECRUTAMENTO',
            '13_ETAPA_RECRUTAMENTO'[stage_name], '13_ETAPA_RECRUTAMENTO'[data_entrada_stage],
            '13_ETAPA_RECRUTAMENTO'[data_saida_stage], '13_ETAPA_RECRUTAMENTO'[resultado_etapa],
            '13_ETAPA_RECRUTAMENTO'[days_in_stage] ),
        '13_ETAPA_RECRUTAMENTO'[stage_name]
            & ""|"" & FORMAT( '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], ""yyyy-mm-dd"" )
            & ""|"" & IF( ISBLANK( '13_ETAPA_RECRUTAMENTO'[data_saida_stage] ), """", FORMAT( '13_ETAPA_RECRUTAMENTO'[data_saida_stage], ""yyyy-mm-dd"" ) )
            & ""|"" & '13_ETAPA_RECRUTAMENTO'[resultado_etapa]
            & ""|"" & FORMAT( '13_ETAPA_RECRUTAMENTO'[days_in_stage], ""0"" ),
        "";;"",
        '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], ASC ) )

-- Etapas da esteira que vêm depois da última por onde a aplicação passou", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Motivo", @"IF( ISBLANK( [Esteira | Nominal Na Base] ), BLANK(),
    MAXX(
        TOPN( 1, FILTER( '13_ETAPA_RECRUTAMENTO', NOT ISBLANK( '13_ETAPA_RECRUTAMENTO'[rejection_reason_name] ) ),
              '13_ETAPA_RECRUTAMENTO'[data_entrada_stage], DESC ),
        '13_ETAPA_RECRUTAMENTO'[rejection_reason_name] ) )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal Na Base", @"IF( NOT ISBLANK( [Esteira | Nominal Situação] ) || NOT ISBLANK( [Esteira | Nominal Entrevista no Período] ), 1 )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal No Período", @"IF( NOT ISBLANK( [Esteira | Candidatos] ), 1 )", @"98. ESTEIRAS\08");
Set(@"Esteira | Nominal SLA", @"IF( [Esteira | Nominal Situação] = ""Contratada"", MAX( '13_ETAPA_RECRUTAMENTO'[sla_esteira_dias] ) )", @"98. ESTEIRAS\08");
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
    ""Outro"" )", @"98. ESTEIRAS\08");
Set(@"Esteira | Check Agenda", @"[Esteira | Entrevistas na Agenda] - [Esteira | Entrevistas Realizadas] - [Esteira | Entrevistas a Realizar]", @"98. ESTEIRAS\99");
Set(@"Esteira | Check Coorte", @"[Esteira | Candidatos] - [Esteira | Contratados] - [Esteira | Rejeitados no Processo] - COALESCE( [Esteira | Ativos Agora], 0 )", @"98. ESTEIRAS\99");
Set(@"Esteira | Check Fechamento", @"[Esteira | Participantes] - [Esteira | Aprovados] - [Esteira | Rejeitados] - [Esteira | Em Andamento]", @"98. ESTEIRAS\99");
Set(@"Esteira | Check Funil", @"[Esteira | Candidatos] - CALCULATE( [Esteira | Funil Aplicações], TREATAS( { 1 }, dFunil[ordem_passo] ) )", @"98. ESTEIRAS\99");
Info("104 medidas atualizadas. Salve com Ctrl+S.");
