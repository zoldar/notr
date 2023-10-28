export interface Note {
  id: string
  created: Date
  title: object
  content: object
}

export class NotrStore extends EventTarget {
  private localStorageKey: string
  private notes: Array<Note> = []
  private editedNoteId: string = "none"

  constructor(localStorageKey: string) {
    super()
    this.localStorageKey = localStorageKey

    this.readStorage()

    // handle notes edited in another window
    window.addEventListener(
      "storage",
      () => {
        this.readStorage()
        this.saveStorage()
      },
      false
    )
  }

  all = (): Array<Note> => this.notes
  get = (id: string) => this.notes.find((note) => note.id === id)
  getEditedNoteId = (): string => this.editedNoteId

  add(note: {title: object, content: object}) {
    this.notes.unshift({
      id: "id_" + Date.now(),
      title: note.title,
      content: note.content,
      created: new Date()
    })
  }

  remove({ id }: Note) {
    this.notes = this.notes.filter((note) => note.id !== id)
  }

  update(note: Note) {
    this.notes = this.notes.map((n) => (n.id === note.id ? note : n))
  }

  setEditedNoteId(id: string) {
    this.editedNoteId = id
  }

  private readStorage() {
    this.notes = JSON.parse(window.localStorage.getItem(this.localStorageKey + '_notes') || "[]")
    this.editedNoteId = window.localStorage.getItem(this.localStorageKey + '_editedNoteId') || "none"
  }

  saveStorage() {
    window.localStorage.setItem(this.localStorageKey + '_notes', JSON.stringify(this.notes))
    window.localStorage.setItem(this.localStorageKey + '_editedNoteId', this.editedNoteId)
    this.dispatchEvent(new CustomEvent("save"))
  }
}