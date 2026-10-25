"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class MenuCard extends Card {
    padrao = new formattingSettings.TextInput({ name: "padrao", displayName: "Visão sem seleção", value: "Aplicações", placeholder: "Primeira da lista" });
    mostrarDescricao = new formattingSettings.ToggleSwitch({ name: "mostrarDescricao", displayName: "Mostrar descrição", value: true });
    mostrarContagem = new formattingSettings.ToggleSwitch({ name: "mostrarContagem", displayName: "Mostrar contagem", value: true });
    name = "menu";
    displayName = "Menu";
    slices = [this.padrao, this.mostrarDescricao, this.mostrarContagem];
}

class CoresCard extends Card {
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo", value: { value: "#FFFFFF" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.destaque, this.fundo];
}

export class MenuSettings extends Model {
    menu = new MenuCard();
    cores = new CoresCard();
    cards = [this.menu, this.cores];
}
