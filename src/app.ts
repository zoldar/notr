import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { NotrStore, Note } from './store.ts';
import { delegate } from './helpers.ts';
import { ContentEditor, SimpleEditor, renderDoc } from './editor.ts';

const Notes = new NotrStore("notr-app");

interface DOMElements {
    [index: string]: HTMLElement | HTMLInputElement | HTMLTextAreaElement | HTMLDialogElement;
}

class NotrApp {
    newTitleEditor: SimpleEditor;
    newContentEditor: ContentEditor;
    editTitleEditor: SimpleEditor;
    editContentEditor: ContentEditor;
    parent: HTMLElement;
    $: DOMElements;

    constructor(el: HTMLElement) {
        this.parent = el;

        this.$ = {
            addForm: el.querySelector('[data-notr="note-add-form"]') as HTMLElement,
            addFormTitle: el.querySelector('[data-notr="note-add-form-title"]') as HTMLElement,
            addFormContent: el.querySelector('[data-notr="note-add-form-content"]') as HTMLElement,
            editDialog: el.querySelector('[data-notr="note-edit-dialog"]') as HTMLDialogElement,
            editFormTitle: el.querySelector('[data-notr="note-edit-form-title"]') as HTMLElement,
            editFormContent: el.querySelector('[data-notr="note-edit-form-content"]') as HTMLElement,
            list: el.querySelector('[data-notr="list"]') as HTMLElement,
        }

        this.newTitleEditor = new SimpleEditor(this.$.addFormTitle, "Title");
        this.newContentEditor = new ContentEditor(this.$.addFormTitle, "Content");
        this.editTitleEditor = new SimpleEditor(this.$.editFormTitle, "Title");
        this.editContentEditor = new ContentEditor(this.$.editFormContent, "Content");

        this.setupUI();
    }

    setupUI(): void {
        Notes.addEventListener("save", this.render.bind(this) as EventListener);

        this.$.addForm.addEventListener("submit", (event) => {
            this.addNote();
            event.preventDefault();
        });

        (this.$.addForm as HTMLElement).addEventListener("keyup", (event) => {
            if (event.key === "Escape") {
                this.addNote();
            }
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

        document.body.addEventListener("keyup", (event) => {
            if (event.key === "Escape" && Notes.getEditedNoteId()) {
                (this.$.editDialog as HTMLDialogElement).close();
                this.saveNote();
            }
        })

        this.bindNoteEvents();
        this.render();
    }

    addNote() {
        Notes.add({
            title: this.newTitleEditor.getDoc(),
            content: this.newContentEditor.getDoc()
        } as Note);
        Notes.saveStorage();
        this.newTitleEditor.reset();
        this.newContentEditor.reset();
    }

    saveNote() {
        const note = Notes.get(Notes.getEditedNoteId());

        if (note) {
            Notes.update({
                ...note,
                title: this.editTitleEditor.getDoc(),
                content: this.editContentEditor.getDoc()
            });
            this.editTitleEditor.reset();
            this.editContentEditor.reset();
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

        this.noteEvent("click", '[data-notr="note"]', (note: Note) => {
            Notes.setEditedNoteId(note.id);
            Notes.saveStorage();
        });

    }

    createNoteItem(note: Note) {
        return html`
            <article data-notr="note" data-id="${note.id}">
                <div class="view new">
                    <h3 data-notr="note-label">${renderDoc(note.title)}</h3>
                    
                    <div data-notr="note-content" class="content">${renderDoc(note.content)}</div>

                    <footer class="buttons">
                        <button class="destroy" data-notr="note-destroy">X</button>
                    </footer>
                </div>
            </article>
        `;
    }

    showEditNoteForm(note: Note) {
        this.editTitleEditor.set(note.title);
        this.editContentEditor.set(note.content);

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