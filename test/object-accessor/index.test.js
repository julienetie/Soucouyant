import { expect } from 'chai'
import o from '../../src/object-accessor/index.js'

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
    expect(o.cat.stateObject).to.be.a('function')
  })
  it('o.cat1.stateObject(\'Hello World\')` - should be a state in a frame in the store', ()=> {
    const greeting = 'Hello World!'
    o`greeting`(greeting)
    const state = o.greeting()
    expect(state).to.equal(greeting)
    // chain.expose()
  })
})

// describe('objectAccessor', ()=> {
//   it('Declare Should be a function', ()=> {
//     expect(o).to.be.a('function')
//   })
// })