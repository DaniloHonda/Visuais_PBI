"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";
import { xpColors } from "./xpTheme";

import Card = formattingSettings.SimpleCard;
import Model = formattingSettings.Model;

class CabecalhoCard extends Card {
    titulo = new formattingSettings.TextInput({ name: "titulo", displayName: "Título", value: "", placeholder: "Usa o nome da medida" });
    unidade = new formattingSettings.TextInput({ name: "unidade", displayName: "Unidade ao lado do valor", value: "", placeholder: "Ex.: dias" });
    corTitulo = new formattingSettings.ColorPicker({ name: "corTitulo", displayName: "Cor do título", value: { value: xpColors.textMuted } });
    tamanhoTitulo = new formattingSettings.NumUpDown({ name: "tamanhoTitulo", displayName: "Tamanho do título", value: 12 });
    name = "cabecalho";
    displayName = "Cabeçalho";
    slices = [this.titulo, this.unidade, this.corTitulo, this.tamanhoTitulo];
}

class ValorCard extends Card {
    tamanho = new formattingSettings.NumUpDown({ name: "tamanho", displayName: "Tamanho", value: 36 });
    cor = new formattingSettings.ColorPicker({ name: "cor", displayName: "Cor", value: { value: xpColors.text } });
    unidades = new formattingSettings.AutoDropdown({ name: "unidades", displayName: "Unidades de exibição", value: 0 });
    casas = new formattingSettings.NumUpDown({ name: "casas", displayName: "Casas decimais (-1 = automático)", value: -1 });
    name = "valorPrincipal";
    displayName = "Valor";
    slices = [this.tamanho, this.cor, this.unidades, this.casas];
}

const tipoItems = [
    { value: "auto", displayName: "Automático (p.p. se a medida for %)" },
    { value: "percentual", displayName: "Variação percentual (▲ 12%)" },
    { value: "absoluto", displayName: "Diferença absoluta (▲ 4)" },
    { value: "pontos", displayName: "Pontos percentuais (▲ 3 p.p.)" }
];
const polaridadeItems = [
    { value: "maior", displayName: "Maior é melhor" },
    { value: "menor", displayName: "Menor é melhor" },
    { value: "neutro", displayName: "Neutro (sem cor)" }
];

class ComparacaoCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar", value: true });
    rotulo = new formattingSettings.TextInput({ name: "rotulo", displayName: "Rótulo", value: "vs mês anterior", placeholder: "" });
    tipo = new formattingSettings.ItemDropdown({ name: "tipo", displayName: "Como mostrar a variação", items: tipoItems, value: tipoItems[0] });
    polaridade = new formattingSettings.ItemDropdown({ name: "polaridade", displayName: "Polaridade", items: polaridadeItems, value: polaridadeItems[0] });
    mostrarValores = new formattingSettings.ToggleSwitch({ name: "mostrarValores", displayName: "Mostrar \"atual vs anterior\"", value: true });
    corBom = new formattingSettings.ColorPicker({ name: "corBom", displayName: "Cor quando melhora", value: { value: xpColors.good } });
    corRuim = new formattingSettings.ColorPicker({ name: "corRuim", displayName: "Cor quando piora", value: { value: xpColors.bad } });
    name = "comparacao";
    displayName = "Comparação";
    slices = [this.mostrar, this.rotulo, this.tipo, this.polaridade, this.mostrarValores, this.corBom, this.corRuim];
}

class AcumuladoCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar", value: true });
    rotulo = new formattingSettings.TextInput({ name: "rotulo", displayName: "Rótulo", value: "YTD", placeholder: "" });
    name = "acumulado";
    displayName = "Acumulado (YTD)";
    slices = [this.mostrar, this.rotulo];
}

class MetaCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar barra de meta", value: true });
    rotulo = new formattingSettings.TextInput({ name: "rotulo", displayName: "Rótulo", value: "Meta", placeholder: "" });
    corBarra = new formattingSettings.ColorPicker({ name: "corBarra", displayName: "Cor da barra", value: { value: xpColors.teal } });
    name = "metaCard";
    displayName = "Meta";
    slices = [this.mostrar, this.rotulo, this.corBarra];
}

class AparenciaCard extends Card {
    fundo = new formattingSettings.ColorPicker({ name: "fundo", displayName: "Cor de fundo", value: { value: "#FFFFFF" } });
    transparencia = new formattingSettings.NumUpDown({ name: "transparencia", displayName: "Transparência do fundo (0 a 100%)", value: 100 });
    espacamento = new formattingSettings.NumUpDown({ name: "espacamento", displayName: "Espaçamento interno (px)", value: 18 });
    corContexto = new formattingSettings.ColorPicker({ name: "corContexto", displayName: "Cor do texto de contexto", value: { value: "#6B6B6B" } });
    name = "aparencia";
    displayName = "Aparência";
    slices = [this.fundo, this.transparencia, this.espacamento, this.corContexto];
}

const estiloItems = [
    { value: "destaque", displayName: "Destaque (segue o filtro)" },
    { value: "neutro", displayName: "Neutro (foto do momento)" }
];

class PeriodosCard extends Card {
    mostrar = new formattingSettings.ToggleSwitch({ name: "mostrar", displayName: "Mostrar selo do período", value: true });
    estilo = new formattingSettings.ItemDropdown({ name: "estilo", displayName: "Estilo do selo", items: estiloItems, value: estiloItems[0] });
    name = "periodos";
    displayName = "Períodos";
    slices = [this.mostrar, this.estilo];
}

// Status vindo da medida (ok · atencao · critico): pinta o número.
class StatusCard extends Card {
    corAtencao = new formattingSettings.ColorPicker({ name: "corAtencao", displayName: "Cor de atenção", value: { value: "#9A6512" } });
    corCritico = new formattingSettings.ColorPicker({ name: "corCritico", displayName: "Cor de crítico", value: { value: "#A33A31" } });
    name = "status";
    displayName = "Status";
    slices = [this.corAtencao, this.corCritico];
}

// Texto do ⓘ quando não vem de medida.
class ExplicacaoCard extends Card {
    texto = new formattingSettings.TextArea({ name: "texto", displayName: "Texto do ⓘ", value: "", placeholder: "O que o número significa" });
    name = "explicacao";
    displayName = "Explicação (ⓘ)";
    slices = [this.texto];
}

export class KpiCardSettings extends Model {
    cabecalho = new CabecalhoCard();
    valor = new ValorCard();
    comparacao = new ComparacaoCard();
    acumulado = new AcumuladoCard();
    meta = new MetaCard();
    periodos = new PeriodosCard();
    aparencia = new AparenciaCard();
    status = new StatusCard();
    explicacao = new ExplicacaoCard();
    cards = [this.cabecalho, this.valor, this.comparacao, this.acumulado, this.meta, this.periodos, this.aparencia, this.status, this.explicacao];
}
