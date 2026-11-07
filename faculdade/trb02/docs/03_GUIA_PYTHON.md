# Guia 3 · Dashboards em Python (Streamlit)

São **dois dashboards**, um em cada arquivo da pasta `python/`, os dois lendo as views do PostgreSQL da EC2:

| Arquivo | Dashboard | Views |
|---|---|---|
| `dashboard.py` | **1 · Visão geral**: volume, origem, vagas, situação e pretensão | `vw_candidaturas`, `vw_vagas_acima_media` |
| `dashboard_recrutadores.py` | **2 · Recrutadores e funil**: etapas, evolução por situação, consulta 2.1, dispersão e resumo | `vw_candidaturas`, `vw_vagas_mais_15` |

## 1. Instalar (uma vez, no seu computador)

Precisa de Python 3.10 ou mais novo. No terminal (PowerShell no Windows):

```bash
pip install streamlit plotly sqlalchemy "psycopg[binary]" pandas
```

## 2. Rodar

Na pasta `python/`, informe o IP da EC2 e a senha por variáveis de ambiente. A senha não fica no código.

Windows (PowerShell):

```powershell
$env:DB_HOST="IP_PUBLICO_DA_EC2"; $env:DB_PASSWORD="SUA_SENHA"; streamlit run dashboard.py
```

Linux ou macOS:

```bash
DB_HOST=IP_PUBLICO_DA_EC2 DB_PASSWORD=SUA_SENHA streamlit run dashboard.py
```

O navegador abre em `http://localhost:8501`. Para o dashboard 2, troque o nome do arquivo:

```powershell
$env:DB_HOST="IP_PUBLICO_DA_EC2"; $env:DB_PASSWORD="SUA_SENHA"; streamlit run dashboard_recrutadores.py
```

Para rodar os dois ao mesmo tempo, abra um segundo terminal e acrescente `--server.port 8502` no fim do comando.

## 3. Dashboard 1 · Visão geral

| Gráfico | Categoria no Abela |
|---|---|
| 4 KPIs (candidaturas, vagas, contratações, pretensão média) | Número único |
| **Linha**: candidaturas por mês | Ao longo do tempo |
| **Rosca**: participação por origem | Composição estática |
| **Barras horizontais**: candidaturas por vaga | Comparação entre muitos itens |
| **Colunas 100% empilhadas**: situação por área | Composição |
| **Histograma**: pretensão salarial | Distribuição |
| Tabela da consulta 3.1 (JOIN + sub select) | Resultado da consulta |

Os filtros de Área, Recrutador e Senioridade ficam no topo e atualizam todos os gráficos.

## 3b. Dashboard 2 · Recrutadores e funil

| Gráfico | Categoria no Abela |
|---|---|
| 4 KPIs (recrutadores, candidaturas por vaga, taxa de contratação, em andamento) | Número único |
| **Funil**: candidaturas que chegaram a cada etapa | Composição: acumulação ou subtração do total |
| **Colunas empilhadas**: candidaturas por mês e situação | Composição ao longo do tempo, poucos períodos |
| **Barras horizontais**: resultado da consulta 2.1 (JOIN + GROUP BY + HAVING) | Comparação entre muitos itens |
| **Dispersão**: candidaturas × pretensão média por vaga | Relação entre duas variáveis |
| Tabela: resumo por recrutador | Resultado consolidado |

Filtros no topo: Recrutador e Status da vaga.

📸 Para **cada** dashboard: print da página inteira (role a página ou use a captura de página inteira do navegador).
📸 Print com um filtro aplicado.
📸 Print do terminal com o comando `streamlit run`, para provar a execução.

## 4. Na entrega

Anexe `dashboard.py` e `dashboard_recrutadores.py` (o enunciado pede o código Python na entrega) e cole os dois códigos também no relatório.
