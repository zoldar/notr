import { NodeSpec, Schema } from "prosemirror-model";
import { listItem } from "prosemirror-schema-list";

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
        ...
        listItem
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