import { expect } from 'chai'
import { o, __internal } from '../src/index.js'

const { createAddress } = __internal

// describe('createAddress', () => {
//     it('Test test case', () => {
//         console.log('createAddress', createAddress)
//         expect(createAddress).to.be.a('function')
//     })
// })

describe('objectAccessor', ()=> {
  it('o - Should be a function', ()=> {
    expect(o).to.be.a('function')
  })
  it('o`cat1 > stateObject` - should return a function', ()=> {
    expect(o`cat1 > stateObject`).to.be.a('function')
  })

  it('o`cat1 > stateObject()` - should return o', ()=> {
    expect(o`cat1 > stateObject`()).to.equal(o)
  })
  it('o.cat1.stateObject` - should be a function', ()=> {
    expect(o.cat1.stateObject).to.be.a('function')
  })
  it('o.cat1.stateObject(\'Hello World\')` - should be a state in a frame in the store', ()=> {
    const greeting = 'Hello World!'
    o`cat2 > greeting`(greeting)
    const state = o.cat2.greeting(t => t)
    console.log('state', state)
    // expect(state).to.equal(greeting)
    // chain.expose()
  })
})

// describe('objectAccessor', ()=> {
//   it('Declare Should be a function', ()=> {
//     expect(o).to.be.a('function')
//   })
// })