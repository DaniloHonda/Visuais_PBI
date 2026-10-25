"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

const layoutItems = [
    { value: "vertical", displayName: "Vertical (barra lateral)" },
    { value: "horizontal", displayName: "Horizontal (cards em cima da tabela)" }
];

class MenuCard extends Card {
    layout = new formattingSettings.ItemDropdown({ name: "layout", displayName: "Formato", items: layoutItems, value: layoutItems[0] });
    padrao = new formattingSettings.TextInput({ name: "padrao", displayName: "Visão sem seleção", value: "Aplicações", placeholder: "Primeira da lista" });
    mostrarDescricao = new formattingSettings.ToggleSwitch({ name: "mostrarDescricao", displayName: "Mostrar descrição", value: true });
    mostrarContagem = new formattingSettings.ToggleSwitch({ name: "mostrarContagem", displayName: "Mostrar contagem", value: true });
    ordemGrupos = new formattingSettings.TextInput({ name: "ordemGrupos", displayName: "Ordem dos grupos (separados por ;)", value: "Resumo;Report", placeholder: "Resumo;Report" });
    name = "menu";
    displayName = "Menu";
    slices = [this.layout, this.padrao, this.ordemGrupos, this.mostrarDescricao, this.mostrarContagem];
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
