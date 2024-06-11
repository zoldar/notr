import { Node } from "prosemirror-model"
import { Decoration, DecorationSet, EditorView } from "prosemirror-view"
import { NodeSelection, Plugin } from "prosemirror-state"

const HANDLE_CLASS = "checklist-drag-handle"

interface Item {
  position: number
}

function wrapItems(doc: Node) {
  const items: Array<Item> = []

  doc.descendants((node: Node, pos: number) => {
    if (node.type.name === "paragraph") {
      items.push({ position: pos })
    }
  })

  return items
}

function handle(item: Item) {
  const handle = document.createElement("div")
  handle.textContent = "||"
  handle.className = HANDLE_CLASS
  handle.contentEditable = false
  handle.dataset.position = item.position.toString(10)
  return handle
}

function handleDeco(doc: Node) {
  const decos: Array<Decoration> = []

  wrapItems(doc).forEach(item => {
    decos.push(Decoration.widget(item.position, handle(item)))
  })

  return DecorationSet.create(doc, decos)
}

export function dragHandlePlugin() {
  const selectItem = (view: EditorView, target: HTMLElement) => {
    const position = Number(target.dataset.position)
    const paragraph = view.state.doc.resolve(position)
    const parentPosition = view.state.doc
      .resolve(position)
      .before(paragraph.depth)
    view.dispatch(
      view.state.tr
        .setSelection(
          NodeSelection.create(view.state.doc, parentPosition))
    )
    view.focus()
  }

  return new Plugin({
    state: {
      init(_, { doc }) { return handleDeco(doc) },
      apply(tr, old) { return tr.docChanged ? handleDeco(tr.doc) : old }
    },
    props: {
      decorations(state) { return this.getState(state) },
      handleDOMEvents: {
        mousedown: (view, event) => {
          const target = event.target as (HTMLElement | null)
          if (event.button === 0 && target?.classList.contains(HANDLE_CLASS)) {
            selectItem(view, target)
          }
          return false
        },
        touchstart: (view, event) => {
          const target = event.target as (HTMLElement | null)
          if (target?.classList.contains(HANDLE_CLASS)) {
            selectItem(view, target)
          }

          return false
        }
      }
    }
  })
}