const empty = ''

const chainConfig = {
    mergeFidelity: 0,
    safeIntegers: false,  // todo
}

const pending = Symbol('pending')
const republish = Symbol('republish')


// Options start
const precision = 'moderate' // 'moderate' | 'high'
// const mergeFidelity
// const typeTransform
// Options end

const { isArray } = Array

const accumulator = []

const uniqueStateMap = new Map([
    ['null', null],
    ['boolean', null],
    ['number', []],
    ['string', []],
    ['plain-object', {
        cloned: [],
        serialized: []
    }],
    ['array', {
        cloned: [],
        serialized: []
    }],
    ['date', []],
    ['reguar-expression', []],
    ['map', []],
    ['set', []],            // Size warning to 256
    ['errors', []],
    ['bigint', []],
    ['pending', [pending]]
])

const evictionStateMap = new Map()
const overwriteSerializedIdentities = new Set()


const getTimestamp = precision === 'moderate' ? Date.now : performance.now


const isPlainObjectPartialCheck = value => {
    const proto = Object.getPrototypeOf(value)
    return proto === null || proto === Object.prototype
}


const areErrorsSimilar = (errorA, errorB) => (
    errorA.name === errorB.name &&
    errorA.message === errorB.message &&
    errorA.constructor === errorB.constructor
)

const areDatesSimilar = (dateA, dateB) => dateA.valueOf() === dateB.valueOf()

const areRegExpSimilar = (regexA, regexB) => regexA.source === regexB.source && regexA.flags === regexB.flags

const arePlainObjectsSimilar = (objA, objB) => {
    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
        if (objA[key] !== objB[key]) return false
    }
    return true
}

const areArraysSimilar = (arrA, arrB) => {
    if (arrA.length !== arrB.length) return false
    return arrA.every((value, i) => value === arrB[i])
}

const areMapsSimilar = (mapA, mapB) => {
    if (mapA.size !== mapB.size) return false

    for (let [key, val] of mapA) {
        if (!mapB.has(key) || mapB.get(key) !== val) return false
    }
    return true
}

const areSetsSimilar = (setA, setB) => {
    if (setA.size !== setB.size) return false

    for (let item of setA) {
        if (!setB.has(item)) return false
    }
    return true
}

