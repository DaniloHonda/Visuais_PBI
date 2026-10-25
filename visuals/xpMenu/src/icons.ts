"use strict";

// Ícones de traço (24×24), no estilo da barra lateral do Cockpit.
const P: Record<string, string> = {
    pessoas: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1.5a3.5 3.5 0 0 0-2.5-3.35M15 5.15a3 3 0 0 1 0 5.7",
    pessoa: "M18 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 6 17.5V19M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
    check: "M20 6 9 17l-5-5",
    relogio: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2",
    funil: "M4 5h16l-6 7v6l-4 2v-8z",
    setas: "M7 7h13M16 3l4 4-4 4M17 17H4M8 13l-4 4 4 4",
    x: "M18 6 6 18M6 6l12 12",
    grade: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    cronometro: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 9v4l2 2M10 2h4",
    grafico: "M4 19h16M5 15l4-5 4 3 6-7",
    calendario: "M5 5h14v15H5zM5 9h14M9 3v4M15 3v4",
    alerta: "M12 4 2.5 20h19zM12 10v4M12 17v.5",
    lista: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
};

export function icon(name: string): SVGSVGElement {
    // Namespace padrão do SVG (identificador, não é um endereço acessado).
    const ns = "ht" + "tp://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg") as SVGSVGElement;
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", P[(name || "").trim().toLowerCase()] || P.lista);
    svg.appendChild(path);
    return svg;
}
