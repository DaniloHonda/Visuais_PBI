"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    unidade = new formattingSettings.TextInput({ name: "unidade", displayName: "Unidade (plural)", value: "rejeições", placeholder: "" });
    item = new formattingSettings.TextInput({ name: "item", displayName: "Nome do item (singular)", value: "motivo", placeholder: "" });
    itens = new formattingSettings.TextInput({ name: "itens", displayName: "Nome do item (plural)", value: "motivos", placeholder: "" });
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar etapa", placeholder: "" });
    vazio = new formattingSettings.TextInput({ name: "vazio", displayName: "Item sem nome", value: "(sem motivo informado)", placeholder: "" });
    nota = new formattingSettings.TextInput({ name: "nota", displayName: "Nota no rodapé", value: "Motivos \"[Offer]\" = recusa do candidato, em vinho.", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.unidade, this.item, this.itens, this.busca, this.vazio, this.nota];
}

export const topItems = [
    { value: "5", displayName: "Top 5" },
    { value: "8", displayName: "Top 8" },
    { value: "10", displayName: "Top 10" },
    { value: "0", displayName: "Todos" }
];
const ordemItems = [
    { value: "total", displayName: "Maior total primeiro" },
    { value: "processo", displayName: "Ordem original (processo)" }
];

class ComportamentoCard extends Card {
    top = new formattingSettings.ItemDropdown({ name: "top", displayName: "Itens ao abrir", items: topItems, value: topItems[1] });
    ordem = new formattingSettings.ItemDropdown({ name: "ordem", displayName: "Ordem da lista", items: ordemItems, value: ordemItems[0] });
    filtrarGrupo = new formattingSettings.ToggleSwitch({ name: "filtrarGrupo", displayName: "Escolher na lista também filtra a página", value: false });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.top, this.ordem, this.filtrarGrupo];
}

class DestaqueCard extends Card {
    prefixo = new formattingSettings.TextInput({ name: "prefixo", displayName: "Destacar itens que começam com", value: "[Offer]", placeholder: "" });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor do destaque", value: { value: "#7A1F1A" } });
    name = "destaque";
    displayName = "Destaque";
    slices = [this.prefixo, this.cor];
}

class CoresCard extends Card {
    barra = new formattingSettings.ColorPicker({ name: "barra", displayName: "Barras", value: { value: xpColors.rejected } });
    selecao = new formattingSettings.ColorPicker({ name: "selecao", displayName: "Item escolhido na lista", value: { value: xpColors.teal } });
    name = "cores";
    displayName = "Cores";
    slices = [this.barra, this.selecao];
}

export class MasterDetailSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    destaque = new DestaqueCard();
    cores = new CoresCard();
    cards = [this.textos, this.comportamento, this.destaque, this.cores];
}
