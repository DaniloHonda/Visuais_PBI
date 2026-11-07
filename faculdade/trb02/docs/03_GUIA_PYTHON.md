# Guia 3 · Dashboard em Python (Streamlit)

O código está em `python/dashboard.py`. Ele lê as views `vw_candidaturas` e `vw_vagas_acima_media` do PostgreSQL da EC2.

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

O navegador abre em `http://localhost:8501`.

## 3. O que o dashboard mostra

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

📸 Print do dashboard inteiro (role a página ou use a captura de página inteira do navegador).
📸 Print com um filtro aplicado.
📸 Print do terminal com o comando `streamlit run`, para provar a execução.

## 4. Na entrega

Anexe `dashboard.py` (o enunciado pede o código Python na entrega) e cole o código também no relatório.
