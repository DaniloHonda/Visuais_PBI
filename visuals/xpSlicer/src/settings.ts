"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class CabecalhoCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar cabeçalho", value: true });
    titulo = new formattingSettings.TextInput({ name: "titulo", displayName: "Título", value: "", placeholder: "Nome do campo" });
    vazio = new formattingSettings.TextInput({ name: "vazio", displayName: "Texto sem seleção", value: "Todos", placeholder: "" });
    name = "cabecalho";
    displayName = "Cabeçalho";
    slices = [this.mostrar, this.titulo, this.vazio];
}

const ordemItems = [
    { value: "original", displayName: "Ordem da coluna" },
    { value: "contagem", displayName: "Maior contagem primeiro" },
    { value: "alfabetica", displayName: "Alfabética" }
];

const modoItems = [
    { value: "suspensa", displayName: "Caixa com lista suspensa" },
    { value: "caixa", displayName: "Caixa com janela de seleção" },
    { value: "lista", displayName: "Lista sempre aberta" }
];

class ComportamentoCard extends Card {
    modo = new formattingSettings.ItemDropdown({ name: "modo", displayName: "Formato", items: modoItems, value: modoItems[0] });
    alturaCaixa = new formattingSettings.NumUpDown({ name: "alturaCaixa", displayName: "Altura da caixa (px)", value: 44 });
    unica = new formattingSettings.ToggleSwitch({ name: "unica", displayName: "Seleção única", value: false });
    busca = new formattingSettings.ToggleSwitch({ name: "busca", displayName: "Campo de busca", value: true });
    selecionarTodos = new formattingSettings.ToggleSwitch({ name: "selecionarTodos", displayName: "\"Selecionar todos\"", value: true });
    ordem = new formattingSettings.ItemDropdown({ name: "ordem", displayName: "Ordem dos itens", items: ordemItems, value: ordemItems[0] });
    semDadosNoFim = new formattingSettings.ToggleSwitch({ name: "semDadosNoFim", displayName: "Itens sem contagem no fim", value: true });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.modo, this.alturaCaixa, this.unica, this.busca, this.selecionarTodos, this.ordem, this.semDadosNoFim];
}

class CoresCard extends Card {
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Cor da borda", value: { value: "#A9B4B6" } });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo da caixa e da lista", value: { value: "#FFFFFF" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.destaque, this.borda, this.fundo];
}

export class SlicerSettings extends Model {
    cabecalho = new CabecalhoCard();
    comportamento = new ComportamentoCard();
    cores = new CoresCard();
    cards = [this.cabecalho, this.comportamento, this.cores];
}
