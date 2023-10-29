import { history, redo, undo } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import { schema } from "prosemirror-schema-basic"
import { EditorState } from "prosemirror-state"
import { EditorView } from "prosemirror-view"
import placeholder from "./editor/placeholder"
import { baseKeymap } from "prosemirror-commands"
import { DOMSerializer, Node, Schema, Slice } from "prosemirror-model"
import { taskSchema } from "./editor/tasklist_schema"
import { buildKeymap } from "./editor/keymap"
import { checkboxPlugin } from "./editor/checkbox"
import { dropCursor } from "prosemirror-dropcursor"
import { dragHandlePlugin } from "./editor/drag_handle"

export interface SerializedDoc {
  schema: string,
  doc: object
}

class BaseEditor {
  newStateFn: () => EditorState
  view: EditorView

  constructor(element: HTMLElement, placeholderLabel: string, viewAttrs?: object) {
    this.newStateFn = () => this.initState({}, placeholderLabel)
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
    })
  }

  initView(element: HTMLElement, state: EditorState, attrs: object) {
    const view = new EditorView(element, {
      ...{ state }, ...attrs
    })

    return view
  }

  submitForm() {
    this.view.dom.closest("form")?.dispatchEvent(new SubmitEvent("submit"))
    return true
  }

  isEmpty() {
    return this.view.state.doc.textContent.trim() === ""
  }

  getDoc = (): SerializedDoc => {
    return {
      schema: (this.view.state.schema === schema) ? 'schema' : 'taskSchema',
      doc: this.view.state.doc.toJSON()
    }
  }

  reset() {
    this.view.updateState(this.newStateFn())
  }

  blur() {
    (this.view.dom as HTMLElement).blur()
    window.getSelection()?.removeAllRanges()
  }

  set(docObj: SerializedDoc) {
    this.reset()
    const objSchema = (docObj.schema === 'schema') ? schema : taskSchema
    const state = this.view.state
    const doc = objSchema.nodeFromJSON(docObj.doc)
    const tr = state.tr
    tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0))
    const newState = state.apply(tr)
    this.view.updateState(newState)
  }
}

export class SimpleEditor extends BaseEditor {
}

export class ContentEditor extends BaseEditor {
  currentSchema: Schema = schema

  initState(attrs: object, placeholderLabel: string): EditorState {
    if (this.currentSchema === taskSchema) {
      return this.initTaskState(attrs, placeholderLabel)
    } else {
      return this.initTextState(attrs, placeholderLabel)
    }
  }

  initTextState(attrs: object, placeholderLabel: string): EditorState {
    return super.initState({
      ...attrs, ...{
        plugins: [
          history(),
          keymap({ "Mod-Enter": () => this.submitForm() }),
          keymap(buildKeymap(schema)),
          keymap(baseKeymap),
          placeholder(placeholderLabel)
        ]
      }
    }, placeholderLabel)
  }

  initTaskState(attrs: object, placeholderLabel: string) {
    return EditorState.create({
      ...{
        schema: taskSchema,
        plugins: [
          history(),
          keymap({ "Mod-Enter": () => this.submitForm() }),
          keymap(buildKeymap(taskSchema)),
          keymap(baseKeymap),
          checkboxPlugin(),
          dropCursor(),
          dragHandlePlugin(),
          placeholder(placeholderLabel)
        ]
      }, ...attrs
    })
  }

  set(docObj: SerializedDoc) {
    this.currentSchema = (docObj.schema === 'schema') ? schema : taskSchema
    super.set(docObj)
  }
}

export function renderDoc(input: SerializedDoc) {
  const objSchema = (input.schema === 'schema') ? schema : taskSchema
  const doc = Node.fromJSON(objSchema, input.doc)
  const Serializer = DOMSerializer.fromSchema(objSchema)
  const outputHtml = Serializer.serializeFragment(doc.content)
  const tmp = document.createElement('div')
  tmp.appendChild(outputHtml)

  return tmp
}