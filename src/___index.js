/*

addNewState

- uniqueStoreManager()
  - uniqueStore: Array
  - uniqueRegister: Array

  .addItem(state or index)
    - Looks for index of existing match in uniqueStore / Uses provided index
    - IF Match
      - Get Index, increment value by 1 at index on uniqueRegister
      - Return index
    - ELSE
      - Add 1 to end of uniqueRegisger
      - Add state to end of uniqueStore
      - Return index

  .removeItem(state or index)
    - Looks for index of existing match in uniqueStore / Use provided index
    - IF Match
      - Subtract 1 from number in index for uniqueRegister
      - If value === 0, replace the value with null
    - Else
      - Do nothing, return null

      Settings:
      - storeUnique: true | false            Uses an alternative store called: nonUniqueStoreManager
      - arrayType: 'sparse' | 'dynamic'
      - initialLength: 10_000 | null
   .  - increment: 10_000 | null

primaryChain: The main timeline

      Settings:
      - persist: true | false
      - arrayType: 'sparse' | 'dynamic'
      - initialLength: 10_000 | null
   .  - increment: 10_000 | null
      - mergeFidelity: 200 | null

        chain.purge()
        chain.trailLimit()
        chain.autoLimitTail()
        chain.tailSliceSize()
        chain.requestTailSlice()
        chain.expose()
        chain.validate()
        chain.find()
        chian.buffer()

      head:
      .meta()
      .seek()
      .ignoreFrame()

 */

const isTesting = globalThis.process.env.NODE_ENV === 'test'

const pending = Symbol('Pending')

const cache = {
  subscriptions: {},
  suspend: {}
}

/**
 Accumilates frames.

**/
const primaryChain = [
  []
]
const uniqueStore = []

const persistence = {
  options: {
    mergeFidelity: 0
  }
}

const cloneObject = (value, allowSingleFunction) => {
  if (typeof value === 'function') {
    if (!allowSingleFunction) {
      throw Error('Cannot copy \'[object Function]\' as \'allowSingleFunction\' is not enabled.')
    }
    return new Function('return ' + value.toString())()
  }
  if (value === undefined) {
    return value
  }
  if (Object.is(value, NaN)) {
    return value
  }
  if (typeof value !== 'object') {
    return value
  }
  const toParse = Array.isArray(value)
    ? value
    : Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = value[key]
      return acc
    }, {})

  return JSON.parse(JSON.stringify(toParse))
}

// Update settings.
const persistenceSettings = options => Object.assign(persistence.options, options)

// Adds a new state to the primaryChain
// May create a new frame to do so.
const addNewState = (state, identity) => {
  const currentTimeStamp = Date.now()
  const mergeFidelity = persistence.options.mergeFidelity
  // Check unique states and add the state if does not yet exist.
  // Directly reference the existing state.
  const clonedState = cloneObject(state)
  const stateAsString = JSON.stringify(clonedState)
  const uniqueStateReferencesLength = uniqueStore.length

  let stateExist = false
  let directReference
  for (let i = 0; i < uniqueStateReferencesLength; i++) {
    const uniqueState = uniqueStore[i]
    const hasExistingState = JSON
      .stringify(uniqueState) === stateAsString
    if (hasExistingState) {
      directReference = uniqueState
      stateExist = true
      break
    }
  }

  if (stateExist === false) {
    uniqueStore.push(clonedState)
    directReference = clonedState
  }

  // Find frame by timestamp
  const accumilatorLength = primaryChain.length
  const lastFrame = primaryChain[accumilatorLength - 1]
  const lastFrameTimeStamp = lastFrame[0]

  // If within proximity merge.
  const withinMergePeriod = lastFrameTimeStamp + mergeFidelity > currentTimeStamp
  if (withinMergePeriod) {
    // merge to last frame
    lastFrame.push([identity, directReference])
  } else {
    // Add new frame.
    primaryChain.push([
      currentTimeStamp, [
        identity,
        directReference
      ]
    ])
  }

  const subscriptions = cache.subscriptions
  // Execute subscriptions
  if (subscriptions[identity] === undefined) {
    subscriptions[identity] = {}
  }
  const subIdentity = subscriptions[identity]
  const subIdentityLength = Object.keys(subIdentity).length

  for (const ref in subIdentity) {
    subIdentity[ref](directReference, identity, currentTimeStamp)
  }
}

