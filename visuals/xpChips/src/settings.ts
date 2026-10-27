"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    botao = new formattingSettings.TextInput({ name: "botao", displayName: "Texto do botão", value: "Filtros", placeholder: "" });
    limpar = new formattingSettings.TextInput({ name: "limpar", displayName: "Texto de limpar", value: "Limpar filtros", placeholder: "" });
    vazio = new formattingSettings.TextInput({ name: "vazio", displayName: "Texto sem filtro", value: "Sem filtros: todas as aplicações desde 01/07/2026", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.botao, this.limpar, this.vazio];
}

// Larguras fixas para o botão nativo transparente ficar exatamente por cima.
class LayoutCard extends Card {
    larguraBotao = new formattingSettings.NumUpDown({ name: "larguraBotao", displayName: "Largura do botão (px)", value: 150 });
    larguraLimpar = new formattingSettings.NumUpDown({ name: "larguraLimpar", displayName: "Largura de limpar (px)", value: 126 });
    name = "layout";
    displayName = "Layout";
    slices = [this.larguraBotao, this.larguraLimpar];
}

class CoresCard extends Card {
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor do botão", value: { value: "#067D84" } });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo da pílula", value: { value: "#EEF7F7" } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Borda da pílula", value: { value: "#CFE3E4" } });
    texto = new formattingSettings.ColorPicker({ name: "texto", displayName: "Texto da pílula", value: { value: "#03474C" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.destaque, this.fundo, this.borda, this.texto];
}

export class ChipsSettings extends Model {
    textos = new TextosCard();
    layout = new LayoutCard();
    cores = new CoresCard();
    cards = [this.textos, this.layout, this.cores];
}
