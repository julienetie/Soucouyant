import { o, pending } from '../src/index.js'

// Counter
o`cat1 > cat2 > counter`(0)

const varyCounter = amount => o.cat1.cat2.counter(state => state + amount)

const result1 = varyCounter(1)
const result2 = varyCounter(-1)

console.log('result1:', result1)                                                             
console.log('result2:', result2)                                                              

// No Category
o`color`()

// console.log('o.color', o.color)
// console.log('o.color', o.color(s => s))
console.log('o.color', o.color())
// console.log('o.color', o.color('yellow'))
// console.log('o.color', o.color(pending))


o`accounts > numbers > bigInt`(123n)

const bigInt = o.accounts.numbers.bigInt() 

console.log('bigInt', typeof bigInt)