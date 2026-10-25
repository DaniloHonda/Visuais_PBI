# 6.6a · Data Quality: modelo

Arquivos: `docs/45-data-quality.dax` (tabelas, medidas, conferência) e `docs/41-visoes-completas.dax` (visão "Alertas").

## Passo a passo
1. **dAlerta:** Exibição de tabela → dAlerta → trocar a fórmula pela A1 → Enter. Depois coluna `alerta` → Classificar por coluna → `ordem`.
2. **dVisao:** trocar a fórmula pela A2 → Enter. Depois `visao` → Classificar por coluna → `ordem`.
3. **Menu da página Nominal:** selecionar o menu de visões → Filtros neste visual → `dVisao[grupo]` → desmarcar "Data Quality".
4. **Visões:** Exibição de consulta DAX → colar o `docs/41-visoes-completas.dax` inteiro → Executar → "Atualizar o modelo com alterações".
5. **Medidas:** colar a parte C do `45` até o fim → Executar → "Atualizar o modelo com alterações". As consultas D1 e D2 aparecem no resultado.
6. **Parâmetro "Onde acontece":** Modelagem → Novo parâmetro → **Campos** → nome `pOnde` → adicionar, nesta ordem:
   `recruiter_name`, `dEtapa[stage_name]`, `job_name`, `esteira`, `especialidade` (as mesmas colunas das Colunas fixas) →
   desmarcar "Adicionar segmentação a esta página" → Criar. Na tabela `pOnde`, renomear os valores para
   Recrutador, Etapa, Vaga, Esteira, Especialidade (coluna `pOnde`, editar a fórmula).

## Regra de cor
| Onde | Âmbar | Coral |
|---|---|---|
| Com algum alerta | > 10% das aplicações | > 20% |
| Cada tipo (cards e lista) | > `dAlerta[atencao]` | > `dAlerta[critico]` |
| Onde acontece (recrutador, etapa…) | taxa ≥ 1,5× a geral, com 20+ aplicações | ≥ 2× a geral |

Limites iniciais por tipo: Voltou 5% / 10% · Configuração 2% / 5% · Sem nome 0,5% / 1% · Sem motivo 2% / 5% ·
Antes da candidatura 0,1% / 0,5% · Em dobro 2% / 5% · Contratada dentro do pool: qualquer caso. Editáveis em dAlerta.
