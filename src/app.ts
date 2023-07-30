import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { NotrStore, Note } from './store.ts';
import { delegate } from './helpers.ts';

const Notes = new NotrStore("notr-app");

interface DOMElements {
    [index: string]: HTMLElement | HTMLInputElement | HTMLTextAreaElement | HTMLDialogElement;
}

class NotrApp {
    parent: HTMLElement;
    $: DOMElements;

    constructor(el: HTMLElement) {
        this.parent = el;

        this.$ = {
            addForm: el.querySelector('[data-notr="note-add-form"]') as HTMLElement,
            addFormTitle: el.querySelector('[data-notr="note-add-form-title"]') as HTMLInputElement,
            addFormContent: el.querySelector('[data-notr="note-add-form-content"]') as HTMLTextAreaElement,
            editDialog: el.querySelector('[data-notr="note-edit-dialog"]') as HTMLDialogElement,
            editFormTitle: el.querySelector('[data-notr="note-edit-form-title"]') as HTMLInputElement,
            editFormContent: el.querySelector('[data-notr="note-edit-form-content"]') as HTMLTextAreaElement,
            list: el.querySelector('[data-notr="list"]') as HTMLElement,
        }

        this.setupUI();
    }

    setupUI(): void {
        Notes.addEventListener("save", this.render.bind(this) as EventListener);

        this.$.addForm.addEventListener("submit", () => {
            Notes.add({
                title: (this.$.addFormTitle as HTMLInputElement).value,
                content: (this.$.addFormContent as HTMLTextAreaElement).value
            } as Note);
            Notes.saveStorage();
        });

        this.$.editDialog.addEventListener("click", (event) => {
            if (event.target === this.$.editDialog) {
                (this.$.editDialog as HTMLDialogElement).close();
                this.saveNote();
            }
        });

        this.$.editDialog.addEventListener("close", () => {
            this.saveNote();
        });

        this.bindNoteEvents();
        this.render();
    }

    saveNote() {
        const note = Notes.get(Notes.getEditedNoteId());

        if (note) {
            Notes.update({
                ...note,
                title: (this.$.editFormTitle as HTMLInputElement).value,
                content: (this.$.editFormContent as HTMLTextAreaElement).value
            });
            Notes.setEditedNoteId("none");
            Notes.saveStorage();
        }
    }

    noteEvent(
        event: keyof GlobalEventHandlersEventMap,
        selector: string,
        handler: (n: Note, el: HTMLElement, e: Event) => void): void {

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

    bindNoteEvents() {
        this.noteEvent("click", '[data-notr="note-destroy"]', (note: Note) => {
            Notes.remove(note);
            Notes.saveStorage();
        });

        this.noteEvent("click", '[data-notr="note-label"]', (note: Note) => {
            Notes.setEditedNoteId(note.id);
            Notes.saveStorage();
        });

        this.noteEvent("click", '[data-notr="note-content"]', (note: Note) => {
            Notes.setEditedNoteId(note.id);
            Notes.saveStorage();
        });
    }

    createNoteItem(note: Note) {
        return html`
            <article data-id="${note.id}">
				<div class="view new">
					<h3 data-notr="note-label">${note.title}</h3>
                    
                    <div data-notr="note-content" class="content">${note.content}</div>

                    <footer class="buttons">
                        <button class="destroy" data-notr="note-destroy">X</button>
                    </footer>
				</div>
            </article>
        `;
    }

    showEditNoteForm(note: Note) {
        (this.$.editFormTitle as HTMLInputElement).value = note.title;
        (this.$.editFormContent as HTMLTextAreaElement).value = note.content;

        (this.$.editDialog as HTMLDialogElement).showModal();
    }

    render() {
        const editedNoteId = Notes.getEditedNoteId()
        const notes = Notes.all();

        if (editedNoteId != "none") {
            const note = Notes.get(editedNoteId);

            if (note) this.showEditNoteForm(note);
        }

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