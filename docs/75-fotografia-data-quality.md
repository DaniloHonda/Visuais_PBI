# 75 · Data Quality e o modo Fotografia (03/11/2026)

**Recomendação: a Data Quality não muda com o modo.** Os alertas são do registro como ele está hoje (voltou de etapa, sem motivo,
contratada no pool, etapas em dobro…). Não existe histórico do registro para dizer como estava a qualidade em D, e o objetivo da
página é achar o que corrigir agora no Greenhouse. Então ela usa sempre a régua da Candidatura (candidatura no período, situação de hoje).

## Como deixar isso claro na tela
- Alternador na DQ **sem sincronizar** e só com a opção Candidatura (vira um selo): copiar do Resumo → colar → "Não sincronizar";
  Filtros neste visual: `dModo[modo]` = Candidatura; Dica: "Data Quality olha a base como está hoje: a página usa sempre a
  régua da Candidatura (aplicações com candidatura no período)". Em Sincronizar segmentações, a DQ fica fora do grupo `modo`.
  Se ficasse sincronizado, o Alternador da DQ aplicaria Candidatura e trocaria o modo das outras páginas.
- Tabela da DQ (visão Alertas): mesmos ajustes da Nominal — Contexto → `Visão Contexto Leve`, Dados → `Visão Dados Modo`,
  filtro do visual `Visão Na Lista Modo` é 1, Máximo de linhas carregadas 150.000 (a Alertas é igual nos dois modos).
- Tipo de página: Página de relatório (sem Detalhamento).
