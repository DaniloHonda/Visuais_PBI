"""Cabeçalho com espaço para os dois alternadores (modo e indicação), numa linha só (y 37–87).

[ Esteiras / subtítulo ]  ...  [Candidatura | Fotografia + contexto]  [Todas | Só indicações]  [Dados desde 01/07/2026]  [🕒 data]
Selo de dados: x 1520–1710 · relógio: x 1722–1880. Uso: python3 tools/gen_bg_cabecalho.py (altera os SVGs no lugar).
"""
from pathlib import Path

SELO_ANTIGO = '<rect x="1330" y="37" width="280" height="50" rx="10" fill="#FFF4E0" stroke="#F2D49B"/>'
SELO_NOVO = '<rect x="1520" y="37" width="190" height="50" rx="10" fill="#FFF4E0" stroke="#F2D49B"/>'
TEXTO_ANTIGO = ('<text x="1470" y="67" font-family="\'Segoe UI\', Arial, sans-serif" font-size="14" font-weight="700" '
                'fill="#7A4B00" text-anchor="middle">Dados disponíveis desde 01/07/2026</text>')
TEXTO_NOVO = ('<text x="1615" y="66.5" font-family="\'Segoe UI\', Arial, sans-serif" font-size="13" font-weight="700" '
              'fill="#7A4B00" text-anchor="middle">Dados desde 01/07/2026</text>')
RELOGIO_ANTIGO = '<rect x="1880" y="87" width="250" height="50" rx="10" transform="rotate(180 1880 87)" fill="#F5F5F5"/>'
RELOGIO_NOVO = '<rect x="1722" y="37" width="158" height="50" rx="10" fill="#F5F5F5"/>'
ICONE = '<path fill-rule="evenodd" clip-rule="evenodd" d="M1660 52.2558'


def ajustar(svg: str) -> str:
    if SELO_NOVO in svg:
        return svg  # já convertido
    for velho, novo in ((SELO_ANTIGO, SELO_NOVO), (TEXTO_ANTIGO, TEXTO_NOVO), (RELOGIO_ANTIGO, RELOGIO_NOVO)):
        assert velho in svg, velho[:40]
        svg = svg.replace(velho, novo, 1)
    linhas = svg.split("\n")
    for i, l in enumerate(linhas):
        if l.startswith(ICONE):
            linhas[i] = f'<g transform="translate(82 0)">{l}</g>'  # ícone do relógio acompanha a caixa (1660 → 1742)
    return "\n".join(linhas)


if __name__ == "__main__":
    for f in sorted(Path("backgrounds").rglob("BG - Esteiras_*.svg")):
        f.write_text(ajustar(f.read_text()))
        print(f, "ok")
