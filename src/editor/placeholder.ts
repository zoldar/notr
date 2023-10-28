/**
 * Taken from: https://gist.github.com/amk221/1f9657e92e003a3725aaa4cf86a07cc0
 */

import { Plugin } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export default function placeholder(text: string) {
  const update = (view: EditorView) => {
    if (view.state.doc.textContent) {
      view.dom.removeAttribute('data-placeholder')
    } else {
      view.dom.setAttribute('data-placeholder', text)
    }
  }

  return new Plugin({
    view(view) {
      update(view)

      return { update }
    }
  })
}