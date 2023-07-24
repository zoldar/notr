import { html } from 'lit';
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

        html`<div>Hello world</div>`
    }
}

new NotrApp(document.body);