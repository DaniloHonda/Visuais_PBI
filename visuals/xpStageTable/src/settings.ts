"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    colEtapa = new formattingSettings.TextInput({ name: "colEtapa", displayName: "Título da coluna de etapa", value: "Etapa (ordem do processo)", placeholder: "" });
    rotuloTotal = new formattingSettings.TextInput({ name: "rotuloTotal", displayName: "Texto da linha de total", value: "Total da esteira", placeholder: "" });
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar etapa", placeholder: "" });
    colParticipantes = new formattingSettings.TextInput({ name: "colParticipantes", displayName: "Coluna: participantes", value: "Participantes", placeholder: "" });
    colAprovados = new formattingSettings.TextInput({ name: "colAprovados", displayName: "Coluna: aprovados", value: "Aprovados", placeholder: "" });
    colRejeitados = new formattingSettings.TextInput({ name: "colRejeitados", displayName: "Coluna: rejeitados", value: "Rejeitados", placeholder: "" });
    colAndamento = new formattingSettings.TextInput({ name: "colAndamento", displayName: "Coluna: em andamento", value: "Em andamento", placeholder: "" });
    colConversao = new formattingSettings.TextInput({ name: "colConversao", displayName: "Coluna: conversão", value: "Conversão", placeholder: "" });
    colMedia = new formattingSettings.TextInput({ name: "colMedia", displayName: "Coluna: SLA média", value: "SLA média", placeholder: "" });
    colMediana = new formattingSettings.TextInput({ name: "colMediana", displayName: "Coluna: SLA mediana", value: "SLA mediana", placeholder: "" });
    rotuloPct = new formattingSettings.TextInput({ name: "rotuloPct", displayName: "Botão de %", value: "% da etapa", placeholder: "" });
    rodape = new formattingSettings.TextInput({ name: "rodape", displayName: "Nota no rodapé (vazio = automática)", value: "", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.colEtapa, this.rotuloTotal, this.busca, this.colParticipantes, this.colAprovados, this.colRejeitados, this.colAndamento, this.colConversao, this.colMedia, this.colMediana, this.rotuloPct, this.rodape];
}

const ordemItems = [
    { value: "processo", displayName: "Ordem original (processo)" },
    { value: "p", displayName: "Mais participantes" },
    { value: "a", displayName: "Mais aprovados" },
    { value: "r", displayName: "Mais rejeitados" },
    { value: "e", displayName: "Mais em andamento" }
];
const convItems = [
    { value: "fixo", displayName: "Limites fixos (%)" },
    { value: "media", displayName: "Comparada à média" }
];

class ComportamentoCard extends Card {
    soMovimento = new formattingSettings.ToggleSwitch({ name: "soMovimento", displayName: "Abrir com \"Só com movimento\"", value: true });
    modoPct = new formattingSettings.ToggleSwitch({ name: "modoPct", displayName: "Abrir em \"% da etapa\"", value: false });
    mostrarTotal = new formattingSettings.ToggleSwitch({ name: "mostrarTotal", displayName: "Mostrar linha de total", value: true });
    somarParticipantes = new formattingSettings.ToggleSwitch({ name: "somarParticipantes", displayName: "Somar participantes no total", value: false });
    ordemInicial = new formattingSettings.ItemDropdown({ name: "ordemInicial", displayName: "Ordem ao abrir", items: ordemItems, value: ordemItems[0] });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.soMovimento, this.modoPct, this.mostrarTotal, this.somarParticipantes, this.ordemInicial];
}

class LimitesCard extends Card {
    convBoa = new formattingSettings.NumUpDown({ name: "convBoa", displayName: "Conversão boa a partir de (%)", value: 70 });
    convAtencao = new formattingSettings.NumUpDown({ name: "convAtencao", displayName: "Conversão em atenção a partir de (%)", value: 50 });
    modoConv = new formattingSettings.ItemDropdown({ name: "modoConv", displayName: "Cor da conversão", items: convItems, value: convItems[0] });
    fatorMedia = new formattingSettings.NumUpDown({ name: "fatorMedia", displayName: "Na média: atenção a partir de (% da média)", value: 70 });
    fatorSla = new formattingSettings.NumUpDown({ name: "fatorSla", displayName: "Alerta quando a média passa de N × a mediana", value: 2 });
    name = "limites";
    displayName = "Limites";
    slices = [this.modoConv, this.convBoa, this.convAtencao, this.fatorMedia, this.fatorSla];
}

class CoresCard extends Card {
    aprovados = new formattingSettings.ColorPicker({ name: "aprovados", displayName: "Aprovados", value: { value: xpColors.teal } });
    rejeitados = new formattingSettings.ColorPicker({ name: "rejeitados", displayName: "Rejeitados", value: { value: xpColors.rejected } });
    andamento = new formattingSettings.ColorPicker({ name: "andamento", displayName: "Em andamento", value: { value: xpColors.warning } });
    name = "cores";
    displayName = "Cores";
    slices = [this.aprovados, this.rejeitados, this.andamento];
}

export class StageTableSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    limites = new LimitesCard();
    cores = new CoresCard();
    cards = [this.textos, this.comportamento, this.limites, this.cores];
}
