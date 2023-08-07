import { NodeSpec, Schema } from "prosemirror-model";

export const nodes = {
    doc: {
        content: "block"
    } as NodeSpec,

    taskList: {
        content: "task+",
        group: "block",
        parseDOM: [{ tag: "ul" }],
        toDOM() { return ["ul", 0] }
    } as NodeSpec,

    task: {
        content: "checkbox inline*",
        group: "task",
        parseDOM: [{ tag: "li" }],
        toDOM() { return ["li", 0] }
    } as NodeSpec,

    checkbox: {
        attrs: {checked: {default: false}},
        selectable: false,
        inline: true,
        parseDOM: [{
            tag: "span", getAttrs(node: HTMLElement) {
                return { checked: node.classList[1] === 'checked' }
            }
        }],
        toDOM(node) {
            return ["span", {
                class: node.attrs.checked ?
                    'taskbox checked' : 'taskbox unchecked'
            }]
        }
    } as NodeSpec,

    text: {
        group: "inline"
    } as NodeSpec
};

export const taskSchema = new Schema({ nodes });