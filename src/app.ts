import { html, render } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { NotrStore, Note } from './store.ts'
import { delegate } from './helpers.ts'
import { ContentEditor, SimpleEditor, TaskEditor, renderTaskDoc, renderTextDoc } from './editor.ts'
import { setupMasonry } from './masonry.ts'

const Notes = new NotrStore("notr-app")

interface DOMElements {
  editDialog: HTMLDialogElement,
  [index: string]: HTMLElement
}

class NotrApp {
  newTitleEditor: SimpleEditor
  newContentEditor: ContentEditor
  editTitleEditor: SimpleEditor
  editContentEditor: ContentEditor
  parent: HTMLElement
  reflowNotes: () => void
  $: DOMElements

  constructor(el: HTMLElement) {
    this.parent = el

    this.$ = {
      addForm: el.querySelector('[data-notr="note-add-form"]') as HTMLElement,
      addFormTitle: el.querySelector('[data-notr="note-add-form-title"]') as HTMLElement,
      addFormContent: el.querySelector('[data-notr="note-add-form-content"]') as HTMLElement,
      addFormButtons: el.querySelector('[data-notr="note-add-form-buttons"]') as HTMLElement,
      editDialog: el.querySelector('[data-notr="note-edit-dialog"]') as HTMLDialogElement,
      editForm: el.querySelector('[data-notr="note-edit-form"]') as HTMLElement,
      editFormTitle: el.querySelector('[data-notr="note-edit-form-title"]') as HTMLElement,
      editFormContent: el.querySelector('[data-notr="note-edit-form-content"]') as HTMLElement,
      editFormDestroy: el.querySelector('[data-notr="note-edit-form-destroy"]') as HTMLElement,
      list: el.querySelector('[data-notr="list"]') as HTMLElement,
    }

    this.newTitleEditor = new SimpleEditor(this.$.addFormTitle, "Title")
    this.newContentEditor = new TaskEditor(this.$.addFormContent, "Write a note...", {
      handleDOMEvents: {
        focus: () => {
          this.expandAddForm()
          return true
        }
      }
    })
    this.editTitleEditor = new SimpleEditor(this.$.editFormTitle, "Title")
    this.editContentEditor = new TaskEditor(this.$.editFormContent, "Write a note...")
    this.reflowNotes = setupMasonry(this.$.list, "note")
    this.setupUI()
  }

  setupUI(): void {
    Notes.addEventListener("save", this.render.bind(this) as EventListener)

    this.$.addForm.addEventListener("submit", (event) => {
      this.addNote()
      event.preventDefault()
    })

    this.$.editForm.addEventListener("submit", (event) => {
      this.$.editDialog.close()
      this.saveNote()
      event.preventDefault()
    })

    this.$.editDialog.addEventListener("click", (event) => {
      if (event.target === this.$.editDialog) {
        this.$.editDialog.close()
        this.saveNote()
      }
    })

    this.$.editDialog.addEventListener("close", () => {
      this.saveNote()
    })

    this.$.editFormDestroy.addEventListener("click", () => {
      const note = Notes.get(Notes.getEditedNoteId())
      if (note) {
        Notes.remove(note)
      }
      this.$.editDialog.close()
      Notes.saveStorage()
    })

    document.body.addEventListener("keyup", (event) => {
      if (event.key === "Escape") {
        if (Notes.getEditedNoteId() !== "none") {
          this.$.editDialog.close()
          this.saveNote()
        } else {
          this.addNote()
        }
      }
    })

    this.bindNoteEvents()
    this.render()
  }

  expandAddForm() {
    this.$.addFormTitle.style.display = 'block'
    this.$.addFormButtons.style.display = 'block'
    this.newContentEditor.view.dom.classList.add('expanded')
  }

  contractAddForm() {
    this.$.addFormTitle.style.display = 'none'
    this.$.addFormButtons.style.display = 'none'
    this.newContentEditor.view.dom.classList.remove('expanded')
  }

  addNote() {
    if (!this.newTitleEditor.isEmpty() || !this.newContentEditor.isEmpty()) {
      Notes.add({
        title: this.newTitleEditor.getDoc(),
        content: this.newContentEditor.getDoc()
      })
      Notes.saveStorage()
    }
    this.newTitleEditor.reset()
    this.newContentEditor.reset()
    this.newContentEditor.blur()
    this.contractAddForm()
  }

  saveNote() {
    const note = Notes.get(Notes.getEditedNoteId())

    if (note) {
      Notes.update({
        ...note,
        title: this.editTitleEditor.getDoc(),
        content: this.editContentEditor.getDoc()
      })
      this.editTitleEditor.reset()
      this.editContentEditor.reset()
      Notes.setEditedNoteId("none")
      Notes.saveStorage()
    }
  }

  noteEvent(
    event: keyof GlobalEventHandlersEventMap,
    selector: string,
    handler: (n: Note, el: HTMLElement, e: Event) => void): void {

    delegate(this.$.list, selector, event, (e: Event) => {
      const $el = (e.target as HTMLElement).closest("[data-id]") as (HTMLElement | null)

      if ($el?.dataset.id) {
        const note = Notes.get($el.dataset.id)
        if (note) {
          handler(note, $el, e)
        }
      }
    })
  }

  bindNoteEvents() {
    this.noteEvent("click", '[data-notr="note-destroy"]', (note) => {
      Notes.remove(note)
      Notes.saveStorage()
    })

    this.noteEvent("click", '[data-notr="note"]', (note) => {
      if (document.getSelection()?.type !== "Range") {
        Notes.setEditedNoteId(note.id)
        Notes.saveStorage()
      }
    })

  }

  createNoteItem(note: Note) {
    return html`
            <article class="note" data-notr="note" data-id="${note.id}">
                <div class="container">
                    <h3 data-notr="note-label">${renderTextDoc(note.title)}</h3>
                    
                    <div data-notr="note-content" class="content">${renderTaskDoc(note.content)}</div>

                    <footer class="buttons">
                        <ul class="container">
                            <li>
                                <button class="destroy" data-notr="note-destroy">
                                    <img src="icons/trash.svg" alt="" />
                                </button>
                            </li>
                        </ul>
                    </footer>
                </div>
            </article>
        `
  }

  showEditNoteForm(note: Note) {
    this.editTitleEditor.set(note.title)
    this.editContentEditor.set(note.content)

    this.$.editDialog.showModal()
  }

  render() {
    const editedNoteId = Notes.getEditedNoteId()
    const notes = Notes.all()

    if (editedNoteId != "none") {
      const note = Notes.get(editedNoteId)

      if (note) this.showEditNoteForm(note)
    }

    render(
      repeat(
        notes,
        note => note.id,
        note => this.createNoteItem(note)
      ),
      this.$.list
    )

    this.reflowNotes()
  }
}

new NotrApp(document.body)