const getCurrentState = (identity) => {
  const accumilatorLength = primaryChain.length
  for (let i = accumilatorLength; i > -1; --i) {
    const frame = primaryChain[i] || []
    const frameLength = frame.length
    for (let j = 0; j < frameLength; j++) {
      if (frame[j][0] === identity) {
        return frame[j][1]
      }
    }
  }
}

/**
 * @param {*} state
 * @param {number} identity - the unique state subscription identifier
 */
const stateMachine = (state, identity) => {
  const stateModifier = callback => {
    const lastState = state === null ? getCurrentState(identity) : state

    switch (typeof callback) {
      case 'function':
        const newState = callback(lastState)

        // We only update state if return is undefined.
        if (newState !== undefined) {
          addNewState(newState, identity)
          if (state !== null) {
            state = null
          }
        }
        return newState
      case 'undefined':
        return lastState
      default:
        addNewState(callback, identity)
        if (state !== null) {
          state = null
        }
        return callback
    }
  }
  /**
     * subscribe method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
  stateModifier.subscribe = (ref, callback) => {
    if (cache.subscriptions[identity] === undefined) {
      cache.subscriptions[identity] = {}
      cache.suspend[identity] = {}
    }
    if (cache.subscriptions[identity][ref] === undefined) {
      cache.suspend[identity][ref] = false
      cache.subscriptions[identity][ref] = (...parameters) => {
        if (!cache.suspend[identity][ref]) {
          callback(...parameters)
        }
      }
    } else {
      console.error(`The subscriptions reference ${ref} is already in use for identity ${identity}`)
    }
  }

  /**
     * suspend method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
  stateModifier.suspend = ref => {
    cache.suspend[identity][ref] = true
  }

  /**
     * suspend method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
  stateModifier.unsubscribe = ref => {
    delete cache.subscriptions[identity][ref]
  }

  return stateModifier
}

let identity = -1
/**
 * @param {Array} addressParts - Namespaces separated by >
 * @param {number} count - 0.
 * @param {*} state
 * @param {number} length - Number of namespaces.
 * @param {boolean} isCollection - false.
 * @param {*} nextPart - null.
 */
const createAddress = (addressParts, count, state, length, isCollection, nextPart) => {
  const newPart = (addressParts[count] + '').trim()

  if (length === 1) {
    objectAccessor[newPart] = stateMachine(state, identity)
    return
  }

  if (nextPart === null) {
    // Creates the next property as an object.
    // And assigns the nextPart as that property to
    // recycle into it's self to add additional levels.
    // Once!
    if (objectAccessor[newPart] === undefined) {
      nextPart = objectAccessor[newPart] = {}
    } else {
      nextPart = objectAccessor[newPart]
    }
  } else {
    // Creates the next property as an object.
    // And assigns the nextPart as that property to
    // recycle into it's self to add additional levels.
    // beyond the first (I think)
    const isEndOfPath = count === length - 1
    if (nextPart[newPart] === undefined) {
      identity++
      const machine = isEndOfPath ? isCollection ? state : stateMachine(state, identity) : {}
      nextPart = nextPart[newPart] = machine // Creates the next property as an object.
      if (isEndOfPath) {
        return
      }
    } else {
      nextPart = nextPart[newPart]
      if (isEndOfPath) {
        return
      }
    }
  }
  count++
  createAddress(addressParts, count, state, length, isCollection, nextPart)
}

/**
 * State object is a side effect represented by the "objectAccessor" letter.
 * It takes a namespace address separeated by forward arrows and
 * an inital state.
 *
 * @param {string} address - The namespace address of the state object.
 * @param {*} state - The value of the state.
 * @returns {Function} objectAccessor.
 */
const objectAccessor = (address) => {
  const addressParts = address[0].split('>')
  const addressPartsLength = addressParts.length

  return (state = pending) => {
    createAddress(
      addressParts,
      0,
      state,
      addressPartsLength,
      false,
      null
    )
    return objectAccessor
  }
}

// Internal test imports
const __internal = isTesting
  ? {
      createAddress
    }
  : undefined

if (isTesting) console.info('[[[[[[ NODE_ENV TESTING ]]]]]]')

const o = objectAccessor
export {
  o,
  pending,
  __internal
}