let plainObjectDedupType = empty
let arrayDedupType = empty
const persistStateAndGetLocation = (state, options = {}) => {
    const stateType = typeof state
    const isEvict = options.mode === 'overwrite'

    let stateIndex
    let typeRegistryIndex
    let typeRegistry
    let typeRegistryName
    let isStateSerialized
    switch (stateType) {
        // Snapshot
        case 'boolean':
            // Booleans are stored int he stateIndex not the uniqueStateMap
            typeRegistryName = stateType
            stateIndex = +state
            break
        case 'number':
        case 'string':
        case 'bigint':
            typeRegistryName = stateType
            typeRegistry = uniqueStateMap.get(typeRegistryName)
            typeRegistryIndex = typeRegistry.indexOf(state)
            if (typeRegistryIndex > -1) {
                stateIndex = typeRegistryIndex
            } else {
                typeRegistry.push(state)
                stateIndex = typeRegistry.length - 1
            }
            break
        case 'object':
            // Date similarities
            if (state instanceof Date) {
                typeRegistryName = 'date'
                typeRegistry = uniqueStateMap.get(typeRegistryName)
                typeRegistryIndex = typeRegistry.findIndex(date => areDatesSimilar(date, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.length - 1
                }
                break
            }

            // Error similarities
            if (state instanceof Error) {
                typeRegistryName = 'error'
                typeRegistry = uniqueStateMap.get(typeRegistryName)
                typeRegistryIndex = typeRegistry.findIndex(error => areErrorsSimilar(error, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.length - 1
                }
                break
            }

            // RegExp similarities
            if (state instanceof RegExp) {
                typeRegistryName = 'regular-expression'
                typeRegistry = uniqueStateMap.get(typeRegistryName)
                typeRegistryIndex = typeRegistry.findIndex(regexp => areRegExpSimilar(regexp, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.length - 1
                }
                break
            }

            // Null comparison
            if (state === null) {
                typeRegistryName = 'null'
                stateIndex = 0
                break
            }

            // Plain Object similaities
            if (isPlainObjectPartialCheck(state)) {
                typeRegistryName = 'plain-object'
                typeRegistry = uniqueStateMap.get(typeRegistryName)

                if (options.serialize) {
                    if (plainObjectDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned objects only and cannot support serialized objects within this chain.`)
                        return [null, null]
                    }
                    plainObjectDedupType = 'serialized'
                    isStateSerialized = true
                    const stateSerialized = JSON.stringify(state)
                    typeRegistryIndex = typeRegistry.serialized.indexOf(stateSerialized)

                    if (typeRegistryIndex > -1) {
                        stateIndex = typeRegistryIndex
                    } else {
                        typeRegistry.serialized.push(
                            stateSerialized
                        )
                        stateIndex = typeRegistry.serialized.length - 1
                    }
                    break
                }
                if (plainObjectDedupType === 'serialized') {
                    console.error(`stateType ${stateType} supports serialized objects only and cannot support cloned objects within this chain.`)
                    return [null, null]
                }
                plainObjectDedupType = 'cloned'
                typeRegistryIndex = typeRegistry.cloned.findIndex(obj => arePlainObjectsSimilar(obj, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.cloned.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.cloned.length - 1
                }
                break
            }

            // Array similaities
            if (isArray(state)) {
                typeRegistryName = 'array'
                typeRegistry = uniqueStateMap.get(typeRegistryName)

                if (options.serialize) {
                    if (arrayDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned arrays only and cannot support serialized arrays within this chain.`)
                        return [null, null]
                    }
                    arrayDedupType = 'serialized'
                    isStateSerialized = true
                    const stateSerialized = JSON.stringify(state)
                    typeRegistryIndex = typeRegistry.serialized.indexOf(stateSerialized)
                    if (typeRegistryIndex > -1) {
                        stateIndex = typeRegistryIndex
                    } else {
                        typeRegistry.serialized.push(
                            stateSerialized
                        )
                        stateIndex = typeRegistry.serialized.length - 1
                    }
                    break
                }


                if (arrayDedupType === 'serialized') {
                    console.error(`stateType ${stateType} supports serialized arrays only and cannot support clond arrays within this chain.`)
                    return [null, null]
                }
                arrayDedupType = 'cloned'
                typeRegistryIndex = typeRegistry.cloned.findIndex(array => areArraysSimilar(array, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.cloned.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.cloned.length - 1
                }
                break
            }

            // Map similaities
            if (state instanceof Map) {
                typeRegistryName = 'map'
                typeRegistry = uniqueStateMap.get(typeRegistryName)

                typeRegistryIndex = typeRegistry.findIndex(map => areMapsSimilar(map, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.length - 1
                }
                break
            }

            // Set similaities
            if (state instanceof Set) {
                if (state.size >= 256) console.warn(`Set size for state exceeded beyond size 256`, state)

                typeRegistryName = 'set'
                typeRegistry = uniqueStateMap.get(typeRegistryName)
                typeRegistryIndex = typeRegistry.findIndex(map => areSetsSimilar(map, state))
                if (typeRegistryIndex > -1) {
                    stateIndex = typeRegistryIndex
                } else {
                    typeRegistry.push(
                        structuredClone(state)
                    )
                    stateIndex = typeRegistry.length - 1
                }
                break
            }

        // Symbol comparison
        case 'symbol':

            if (state === pending) {
                typeRegistryName = 'pending'
                typeRegistry = uniqueStateMap.get(typeRegistryName)
                stateIndex = 0
                break
            }
            if (state === republish) {
                // @@@ Incomplete: Get last uniqueStateRegistry type against stateName 
                // typeRegistryName = '????'
                // typeRegistry = uniqueStateMap.get(????)
                // stateIndex = typeRegistry.length - 1
                break
            }
    }


    return [typeRegistryName, stateIndex, isStateSerialized]

}

const getPersistentState = (identity) => {
    const frame = accumulator.findLast(frame => frame[identity])

    if (frame) {

        const { typeRegistryName, stateIndex, isStateSerialized } = frame[identity]
        // Boolean 
        if (typeRegistryName === 'boolean') return !!stateIndex

        const registry = uniqueStateMap.get(typeRegistryName)
        switch (typeRegistryName) {
            // String | Number | BigInt
            case 'string':
            case 'number':
            case 'bigint':
            case 'date':
            case 'error':
            case 'regular-expression':
                return registry[stateIndex]
            case 'null':
                return null
            case 'plain-object':
                if (isStateSerialized) {
                    return JSON.parse(registry.serialized[stateIndex])
                }
                return registry.cloned[stateIndex]
            case 'array':
                if (isStateSerialized) {
                    return JSON.parse(registry.serialized[stateIndex])
                }
                return registry.cloned[stateIndex]
            case 'map':
                return registry[stateIndex]
            case 'set':
                return registry[stateIndex]
            case 'pending':
                return pending
        }
    }
}


const readEvictionState = (identity) => {
    const isSerialized = overwriteSerializedIdentities.has(identity)
    const rawState = evictionStateMap.get(identity)
    return isSerialized ? JSON.parse(rawState) : rawState
}


const overwriteEvictionState = (identity, state, options = {}) => {
    const stateType = typeof state
    switch (stateType) {
        // Snapshot
        case 'boolean':
        case 'number':
        case 'string':
        case 'bigint':
            evictionStateMap.set(identity, state)
            break
        case 'object':
            // Null
            if (state === null) {
                evictionStateMap.set(identity, state)
                break
            }

            // Serialize Object | Array
            if (options.serialize && (isPlainObjectPartialCheck(state) || isArray(state))) {
                evictionStateMap.set(identity, JSON.stringify(state))
                overwriteSerializedIdentities.add(identity)
                break
            }


            // Array | Plain Object | Map | Set | Date | Error | RegExp
            if (
                isArray(state)
                || isPlainObjectPartialCheck(state)
                || state instanceof Map
                || state instanceof Set
                || state instanceof Date
                || state instanceof Error
                || state instanceof RegExp
            ) {
                evictionStateMap.set(identity, structuredClone(state))
                break
            }

        case 'symbol':
            // Pending 
            if (state === pending) {
                evictionStateMap.set(identity, pending)
                break
            }

            // Repending
            if (state === republish) {
                // Todo reaction last state of identity 
                break
            }
    }
}





const addState = (identity, state, options = {}) => {
    if (state === undefined) return console.error('state is undefined', state)
    if (identity === undefined) return console.error('identity is undefined', identity)
    if (options === undefined) return console.error('options is undefined', options)

    const mode = options.mode || 'overwrite'

    if (mode === 'overwrite') {
        overwriteEvictionState(identity, state, options)
        return
    }

    const currentTimestamp = getTimestamp()
    const mergeFidelity = chainConfig.mergeFidelity


    // Persist State
    if (mode === 'persist') {
        // Add state to registry
        const [typeRegistryName, stateIndex, isStateSerialized] = persistStateAndGetLocation(state, options)
        if (typeRegistryName === null) return

        const lastFrame = accumulator.at(-1)
        const lastFrameTimeStamp = lastFrame?.timestamp || 0
        // If within proximity merge. 
        const withinMergePeriod = lastFrameTimeStamp + mergeFidelity > currentTimestamp

        // Add state to accumulator
        if (lastFrame !== undefined && withinMergePeriod) {
            // merge to last frame writing over any existing state of the same identity.
            if (lastFrame[identity]) (delete lastFrame[identity])
            lastFrame[identity] = isStateSerialized ? { typeRegistryName, stateIndex, isStateSerialized } : { typeRegistryName, stateIndex }
        } else {
            // Add new frame.
            const frame = {}
            frame.timestamp = currentTimestamp
            frame[identity] = isStateSerialized ? {
                typeRegistryName,
                stateIndex,
                isStateSerialized
            } : {
                typeRegistryName,
                stateIndex
            }
            accumulator.push(frame)
        }
        return
    }
}



const dummyData = {
    users: [
        { id: 1, name: "John", age: 28, email: "john@example.com", active: true },
        { id: 2, name: "Jane", age: 34, email: "jane@example.com", active: false },
        { id: 3, name: "Mike", age: 22, email: "mike@example.com", active: true }
    ],
    products: [
        { id: 101, name: "Laptop", price: 999.99, stock: 50 },
        { id: 102, name: "Phone", price: 499.99, stock: 100 },
        { id: 103, name: "Tablet", price: 299.99, stock: 75 }
    ],
    orders: [
        { id: 1001, userId: 1, productId: 101, amount: 999.99, status: "Shipped" },
        { id: 1002, userId: 2, productId: 102, amount: 499.99, status: "Pending" },
        { id: 1003, userId: 3, productId: 103, amount: 299.99, status: "Delivered" }
    ]
}

const dummyArray = [
    { id: 1, name: "John", age: 28, email: "john@example.com", active: true },
    { id: 2, name: "Jane", age: 34, email: "jane@example.com", active: false },
    { id: 3, name: "Mike", age: 22, email: "mike@example.com", active: true },
    { id: 4, name: "Sara", age: 25, email: "sara@example.com", active: true },
    { id: 5, name: "David", age: 40, email: "david@example.com", active: false }
]


// addState('zap', 'hello world', { mode: 'overwrite' })
// addState('horse', 'Esp gerge', { mode: 'overwrite' })
// addState('meyow', 1e60, { mode: 'overwrite' })

// addState('apple', [1, 2, 3, 4], { mode: 'overwrite', serializeArray: true })
// addState('apple2', [1, 2, 3, 4], { mode: 'overwrite', serializeArray: false })
// addState('banana', { 1: 'hello', 2: 'world', 3: 'banana' }, { mode: 'overwrite', serializePlainObject: true })
// addState('banana2', { 1: 'hello', 2: 'world', 3: 'banana' }, { mode: 'overwrite', serializePlainObject: false })


// addState('test', { greeting: "hello", obj: { yo: 123, blob: new Blob() } }, { mode: 'persist', serializePlainObject: false })

addState('test', dummyData, { mode: 'overwrite', serialize: false })
// console.info('Overwrite registry', evictionStateMap)

addState('test2', dummyArray, { mode: 'overwrite', serialize: false })

// console.info('Persistent registry', uniqueStateMap)
// console.info('Persistent acc', accumulator)

// console.info('Get persistent state', getPersistentState('test'))

// console.info('Overwrite registry', evictionStateMap)
// console.info('Get persistent state', readEvictionState('test'))
// console.info('Get persistent state', readEvictionState('test2'))



export {
    addState
}





/*
# Inital chain
o.config({}) // Anywhere in the code once. 

o`images > trees > showBaobab`(false)

# Create new chain
o.createChain('menu')

o.menu`top-nav > help-drop-down`([])

*/