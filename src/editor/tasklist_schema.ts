import { NodeSpec, Schema } from "prosemirror-model";

export const nodes = {
    doc: {
        content: "bullet_list"
    } as NodeSpec,

    bullet_list: {
        content: "list_item+",
        group: "block",
        parseDOM: [{ tag: "ul" }],
        toDOM() { return ["ul", {class: "tasklist"}, 0] }
    } as NodeSpec,

    list_item: {
        content: "paragraph",
        parseDOM: [{tag: "li"}],
        toDOM() { return ["li", 0] },
        defining: true,
        draggable: true
    } as NodeSpec,

    paragraph: {
        attrs: {checked: {default: false}},
        content: "inline*",
        parseDOM: [{ tag: "p" }],
        toDOM(node) {
            if (node.attrs.checked) {
                return ["p", {class: "checked"}, 0]
            }
            return ["p", 0]
        }
    } as NodeSpec,

    text: {
        group: "inline"
    } as NodeSpec
};

export const taskSchema = new Schema({ nodes });