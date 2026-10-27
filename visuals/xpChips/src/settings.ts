"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    vazio = new formattingSettings.TextInput({ name: "vazio", displayName: "Texto sem filtro", value: "Sem filtros: todas as aplicações desde 01/07/2026", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.vazio];
}

class CoresCard extends Card {
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo da pílula", value: { value: "#EEF7F7" } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Borda da pílula", value: { value: "#CFE3E4" } });
    texto = new formattingSettings.ColorPicker({ name: "texto", displayName: "Texto da pílula", value: { value: "#03474C" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.fundo, this.borda, this.texto];
}

export class ChipsSettings extends Model {
    textos = new TextosCard();
    cores = new CoresCard();
    cards = [this.textos, this.cores];
}
