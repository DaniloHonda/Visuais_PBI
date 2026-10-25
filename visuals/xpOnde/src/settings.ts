"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    subtitulo = new formattingSettings.TextInput({ name: "subtitulo", displayName: "Subtítulo", value: "aplicações com o alerta · % sobre as aplicações de cada um", placeholder: "" });
    rodape = new formattingSettings.TextInput({ name: "rodape", displayName: "Rodapé", value: "clique numa barra para filtrar a página · clique de novo para tirar", placeholder: "" });
    name = "textos";
    displayName = "Textos";
    slices = [this.subtitulo, this.rodape];
}

// Mesma regra da medida Esteira | DQ Onde Status.
class RegraCard extends Card {
    minimo = new formattingSettings.NumUpDown({ name: "minimo", displayName: "Mínimo de aplicações para colorir", value: 20 });
    atencao = new formattingSettings.NumUpDown({ name: "atencao", displayName: "Âmbar: vezes a taxa geral", value: 1.5 });
    critico = new formattingSettings.NumUpDown({ name: "critico", displayName: "Coral: vezes a taxa geral", value: 2 });
    name = "regra";
    displayName = "Regra de cor";
    slices = [this.minimo, this.atencao, this.critico];
}

class CoresCard extends Card {
    ok = new formattingSettings.ColorPicker({ name: "ok", displayName: "Barra na média", value: { value: "#B9C3C4" } });
    atencao = new formattingSettings.ColorPicker({ name: "atencao", displayName: "Barra de atenção", value: { value: xpColors.warning } });
    critico = new formattingSettings.ColorPicker({ name: "critico", displayName: "Barra crítica", value: { value: xpColors.rejected } });
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor de destaque", value: { value: xpColors.teal } });
    name = "cores";
    displayName = "Cores";
    slices = [this.ok, this.atencao, this.critico, this.destaque];
}

export class OndeSettings extends Model {
    textos = new TextosCard();
    regra = new RegraCard();
    cores = new CoresCard();
    cards = [this.textos, this.regra, this.cores];
}
