# Guia 2 · Dashboard no Power BI Desktop

Pré-requisitos: a EC2 ligada (Learner Lab em *Start Lab*), o IP público em mãos e a regra 5432 liberada para o seu IP.

## 1. Conectar ao PostgreSQL da EC2

1. Power BI Desktop → **Obter dados → Mais… → Banco de dados PostgreSQL → Conectar**.
2. **Servidor**: `IP_PUBLICO:5432` · **Banco de dados**: `recrutamento` · Modo: **Importar** → OK.
3. Credenciais: aba **Banco de dados** → Usuário `trb02` · Senha → **Conectar**.

> **Erro "o certificado remoto é inválido"?** O PostgreSQL do Ubuntu usa um certificado autoassinado.
> Clique em OK quando o Power BI perguntar se quer conectar **sem criptografia**.
> Se ele não perguntar: **Arquivo → Opções e configurações → Configurações da fonte de dados** → selecione a fonte → **Editar permissões** → desmarque **Criptografar conexões**.

4. No Navegador, marque as views:
   - `public.vw_candidaturas` (base detalhada, junta as 4 tabelas)
   - `public.vw_vagas_mais_15` (consulta 2.1: JOIN + GROUP BY + HAVING)
   - `public.vw_vagas_acima_media` (consulta 3.1: JOIN + sub select)
5. **Carregar**.

📸 Print do Navegador com as views marcadas (prova de que o dashboard lê as tabelas criadas, e não um painel da AWS).

## 2. Medidas (Página inicial → Nova medida)

```DAX
Candidaturas = COUNTROWS ( vw_candidaturas )

Contratações = CALCULATE ( [Candidaturas], vw_candidaturas[situacao] = "Contratado" )

Vagas = DISTINCTCOUNT ( vw_candidaturas[id_vaga] )

Pretensão média = AVERAGE ( vw_candidaturas[pretensao_salarial] )

Taxa de contratação = DIVIDE ( [Contratações], [Candidaturas] )
```

Formatos: *Pretensão média* → Moeda R$; *Taxa de contratação* → Porcentagem com 1 casa.

## 3. Visuais (uma página, 16:9)

Os tipos de gráfico seguem o diagrama de Abela (*Chart Suggestions*):

| Posição | Visual | Campos | Categoria no Abela |
|---|---|---|---|
| Topo | 4 × **Cartão** | Candidaturas · Vagas · Contratações · Pretensão média | Número único |
| Topo, à direita | **Segmentação** (lista suspensa) | `area` e outra com `recrutador` | Filtro |
| Meio, à esquerda | **Gráfico de colunas clusterizado** | Eixo X: `mes` (hierarquia → só *Mês*) · Y: *Candidaturas* | Comparação no tempo, poucos períodos |
| Meio, à direita | **Gráfico de barras 100% empilhadas** | Eixo Y: `area` · X: *Candidaturas* · Legenda: `situacao` | Composição |
| Embaixo, à esquerda | **Gráfico de barras clusterizado** | `vw_vagas_mais_15`: Eixo Y `titulo` · X `total_candidaturas` · ordenar decrescente | Comparação entre muitos itens |
| Embaixo, à direita | **Gráfico de rosca** | Legenda: `origem` · Valores: *Candidaturas* | Composição estática (parte do todo) |
| Rodapé | **Tabela** | `vw_vagas_acima_media`: `titulo`, `recrutador`, `total_candidaturas` | Resultado do sub select |

Dicas de acabamento:
- Título da página: **Processo seletivo · Dashboard Power BI**. Subtítulo: *Fonte: PostgreSQL em AWS EC2 · banco recrutamento*.
- Ative **Rótulos de dados** nas barras e colunas.
- Use poucas cores: uma cor para séries únicas e 4 cores distintas para `situacao` e `origem`.
- As views `vw_vagas_mais_15` e `vw_vagas_acima_media` não se relacionam com `vw_candidaturas`, então as segmentações não as filtram. Isso é esperado, porque elas mostram o resultado fixo das consultas.

📸 Print do dashboard completo. 📸 Print com um filtro aplicado (ex.: área = Dados), mostrando a interação.

## 4. Salvar

**Arquivo → Salvar como** `TRB02_dashboard.pbix`. Esse arquivo vai na entrega (sem compactar).
