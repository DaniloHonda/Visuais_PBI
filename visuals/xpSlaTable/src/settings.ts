"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    colEtapa = new formattingSettings.TextInput({ name: "colEtapa", displayName: "Título da coluna de etapa", value: "Etapa", placeholder: "" });
    resumo = new formattingSettings.TextInput({ name: "resumo", displayName: "Texto após o total de \"acima hoje\"", value: "aplicações em andamento já passaram do tempo em que 90% saem", placeholder: "" });
    rodape = new formattingSettings.TextInput({ name: "rodape", displayName: "Nota no rodapé", value: "Base = aplicações que já saíram da etapa no período · \"Acima hoje\" = em andamento há mais tempo que o P90 da etapa", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.colEtapa, this.resumo, this.rodape];
}

export const ordemItems = [
    { value: "p90", displayName: "Maior P90" },
    { value: "processo", displayName: "Ordem do processo" },
    { value: "acima", displayName: "Mais acima hoje" },
    { value: "tipico", displayName: "Maior típico" }
];

class ComportamentoCard extends Card {
    soMovimento = new formattingSettings.ToggleSwitch({ name: "soMovimento", displayName: "Abrir com \"Só com movimento\"", value: true });
    ordemInicial = new formattingSettings.ItemDropdown({ name: "ordemInicial", displayName: "Ordem ao abrir", items: ordemItems, value: ordemItems[0] });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.soMovimento, this.ordemInicial];
}

class CoresCard extends Card {
    tipico = new formattingSettings.ColorPicker({ name: "tipico", displayName: "Faixa até o típico", value: { value: xpColors.teal } });
    p90 = new formattingSettings.ColorPicker({ name: "p90", displayName: "Faixa até 90%", value: { value: "#BFE3E5" } });
    acima = new formattingSettings.ColorPicker({ name: "acima", displayName: "Selo \"acima hoje\"", value: { value: xpColors.rejected } });
    name = "cores";
    displayName = "Cores";
    slices = [this.tipico, this.p90, this.acima];
}

export class SlaTableSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    cores = new CoresCard();
    cards = [this.textos, this.comportamento, this.cores];
}
