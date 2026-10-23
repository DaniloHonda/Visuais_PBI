"use strict";

// Interpolação em OKLab: mantém a saturação no meio do degradê (em RGB os tons do meio ficam acinzentados).
function toLinear(v: number): number { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function fromLinear(v: number): number { const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.round(Math.min(1, Math.max(0, c)) * 255); }
function hexToRgb(hex: string): number[] {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
    const n = m ? parseInt(m[1], 16) : 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToOklab(rgb: number[]): number[] {
    const [r, g, b] = rgb.map(toLinear);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklabToHex(lab: number[]): string {
    const [L, a, b] = lab;
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
    return "#" + rgb.map(v => fromLinear(v).toString(16).padStart(2, "0")).join("");
}
// Interpola luminosidade, saturação e matiz separadamente (OKLCH): o meio do degradê não acinzenta.
export function mixOklab(a: string, b: string, t: number): string {
    const A = rgbToOklab(hexToRgb(a)), B = rgbToOklab(hexToRgb(b));
    const ca = Math.hypot(A[1], A[2]), cb = Math.hypot(B[1], B[2]);
    const ha = Math.atan2(A[2], A[1]);
    let dh = Math.atan2(B[2], B[1]) - ha;
    if (dh > Math.PI) dh -= 2 * Math.PI;
    if (dh < -Math.PI) dh += 2 * Math.PI;
    const L = A[0] + (B[0] - A[0]) * t, C = ca + (cb - ca) * t, h = ha + dh * t;
    return oklabToHex([L, C * Math.cos(h), C * Math.sin(h)]);
}
// Texto branco ou preto, o que tiver mais contraste com a barra.
export function textOn(hex: string): string {
    const lum = (rgb: number[]) => { const [r, g, b] = rgb.map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const L = lum(hexToRgb(hex));
    return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#FFFFFF" : "#121212";
}


// Mistura linear em OKLab (sem girar o matiz): bom para sair de um cinza neutro até uma cor.
export function mixLab(a: string, b: string, t: number): string {
    const A = rgbToOklab(hexToRgb(a)), B = rgbToOklab(hexToRgb(b));
    return oklabToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
