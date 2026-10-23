"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

const formatoItems = [
    { value: "funil", displayName: "Funil (barras centralizadas)" },
    { value: "barras", displayName: "Barras (alinhadas à esquerda)" }
];

const modoCorItems = [
    { value: "degrade", displayName: "Degradê por etapa (claro → escuro)" },
    { value: "grupo", displayName: "Uma cor por grupo (com legenda)" },
    { value: "unica", displayName: "Cor única" }
];

class BarrasCard extends Card {
    modoCor = new formattingSettings.ItemDropdown({ name: "modoCor", displayName: "Cores das barras", items: modoCorItems, value: modoCorItems[0] });
    corInicio = new formattingSettings.ColorPicker({ name: "corInicio", displayName: "Degradê: cor da primeira etapa", value: { value: "#6CCBD0" } });
    corFim = new formattingSettings.ColorPicker({ name: "corFim", displayName: "Degradê: cor da penúltima etapa", value: { value: "#03474C" } });
    formato = new formattingSettings.ItemDropdown({ name: "formato", displayName: "Formato", items: formatoItems, value: formatoItems[0] });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor única", value: { value: xpColors.teal } });
    destacarUltima = new formattingSettings.ToggleSwitch({ name: "destacarUltima", displayName: "Destacar a última etapa", value: true });
    corUltima = new formattingSettings.ColorPicker({ name: "corUltima", displayName: "Cor da última etapa", value: { value: xpColors.ink } });
    etapaDestaque = new formattingSettings.TextInput({ name: "etapaDestaque", displayName: "Etapa em destaque (nome exato)", value: "", placeholder: "Ex.: Chegaram ao recrutador" });
    corDestaque = new formattingSettings.ColorPicker({ name: "corDestaque", displayName: "Cor da etapa em destaque", value: { value: xpColors.tealDark } });
    altura = new formattingSettings.NumUpDown({ name: "altura", displayName: "Altura da barra (px)", value: 40 });
    espacamento = new formattingSettings.NumUpDown({ name: "espacamento", displayName: "Espaço entre linhas (px)", value: 9 });
    name = "barras";
    displayName = "Barras";
    slices = [this.modoCor, this.corInicio, this.corFim, this.formato, this.cor, this.destacarUltima, this.corUltima, this.etapaDestaque, this.corDestaque, this.altura, this.espacamento];
}

class RotulosCard extends Card {
    largura = new formattingSettings.NumUpDown({ name: "largura", displayName: "Largura dos nomes (px)", value: 190 });
    tamanho = new formattingSettings.NumUpDown({ name: "tamanho", displayName: "Tamanho do texto", value: 13 });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor do texto", value: { value: xpColors.text } });
    name = "rotulos";
    displayName = "Nomes das etapas";
    slices = [this.largura, this.tamanho, this.cor];
}

class PercentuaisCard extends Card {
    mostrarTotal = new formattingSettings.ToggleSwitch({ name: "mostrarTotal", displayName: "Mostrar % do total", value: true });
    textoTotal = new formattingSettings.TextInput({ name: "textoTotal", displayName: "Texto após o % do total", value: "do total", placeholder: "" });
    mostrarAnterior = new formattingSettings.ToggleSwitch({ name: "mostrarAnterior", displayName: "Mostrar % da etapa anterior", value: true });
    textoAnterior = new formattingSettings.TextInput({ name: "textoAnterior", displayName: "Texto após o % da anterior", value: "da etapa anterior", placeholder: "" });
    textoBase = new formattingSettings.TextInput({ name: "textoBase", displayName: "Texto da primeira etapa", value: "base do funil", placeholder: "" });
    name = "percentuais";
    displayName = "Percentuais";
    slices = [this.mostrarTotal, this.textoTotal, this.mostrarAnterior, this.textoAnterior, this.textoBase];
}

// Paleta validada (CVD e visão normal) para grupos em sequência. Evita vermelho, laranja e amarelo,
// que são reservados para status (rejeitado, em andamento).
export const grupoPalette = ["#00959C", "#6250D6", "#5E8C1F", "#C2477F", "#2A78D6", "#6B6B6B"];

class CoresCard extends Card {
    mostrarLegenda = new formattingSettings.ToggleSwitch({ name: "mostrarLegenda", displayName: "Mostrar legenda", value: true });
    cor1 = new formattingSettings.ColorPicker({ name: "cor1", displayName: "Grupo 1", value: { value: grupoPalette[0] } });
    cor2 = new formattingSettings.ColorPicker({ name: "cor2", displayName: "Grupo 2", value: { value: grupoPalette[1] } });
    cor3 = new formattingSettings.ColorPicker({ name: "cor3", displayName: "Grupo 3", value: { value: grupoPalette[2] } });
    cor4 = new formattingSettings.ColorPicker({ name: "cor4", displayName: "Grupo 4", value: { value: grupoPalette[3] } });
    cor5 = new formattingSettings.ColorPicker({ name: "cor5", displayName: "Grupo 5", value: { value: grupoPalette[4] } });
    cor6 = new formattingSettings.ColorPicker({ name: "cor6", displayName: "Grupo 6 e demais", value: { value: grupoPalette[5] } });
    name = "cores";
    displayName = "Cores dos grupos";
    slices = [this.mostrarLegenda, this.cor1, this.cor2, this.cor3, this.cor4, this.cor5, this.cor6];
}

export class FunnelSettings extends Model {
    barras = new BarrasCard();
    rotulos = new RotulosCard();
    percentuais = new PercentuaisCard();
    cores = new CoresCard();
    cards = [this.barras, this.cores, this.rotulos, this.percentuais];
}
