import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { schema } from "prosemirror-schema-basic"
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import placeholder from "./editor/placeholder";
import { chainCommands, exitCode } from "prosemirror-commands";
import { DOMSerializer, Node } from "prosemirror-model";
import { taskSchema } from "./editor/tasklist_schema";

class BaseEditor {
    newStateFn: () => EditorState;
    view: EditorView;

    constructor(element: HTMLElement, placeholderLabel: string, viewAttrs?: object) {
        this.newStateFn = () => this.initState({}, placeholderLabel);
        this.view = this.initView(element, this.newStateFn(), viewAttrs || {})
    }

    initState(attrs: object, placeholderLabel: string) {
        return EditorState.create({
            ...{
                schema,
                plugins: [
                    history(),
                    keymap({ "Mod-z": undo, "Mod-y": redo, "Mod-Enter": () => this.submitForm() }),
                    placeholder(placeholderLabel)
                ]
            }, ...attrs
        });
    }

    initView(element: HTMLElement, state: EditorState, attrs: object) {
        const view = new EditorView(element, {
            ...{
                state: state,
                dispatchTransaction(transaction) {
                    const newState = view.state.apply(transaction);
                    // console.log(newState.doc.toJSON());
                    view.updateState(newState);
                }
            }, ...attrs
        });

        return view;
    }

    submitForm() {
        this.view.dom.closest("form")?.dispatchEvent(new SubmitEvent("submit"));
        return true;
    }

    isEmpty() {
        return this.view.state.doc.textContent.trim() === "";
    }

    getDoc = (): object => this.view.state.doc.toJSON();

    reset() {
        this.view.updateState(this.newStateFn());
    }

    blur() {
        (this.view.dom as HTMLElement).blur();
        window.getSelection()?.removeAllRanges();
    }

    set(doc: object) {
        this.reset();
        const newState = this.view.state;
        newState.doc = newState.schema.nodeFromJSON(doc);
        this.view.updateState(newState);
    }
}

export class SimpleEditor extends BaseEditor {
}

export class ContentEditor extends BaseEditor {
    initState(attrs: object, placeholderLabel: string): EditorState {
        return super.initState({
            ...attrs, ...{
                plugins: [
                    history(),
                    keymap({
                        "Mod-z": undo,
                        "Mod-y": redo,
                        "Mod-Enter": () => this.submitForm(),
                        "Enter": chainCommands(exitCode, (state, dispatch) => {
                            const br = schema.nodes.hard_break;
                            if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
                            return true;
                        })
                    }),
                    placeholder(placeholderLabel)
                ]
            }
        }, placeholderLabel);
    }
}

export class TaskEditor extends BaseEditor {
    initState(attrs: object, placeholderLabel: string) {
        return EditorState.create({
            ...{
                schema: taskSchema,
                plugins: [
                    history(),
                    keymap({
                        "Mod-z": undo,
                        "Mod-y": redo,
                        "Mod-Enter": () => this.submitForm(),
                        "Enter": chainCommands(exitCode, (state, dispatch) => {
                            const task = taskSchema.nodes.task;
                            const checkbox = taskSchema.nodes.checkbox;
                            if (dispatch) dispatch(state.tr.replaceSelectionWith(task.create(null, checkbox.create())).scrollIntoView());
                            return true;
                        })
                    }),
                    placeholder(placeholderLabel)
                ]
            }, ...attrs
        });
    }

    initView(element: HTMLElement, state: EditorState, attrs: object) {
        const view = new EditorView(element, {
            ...{
                state: state,
                dispatchTransaction(transaction) {
                    const newState = view.state.apply(transaction);
                    // console.log(newState.doc.toJSON());
                    view.updateState(newState);
                },
                handleClickOn(view, _pos, node, nodePos) {
                    const checkbox = taskSchema.nodes.checkbox;
                    if (node.type === checkbox) {
                        const tr = view.state.tr.replaceWith(nodePos, nodePos + 1, checkbox.create({ checked: !node.attrs.checked }))
                        view.dispatch(tr);
                    }
                    return true;
                },
                handleDoubleClickOn(view, _pos, node, nodePos, event) {
                    const checkbox = taskSchema.nodes.checkbox;
                    if (node.type === checkbox) {
                        const tr = view.state.tr.replaceWith(nodePos, nodePos + 1, checkbox.create({ checked: !node.attrs.checked }))
                        view.dispatch(tr);
                        event.preventDefault();
                    }
                    return true;
                },
                handleTripleClickOn(view, _pos, node, nodePos, event) {
                    const checkbox = taskSchema.nodes.checkbox;
                    if (node.type === checkbox) {
                        const tr = view.state.tr.replaceWith(nodePos, nodePos + 1, checkbox.create({ checked: !node.attrs.checked }))
                        view.dispatch(tr);
                        event.preventDefault();
                    }
                    return true;
                }
            }, ...attrs
        });

        return view;
    }
}

export function renderTextDoc(input: object) {
    const doc = Node.fromJSON(schema, input);
    const Serializer = DOMSerializer.fromSchema(schema);
    const outputHtml = Serializer.serializeFragment(doc.content)
    const tmp = document.createElement('div');
    tmp.appendChild(outputHtml);

    return tmp;
}

export function renderTaskDoc(input: object) {
    const doc = Node.fromJSON(taskSchema, input);
    const Serializer = DOMSerializer.fromSchema(taskSchema);
    const outputHtml = Serializer.serializeFragment(doc.content)
    const tmp = document.createElement('div');
    tmp.appendChild(outputHtml);

    return tmp;
}