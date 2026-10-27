"""Fundos com a faixa fina de filtros (painel de filtros por indicador).

O cartão "Filtros" (y 135, altura 203) vira uma faixa de 64 px e todo o conteúdo abaixo sobe 139 px.
A página fica 139 px mais baixa. Uso: python3 tools/gen_bg_faixa_filtros.py (altera backgrounds/ no lugar).
"""
import re
from pathlib import Path

SOBE = 139
PAGINAS = ["Resumo", "Report", "Nominal", "DataQuality"]

def ajustar(svg: str) -> str:
    if 'height="64" rx="20" fill="white"/>' in svg and "faixa-filtros" in svg:
        return svg  # já convertido
    h = int(re.search(r'<svg width="1900" height="(\d+)"', svg).group(1))
    novo = h - SOBE
    svg = svg.replace(f'height="{h}"', f'height="{novo}"').replace(f'viewBox="0 0 1900 {h}"', f'viewBox="0 0 1900 {novo}"')
    # rodapé do menu lateral acompanha o fim da página (convenção: translate(0 H-1500))
    svg = svg.replace(f'translate(0 {h - 1500})', f'translate(0 {novo - 1500})')
    linhas = svg.split("\n")
    out, dentro = [], False
    for l in linhas:
        if '<rect x="292" y="135" width="1588" height="203" rx="20" fill="white"/>' in l:
            l = l.replace('height="203"', 'height="64"') + "<!-- faixa-filtros -->"
        elif l.startswith('<line x1="319" y1="277.5"'):
            continue  # divisória do cartão antigo
        elif l.startswith('<rect x="326" y="147" width="42" height="38" rx="10" fill="#067D84"/>') or \
                l.startswith('<rect width="24" height="24" transform="translate(335 154)"') or \
                l.startswith('<path fill-rule="evenodd" clip-rule="evenodd" d="M356 160.5H338'):
            continue  # ícone "Filtros" (o botão nativo assume)
        elif l.startswith('<path d="M379.496 172V156.6'):
            continue  # texto "Filtros"
        if "Dados disponíveis desde" in l:
            out.append(l)
            dentro = True
            continue
        if dentro and l.strip() == "</g>":
            dentro = False
        if dentro and l.strip():
            l = f'<g transform="translate(0 -{SOBE})">{l}</g>'
        out.append(l)
    return "\n".join(out)

if __name__ == "__main__":
    for p in PAGINAS:
        f = Path(f"backgrounds/BG - Esteiras_{p}.svg")
        f.write_text(ajustar(f.read_text()))
        print(p, "ok")
