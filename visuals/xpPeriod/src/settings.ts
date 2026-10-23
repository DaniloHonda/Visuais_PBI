"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class CaixaCard extends Card {
    titulo = new formattingSettings.TextInput({ name: "titulo", displayName: "Título", value: "Período", placeholder: "" });
    rotuloTudo = new formattingSettings.TextInput({ name: "rotuloTudo", displayName: "Texto sem filtro", value: "", placeholder: "Desde 01/jul" });
    altura = new formattingSettings.NumUpDown({ name: "altura", displayName: "Altura da caixa (px)", value: 44 });
    name = "caixa";
    displayName = "Caixa";
    slices = [this.titulo, this.rotuloTudo, this.altura];
}

class AtalhosCard extends Card {
    mes = new formattingSettings.ToggleSwitch({ name: "mes", displayName: "Mês atual", value: true });
    mesAnterior = new formattingSettings.ToggleSwitch({ name: "mesAnterior", displayName: "Mês anterior", value: true });
    trimestre = new formattingSettings.ToggleSwitch({ name: "trimestre", displayName: "Trimestre atual", value: true });
    trimestreAnterior = new formattingSettings.ToggleSwitch({ name: "trimestreAnterior", displayName: "Trimestre anterior", value: true });
    ultimos30 = new formattingSettings.ToggleSwitch({ name: "ultimos30", displayName: "Últimos 30 dias", value: true });
    proximos30 = new formattingSettings.ToggleSwitch({ name: "proximos30", displayName: "Próximos 30 dias", value: false });
    ano = new formattingSettings.ToggleSwitch({ name: "ano", displayName: "Ano atual", value: false });
    tudo = new formattingSettings.ToggleSwitch({ name: "tudo", displayName: "Desde o início dos dados", value: true });
    name = "atalhos";
    displayName = "Atalhos";
    slices = [this.mes, this.mesAnterior, this.trimestre, this.trimestreAnterior, this.ultimos30, this.proximos30, this.ano, this.tudo];
}

class CalendarioCard extends Card {
    futuro = new formattingSettings.ToggleSwitch({ name: "futuro", displayName: "Permitir datas futuras", value: true });
    name = "calendario";
    displayName = "Calendário";
    slices = [this.futuro];
}

class CoresCard extends Card {
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Cor da borda", value: { value: "#A9B4B6" } });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Fundo da caixa e do calendário", value: { value: "#FFFFFF" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.destaque, this.borda, this.fundo];
}

export class PeriodSettings extends Model {
    caixa = new CaixaCard();
    atalhos = new AtalhosCard();
    calendario = new CalendarioCard();
    cores = new CoresCard();
    cards = [this.caixa, this.atalhos, this.calendario, this.cores];
}
