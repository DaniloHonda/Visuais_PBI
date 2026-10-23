"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    unidade = new formattingSettings.TextInput({ name: "unidade", displayName: "Unidade", value: "dias", placeholder: "" });
    unidadeCurta = new formattingSettings.TextInput({ name: "unidadeCurta", displayName: "Unidade curta (na lista)", value: "d", placeholder: "" });
    realizado = new formattingSettings.TextInput({ name: "realizado", displayName: "Texto após o número", value: "de SLA realizado", placeholder: "" });
    partePor = new formattingSettings.TextInput({ name: "partePor", displayName: "Texto do % na lista", value: "do SLA", placeholder: "" });
    rotuloTotal = new formattingSettings.TextInput({ name: "rotuloTotal", displayName: "Botão do total", value: "Mediana", placeholder: "" });
    rotuloTotal2 = new formattingSettings.TextInput({ name: "rotuloTotal2", displayName: "Botão do total alternativo", value: "Média", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.unidade, this.unidadeCurta, this.realizado, this.partePor, this.rotuloTotal, this.rotuloTotal2];
}

class CoresCard extends Card {
    inicio = new formattingSettings.ColorPicker({ name: "inicio", displayName: "Degradê: primeiro item", value: { value: "#6CCBD0" } });
    fim = new formattingSettings.ColorPicker({ name: "fim", displayName: "Degradê: último item", value: { value: "#03474C" } });
    dentro = new formattingSettings.ColorPicker({ name: "dentro", displayName: "Selo dentro da meta", value: { value: xpColors.teal } });
    acima = new formattingSettings.ColorPicker({ name: "acima", displayName: "Selo acima da meta", value: { value: xpColors.rejected } });
    name = "cores";
    displayName = "Cores";
    slices = [this.inicio, this.fim, this.dentro, this.acima];
}

const ordemItems = [
    { value: "maior", displayName: "Mais lentos primeiro" },
    { value: "original", displayName: "Ordem original (processo)" }
];

class ListaCard extends Card {
    ordemInicial = new formattingSettings.ItemDropdown({ name: "ordemInicial", displayName: "Ordem ao abrir", items: ordemItems, value: ordemItems[0] });
    mostrarZerados = new formattingSettings.ToggleSwitch({ name: "mostrarZerados", displayName: "Mostrar itens sem valor", value: false });
    altura = new formattingSettings.NumUpDown({ name: "altura", displayName: "Altura da linha (px)", value: 20 });
    name = "lista";
    displayName = "Lista";
    slices = [this.ordemInicial, this.mostrarZerados, this.altura];
}

export class GoalSettings extends Model {
    textos = new TextosCard();
    cores = new CoresCard();
    lista = new ListaCard();
    cards = [this.textos, this.cores, this.lista];
}
