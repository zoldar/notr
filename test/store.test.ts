import { expect } from '@open-wc/testing'

import { NotrStore } from '../src/store'

describe('NotrStore', () => {
    it('empty store returns no notes', () => {
        const store = new NotrStore("test-store")

        expect(store.all()).to.be.empty
    })
})