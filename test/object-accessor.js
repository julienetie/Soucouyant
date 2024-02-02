import { expect } from 'chai'
import { o, __internal, pending } from '../src/index.js'

const { createAddress } = __internal

describe('objectAccessor', () => {
    // Import
    it('o - Should be a function', () => {
        expect(o).to.be.a('function')
    })

    // Object Accessor
    it('o.stateObject()` - should return o', () => {
        // This shoudl also sets the inital state as pending
        const objectAccessor = o`stateObject`()
        expect(objectAccessor)
            .to.equal(o)
    })

    it('o.stateObject` - should be a function', () => {
        const stateObject = o.stateObject
        expect(stateObject)
            .to.be.a('function')
    })

    it('o.stateObject()` - should get the last state `pending`', () => {
        // Sets inital state as pending
        const state = o.stateObject()
        expect(state.toString())
            .to.equal(pending.toString())
    })

    it('o.stateObject(undefined)` - should get the last state', () => {
        const state = o.stateObject(undefined)
        expect(state.toString())
            .to.equal(pending.toString())
    })

    it('o.stateObject(undefined)` - should set and return "red"', () => {
        const state = o.stateObject('red')
        expect(state)
            .to.equal('red')
    })

    it('o.stateObject()` - should get "red"', () => {
        const state = o.stateObject()
        expect(state)
            .to.equal('red')
    })

    // Categories
    it('o`cat1 > stateObject` - should return a function', () => {
        expect(o`cat1 > stateObject`).to.be.a('function')
    })

    it('o`cat1 > stateObject()` - should return o', () => {
        expect(o`cat1 > stateObject`()).to.equal(o)
    })

    it('o.cat1.stateObject` - should be a function', () => {
        expect(o.cat1.stateObject).to.be.a('function')
    })

    it('o.cat1.stateObject` - should set and return `12345n`', () => {
        const state = o.cat1.stateObject(12345n)
        expect(state).to.be.a(12345n)
    })

    it('o.cat1.stateObject` - should get `12345n`', () => {
        const state = o.cat1.stateObject()
        expect(state).to.be.a(12345n)
    })
})