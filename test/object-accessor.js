// test.js (Deno 2.0 setup)
import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.220.0/assert/mod.ts'
import { o, pending, empty } from '../src/index.js'

Deno.test('o - Should be a function with expected properties', () => {
  assertInstanceOf(o, Function) // Check if o is a function
  assertInstanceOf(o.createChain, Function) // Check if o is a function
  assertEquals(o.chain.name, 'main')
})
Deno.test('o.`stateObject` - should return undefined for malformed namespaces', () => {
  // Cannot use an empty string
  o``
  o`_stateObject`
  o`StateObject`

  const noNamespace = o['']
  const firstCharUnderscore = o._stateObject
  const firstCharUppercase = o.StateObject

  // Cannot use an empty string
  assertEquals(noNamespace, undefined)

  // The address of the main chain cannot begin with an underscore
  assertEquals(firstCharUnderscore, undefined)

  // The address of the main chain cannot begin with an upper-case letter
  assertEquals(firstCharUppercase, undefined)
})

Deno.test('o.`stateObject()` - should set the undefined created default state to pending', () => {
  o`stateObject`()
  const noArg = o.stateObject()

  assertEquals(noArg, pending)
})

Deno.test('o.`stateObject()` - should return test', () => {
  o`shouldReturnNull`(null)

  assertEquals(o.shouldReturnNull(), null) // Check if stateObject returns o
})
/* Deno.test('o.stateObject` - should be a function', () => {
  const stateObject = o.stateObject
  assertInstanceOf(stateObject, Function) // Check if stateObject is a function
})
Deno.test('o.stateObject()` - should get the last state `pending`', () => {
  const state = o.stateObject()
  assertEquals(state.toString(), pending.toString()) // Check if state equals 'pending'
})
Deno.test('o.stateObject(undefined)` - should get the last state', () => {
  const state = o.stateObject(undefined)
  assertEquals(state.toString(), pending.toString()) // Check if state equals 'pending'
})
Deno.test('o.stateObject(undefined)` - should set and return "red"', () => {
  const state = o.stateObject('red')
  assertEquals(state, 'red') // Check if state is set to 'red'
})
Deno.test('o.stateObject()` - should get "red"', () => {
  const state = o.stateObject()
  assertEquals(state, 'red') // Check if state equals 'red'
})
Deno.test('o`cat1 > stateObject` - should return a function', () => {
  assertInstanceOf(o`cat1 > stateObject`, Function) // Check if cat1 > stateObject is a function
})
Deno.test('o`cat1 > stateObject()` - should return o', () => {
  assertEquals(o`cat1 > stateObject`(), o) // Check if cat1 > stateObject() returns o
})
Deno.test('o.cat1.stateObject` - should be a function', () => {
  assertInstanceOf(o.cat1.stateObject, Function) // Check if o.cat1.stateObject is a function
})
Deno.test('o.cat1.stateObject` - should set and return `12345n`', () => {
  const state = o.cat1.stateObject(12345n)
  assertEquals(state, 12345n) // Check if state is set to 12345n
})
Deno.test('o.cat1.stateObject` - should get `12345n`', () => {
  const state = o.cat1.stateObject()
  assertEquals(state, 12345n) // Check if state equals 12345n
}) */
