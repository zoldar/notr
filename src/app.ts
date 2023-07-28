import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { NotrStore, Note } from './store.ts';

const Notes = new NotrStore("notr-app");

interface DOMElements {
	[index: string]: HTMLElement | HTMLInputElement;
}

class NotrApp {
    parent: HTMLElement;
    $: DOMElements;

    constructor(el: HTMLElement) {
        this.parent = el;

        this.$ = {
            helloName: el.querySelector('[data-notr="hello-name"]') as HTMLElement,
            list: el.querySelector('[data-notr="list"]') as HTMLElement,
        }

        this.setupUI();
    }

    setupUI(): void {
        Notes.addEventListener("save", this.render.bind(this) as EventListener);

        this.$.helloName.textContent = 'Adrian';

        html`<div>Hello world</div>`
    }

    createNoteItem(note: Note) {
        return html`
            <li data-id="${note.id}">
				<div class="view new">
					<label data-todo="label">${note.title}</label>
				</div>
			</li>
        `;
    }

    render () {
        const notes = Notes.all();

        render(
			repeat(
				notes,
				(note: Note) => note.id,
				(note: Note) => this.createNoteItem(note)
			),
			this.$.list
		);
    }
}

new NotrApp(document.body);