# 14 · Aprovados por praça em cada etapa (página Report)

Visual: **XP · Matriz de calor 1.2.0** (`dist/XP - Matriz de calor 1.2.0.pbiviz`). Importar por cima da versão anterior: a matriz de tempo parado continua igual (sem "Base da taxa" o botão de taxa não aparece).

![Praça](14-praca-preview.png)

## Posição
| X | Y | Largura | Altura |
|---|---|---|---|
| 316 | 2722 | 736 | 400 |

## Campos (nenhuma medida nova)
| Campo | O que colocar |
|---|---|
| Linhas | a coluna de praça (a mesma da segmentação "Praça") |
| Colunas | `dEtapa[grupo]` (já classificada por `ordem_grupo`) |
| Valor | `Esteira \| Aprovados` |
| Base da taxa | `Esteira \| Rejeitados` |
| Detalhe da coluna | `Esteira \| Etapas do Grupo` (ⓘ no título de cada grupo) |

Para usar só algumas etapas-chave no lugar dos grupos: Colunas = `dEtapa[stage_name]` e filtro do visual nas etapas desejadas.

## Medida do ⓘ (etapas de cada grupo)
```DAX
Esteira | Etapas do Grupo =
CONCATENATEX(
    VALUES( dEtapa[stage_name] ),
    dEtapa[stage_name],
    UNICHAR(10),
    CALCULATE( MIN( dEtapa[ordem] ) ), ASC
)
```
![Informativo](14-praca-info.png)

## Formatar
| Grupo | Opção | Valor |
|---|---|---|
| Textos | Título da coluna das linhas / Título da coluna de total / Unidade | Praça / Aprovados / aprovados |
| Textos | Nota no rodapé | Cor mais escura = mais aprovados |
| Coluna de alerta | Destacar a última coluna | desligado |
| Taxa (com base) | Abrir em / Cálculo da taxa | Taxa vs. média / Valor ÷ (valor + base) |
| Taxa (com base) | Na média até ± / Cor cheia a partir de / Mínimo de casos | 2 / 15 / 30 |

## Como funciona
- Taxa vs. média: taxa da praça na etapa e diferença para a média da coluna ("51% −6"); teal acima, coral abaixo, cinza na média (± 2 p.p.); células com menos de 30 aprovados + rejeitados ficam sem cor (número em cinza). Linha "Média" no fim.
- Botões Números e % da linha mostram o volume de aprovados.
- Ordenar pelo título da coluna (na taxa, ordena pela taxa); clique na célula filtra praça + etapa.

---

## 1.3.0 · Etapas nas linhas, praças nas colunas (27/10)
Pacote: `dist/XP - Matriz de calor 1.3.0.pbiviz` (importar por cima da 1.2.0; a matriz de tempo parado continua igual).
Prévia: `docs/14-praca-1.3-preview.png` (números fictícios).

### Novidades do visual
- **Ordem das linhas (opcional):** medida com o número da ordem. As linhas ficam **sempre** nessa ordem, qualquer que seja o grupo
  ou a ordem em que o Power BI manda os dados. Etapa sem ordem vai para o fim.
- **Grupo da linha (opcional):** liga os títulos de grupo entre as linhas e o botão **Etapa | Grupo**. Os títulos só aparecem
  quando o grupo muda na sequência da ordem: nunca reordenam as etapas. Na visão Grupo, as etapas do grupo são somadas.
- **Taxa → Comparar com a: Média da linha:** cada célula é comparada à taxa da etapa (todas as praças) e aparece a coluna **Média**.
- "Só com movimento" esconde também as colunas (praças) sem nenhum valor.

### Medidas (Exibição de consulta DAX → Executar → "Atualizar o modelo com alterações")
```
DEFINE
    MEASURE '_Medidas'[Esteira | Ordem da Etapa] = MIN( dEtapa[ordem] )
    MEASURE '_Medidas'[Esteira | Grupo da Etapa] = SELECTEDVALUE( dEtapa[grupo] )
EVALUATE ROW( "medidas", 1 )
```

### Campos
| Campo | O que colocar |
|---|---|
| Linhas | `dEtapa[stage_name]` |
| Colunas | a coluna de praça (a mesma da segmentação "Praça") |
| Valor | `Esteira \| Aprovados` |
| Base da taxa | `Esteira \| Rejeitados` |
| Detalhe da coluna | vazio (tirar `Etapas do Grupo`) |
| Ordem das linhas | `Esteira \| Ordem da Etapa` |
| Grupo da linha | `Esteira \| Grupo da Etapa` |

### Formatar
| Grupo | Opção | Valor |
|---|---|---|
| Textos | Título da coluna das linhas / de total / Unidade | Etapa / Aprovados / aprovados |
| Textos | Botão de grupo / Título da coluna de média | Grupo / Média |
| Taxa (com base) | Abrir em / Comparar com a | Taxa vs. média / **Média da linha** |
| Taxa (com base) | Nota no rodapé | Taxa = aprovados ÷ (aprovados + rejeitados) · teal = acima da média da etapa · coral = abaixo · cinza = na média · sem cor = menos de 30 casos |
| Coluna de alerta | Destacar a última coluna | desligado |

### Página Report · layout "mínima mudança"
Fundo novo `backgrounds/BG - Esteiras_Report.svg` (página **1900 × 4444**: Exibir → Tamanho da página → Personalizado, altura 4444).
Tudo acima da praça fica onde está. Mudam só:
| Visual | X | Y | L | A |
|---|---|---|---|---|
| Aprovados por praça em cada etapa (Matriz 1.3.0) | 316 | 2722 | 1540 | 540 |
| Aprovados por recrutador (Tabela por etapa) | 316 | 3386 | 1540 | 400 |
| Aplicações em Pré Offer e Offer (Tabela nominal) | 316 | 3910 | 1540 | 460 |

Recrutador com a largura toda: a tabela sai do modo compacto e mostra todas as colunas. Opcional: SLA média =
`Esteira | SLA da Esteira (Média)` (Formatar → Textos → coluna SLA média = "SLA médio").

### Conferir
1. Filtrar uma esteira: só aparecem as etapas dela, na ordem do processo.
2. Coluna Aprovados de cada etapa = Aprovados da mesma etapa em "Entradas e aprovações por etapa".
3. Botão Grupo: Aprovados de cada grupo = soma das etapas do grupo.
