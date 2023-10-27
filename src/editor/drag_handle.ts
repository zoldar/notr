import { Decoration, DecorationSet } from "prosemirror-view"
import { NodeSelection, Plugin } from "prosemirror-state"

function wrapItems(doc) {
    const items = []

    doc.descendants((node, pos) => {
        if (node.type.name === "paragraph") {
            items.push({ from: pos })
        }
    })

    return items
}

function button(checklistItem: object) {
    checklistItem.parent
    const button = document.createElement("div")
    button.textContent = "||"
    button.className = "checklist-drag-handle"
    button.position = checklistItem.from
    return button
}

function buttonDeco(doc) {
    const decos = []

    wrapItems(doc).forEach(item => {
        decos.push(Decoration.widget(item.from, button(item)))
    })

    return DecorationSet.create(doc, decos)
}

export function dragHandlePlugin() {
    const selectItem = (view, event) => {
        const position = event.target.position
        const paragraph = view.state.doc.resolve(position)
        const parentPosition = view.state.doc.resolve(position).before(paragraph.depth)
        view.dispatch(
            view.state.tr.setSelection(NodeSelection.create(view.state.doc, parentPosition))
        )
    }
    return new Plugin({
        state: {
            init(_, { doc }) { return buttonDeco(doc) },
            apply(tr, old) { return tr.docChanged ? buttonDeco(tr.doc) : old }
        },
        props: {
            decorations(state) { return this.getState(state) },
            handleDOMEvents: {
                mousedown: (view, event) => {
                    if (event.button === 0 && event.target?.classList.contains('checklist-drag-handle')) {
                        selectItem(view, event)
                    }
                    return false;
                },
                touchstart: (view, event) => {
                    selectItem(view, event)

                    return false;
                }
            }
        }
    })
}


