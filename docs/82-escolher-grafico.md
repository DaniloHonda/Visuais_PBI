# 82 · Nominal: clicar no card e escolher o gráfico (05/11/2026) · proposta

Prévia: `docs/82-escolher-grafico-preview.png` (HTML em `docs/mockups/82-escolher-grafico.html`). Números ilustrativos, exceto o 5.106.

## Como funciona
1. **Card = lista** (Entradas por etapa, Em andamento…). O card diz quantos gráficos usam aquela lista.
2. Ao clicar no card, aparece **"De qual gráfico?"** com um botão por gráfico, cada um com o número que o gráfico considera
   (mesma regra e mesmos filtros do gráfico). O primeiro vem escolhido.
3. A lista mostra **só as aplicações daquele gráfico**. Logo acima fica o número do botão: os dois têm que ser iguais.
   A lista diz também quantas **passagens** são (soma das linhas por etapa do gráfico).
4. **Abas = colunas do gráfico** (ex.: Aprovados e Rejeitados no "Aprovados por praça"). Como no gráfico, a mesma aplicação
   pode estar em duas abas (aprovada numa etapa e rejeitada em outra). Hoje as abas são exclusivas: por isso não batem com as colunas.
5. Com a **Etapa filtrada**, os números são os da linha daquela etapa no gráfico.

## Por que dois números (aplicações e passagens)
Os gráficos por etapa contam a aplicação **uma vez em cada etapa** por onde ela passou. A lista tem uma linha por aplicação.
Sem etapa filtrada: lista = aplicações distintas do gráfico; soma das linhas do gráfico = passagens. Com uma etapa: os dois são iguais.

## Gráficos de cada card
| Card | Gráficos (botões) |
|---|---|
| Aplicações | Card Aplicações · Card Conversão (Resumo) · Aprovados por recrutador (Report) |
| Funil | Quantas aplicações precisamos para contratar (Resumo) |
| Em andamento | Card Em andamento · Onde estão as aplicações em andamento (Resumo) · Aplicações em andamento por etapa · Pré Offer e Offer (Report) |
| Contratadas | Card Contratadas · Card SLA · Consumo do SLA por etapa (Resumo) |
| Entradas por etapa | Entradas e aprovações por etapa · Aprovados por praça (Report) · Onde a esteira perde (Resumo) |
| Rejeitados e motivos | Rejeitados por etapa · Motivos de saída por etapa (Report) |
| SLA por etapa | SLA por etapa: típico e 90% (Report) |
| Evolução | Evolução da esteira · Movimentações (Report) |
| Entrevistas | Card Entrevistas (Resumo) · Evolução da esteira · Agenda (Report) |
| Alertas | Tipos de alerta (Data Quality) |
"Por recrutador" e "Andamento por faixa" deixam de ser cards e viram botões (Aplicações e Em andamento): 12 → 10 cards.

## Decisão (05/11): card mostra o número do 1º gráfico (opção 1). Danilo aprovou seguir.

## Partes (cada uma com conferência)
1. `dVisao` com a coluna `grafico` (uma linha por gráfico) e a ordem: `docs/83-dvisao-graficos.dax` (enviada 05/11, aguardando foto).
2. Medidas: contagem, lista e dados leem o gráfico escolhido (mudam só os gráficos com regra diferente da do card).
3. **Conferência gráfico a gráfico, etapa a etapa** (consulta DAX: número do gráfico × número da lista). Só depois disso dizemos que bate.
4. Menu de visões 1.3.0: linha "De qual gráfico?" com os números. Prévia antes do arquivo.
5. Tabela nominal 2.3.0: abas que se sobrepõem, aplicações e passagens, mais o que estava na proposta 80. Prévia antes do arquivo.
