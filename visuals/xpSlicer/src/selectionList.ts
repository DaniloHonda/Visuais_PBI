"use strict";

// Lista de seleção usada tanto no modo "lista aberta" quanto dentro da janela.
// Trabalha só com dados simples (texto e números), para poder atravessar a janela do Power BI.

export interface ListItem {
    key: string;
    label: string;
    count: string | null;   // já formatado
    hasData: boolean;
}

export interface ListOptions {
    single: boolean;
    search: boolean;
    selectAll: boolean;
    placeholder: string;
    onChange: (selected: string[]) => void;
    onSubmit?: () => void;
}

export class SelectionList {
    private root: HTMLElement;
    private input: HTMLInputElement;
    private actions: HTMLElement;
    private list: HTMLElement;
    private footer: HTMLElement;
    private items: ListItem[] = [];
    private selected = new Set<string>();
    private query = "";
    private focusIndex = -1;

    constructor(container: HTMLElement, private opts: ListOptions) {
        this.root = el("div", "xp-sl");
        this.input = document.createElement("input");
        this.input.type = "search";
        this.input.className = "xp-sl__search";
        this.input.setAttribute("aria-label", "Buscar");
        this.input.addEventListener("input", () => { this.query = this.input.value; this.focusIndex = -1; this.renderList(); });
        this.input.addEventListener("keydown", (e: KeyboardEvent) => this.onKey(e));
        this.actions = el("div", "xp-sl__actions");
        this.list = el("div", "xp-sl__list");
        this.list.setAttribute("role", "listbox");
        this.list.setAttribute("aria-multiselectable", String(!opts.single));
        this.footer = el("div", "xp-sl__footer");
        this.root.append(this.input, this.actions, this.list, this.footer);
        container.appendChild(this.root);
    }

    public setOptions(opts: ListOptions) { this.opts = opts; }

    public setData(items: ListItem[], selected: string[]) {
        this.items = items;
        this.selected = new Set(selected);
        this.input.placeholder = this.opts.placeholder;
        this.input.style.display = this.opts.search ? "" : "none";
        this.renderList();
    }

    public focusSearch() { if (this.opts.search) this.input.focus(); }

    private visible(): ListItem[] {
        const q = normalize(this.query);
        return this.items.filter(i => !q || normalize(i.label).indexOf(q) >= 0);
    }

    private change() {
        this.opts.onChange(Array.from(this.selected));
        this.renderList();
    }

    private toggle(item: ListItem) {
        if (this.opts.single) {
            const was = this.selected.has(item.key);
            this.selected.clear();
            if (!was) this.selected.add(item.key);
        } else if (this.selected.has(item.key)) {
            this.selected.delete(item.key);
        } else {
            this.selected.add(item.key);
        }
        this.change();
    }

    private onKey(e: KeyboardEvent) {
        e.stopPropagation();
        const rows = this.visible();
        if (e.key === "ArrowDown") { e.preventDefault(); this.focusIndex = Math.min(rows.length - 1, this.focusIndex + 1); this.renderList(); }
        else if (e.key === "ArrowUp") { e.preventDefault(); this.focusIndex = Math.max(0, this.focusIndex - 1); this.renderList(); }
        else if (e.key === " " && this.focusIndex >= 0 && rows[this.focusIndex]) { e.preventDefault(); this.toggle(rows[this.focusIndex]); }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (this.focusIndex >= 0 && rows[this.focusIndex] && !this.opts.onSubmit) this.toggle(rows[this.focusIndex]);
            else if (this.opts.onSubmit) this.opts.onSubmit();
        }
    }

    private renderList() {
        clear(this.list);
        clear(this.actions);
        clear(this.footer);
        const q = normalize(this.query);
        const rows = this.visible();

        if (this.opts.selectAll && !this.opts.single) {
            const all = el("button", "xp-sl__link", q ? `Selecionar os ${rows.length} encontrados` : `Selecionar todos (${rows.length})`);
            all.addEventListener("click", () => { rows.forEach(r => this.selected.add(r.key)); this.change(); });
            all.toggleAttribute("disabled", rows.length === 0);
            this.actions.appendChild(all);
        }
        const clr = el("button", "xp-sl__link xp-sl__link--end", "Limpar");
        clr.toggleAttribute("disabled", this.selected.size === 0);
        clr.addEventListener("click", () => { this.selected.clear(); this.change(); });
        this.actions.appendChild(clr);

        if (!this.items.length) {
            this.list.appendChild(el("div", "xp-sl__empty", "Arraste uma coluna para \"Campo\"."));
            return;
        }
        if (!rows.length) {
            this.list.appendChild(el("div", "xp-sl__empty", `Nada encontrado para "${this.query}".`));
        }
        rows.forEach((r, i) => {
            const on = this.selected.has(r.key);
            const it = el("div", "xp-sl__item" + (on ? " xp-sl__item--on" : "") + (r.hasData ? "" : " xp-sl__item--nodata") + (i === this.focusIndex ? " xp-sl__item--focus" : ""));
            it.setAttribute("role", "option");
            it.setAttribute("aria-selected", String(on));
            it.appendChild(el("span", "xp-sl__check" + (this.opts.single ? " xp-sl__check--radio" : "")));
            const label = el("span", "xp-sl__label");
            highlight(label, r.label, q);
            label.title = r.label;
            it.appendChild(label);
            if (r.count !== null) it.appendChild(el("span", "xp-sl__n", r.count));
            it.addEventListener("click", () => { this.focusIndex = i; this.toggle(r); });
            this.list.appendChild(it);
            if (i === this.focusIndex) it.scrollIntoView({ block: "nearest" });
        });

        const n = this.selected.size;
        this.footer.textContent = n === 0
            ? "Nenhum selecionado: mostra todos"
            : `${n} selecionado${n > 1 ? "s" : ""}`;
    }
}

export function normalize(text: string): string {
    return (text || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function el(tag: string, className: string, text?: string): HTMLElement {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function clear(node: HTMLElement) { while (node.firstChild) node.removeChild(node.firstChild); }

// Destaca o trecho buscado, ignorando acentos, sem innerHTML.
function highlight(target: HTMLElement, label: string, q: string) {
    const pos = q ? normalize(label).indexOf(q) : -1;
    if (pos < 0) { target.textContent = label; return; }
    target.appendChild(document.createTextNode(label.slice(0, pos)));
    const mark = document.createElement("mark");
    mark.textContent = label.slice(pos, pos + q.length);
    target.appendChild(mark);
    target.appendChild(document.createTextNode(label.slice(pos + q.length)));
}
