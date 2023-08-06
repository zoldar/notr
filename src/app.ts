import { html, render } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { NotrStore, Note } from './store.ts';
import { delegate } from './helpers.ts';
import { ContentEditor, SimpleEditor, renderDoc } from './editor.ts';
import { setupMasonry } from './masonry.ts';

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
    reflowNotes: () => void;
    $: DOMElements;

    constructor(el: HTMLElement) {
        this.parent = el;

        this.$ = {
            addForm: el.querySelector('[data-notr="note-add-form"]') as HTMLElement,
            addFormTitle: el.querySelector('[data-notr="note-add-form-title"]') as HTMLElement,
            addFormContent: el.querySelector('[data-notr="note-add-form-content"]') as HTMLElement,
            addFormButtons: el.querySelector('[data-notr="note-add-form-buttons"]') as HTMLElement,
            editDialog: el.querySelector('[data-notr="note-edit-dialog"]') as HTMLDialogElement,
            editForm: el.querySelector('[data-notr="note-edit-form"]') as HTMLDialogElement,
            editFormTitle: el.querySelector('[data-notr="note-edit-form-title"]') as HTMLElement,
            editFormContent: el.querySelector('[data-notr="note-edit-form-content"]') as HTMLElement,
            editFormDestroy: el.querySelector('[data-notr="note-edit-form-destroy"]') as HTMLElement,
            list: el.querySelector('[data-notr="list"]') as HTMLElement,
        }

        this.newTitleEditor = new SimpleEditor(this.$.addFormTitle, "Title");
        this.newContentEditor = new ContentEditor(this.$.addFormContent, "Write a note...", {
            handleDOMEvents: {
                focus: () => {
                    console.log('hit')
                    this.expandAddForm();
                    return true;
                }
            }
        });
        this.editTitleEditor = new SimpleEditor(this.$.editFormTitle, "Title");
        this.editContentEditor = new ContentEditor(this.$.editFormContent, "Write a note...");
        this.reflowNotes = setupMasonry(this.$.list, "note");
        this.setupUI();
    }

    setupUI(): void {
        Notes.addEventListener("save", this.render.bind(this) as EventListener);

        this.$.addForm.addEventListener("submit", (event) => {
            this.addNote();
            event.preventDefault();
        });

        this.$.editForm.addEventListener("submit", (event) => {
            (this.$.editDialog as HTMLDialogElement).close();
            this.saveNote();
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

        this.$.editFormDestroy.addEventListener("click", () => {
            const note = Notes.get(Notes.getEditedNoteId());
            if (note) {
                Notes.remove(note);
            }
            (this.$.editDialog as HTMLDialogElement).close();
            Notes.saveStorage();
        });

        document.body.addEventListener("keyup", (event) => {
            if (event.key === "Escape" && Notes.getEditedNoteId()) {
                (this.$.editDialog as HTMLDialogElement).close();
                this.saveNote();
            }
        });

        this.bindNoteEvents();
        this.render();
    }

    expandAddForm() {
        this.$.addFormTitle.style.display = 'block';
        this.$.addFormButtons.style.display = 'block';
    }

    contractAddForm() {
        this.$.addFormTitle.style.display = 'none';
        this.$.addFormButtons.style.display = 'none';
    }

    addNote() {
        if (!this.newTitleEditor.isEmpty() || !this.newContentEditor.isEmpty()) {
            Notes.add({
                title: this.newTitleEditor.getDoc(),
                content: this.newContentEditor.getDoc()
            } as Note);
            Notes.saveStorage();
        }
        this.newTitleEditor.reset();
        this.newContentEditor.reset();
        this.newContentEditor.blur();
        this.contractAddForm();
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
            if (document.getSelection()?.type !== "Range") {
                Notes.setEditedNoteId(note.id);
                Notes.saveStorage();
            }
        });

    }

    createNoteItem(note: Note) {
        return html`
            <article class="note" data-notr="note" data-id="${note.id}">
                <div class="container">
                    <h3 data-notr="note-label">${renderDoc(note.title)}</h3>
                    
                    <div data-notr="note-content" class="content">${renderDoc(note.content)}</div>

                    <footer class="buttons">
                        <ul class="container">
                            <li>
                                <button class="destroy" data-notr="note-destroy">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg> 
                                </button>
                            </li>
                        </ul>
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

        this.reflowNotes();
    }
}

new NotrApp(document.body);