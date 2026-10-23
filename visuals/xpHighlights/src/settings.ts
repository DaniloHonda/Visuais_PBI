"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class LayoutCard extends Card {
    ordenar = new formattingSettings.ToggleSwitch({ name: "ordenar", displayName: "Mais graves primeiro", value: true });
    preencher = new formattingSettings.ToggleSwitch({ name: "preencher", displayName: "Ocupar toda a altura", value: true });
    espaco = new formattingSettings.NumUpDown({ name: "espaco", displayName: "Espaço entre destaques (px)", value: 8 });
    larguraNumero = new formattingSettings.NumUpDown({ name: "larguraNumero", displayName: "Largura do número (px)", value: 96 });
    tamanhoNumero = new formattingSettings.NumUpDown({ name: "tamanhoNumero", displayName: "Tamanho do número", value: 26 });
    tamanhoTitulo = new formattingSettings.NumUpDown({ name: "tamanhoTitulo", displayName: "Tamanho do título", value: 13.5 });
    name = "layout";
    displayName = "Layout";
    slices = [this.ordenar, this.preencher, this.espaco, this.larguraNumero, this.tamanhoNumero, this.tamanhoTitulo];
}

class CoresCard extends Card {
    ruim = new formattingSettings.ColorPicker({ name: "ruim", displayName: "Ruim", value: { value: xpColors.rejected } });
    atencao = new formattingSettings.ColorPicker({ name: "atencao", displayName: "Atenção", value: { value: xpColors.warning } });
    bom = new formattingSettings.ColorPicker({ name: "bom", displayName: "Bom", value: { value: xpColors.teal } });
    info = new formattingSettings.ColorPicker({ name: "info", displayName: "Informativo", value: { value: xpColors.ink } });
    name = "cores";
    displayName = "Cores por status";
    slices = [this.ruim, this.atencao, this.bom, this.info];
}

export class HighlightsSettings extends Model {
    layout = new LayoutCard();
    cores = new CoresCard();
    cards = [this.layout, this.cores];
}
