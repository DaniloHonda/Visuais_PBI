"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class CabecalhoCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar cabeçalho", value: true });
    titulo = new formattingSettings.TextInput({ name: "titulo", displayName: "Título", value: "Organograma (N)", placeholder: "" });
    vazio = new formattingSettings.TextInput({ name: "vazio", displayName: "Texto sem seleção", value: "Todos", placeholder: "" });
    name = "cabecalho";
    displayName = "Cabeçalho";
    slices = [this.mostrar, this.titulo, this.vazio];
}

const ordemItems = [
    { value: "contagem", displayName: "Maior contagem primeiro" },
    { value: "alfabetica", displayName: "Alfabética" }
];

class ComportamentoCard extends Card {
    alturaCaixa = new formattingSettings.NumUpDown({ name: "alturaCaixa", displayName: "Altura da caixa (px)", value: 44 });
    primeiroNivel = new formattingSettings.NumUpDown({ name: "primeiroNivel", displayName: "Número do primeiro nível (2 = N2)", value: 2 });
    nomeDoEmail = new formattingSettings.ToggleSwitch({ name: "nomeDoEmail", displayName: "Mostrar nome a partir do e-mail", value: true });
    ordem = new formattingSettings.ItemDropdown({ name: "ordem", displayName: "Ordem dos nomes", items: ordemItems, value: ordemItems[0] });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.alturaCaixa, this.primeiroNivel, this.nomeDoEmail, this.ordem];
}

class CoresCard extends Card {
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Cor da borda", value: { value: "#A9B4B6" } });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo da caixa e da lista", value: { value: "#FFFFFF" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.destaque, this.borda, this.fundo];
}

export class OrgSettings extends Model {
    cabecalho = new CabecalhoCard();
    comportamento = new ComportamentoCard();
    cores = new CoresCard();
    cards = [this.cabecalho, this.comportamento, this.cores];
}
