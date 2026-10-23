"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar candidato, vaga, recrutador ou motivo", placeholder: "" });
    link = new formattingSettings.TextInput({ name: "link", displayName: "Título da coluna do link", value: "Greenhouse", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.busca, this.link];
}

class LinkCard extends Card {
    modelo = new formattingSettings.TextInput({ name: "modelo", displayName: "Modelo do link ({valor} = campo Link)", value: "", placeholder: "https://app.greenhouse.io/people/{valor}" });
    name = "link";
    displayName = "Link";
    slices = [this.modelo];
}

class ComportamentoCard extends Card {
    linhasTela = new formattingSettings.NumUpDown({ name: "linhasTela", displayName: "Linhas por vez (Mostrar mais)", value: 50 });
    maxLinhas = new formattingSettings.NumUpDown({ name: "maxLinhas", displayName: "Máximo de linhas carregadas", value: 100000 });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.linhasTela, this.maxLinhas];
}

class DiasCard extends Card {
    alerta = new formattingSettings.NumUpDown({ name: "alerta", displayName: "Dias em coral acima de", value: 45 });
    name = "dias";
    displayName = "Dias";
    slices = [this.alerta];
}

export class DetailSettings extends Model {
    textos = new TextosCard();
    link = new LinkCard();
    comportamento = new ComportamentoCard();
    dias = new DiasCard();
    cards = [this.textos, this.link, this.comportamento, this.dias];
}
