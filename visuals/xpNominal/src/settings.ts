"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    total = new formattingSettings.TextInput({ name: "total", displayName: "Texto do contador total", value: "aguardando decisão", placeholder: "" });
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar nome, vaga ou recrutador", placeholder: "" });
    todos = new formattingSettings.TextInput({ name: "todos", displayName: "Botão de todos", value: "Todas", placeholder: "" });
    link = new formattingSettings.TextInput({ name: "link", displayName: "Título da coluna do link", value: "Greenhouse", placeholder: "" });
    colDias = new formattingSettings.TextInput({ name: "colDias", displayName: "Título da coluna de dias", value: "Dias na etapa", placeholder: "nome da medida" });
    colSla = new formattingSettings.TextInput({ name: "colSla", displayName: "Título da coluna de SLA", value: "SLA total", placeholder: "nome da medida" });
    unidade = new formattingSettings.TextInput({ name: "unidade", displayName: "Unidade dos dias", value: "d", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.total, this.busca, this.todos, this.link, this.colDias, this.colSla, this.unidade];
}

class LinkCard extends Card {
    modelo = new formattingSettings.TextInput({ name: "modelo", displayName: "Modelo do link ({valor} = campo Link)", value: "", placeholder: "https://app.greenhouse.io/people/{valor}" });
    name = "link";
    displayName = "Link";
    slices = [this.modelo];
}

class DiasCard extends Card {
    atencao = new formattingSettings.NumUpDown({ name: "atencao", displayName: "Âmbar acima de (dias)", value: 30 });
    alerta = new formattingSettings.NumUpDown({ name: "alerta", displayName: "Coral acima de (dias)", value: 45 });
    botao = new formattingSettings.ToggleSwitch({ name: "botao", displayName: "Botão \"Acima de N dias\"", value: true });
    name = "dias";
    displayName = "Dias";
    slices = [this.atencao, this.alerta, this.botao];
}

class ComportamentoCard extends Card {
    linhasTela = new formattingSettings.NumUpDown({ name: "linhasTela", displayName: "Linhas por vez (\"Mostrar mais\")", value: 100 });
    maxLinhas = new formattingSettings.NumUpDown({ name: "maxLinhas", displayName: "Máximo de aplicações carregadas", value: 100000 });
    exportar = new formattingSettings.ToggleSwitch({ name: "exportar", displayName: "Botão Exportar", value: true });
    colunaSegmento = new formattingSettings.ToggleSwitch({ name: "colunaSegmento", displayName: "Mostrar o segmento como coluna", value: true });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.linhasTela, this.maxLinhas, this.exportar, this.colunaSegmento];
}

export class NominalSettings extends Model {
    textos = new TextosCard();
    link = new LinkCard();
    dias = new DiasCard();
    comportamento = new ComportamentoCard();
    cards = [this.textos, this.link, this.dias, this.comportamento];
}
