/*
    What is a chain?
    - evictionStatMap or accumulator

    - evictionStatMap
        - config
          - mergeFidelity
          - safeIntegers
          - serialize
        - evictionSerializedIdentities

    



*/

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

// const accumulator = []

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
const persistStateAndGetLocation = (config, internal, state) => {
    const stateType = typeof state

    let stateIndex
    let typeRegistryIndex
    let typeRegistry
    let typeRegistryName
    let isSerialized
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
                console.log('config', config)
                if (config.jsonObjects) {
                    console.log('yes')
                    if (internal.plainObjectDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned objects only and cannot support serialized objects within this chain.`)
                        return [null, null]
                    }
                    internal.plainObjectDedupType = 'serialized'
                    isSerialized = true
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
                if (internal.plainObjectDedupType === 'serialized') {
                    console.error(`stateType ${stateType} supports serialized objects only and cannot support cloned objects within this chain.`)
                    return [null, null]
                }
                internal.plainObjectDedupType = 'cloned'
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

                if (config.jsonArrays) {
                    if (internal.arrayDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned arrays only and cannot support serialized arrays within this chain.`)
                        return [null, null]
                    }
                    internal.arrayDedupType = 'serialized'
                    isSerialized = true
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


                if (internal.arrayDedupType === 'serialized') {
                    console.error(`stateType ${stateType} supports serialized arrays only and cannot support clond arrays within this chain.`)
                    return [null, null]
                }
                internal.arrayDedupType = 'cloned'
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


    return [typeRegistryName, stateIndex, isSerialized]

}

