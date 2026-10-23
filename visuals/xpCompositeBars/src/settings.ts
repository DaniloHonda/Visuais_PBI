"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

// Partes 1 a 3 seguem as cores de status do padrão XP (aprovado, rejeitado, em andamento).
export const partePalette = [xpColors.teal, xpColors.rejected, xpColors.warning, "#6250D6", "#6B6B6B"];

class BarrasCard extends Card {
    altura = new formattingSettings.NumUpDown({ name: "altura", displayName: "Altura da barra (px)", value: 20 });
    espacamento = new formattingSettings.NumUpDown({ name: "espacamento", displayName: "Espaço entre linhas (px)", value: 7 });
    cor1 = new formattingSettings.ColorPicker({ name: "cor1", displayName: "Cor da parte 1", value: { value: partePalette[0] } });
    cor2 = new formattingSettings.ColorPicker({ name: "cor2", displayName: "Cor da parte 2", value: { value: partePalette[1] } });
    cor3 = new formattingSettings.ColorPicker({ name: "cor3", displayName: "Cor da parte 3", value: { value: partePalette[2] } });
    cor4 = new formattingSettings.ColorPicker({ name: "cor4", displayName: "Cor da parte 4", value: { value: partePalette[3] } });
    cor5 = new formattingSettings.ColorPicker({ name: "cor5", displayName: "Cor da parte 5", value: { value: partePalette[4] } });
    mostrarDetalhe = new formattingSettings.ToggleSwitch({ name: "mostrarDetalhe", displayName: "Mostrar valores abaixo da barra", value: true });
    mostrarLegenda = new formattingSettings.ToggleSwitch({ name: "mostrarLegenda", displayName: "Mostrar legenda", value: true });
    textoVazio = new formattingSettings.TextInput({ name: "textoVazio", displayName: "Texto da linha sem dados", value: "sem movimento no período", placeholder: "" });
    name = "barras";
    displayName = "Barras";
    slices = [this.altura, this.espacamento, this.cor1, this.cor2, this.cor3, this.cor4, this.cor5, this.mostrarDetalhe, this.mostrarLegenda, this.textoVazio];
}

class RotulosCard extends Card {
    largura = new formattingSettings.NumUpDown({ name: "largura", displayName: "Largura dos nomes (px)", value: 210 });
    tamanho = new formattingSettings.NumUpDown({ name: "tamanho", displayName: "Tamanho do texto", value: 12.5 });
    textoTotal = new formattingSettings.TextInput({ name: "textoTotal", displayName: "Texto após o total", value: "entraram", placeholder: "" });
    rotulo1 = new formattingSettings.TextInput({ name: "rotulo1", displayName: "Nome da parte 1", value: "", placeholder: "Nome da medida" });
    rotulo2 = new formattingSettings.TextInput({ name: "rotulo2", displayName: "Nome da parte 2", value: "", placeholder: "Nome da medida" });
    rotulo3 = new formattingSettings.TextInput({ name: "rotulo3", displayName: "Nome da parte 3", value: "", placeholder: "Nome da medida" });
    rotulo4 = new formattingSettings.TextInput({ name: "rotulo4", displayName: "Nome da parte 4", value: "", placeholder: "Nome da medida" });
    rotulo5 = new formattingSettings.TextInput({ name: "rotulo5", displayName: "Nome da parte 5", value: "", placeholder: "Nome da medida" });
    name = "rotulos";
    displayName = "Nomes";
    slices = [this.largura, this.tamanho, this.textoTotal, this.rotulo1, this.rotulo2, this.rotulo3, this.rotulo4, this.rotulo5];
}

class IndicadorCard extends Card {
    texto = new formattingSettings.TextInput({ name: "texto", displayName: "Texto abaixo do indicador", value: "conversão", placeholder: "" });
    name = "indicador";
    displayName = "Indicador à direita";
    slices = [this.texto];
}

class FerramentasCard extends Card {
    busca = new formattingSettings.ToggleSwitch({ name: "busca", displayName: "Campo de busca", value: true });
    soComDados = new formattingSettings.ToggleSwitch({ name: "soComDados", displayName: "Botão \"Só com movimento\"", value: true });
    soComDadosInicial = new formattingSettings.ToggleSwitch({ name: "soComDadosInicial", displayName: "Abrir só com movimento", value: false });
    ordenacao = new formattingSettings.ToggleSwitch({ name: "ordenacao", displayName: "Seletor de ordem", value: true });
    name = "ferramentas";
    displayName = "Ferramentas";
    slices = [this.busca, this.soComDados, this.soComDadosInicial, this.ordenacao];
}

const ordemItems = [
    { value: "processo", displayName: "Original (processo)" },
    { value: "total", displayName: "Maior total" }
];
const notaItems = [
    { value: "0", displayName: "Nenhuma" },
    { value: "1", displayName: "Parte 1" },
    { value: "2", displayName: "Parte 2" },
    { value: "3", displayName: "Parte 3" },
    { value: "4", displayName: "Parte 4" },
    { value: "5", displayName: "Parte 5" }
];

class ResumoCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar linha de resumo", value: false });
    textoTotal = new formattingSettings.TextInput({ name: "textoTotal", displayName: "Texto após o total", value: "no período", placeholder: "" });
    nota = new formattingSettings.ItemDropdown({ name: "nota", displayName: "Parte em destaque", items: notaItems, value: notaItems[0] });
    textoNota = new formattingSettings.TextInput({ name: "textoNota", displayName: "Texto da parte em destaque", value: "", placeholder: "nome da parte" });
    name = "resumo";
    displayName = "Resumo e parte em destaque";
    slices = [this.mostrar, this.textoTotal, this.nota, this.textoNota];
}

class ParetoCard extends Card {
    ativar = new formattingSettings.ToggleSwitch({ name: "ativar", displayName: "Mostrar % do total e acumulado", value: false });
    corte = new formattingSettings.NumUpDown({ name: "corte", displayName: "Corte do acumulado (%)", value: 80 });
    item = new formattingSettings.TextInput({ name: "item", displayName: "Nome dos itens (plural)", value: "etapas", placeholder: "" });
    medida = new formattingSettings.TextInput({ name: "medida", displayName: "Texto do corte", value: "do total", placeholder: "" });
    ordemInicial = new formattingSettings.ItemDropdown({ name: "ordemInicial", displayName: "Ordem ao abrir", items: ordemItems, value: ordemItems[0] });
    name = "pareto";
    displayName = "Ranking (Pareto)";
    slices = [this.ativar, this.corte, this.item, this.medida, this.ordemInicial];
}

class DestaqueCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar faixa de destaque", value: true });
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Cor de fundo", value: { value: "#FDF0EE" } });
    name = "destaque";
    displayName = "Faixa de destaque";
    slices = [this.mostrar, this.fundo];
}

export class CompositeSettings extends Model {
    barras = new BarrasCard();
    rotulos = new RotulosCard();
    indicador = new IndicadorCard();
    ferramentas = new FerramentasCard();
    destaque = new DestaqueCard();
    resumo = new ResumoCard();
    pareto = new ParetoCard();
    cards = [this.barras, this.rotulos, this.indicador, this.ferramentas, this.destaque, this.resumo, this.pareto];
}
