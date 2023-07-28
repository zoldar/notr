export interface Note {
    id: string;
    created: Date;
    title: string;
    content: string;
}

export class NotrStore extends EventTarget {
    private localStorageKey: string;
    private notes: Array<Note> = [];

    constructor(localStorageKey: string) {
        super();
        this.localStorageKey = localStorageKey;

        this.readStorage();

		// handle notes edited in another window
		window.addEventListener(
			"storage",
			() => {
				this.readStorage();
				this.saveStorage();
			},
			false
		);
    }

    all = (): Array<Note> => this.notes;
    get = (id: string) => this.notes.find((note) => note.id === id);

    add(note: Note) {
		this.notes.push({
			id: "id_" + Date.now(),
			title: note.title,
            content: note.content,
            created: new Date()
		});

		this.saveStorage();
	}

    remove({ id }: Note) {
		this.notes = this.notes.filter((note) => note.id !== id);
		this.saveStorage();
	}

    update(note: Note) {
		this.notes = this.notes.map((n) => (n.id === note.id ? note : n));
		this.saveStorage();
	}

    revert() {
        this.saveStorage();
    }

    private readStorage() {
        this.notes = JSON.parse(window.localStorage.getItem(this.localStorageKey) || "[]");
    }

    private saveStorage() {
		window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.notes));
		this.dispatchEvent(new CustomEvent("save"));
	}
}