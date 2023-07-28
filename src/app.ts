import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { NotrStore, Note } from './store.ts';
import { delegate } from './helpers.ts';

const Notes = new NotrStore("notr-app");

interface DOMElements {
    [index: string]: HTMLElement | HTMLInputElement | HTMLTextAreaElement;
}

class NotrApp {
    parent: HTMLElement;
    $: DOMElements;

    constructor(el: HTMLElement) {
        this.parent = el;

        this.$ = {
            form: el.querySelector('[data-notr="note-form"]') as HTMLElement,
            formTitle: el.querySelector('[data-notr="note-form-title"]') as HTMLInputElement,
            formContent: el.querySelector('[data-notr="note-form-content"]') as HTMLTextAreaElement,
            list: el.querySelector('[data-notr="list"]') as HTMLElement,
        }

        this.setupUI();
    }

    setupUI(): void {
        Notes.addEventListener("save", this.render.bind(this) as EventListener);

        this.$.form.addEventListener("submit", () => {
            Notes.add({
                title: (this.$.formTitle as HTMLInputElement).value,
                content: (this.$.formContent as HTMLTextAreaElement).value
            } as Note)
        });

        this.bindEvents();
        this.render();
    }

    notrEvent(event: keyof GlobalEventHandlersEventMap, selector: string, handler: (n: Note, el: HTMLElement, e: Event) => void): void {
        delegate(this.$.list as HTMLElement, selector, event, (e: Event) => {
            const $el = (e.target as HTMLElement).closest("[data-id]") as HTMLElement;

            if ($el.dataset.id) {
                const note = Notes.get($el.dataset.id);
                if (note) {
                    handler(note, $el, e);
                }
            }
        });
    }

    bindEvents() {
        this.notrEvent("click", '[data-notr="destroy"]', (note: Note) => {
            Notes.remove(note);
        });
    }

    createNoteItem(note: Note) {
        return html`
            <li data-id="${note.id}">
				<div class="view new">
					<label data-notr="label">${note.title}</label>
                    <button class="destroy" data-notr="destroy">X</button>
				</div>
			</li>
        `;
    }

    render() {
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