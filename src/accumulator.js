const empty = ''

const chainConfig = {
    mergeFidelity: 0
}

const pending = Symbol('pending')
const republish = Symbol('republish')

/*
- Structured State: Objects are parsed though the structuredClone algorithm
- Unstructued State: Objects are stored directly without being cloned
- Pruned State: string, number, null, symbol, boolean, JSON objects, JSON array, Date (string)
 */

// State is structured by default

/*
There is no branching of chains there is no child or parents
You can create multiple chains in a project and merge either into eachother.

You will get errors if you extend a chain to the wrong type of stateObject.
- Unstructured State: Can be extended with Unstructured, Structured or Pruned stateObjects
- Structured State: Can be extended with Structured or Pruned stateObjects.
- Pruned State: Can be extended with only other Pruned stateObjects.
 */

// Options start
const precision = 'moderate' // 'moderate' | 'high'
// const mergeFidelity
// const typeTransform
// Options end

const { isArray } = Array

const accumulator = [{}]

const uniqueStateMap = new Map([
    ['null', [null]],
    ['boolean', [true, false]],
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
    ['set', []],            // Size capped to 256
    ['errors', []],
    ['bigint', []],
    ['pending', [pending]],
    ['republish', []],
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
const addStateAndGetLocation = (state, options = {}) => {
    const serializePlainObject = options.serializePlainObject
    const serializeArray = options.serializeArray
    const stateType = typeof state

    let stateIndex
    let typeRegistryIndex
    let typeRegistry
    let typeRegistryName
    switch (stateType) {
        // Snapshot
        case 'boolean':
            typeRegistryName = stateType
            typeRegistry = uniqueStateMap.get(typeRegistryName)
            stateIndex = state ? 0 : 1
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
                console.log('serializePlainObject', serializePlainObject)
                if (serializePlainObject) {
                    if (plainObjectDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned objects only and cannot support serialized objects within this chain.`)
                        return [null, null]
                    }
                    plainObjectDedupType = 'serialized'
                    typeRegistryName += ':serialized'
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

                if (serializeArray) {
                    if (arrayDedupType === 'cloned') {
                        console.error(`stateType ${stateType} supports cloned arrays only and cannot support serialized arrays within this chain.`)
                        return [null, null]
                    }
                    arrayDedupType = 'serialized'
                    typeRegistryName += ':serialized'
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

    return [typeRegistryName, stateIndex]
}


const addState = (identity, options, state) => {
    if (state === undefined) return console.error('state is undefined', state)
    if (identity === undefined) return console.error('identity is undefined', identity)
    if (options === undefined) return console.error('options is undefined', options)


    const currentTimestamp = getTimestamp()
    const mergeFidelity = chainConfig.mergeFidelity

    // Add state to registry
    const [typeRegistryName, stateIndex] = addStateAndGetLocation(state, options)

    if (typeRegistryName === null) return

    const lastFrame = accumulator.at(-1)
    const lastFrameTimeStamp = lastFrame.timestamp || 0
    // If within proximity merge. 
    const withinMergePeriod = lastFrameTimeStamp + mergeFidelity > currentTimestamp

    // Add state to accumulator
    if (withinMergePeriod) {
        // merge to last frame writing over any existing state of the same identity.
        if (lastFrame[identity]) (delete lastFrame[identity])
        lastFrame[identity] = { typeRegistryName, stateIndex }
    } else {
        // Add new frame.
        const frame = {}
        frame.timestamp = currentTimestamp
        frame[identity] = {
            typeRegistryName,
            stateIndex
        }
        accumulator.push(frame)
    }
}

addState('apple', {}, 'hello world ')
addState('cars', { serializePlainObject: true }, 'how iz you ')
addState('banana', { serializePlainObject: true }, 'blue berriese')
addState('cars', { serializePlainObject: true }, 12424124)
addState('pear', { serializeArray: true }, ['~', NaN, false])

console.info('registry', uniqueStateMap)
console.info('acc', accumulator)

// export {
//     addState
// }
