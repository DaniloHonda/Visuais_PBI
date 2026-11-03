"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class TextosCard extends Card {
    rotulos = new formattingSettings.TextInput({ name: "rotulos", displayName: "Rótulos (separados por ;)", value: "", placeholder: "vazio = valores da coluna" });
    dicas = new formattingSettings.TextInput({ name: "dicas", displayName: "Dicas (separadas por |)", value: "", placeholder: "texto ao passar o mouse, na ordem das opções" });
    name = "textos";
    displayName = "Textos";
    slices = [this.rotulos, this.dicas];
}

class ComportamentoCard extends Card {
    padrao = new formattingSettings.TextInput({ name: "padrao", displayName: "Opção padrão", value: "", placeholder: "vazio = a primeira" });
    aplicarPadrao = new formattingSettings.ToggleSwitch({ name: "aplicarPadrao", displayName: "Aplicar a opção padrão quando nada estiver escolhido", value: true });
    name = "comportamento";
    displayName = "Comportamento";
    slices = [this.padrao, this.aplicarPadrao];
}

const estiloItems = [
    { value: "pilula", displayName: "Pílula" },
    { value: "abas", displayName: "Abas" },
    { value: "compacto", displayName: "Compacto" }
];
const alinhamentoItems = [
    { value: "esquerda", displayName: "Esquerda" },
    { value: "centro", displayName: "Centro" },
    { value: "direita", displayName: "Direita" }
];

class FormatoCard extends Card {
    estilo = new formattingSettings.ItemDropdown({ name: "estilo", displayName: "Formato", items: estiloItems, value: estiloItems[0] });
    alinhamento = new formattingSettings.ItemDropdown({ name: "alinhamento", displayName: "Alinhamento", items: alinhamentoItems, value: alinhamentoItems[0] });
    tamanho = new formattingSettings.NumUpDown({ name: "tamanho", displayName: "Tamanho do texto", value: 14 });
    altura = new formattingSettings.NumUpDown({ name: "altura", displayName: "Altura do botão (px)", value: 40 });
    cantos = new formattingSettings.NumUpDown({ name: "cantos", displayName: "Cantos (px)", value: 12 });
    larguraIgual = new formattingSettings.ToggleSwitch({ name: "larguraIgual", displayName: "Opções com a mesma largura", value: false });
    name = "formato";
    displayName = "Formato";
    slices = [this.estilo, this.alinhamento, this.tamanho, this.altura, this.cantos, this.larguraIgual];
}

class CoresCard extends Card {
    ativo = new formattingSettings.ColorPicker({ name: "ativo", displayName: "Fundo da opção ativa", value: { value: "#067D84" } });
    textoAtivo = new formattingSettings.ColorPicker({ name: "textoAtivo", displayName: "Texto da opção ativa", value: { value: "#FFFFFF" } });
    trilho = new formattingSettings.ColorPicker({ name: "trilho", displayName: "Fundo do botão", value: { value: "#EEF0F0" } });
    texto = new formattingSettings.ColorPicker({ name: "texto", displayName: "Texto das outras opções", value: { value: "#3C3C3C" } });
    borda = new formattingSettings.ColorPicker({ name: "borda", displayName: "Borda (formato compacto)", value: { value: "#A9B4B6" } });
    name = "cores";
    displayName = "Cores";
    slices = [this.ativo, this.textoAtivo, this.trilho, this.texto, this.borda];
}

const posicaoItems = [
    { value: "lado", displayName: "Ao lado" },
    { value: "abaixo", displayName: "Embaixo" },
    { value: "nenhum", displayName: "Não mostrar" }
];

class ContextoCard extends Card {
    posicao = new formattingSettings.ItemDropdown({ name: "posicao", displayName: "Posição", items: posicaoItems, value: posicaoItems[0] });
    tamanho = new formattingSettings.NumUpDown({ name: "tamanho", displayName: "Tamanho do texto", value: 13 });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor do texto", value: { value: "#3C3C3C" } });
    destaque = new formattingSettings.ColorPicker({ name: "destaque", displayName: "Cor do **negrito**", value: { value: "#03474C" } });
    name = "contexto";
    displayName = "Texto de contexto";
    slices = [this.posicao, this.tamanho, this.cor, this.destaque];
}

export class ToggleSettings extends Model {
    textos = new TextosCard();
    comportamento = new ComportamentoCard();
    formato = new FormatoCard();
    cores = new CoresCard();
    contexto = new ContextoCard();
    cards = [this.textos, this.comportamento, this.formato, this.cores, this.contexto];
}
