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

// Cor de cada tipo na composição, pela ordem de dAlerta. Família teal = processo, cinzas = dado
// (âmbar e coral ficam livres para o status no número).
const PALETA = ["#04585D", "#067D84", "#7FC4C4", "#5B6770", "#8E9AAF", "#B7A5D3", "#C9CFD0"];
class TiposCard extends Card {
    t1 = new formattingSettings.ColorPicker({ name: "t1", displayName: "Tipo 1", value: { value: PALETA[0] } });
    t2 = new formattingSettings.ColorPicker({ name: "t2", displayName: "Tipo 2", value: { value: PALETA[1] } });
    t3 = new formattingSettings.ColorPicker({ name: "t3", displayName: "Tipo 3", value: { value: PALETA[2] } });
    t4 = new formattingSettings.ColorPicker({ name: "t4", displayName: "Tipo 4", value: { value: PALETA[3] } });
    t5 = new formattingSettings.ColorPicker({ name: "t5", displayName: "Tipo 5", value: { value: PALETA[4] } });
    t6 = new formattingSettings.ColorPicker({ name: "t6", displayName: "Tipo 6", value: { value: PALETA[5] } });
    t7 = new formattingSettings.ColorPicker({ name: "t7", displayName: "Tipo 7", value: { value: PALETA[6] } });
    name = "tipos";
    displayName = "Cores dos tipos (pela ordem)";
    slices = [this.t1, this.t2, this.t3, this.t4, this.t5, this.t6, this.t7];
}

export class OndeSettings extends Model {
    textos = new TextosCard();
    regra = new RegraCard();
    cores = new CoresCard();
    tipos = new TiposCard();
    cards = [this.textos, this.regra, this.cores, this.tipos];
}
