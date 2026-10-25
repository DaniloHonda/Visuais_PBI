"""Fundos com a 5ª página do submenu Esteiras: Data Quality (abaixo de Nominal).

Lê backgrounds/BG - Esteiras_*.svg, aumenta o submenu de 4 para 5 itens e cria o fundo da página Data Quality
(cópia do Nominal com o item ativo trocado). Saída em docs/mockups/43-fundos/ (copiar para backgrounds/ após aprovação).
"""
import os
import re

SRC = "backgrounds"
OUT = "docs/mockups/43-fundos"
Y = 1333  # item novo logo abaixo de Nominal (1299 + 34)

ICON = (
    f'<path d="M64 {Y + 7}L73.5 {Y + 10.5}V{Y + 17}C73.5 {Y + 22.5} 69.5 {Y + 26} 64 {Y + 28}'
    f'C58.5 {Y + 26} 54.5 {Y + 22.5} 54.5 {Y + 17}V{Y + 10.5}Z" stroke="white" stroke-width="1.6" fill="none"/>'
    f'<path d="M59.8 {Y + 17.4}L63 {Y + 20.6}L68.4 {Y + 14.6}" stroke="white" stroke-width="1.6" fill="none" '
    f'stroke-linecap="round" stroke-linejoin="round"/>'
)


def item(active: bool) -> str:
    bg = "#1F1F1F" if active else "#121212"
    bar = f'<rect x="27" y="{Y}" width="2" height="34" fill="#067D84"/>' if active else ""
    weight = 700 if active else 400
    return (f'<g><rect width="237" height="34" transform="translate(27 {Y})" fill="{bg}"/>{bar}{ICON}'
            f'<text x="101" y="{Y + 22}" font-family="\'Segoe UI\', Arial, sans-serif" font-size="14" '
            f'font-weight="{weight}" fill="white" text-anchor="start">Data Quality</text></g>')


def five_items(svg: str, dq_active: bool) -> str:
    svg = svg.replace('<rect width="26" height="136" transform="translate(0 1197)"',
                      '<rect width="26" height="170" transform="translate(0 1197)"', 1)
    svg = svg.replace('<rect y="1197" width="2" height="136"', '<rect y="1197" width="2" height="170"', 1)
    lines = svg.split("\n")
    i = next(k for k, l in enumerate(lines) if "translate(27 1299)" in l and l.startswith("<g"))
    lines.insert(i + 1, item(dq_active))
    return "\n".join(lines)


def deactivate_nominal(svg: str) -> str:
    lines = svg.split("\n")
    i = next(k for k, l in enumerate(lines) if "translate(27 1299)" in l and l.startswith("<g"))
    l = lines[i].replace('transform="translate(27 1299)" fill="#1F1F1F"', 'transform="translate(27 1299)" fill="#121212"', 1)
    l = l.replace('<rect x="27" y="1299" width="2" height="34" fill="#067D84"/>', "", 1)
    l = l.replace('font-weight="700" fill="white" text-anchor="start">Nominal', 'font-weight="400" fill="white" text-anchor="start">Nominal', 1)
    lines[i] = l
    return "\n".join(lines)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name in ["Conceitos", "Resumo", "Report", "Nominal"]:
        svg = open(f"{SRC}/BG - Esteiras_{name}.svg", encoding="utf-8").read()
        open(f"{OUT}/BG - Esteiras_{name}.svg", "w", encoding="utf-8").write(five_items(svg, False))
    svg = open(f"{SRC}/BG - Esteiras_Nominal.svg", encoding="utf-8").read()
    svg = deactivate_nominal(svg)
    svg = re.sub(r">Bases nominais:[^<]*<", ">Data quality: alertas de processo e de dado por trás dos números<", svg, count=1)
    open(f"{OUT}/BG - Esteiras_DataQuality.svg", "w", encoding="utf-8").write(five_items(svg, True))


if __name__ == "__main__":
    main()
