"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    link = new formattingSettings.TextInput({ name: "link", displayName: "Título da coluna de link", value: "Greenhouse", placeholder: "Greenhouse" });
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar candidato, vaga, recrutador, motivo…", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.link, this.busca];
}

class LinkCard extends Card {
    modelo = new formattingSettings.TextInput({ name: "modelo", displayName: "Modelo do link (se o campo não for URL)", value: "", placeholder: "https://…/{valor}" });
    name = "link";
    displayName = "Link";
    slices = [this.modelo];
}

class ComportamentoCard extends Card {
    linhasIniciais = new formattingSettings.NumUpDown({ name: "linhasIniciais", displayName: "Linhas na tela", value: 50 });
    passo = new formattingSettings.NumUpDown({ name: "passo", displayName: "\"Mostrar mais\" adiciona", value: 100 });
    maxLinhas = new formattingSettings.NumUpDown({ name: "maxLinhas", displayName: "Máximo de linhas carregadas", value: 60000 });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.linhasIniciais, this.passo, this.maxLinhas];
}

class DiasCard extends Card {
    alerta = new formattingSettings.NumUpDown({ name: "alerta", displayName: "Dias em vermelho acima de", value: 45 });
    name = "dias";
    displayName = "Dias";
    slices = [this.alerta];
}

// Colunas escondidas pelo usuário em "Colunas ▾" (salvas no relatório, por visão). Não aparece no painel.
class ColunasCard extends Card {
    ocultas = new formattingSettings.TextInput({ name: "ocultas", displayName: "Colunas ocultas", value: "{}", placeholder: "" });
    name = "colunas";
    displayName = "Colunas";
    visible = false;
    slices = [this.ocultas];
}

export class TabelaSettings extends Model {
    textos = new TextosCard();
    link = new LinkCard();
    comportamento = new ComportamentoCard();
    dias = new DiasCard();
    colunas = new ColunasCard();
    cards = [this.textos, this.link, this.comportamento, this.dias, this.colunas];
}
