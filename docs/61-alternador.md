# 61 · XP · Alternador 1.0.0 e o modo Candidatura × Fotografia (parte 1: o botão)

Pacote: `dist/XP - Alternador 1.0.0.pbiviz` · prévia do visual real (host simulado): `docs/61-alternador-preview.png` ·
desenho aprovado: `docs/mockups/61-alternador-fotografia.png` · conceito e limites: `docs/60-fotografia.md`.

O visual filtra uma tabela de opções **sem relação** (`dModo`); as medidas leem o modo com `SELECTEDVALUE`.
Reutilizável em qualquer troca de modo (ex.: "Todas | Só indicações" no formato compacto).

## 1. Tabela (Modelagem → Nova tabela)
```DAX
dModo =
DATATABLE( "modo", STRING, "ordem", INTEGER, { { "Candidatura", 1 }, { "Fotografia", 2 } } )
```
`dModo[modo]` → Classificar por coluna → `ordem`; ocultar `ordem`. **Sem relação** com nenhuma tabela.

## 2. Medidas (Exibição de consulta DAX)
```DAX
DEFINE
    MEASURE '_Medidas'[Esteira | Modo] = SELECTEDVALUE( dModo[modo], "Candidatura" )
    MEASURE '_Medidas'[Esteira | Data da Fotografia] = MIN( MAX( '_dCALENDARIO'[Data] ), TODAY() )
    MEASURE '_Medidas'[Esteira | Texto do Modo] =
        VAR Ini = MAX( MIN( '_dCALENDARIO'[Data] ), DATE( 2026, 7, 1 ) )
        VAR Fim = [Esteira | Data da Fotografia]
        VAR Per = FORMAT( Ini, "dd/mm" ) & " a " & FORMAT( Fim, "dd/mm" )
        RETURN
        IF( [Esteira | Modo] = "Fotografia",
            "Como estava em **" & FORMAT( Fim, "dd/mm" ) & "** · e o que aconteceu de " & Per,
            "Candidaturas de **" & Per & "** · situação de hoje" )
EVALUATE
ROW( "modo", [Esteira | Modo], "foto", [Esteira | Data da Fotografia], "texto", [Esteira | Texto do Modo] )
```

## 3. Visual
Campos: Opções = `dModo[modo]` · Texto de contexto = `Esteira | Texto do Modo`.
Formatar: Geral → Título e Plano de fundo desligados · Comportamento → Opção padrão "Candidatura" ·
Textos → Dicas: `Aplicações criadas no período, com a situação de hoje|Como estava cada aplicação no último dia do período, e o que aconteceu dentro dele`.
Formato pílula (padrão), altura 40, cantos 12, texto 14 · contexto ao lado, 13.
Posição sugerida (cabeçalho, antes do "Todas | Só indicações" em X 1000): **X 560 · Y 26 · L 430 · A 64**, contexto **Embaixo**.
Copiar para as outras páginas (Ctrl+C / Ctrl+V → Sincronizar).

## 4. Conferência
Cartão temporário com `Esteira | Modo`: clicar em Fotografia → "Fotografia"; em Candidatura → "Candidatura". Depois apagar o cartão.
Nada no dash muda ainda: as medidas de cada visual no modo Fotografia vêm na parte 2 (cards do Resumo).

## 1.1.0 (03/11/2026) · sincroniza entre páginas
Só muda a capacidade `supportsSynchronizingFilterState` (aparência igual). Sem ela o Power BI não sincroniza visual personalizado:
cada página teria o seu modo e, ao trocar de página, voltaria para Candidatura.
Importar `dist/XP - Alternador 1.1.0.pbiviz` por cima da 1.0.0 → copiar do Resumo (Ctrl+C) → colar na Report (Ctrl+V) → "Sincronizar".
Conferir em Exibição → Sincronizar segmentações: `modo` com Sincronizar e Visível marcados no Resumo e na Report.
