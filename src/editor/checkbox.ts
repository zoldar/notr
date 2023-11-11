import { Node } from "prosemirror-model"
import { Decoration, DecorationSet, EditorView } from "prosemirror-view"
import { Plugin } from "prosemirror-state"

const TOGGLE_CLASS = "checklist-toggle"
const CHECKBOX_CLASS = "checklist-checkbox"

interface Item {
  position: number,
  checked: boolean
}

function wrapItems(doc: Node) {
  const items: Array<Item> = []

  doc.descendants((node, pos) => {
    if (node.type.name === "paragraph") {
      items.push({ position: pos, checked: node.attrs.checked })
    }
  })

  return items
}

function checkbox(item: Item) {
  const wrap = document.createElement("div")
  wrap.setAttribute("aria-hidden", "true")
  wrap.className = TOGGLE_CLASS
  const box = wrap.appendChild(document.createElement("input"))
  box.type = "checkbox"
  box.checked = item.checked
  box.className = CHECKBOX_CLASS
  box.dataset.position = item.position.toString(10)
  return wrap
}

function checkboxDeco(doc: Node) {
  const decos: Array<Decoration> = []

  wrapItems(doc).forEach(item => {
    decos.push(Decoration.widget(item.position, checkbox(item), { side: 1 }))
  })

  return DecorationSet.create(doc, decos)
}

export function checkboxPlugin() {
  const handleCheckboxClick = (view: EditorView, event: MouseEvent) => {
    const target = event.target as (HTMLInputElement | null)
    if (target?.classList.contains(CHECKBOX_CLASS)) {
      event.preventDefault()
      const position = Number(target.dataset.position)
      view.dispatch(
        view.state.tr.setNodeAttribute(
          position, 'checked', !target.checked)
      )
      return true
    }
  }
  return new Plugin({
    state: {
      init(_, { doc }) { return checkboxDeco(doc) },
      apply(tr, old) { return tr.docChanged ? checkboxDeco(tr.doc) : old }
    },
    props: {
      decorations(state) { return this.getState(state) },
      handleClick(view, _, event) {
        handleCheckboxClick(view, event)
      },
      handleDoubleClick(view, _, event) {
        handleCheckboxClick(view, event)
      },
      handleTripleClick(view, _, event) {
        handleCheckboxClick(view, event)
      }
    },

  })
}
