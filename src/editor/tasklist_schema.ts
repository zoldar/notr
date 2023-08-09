import { NodeSpec, Schema } from "prosemirror-model";

export const nodes = {
    doc: {
        content: "block"
    } as NodeSpec,

    taskList: {
        content: "task+",
        group: "block",
        parseDOM: [{ tag: "ul" }],
        toDOM() { return ["ul", {class: "tasklist"}, 0] }
    } as NodeSpec,

    task: {
        content: "checkbox paragraph",
        group: "task",
        parseDOM: [{ tag: "li" }],
        toDOM() { return ["li", 0] }
    } as NodeSpec,

    checkbox: {
        attrs: { checked: { default: false } },
        selectable: false,
        parseDOM: [{
            tag: "div", getAttrs(node: HTMLElement) {
                return { checked: node.classList[1] === 'checked' }
            }
        }],
        toDOM(node) {
            return ["div", {
                class: node.attrs.checked ?
                    'taskbox checked' : 'taskbox unchecked'
            }]
        }
    } as NodeSpec,

    paragraph: {
        content: "inline*",
        parseDOM: [{ tag: "p" }],
        toDOM() { return ["p", 0] }
    } as NodeSpec,

    text: {
        group: "inline"
    } as NodeSpec
};

export const taskSchema = new Schema({ nodes });