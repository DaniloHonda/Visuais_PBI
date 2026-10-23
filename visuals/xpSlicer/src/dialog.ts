"use strict";

import powerbi from "powerbi-visuals-api";
import { ListItem, SelectionList } from "./selectionList";

import DialogConstructorOptions = powerbi.extensibility.visual.DialogConstructorOptions;
import DialogAction = powerbi.DialogAction;

export interface DialogState {
    title: string;
    items: ListItem[];
    selected: string[];
    single: boolean;
    search: boolean;
    selectAll: boolean;
    accent: string;
}

export interface DialogResult { selected: string[]; }

// Janela de seleção aberta pela caixa. Roda separada do visual: recebe tudo pelo estado inicial
// e devolve a seleção por setResult/close.
export class SlicerDialog {
    static id = "xpSlicerDialog";

    constructor(options: DialogConstructorOptions, initialState: object) {
        const state = initialState as DialogState;
        const host = options.host;
        let selected = state.selected.slice();
        host.setResult({ selected } as DialogResult);
        const wrap = document.createElement("div");
        wrap.className = "xp-sl-dialog";
        wrap.style.setProperty("--xp-sl-accent", state.accent);
        options.element.appendChild(wrap);
        const list = new SelectionList(wrap, {
            single: state.single,
            search: state.search,
            selectAll: state.selectAll,
            placeholder: `Buscar ${state.title.toLowerCase()}`,
            onChange: s => { selected = s; host.setResult({ selected } as DialogResult); },
            onSubmit: () => host.close(DialogAction.OK, { selected } as DialogResult)
        });
        list.setData(state.items, state.selected);
        list.focusSearch();
    }
}

const g = globalThis as unknown as { dialogRegistry?: Record<string, unknown> };
g.dialogRegistry = g.dialogRegistry || {};
g.dialogRegistry[SlicerDialog.id] = SlicerDialog;
