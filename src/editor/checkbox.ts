import { Decoration, DecorationSet } from "prosemirror-view"
import { Plugin } from "prosemirror-state"

function wrapItems(doc) {
    const items = []

    doc.descendants((node, pos) => {
        if (node.type.name === "paragraph") {
            items.push({ from: pos, checked: node.attrs.checked })
        }
    })

    return items
}

function checkbox(checklistItem: object) {
    const wrap = document.createElement("div")
    wrap.setAttribute("aria-hidden", "true")
    wrap.className = "checklist-toggle"
    const box = wrap.appendChild(document.createElement("input"))
    box.type = "checkbox"
    box.checked = checklistItem.checked
    box.className = "checklist-checkbox"
    box.position = checklistItem.from
    return wrap
}

function checkboxDeco(doc) {
    const decos = []

    wrapItems(doc).forEach(item => {
        decos.push(Decoration.widget(item.from, checkbox(item), {side: 1}))
    })

    return DecorationSet.create(doc, decos)
}

export function checkboxPlugin() {
    const handleCheckboxClick = (view, event) => {
        if (event.target.classList.contains('checklist-checkbox')) {
            event.preventDefault()
            const position = event.target.position;
            view.dispatch(
                view.state.tr.setNodeAttribute(
                    position, 'checked', !event.target.checked)
            )
            return true;
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
                handleCheckboxClick(view, event);
            },
            handleDoubleClick(view, _, event) {
                handleCheckboxClick(view, event);
            },
            handleTripleClick(view, _, event) {
                handleCheckboxClick(view, event);
            }
        },

    })
}
