"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    titulo = new formattingSettings.TextInput({ name: "titulo", displayName: "Título", value: "Tipos de alerta", placeholder: "" });
    subtitulo = new formattingSettings.TextInput({ name: "subtitulo", displayName: "Subtítulo", value: "passe o mouse no ⓘ para ver o que significa · clique para filtrar a página", placeholder: "" });
    legendas = new formattingSettings.TextInput({ name: "legendas", displayName: "Legenda dos grupos (Grupo=texto;…)", value: "Processo=corrigir no Greenhouse (áreas e recrutadores);Dado=tabela de etapas (engenharia)", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.titulo, this.subtitulo, this.legendas];
}

class CoresCard extends Card {
    ok = new formattingSettings.ColorPicker({ name: "ok", displayName: "Barra normal", value: { value: "#B9C3C4" } });
    atencao = new formattingSettings.ColorPicker({ name: "atencao", displayName: "Barra de atenção", value: { value: xpColors.warning } });
    critico = new formattingSettings.ColorPicker({ name: "critico", displayName: "Barra crítica", value: { value: xpColors.rejected } });
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    name = "cores";
    displayName = "Cores";
    slices = [this.ok, this.atencao, this.critico, this.destaque];
}

export class AlertListSettings extends Model {
    textos = new TextosCard();
    cores = new CoresCard();
    cards = [this.textos, this.cores];
}
