"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    serie1 = new formattingSettings.TextInput({ name: "serie1", displayName: "Botão da série 1", value: "Aprovações × rejeições", placeholder: "" });
    serie2 = new formattingSettings.TextInput({ name: "serie2", displayName: "Botão da série 2", value: "Entrevistas criadas × agendadas", placeholder: "" });
    nome1a = new formattingSettings.TextInput({ name: "nome1a", displayName: "Série 1: nome da primeira linha", value: "Aprovações", placeholder: "nome do campo" });
    nome1b = new formattingSettings.TextInput({ name: "nome1b", displayName: "Série 1: nome da segunda linha", value: "Rejeições", placeholder: "nome do campo" });
    nome2a = new formattingSettings.TextInput({ name: "nome2a", displayName: "Série 2: nome da primeira linha", value: "Criadas", placeholder: "nome do campo" });
    nome2b = new formattingSettings.TextInput({ name: "nome2b", displayName: "Série 2: nome da segunda linha", value: "Agendadas", placeholder: "nome do campo" });
    rotuloTaxa = new formattingSettings.TextInput({ name: "rotuloTaxa", displayName: "Texto da taxa (série 1)", value: "taxa de aprovação", placeholder: "" });
    rotuloFuturo = new formattingSettings.TextInput({ name: "rotuloFuturo", displayName: "Texto das datas futuras", value: "a partir de amanhã", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.serie1, this.serie2, this.nome1a, this.nome1b, this.nome2a, this.nome2b, this.rotuloTaxa, this.rotuloFuturo];
}

export const granItems = [
    { value: "dia", displayName: "Dia" },
    { value: "semana", displayName: "Semana" },
    { value: "mes", displayName: "Mês" },
    { value: "trimestre", displayName: "Trimestre" },
    { value: "ano", displayName: "Ano" }
];
const serieItems = [
    { value: "1", displayName: "Série 1" },
    { value: "2", displayName: "Série 2" }
];

class ComportamentoCard extends Card {
    granularidade = new formattingSettings.ItemDropdown({ name: "granularidade", displayName: "Granularidade ao abrir", items: granItems, value: granItems[1] });
    serieInicial = new formattingSettings.ItemDropdown({ name: "serieInicial", displayName: "Série ao abrir", items: serieItems, value: serieItems[0] });
    mostrarTaxa = new formattingSettings.ToggleSwitch({ name: "mostrarTaxa", displayName: "Mostrar taxa na série 1", value: true });
    mostrarHoje = new formattingSettings.ToggleSwitch({ name: "mostrarHoje", displayName: "Marcar \"hoje\" quando houver datas futuras", value: true });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.granularidade, this.serieInicial, this.mostrarTaxa, this.mostrarHoje];
}

class CoresCard extends Card {
    c1a = new formattingSettings.ColorPicker({ name: "c1a", displayName: "Série 1: primeira linha", value: { value: xpColors.teal } });
    c1b = new formattingSettings.ColorPicker({ name: "c1b", displayName: "Série 1: segunda linha", value: { value: xpColors.rejected } });
    c2a = new formattingSettings.ColorPicker({ name: "c2a", displayName: "Série 2: primeira linha", value: { value: xpColors.ink } });
    c2b = new formattingSettings.ColorPicker({ name: "c2b", displayName: "Série 2: segunda linha", value: { value: xpColors.teal } });
    name = "cores";
    displayName = "Cores";
    slices = [this.c1a, this.c1b, this.c2a, this.c2b];
}

const areaItems = [
    { value: "a", displayName: "Primeira linha" },
    { value: "b", displayName: "Segunda linha" },
    { value: "nenhuma", displayName: "Nenhuma" }
];

class AreaCard extends Card {
    area1 = new formattingSettings.ItemDropdown({ name: "area1", displayName: "Série 1: área sob", items: areaItems, value: areaItems[0] });
    area2 = new formattingSettings.ItemDropdown({ name: "area2", displayName: "Série 2: área sob", items: areaItems, value: areaItems[1] });
    name = "area";
    displayName = "Área";
    slices = [this.area1, this.area2];
}

export class TrendSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    cores = new CoresCard();
    area = new AreaCard();
    cards = [this.textos, this.comportamento, this.cores, this.area];
}
