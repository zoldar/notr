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
        }

        this.setupUI();
    }

    setupUI(): void {
        this.$.helloName.textContent = 'Adrian';
    }
}

new NotrApp(document.body);