const getPersistentState = (
    config,
    accumulator,
    identity
) => {
    const frame = accumulator.findLast(frame => frame[identity])

    if (frame) {

        const { typeRegistryName, stateIndex, isSerialized } = frame[identity]
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
                if (isSerialized) {
                    return JSON.parse(registry.serialized[stateIndex])
                }
                return registry.cloned[stateIndex]
            case 'array':
                if (isSerialized) {
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


const readEvictionState = (
    config,
    evictionStateMap,
    evictionSerializedIdentities,
    identity
) => {
    const isSerialized = evictionSerializedIdentities.has(identity)
    const rawState = evictionStateMap.get(identity)
    return isSerialized ? JSON.parse(rawState) : rawState
}


const overwriteEvictionState = (
    evictionStateMap,
    evictionSerializedIdentities,
    config,
    identity,
    state
) => {
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
            if ((config.jsonArrays && isArray(state)) || (config.jsonObjects && isPlainObjectPartialCheck(state))) {
                evictionStateMap.set(identity, JSON.stringify(state))
                evictionSerializedIdentities.add(identity)
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





// const setState = (identity, state, options = {}) => {
const setState = (
    config,
    internal,
    accumulator,
    evictionStateMap,
    evictionSerializedIdentities,
    identity,
    state
) => {
    if (state === undefined) return console.error('state is undefined', state)
    if (identity === undefined) return console.error('identity is undefined', identity)

    const currentTimestamp = getTimestamp()
    const { mode, mergeFidelity } = config

    if (mode === 'volitile') {
        overwriteEvictionState(
            accumulator,
            config,
            identity,
            state
        )
        return
    }

    // Persist State
    if (mode === 'persist') {
        // Add state to registry
        const [typeRegistryName, stateIndex, isSerialized] = persistStateAndGetLocation(config, internal, state)

        // Null is not persisted,it's alrady unique.
        if (typeRegistryName === null) return

        const lastFrame = accumulator.at(-1)
        const lastFrameTimeStamp = lastFrame?.timestamp || 0

        // If within proximity merge. 
        const withinMergePeriod = lastFrameTimeStamp + mergeFidelity > currentTimestamp

        // Add state to accumulator
        if (lastFrame !== undefined && withinMergePeriod) {
            // merge to last frame writing over any existing state of the same identity.
            if (lastFrame[identity]) (delete lastFrame[identity])
            lastFrame[identity] = isSerialized ? { typeRegistryName, stateIndex, isSerialized } : { typeRegistryName, stateIndex }
        } else {
            // Add new frame.
            const frame = {}
            frame.timestamp = currentTimestamp
            frame[identity] = isSerialized ? {
                typeRegistryName,
                stateIndex,
                isSerialized
            } : {
                typeRegistryName,
                stateIndex
            }
            accumulator.push(frame)
        }
        return
    }
}


const getState = (
    config,
    internal,
    accumulator,
    evictionStateMap,
    evictionSerializedIdentities,
    identity
) => {
    if (config.mode === 'volitile') {
        return readEvictionState(
            config,
            evictionStateMap,
            evictionSerializedIdentities,
            identity
        )

    }

    if (config.mode === 'persist') {
        return getPersistentState(
            config,
            accumulator,
            identity
        )
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


// setState('zap', 'hello world', { mode: 'overwrite' })
// setState('horse', 'Esp gerge', { mode: 'overwrite' })
// setState('meyow', 1e60, { mode: 'overwrite' })

// setState('apple', [1, 2, 3, 4], { mode: 'overwrite', serializeArray: true })
// setState('apple2', [1, 2, 3, 4], { mode: 'overwrite', serializeArray: false })
// setState('banana', { 1: 'hello', 2: 'world', 3: 'banana' }, { mode: 'overwrite', serializePlainObject: true })
// setState('banana2', { 1: 'hello', 2: 'world', 3: 'banana' }, { mode: 'overwrite', serializePlainObject: false })


// setState('test', { greeting: "hello", obj: { yo: 123, blob: new Blob() } }, { mode: 'persist', serializePlainObject: false })

// setState('test', dummyData, { mode: 'overwrite', serialize: false })
// // console.info('Overwrite registry', evictionStateMap)

// setState('test2', dummyArray, { mode: 'overwrite', serialize: false })

// console.info('Persistent registry', uniqueStateMap)
// console.info('Persistent acc', accumulator)

// console.info('Get persistent state', getPersistentState('test'))

// console.info('Overwrite registry', evictionStateMap)
// console.info('Get persistent state', readEvictionState('test'))
// console.info('Get persistent state', readEvictionState('test2'))

const isBrowser = () => {
    const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined'
    const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null
    const isDeno = typeof Deno !== 'undefined'
    const isBun = typeof Bun !== 'undefined'

    return isBrowser && !(isNode || isDeno || isBun)
}

/*
    const config = {
        mode: 'persist' | 'volatile'                            - Default is volatile
        serialize: 'array' | 'object' | 'array | object'        - Default is empty 
        mergeFidelity: <number>                                 - Default is 0
        integerSaturation: boolean                                  - Dfault is false
        namespaceDepth:  0...Infinity                           - Limit of namespace length
        invocation:    'setTimeout0' | 'queueMicrotask' | 'requestIdleCallback' | 'requestAnimationFrame' | 'sync'   - Default is requestAnimationFrame for browsers and queueMicrotask for backend runtimes.
    }
*/
const defaultChainConfig = {
    mode: 'volatile',
    jsonObjects: false,
    jsonArrays: false,
    mergeFidelity: 0,
    integerSaturation: true,
    namespaceDepth: 4,
    invocation: isBrowser ? globalThis?.requestAnimationFrame : queueMicrotask,
}

var a // to delete
var b // to delete
var c // to delete
const chainFactory = (userConfig = {}, chainName) => {
    const config = Object.assign({}, defaultChainConfig, userConfig)
    const internal = { chainName }
    const accumulator = []
    const evictionStateMap = new Map()
    const evictionSerializedIdentities = new Set()
    a = accumulator // to delete
    b = evictionStateMap // to delete
    c = evictionSerializedIdentities // to delete
    return {
        setState: (identity, state) => setState(
            config,
            internal,
            accumulator,
            evictionStateMap,
            evictionSerializedIdentities,
            identity,
            state
        ),
        getState: identity => getState(
            config,
            internal,
            accumulator,
            evictionStateMap,
            evictionSerializedIdentities,
            identity
        ),
    }
}


const chainA = chainFactory({ mode: 'persist', jsonObjects: false, jsonArrays: true })
// console.log('uniqueStateMap', uniqueStateMap)
// console.log('acc', a)
chainA.setState('score', dummyArray)
// chainA.setState('score', 'no way')
console.log(
    chainA.getState('score')
)
// chainA.setState('score', dummyData)


// export {
//     setState
// }
// const chainB = chainFactory({ mode: 'persist', jsonObjects: true })

// chainB.setState('score', dummyData)

// console.log('uniqueStateMap', uniqueStateMap)
// console.log('a', a)
// console.log('b', b)
// console.log('c', c)
/*
# Inital chain
o.config({}) // Anywhere in the code once. 

o`images > trees > showBaobab`(false)

# Create new chain
o.createChain('menu')

o.menu`top-nav > help-drop-down`([])

*/