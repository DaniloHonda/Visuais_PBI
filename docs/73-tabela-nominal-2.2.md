# 73 · XP · Tabela nominal 2.2.0 (03/11/2026)

Prévia: `docs/73-tabela-nominal-2.2-preview.png` (aprovada). Pacote: `dist/XP - Tabela nominal 2.2.0.pbiviz`. Importar por cima da 2.1.2.

## O que muda
- **Fotografia calculada na tabela:** valores `~token` em "Dados da visão" são resolvidos pela tabela a partir da linha do tempo
  (`jornada_txt`: etapa|entrada|saída|resultado|dias) e das chaves do Contexto `foto=`, `ini=`, `etapas=`, `faixas=`.
  Tokens: `etapa_dia`, `entrada_dia`, `dias_dia`, `seg45`, `faixa_dia`, `etapa_ultima`, `dias_ultima`, `etapa_rej`, `dias_rej`,
  `ent_etapa/res/entrada/saida/dias` (usa `_rej` e `_aberta` da linha), `sla_n/dias/entrada/saida/faixa/etapa`.
  Chaves que começam com `_` não viram coluna. Sem `foto=` no Contexto, nada muda (Candidatura, Evolução, Entrevistas, Alertas).
- **CSV só com a lista completa:** enquanto carrega, o botão mostra "⏳ Preparando CSV…" (desabilitado).
- **Blocos de 30 mil** (antes 10 mil) e **Máximo de linhas carregadas = 150.000** (antes 60.000). Se parar no limite, o cabeçalho avisa.
- Selo colorido também em "Situação no dia", "Situação hoje" e "Resultado no dia"; "Sem etapa no dia" em cinza.

## Ordem de implantação
1. Importar a 2.2.0 (sozinha não muda nada). Conferir em Formatar → Comportamento → Máximo de linhas carregadas = 150000
   (o valor salvo no relatório vale mais que o padrão).
2. DAX parte 1 (`docs/74`): cabeçalho com foto/ini/etapas/faixas.
3. DAX parte 2 (`docs/74`): linha da Fotografia leve, com tokens.
