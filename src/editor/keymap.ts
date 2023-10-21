import {
    wrapIn, chainCommands, toggleMark, exitCode,
    joinUp, joinDown
} from "prosemirror-commands"
import { splitListItem } from "prosemirror-schema-list"
import { undo, redo } from "prosemirror-history"
import { undoInputRule } from "prosemirror-inputrules"
import { Command } from "prosemirror-state"
import { Schema } from "prosemirror-model"

const mac = typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false

/// Inspect the given schema looking for marks and nodes from the
/// basic schema, and if found, add key bindings related to them.
/// This will add:
///
/// * **Mod-b** for toggling [strong](#schema-basic.StrongMark)
/// * **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
/// * **Mod-`** for toggling [code font](#schema-basic.CodeMark)
/// * **Enter** to split a non-empty textblock in a list item while at
///   the same time splitting the list item
/// * **Mod-Enter** to insert a hard break
/// * **Backspace** to undo an input rule
/// * **Alt-ArrowUp** to `joinUp`
/// * **Alt-ArrowDown** to `joinDown`
///
/// You can suppress or map these bindings by passing a `mapKeys`
/// argument, which maps key names (say `"Mod-B"` to either `false`, to
/// remove the binding, or a new key name string.
export function buildKeymap(schema: Schema, mapKeys?: { [key: string]: false | string }) {
    const keys: { [key: string]: Command } = {}
    let type

    function bind(key: string, cmd: Command) {
        if (mapKeys) {
            const mapped = mapKeys[key]
            if (mapped === false) return
            if (mapped) key = mapped
        }
        keys[key] = cmd
    }

    bind("Mod-z", undo)
    bind("Shift-Mod-z", redo)
    bind("Backspace", undoInputRule)
    if (!mac) bind("Mod-y", redo)

    bind("Alt-ArrowUp", joinUp)
    bind("Alt-ArrowDown", joinDown)

    if (type = schema.marks.strong) {
        bind("Mod-b", toggleMark(type))
        bind("Mod-B", toggleMark(type))
    }
    if (type = schema.marks.em) {
        bind("Mod-i", toggleMark(type))
        bind("Mod-I", toggleMark(type))
    }
    if (type = schema.marks.code)
        bind("Mod-`", toggleMark(type))

    if (type = schema.nodes.blockquote)
        bind("Ctrl->", wrapIn(type))

    if (type = schema.nodes.hard_break) {
        const br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
            if (dispatch) dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView())
            return true
        })
        bind("Mod-Enter", cmd)
        bind("Shift-Enter", cmd)
        if (mac) bind("Ctrl-Enter", cmd)
    }

    if (type = schema.nodes.list_item) {
        bind("Enter", splitListItem(type))
    }

    return keys
}
