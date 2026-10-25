# 6.6b · Data Quality: visuais e posições

Prévia com os números reais da conferência: `docs/mockups/46-data-quality-visuais.png` (desenho aprovado: `docs/mockups/44-data-quality.png`).
Pacotes: `dist/XP - Card de KPI 1.3.0.pbiviz` · `dist/XP - Tipos de alerta 1.0.0.pbiviz` (novo) · `dist/XP - Onde acontece 1.0.0.pbiviz` (novo) · `dist/XP - Tabela nominal 2.1.1.pbiviz`.

Página **Data Quality** · 1900 × 1720 · fundo `BG - Esteiras_DataQuality.svg` · barra de filtros copiada da Nominal.

## 0. Importar
Visualizações → ⋯ → Importar um visual de um arquivo → os 3 arquivos. O Card de KPI 1.3.0 substitui o 1.2.1 em todas as páginas (os cards atuais não mudam).

## 1. Cards (XP · Card de KPI 1.3.0) · Y 380 · L 372 · A 180
| Card | X | Valor | Texto de contexto | Linha de insight | Status |
|---|---|---|---|---|---|
| Com algum alerta | 310 | DQ Com Alerta | DQ Com Alerta Texto | DQ Com Alerta Insight | DQ Com Alerta Status |
| Voltou de etapa | 700 | DQ Voltou | DQ Voltou Texto | DQ Voltou Insight | DQ Voltou Status |
| Sem motivo na base | 1090 | DQ Sem Motivo | DQ Sem Motivo Texto | DQ Sem Motivo Insight | DQ Sem Motivo Status |
| Contratada no pool | 1480 | DQ No Pool | DQ No Pool Texto | DQ No Pool Insight | DQ No Pool Status |

(todas as medidas começam com `Esteira | `). Período do valor: `Esteira | Período Selecionado` (igual aos cards do Resumo).

Formatar: Cabeçalho → Título (o nome da tabela acima) · Valor → Unidades de exibição **Nenhum** · Comparação e Acumulado **desligados** ·
**Explicação (ⓘ)** → colar o texto:
- Com algum alerta: "Aplicações do período com pelo menos um alerta de processo ou de dado. Uma aplicação pode ter mais de um. Use os Tipos de alerta para ver cada um."
- Voltou de etapa: "A aplicação saiu de uma etapa e foi para uma etapa anterior do fluxo. O tempo conta no SLA e a etapa de onde voltou não conta como aprovação."
- Sem motivo na base: "Aplicação rejeitada sem motivo na base. Na maioria dos casos é o 'Duplicate' do Greenhouse, que chega vazio."
- Contratada no pool: "A contratação foi registrada na própria vaga de pool, em vez de mover a pessoa para a vaga final. A origem e o SLA da contratação ficam errados."

Cor: Status = critico → coral, atencao → âmbar (Formatar → Status muda as cores).

## 2. Tipos de alerta (XP · Tipos de alerta 1.0.0)
1. Fundo: Inserir → Formas → Retângulo arredondado · X 310 · Y 580 · L 770 · A 430 · branco, borda #E6E6E6 1 px, cantos 22.
2. Visual por cima: **X 334 · Y 600 · L 722 · A 392**, fundo desligado.
3. Campos: Alerta `dAlerta[alerta]` · Grupo `dAlerta[grupo]` · Ordem `dAlerta[ordem]` · Explicação `dAlerta[descricao]` · Onde corrigir `dAlerta[onde_corrigir]` ·
   Aplicações `Esteira | Aplicações com Alerta` · % `Esteira | % com Alerta` · Status `Esteira | DQ Status`.
4. Clicar num tipo filtra a página (Onde acontece e a tabela). Clicar de novo, ou em "× Ver todos os alertas", tira o filtro. Os cards não mudam.

## 3. Onde acontece · visual nosso **XP · Onde acontece 1.0.0** (título + botões + barras num só)
Não usa visual nativo nem parâmetro de campos (se criou o `pOnde`, pode apagar a tabela).
1. Fundo: Inserir → Formas → Retângulo arredondado · X 1100 · Y 580 · L 752 · A 430 · branco, borda #E6E6E6, cantos 22.
2. Visual por cima: **X 1124 · Y 600 · L 704 · A 390**, fundo desligado, título desligado.
3. Campos:
   | Campo do visual | O que colocar |
   |---|---|
   | Recortes (um botão por campo) | `recruiter_name`, `dEtapa[stage_name]`, `job_name`, `esteira`, `especialidade` (nesta ordem; a ordem é a dos botões) |
   | Aplicações com alerta | `Esteira \| Aplicações com Alerta` |
   | Base (aplicações do recorte) | `Esteira \| DQ Onde Base` |
   | Título | `Esteira \| DQ Onde Título` |
4. Nome dos botões: seta do campo em Recortes → **Renomear para este visual** → Recrutador, Etapa, Vaga, Esteira, Especialidade.
5. Formatar → Regra de cor: mínimo 20 aplicações · âmbar 1,5× · coral 2× a taxa geral (mesma regra da medida DQ Onde Status).
6. Clicar numa barra filtra a página (a tabela mostra só aquele recrutador/etapa/vaga); clicar de novo ou "× tirar filtro" tira.

## 4. Tabela (XP · Tabela nominal 2.1.1)
1. Copiar a tabela da página Nominal (Ctrl+C) e colar aqui (Ctrl+V): mesmos campos e o filtro do visual `Visão Na Lista = 1`.
2. Posição: **X 310 · Y 1030 · L 1542 · A 650**.
3. **Filtro da página:** Filtros nesta página → `dVisao[visao]` → só **Alertas**.
4. Selos na coluna Alertas: dado = cinza, processo = âmbar, coral para "Contratada dentro do pool" e "Voltou de etapa (3× ou mais)".

## Teste
1. Os 4 números = conferência D2/D1 (16.867 · 8.023 · 4.162 · 1), com as cores âmbar e coral.
2. Clicar "Voltou de etapa" → título "Onde acontece: "Voltou de etapa"" e a tabela com 8.023 e "✓ igual ao gráfico".
3. Trocar Recrutador → Etapa → Vaga nos botões; as barras mais fora da média ficam âmbar/coral.
