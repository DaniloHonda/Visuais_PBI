"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class CardsCard extends Card {
    andamento = new formattingSettings.TextInput({ name: "andamento", displayName: "Card: em andamento", value: "Em andamento", placeholder: "" });
    agendadas = new formattingSettings.TextInput({ name: "agendadas", displayName: "Card: entrevistas agendadas", value: "Entrevistas agendadas", placeholder: "" });
    contratadas = new formattingSettings.TextInput({ name: "contratadas", displayName: "Card: contratadas", value: "Contratadas", placeholder: "" });
    rejeitadas = new formattingSettings.TextInput({ name: "rejeitadas", displayName: "Card: rejeitadas", value: "Rejeitadas", placeholder: "" });
    declinaram = new formattingSettings.TextInput({ name: "declinaram", displayName: "Card: declinaram", value: "Declinaram", placeholder: "" });
    todas = new formattingSettings.TextInput({ name: "todas", displayName: "Card: todas", value: "Todas", placeholder: "" });
    dica = new formattingSettings.TextInput({ name: "dica", displayName: "Frase acima dos cards (vazio = sem frase)", value: "Clique em um número para ver a lista.", placeholder: "" });
    name = "cards";
    displayName = "Cards";
    slices = [this.andamento, this.agendadas, this.contratadas, this.rejeitadas, this.declinaram, this.todas, this.dica];
}

class TextosCard extends Card {
    busca = new formattingSettings.TextInput({ name: "busca", displayName: "Texto da busca", value: "Buscar nome, vaga ou ID", placeholder: "" });
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

export const baseItems = [
    { value: "andamento", displayName: "Em andamento" },
    { value: "agendadas", displayName: "Entrevistas agendadas" },
    { value: "contratadas", displayName: "Contratadas" },
    { value: "rejeitadas", displayName: "Rejeitadas" },
    { value: "declinaram", displayName: "Declinaram" },
    { value: "todas", displayName: "Todas" }
];

class ComportamentoCard extends Card {
    baseInicial = new formattingSettings.ItemDropdown({ name: "baseInicial", displayName: "Base ao abrir", items: baseItems, value: baseItems[0] });
    linhasTela = new formattingSettings.NumUpDown({ name: "linhasTela", displayName: "Linhas por vez na tela", value: 100 });
    maxLinhas = new formattingSettings.NumUpDown({ name: "maxLinhas", displayName: "Máximo de aplicações carregadas", value: 100000 });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.baseInicial, this.linhasTela, this.maxLinhas];
}

class DiasCard extends Card {
    alerta = new formattingSettings.NumUpDown({ name: "alerta", displayName: "Dias em coral acima de", value: 45 });
    name = "dias";
    displayName = "Dias";
    slices = [this.alerta];
}

export class BaseNominalSettings extends Model {
    numeros = new CardsCard();
    textos = new TextosCard();
    link = new LinkCard();
    comportamento = new ComportamentoCard();
    dias = new DiasCard();
    cards = [this.numeros, this.textos, this.link, this.comportamento, this.dias];
}
