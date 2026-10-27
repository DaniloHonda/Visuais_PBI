"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    colLinhas = new formattingSettings.TextInput({ name: "colLinhas", displayName: "Título da coluna das linhas", value: "Etapa", placeholder: "nome do campo" });
    rotuloTotal = new formattingSettings.TextInput({ name: "rotuloTotal", displayName: "Título da coluna de total", value: "Total", placeholder: "" });
    unidade = new formattingSettings.TextInput({ name: "unidade", displayName: "Unidade na dica", value: "aplicações", placeholder: "" });
    rodape = new formattingSettings.TextInput({ name: "rodape", displayName: "Nota no rodapé", value: "Dias desde a entrada na etapa atual · cor mais escura = mais aplicações", placeholder: "" });
    rotuloGrupo = new formattingSettings.TextInput({ name: "rotuloGrupo", displayName: "Botão de grupo", value: "Grupo", placeholder: "" });
    rotuloMediaCol = new formattingSettings.TextInput({ name: "rotuloMediaCol", displayName: "Título da coluna de média (taxa por linha)", value: "Média", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.colLinhas, this.rotuloTotal, this.unidade, this.rodape, this.rotuloGrupo, this.rotuloMediaCol];
}

class ComportamentoCard extends Card {
    busca = new formattingSettings.ToggleSwitch({ name: "busca", displayName: "Mostrar busca e botões", value: true });
    soMovimento = new formattingSettings.ToggleSwitch({ name: "soMovimento", displayName: "Abrir com \"Só com movimento\"", value: true });
    modoPct = new formattingSettings.ToggleSwitch({ name: "modoPct", displayName: "Abrir em \"% da linha\"", value: false });
    mostrarTotal = new formattingSettings.ToggleSwitch({ name: "mostrarTotal", displayName: "Mostrar coluna de total", value: true });
    botaoGrupo = new formattingSettings.ToggleSwitch({ name: "botaoGrupo", displayName: "Mostrar botão linha | grupo", value: true });
    ocultarColunas = new formattingSettings.ToggleSwitch({ name: "ocultarColunas", displayName: "\"Só com movimento\" esconde colunas vazias", value: true });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.busca, this.soMovimento, this.modoPct, this.mostrarTotal, this.botaoGrupo, this.ocultarColunas];
}

class AlertaCard extends Card {
    ultima = new formattingSettings.ToggleSwitch({ name: "ultima", displayName: "Destacar a última coluna", value: true });
    coluna = new formattingSettings.TextInput({ name: "coluna", displayName: "Ou a coluna com este nome", value: "", placeholder: "ex.: > 45 d" });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor do destaque", value: { value: xpColors.rejected } });
    name = "alerta";
    displayName = "Coluna de alerta";
    slices = [this.ultima, this.coluna, this.cor];
}

class CoresCard extends Card {
    clara = new formattingSettings.ColorPicker({ name: "clara", displayName: "Menor valor", value: { value: "#EAF6F6" } });
    meio = new formattingSettings.ColorPicker({ name: "meio", displayName: "Valor do meio", value: { value: "#6CCBD0" } });
    escura = new formattingSettings.ColorPicker({ name: "escura", displayName: "Maior valor", value: { value: "#03474C" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.clara, this.meio, this.escura];
}

const formulaItems = [
    { value: "soma", displayName: "Valor ÷ (valor + base)" },
    { value: "base", displayName: "Valor ÷ base" }
];
const compararItems = [
    { value: "coluna", displayName: "Média da coluna" },
    { value: "linha", displayName: "Média da linha" }
];
const modoItems = [
    { value: "num", displayName: "Números" },
    { value: "taxa", displayName: "Taxa vs. média" }
];

class TaxaCard extends Card {
    modoInicial = new formattingSettings.ItemDropdown({ name: "modoInicial", displayName: "Abrir em", items: modoItems, value: modoItems[0] });
    comparar = new formattingSettings.ItemDropdown({ name: "comparar", displayName: "Comparar com a", items: compararItems, value: compararItems[0] });
    formula = new formattingSettings.ItemDropdown({ name: "formula", displayName: "Cálculo da taxa", items: formulaItems, value: formulaItems[0] });
    rotulo = new formattingSettings.TextInput({ name: "rotulo", displayName: "Botão da taxa", value: "Taxa vs. média", placeholder: "" });
    rotuloNumeros = new formattingSettings.TextInput({ name: "rotuloNumeros", displayName: "Botão dos números", value: "Números", placeholder: "" });
    mostrarPct = new formattingSettings.ToggleSwitch({ name: "mostrarPct", displayName: "Mostrar botão \"% da linha\"", value: true });
    rotuloMedia = new formattingSettings.TextInput({ name: "rotuloMedia", displayName: "Linha da média", value: "Média", placeholder: "" });
    tolerancia = new formattingSettings.NumUpDown({ name: "tolerancia", displayName: "Na média até ± (p.p.)", value: 2 });
    escala = new formattingSettings.NumUpDown({ name: "escala", displayName: "Cor cheia a partir de (p.p.)", value: 15 });
    minimo = new formattingSettings.NumUpDown({ name: "minimo", displayName: "Mínimo de casos para colorir", value: 30 });
    acima = new formattingSettings.ColorPicker({ name: "acima", displayName: "Acima da média", value: { value: xpColors.teal } });
    abaixo = new formattingSettings.ColorPicker({ name: "abaixo", displayName: "Abaixo da média", value: { value: "#C2453B" } });
    rodape = new formattingSettings.TextInput({ name: "rodape", displayName: "Nota no rodapé (modo taxa)", value: "Taxa = aprovados ÷ (aprovados + rejeitados) · teal = acima da média da etapa · coral = abaixo · cinza = na média · sem cor = poucos casos", placeholder: "" });
    name = "taxa";
    displayName = "Taxa (com base)";
    slices = [this.modoInicial, this.comparar, this.formula, this.rotulo, this.rotuloNumeros, this.mostrarPct, this.rotuloMedia, this.tolerancia, this.escala, this.minimo, this.acima, this.abaixo, this.rodape];
}

export class HeatmapSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    alerta = new AlertaCard();
    cores = new CoresCard();
    taxa = new TaxaCard();
    cards = [this.textos, this.comportamento, this.alerta, this.cores, this.taxa];
}
