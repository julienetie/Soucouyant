const isTesting = globalThis.process.env.NODE_ENV === 'test'

const pending = Symbol('Pending')



const cache = {
    subscriptions: {},
    suspend: {},
}


/** 
 Accumilates frames.

**/
const accumilator = [
    []
];
const uniqueStateReferences = [];

const persistence = {
    options: {
        mergeFidelity: 0,
    }
};

const cloneObject = (value, allowSingleFunction) => {
    if (typeof value === 'function') {
        if (!allowSingleFunction) {
            throw Error('Cannot copy \'[object Function]\' as \'allowSingleFunction\' is not enabled.');
        }
        return new Function('return ' + value.toString())();
    }
    if (value === undefined) {
        return value;
    }
    if (Object.is(value, NaN)) {
        return value;
    }
    if (typeof value !== 'object') {
        return value;
    }
    const toParse = Array.isArray(value) ? value
        : Object.keys(value).sort().reduce((acc, key) => {
            acc[key] = value[key];
            return acc;
        }, {});

    return JSON.parse(JSON.stringify(toParse));
}

// Update settings.
const persistenceSettings = options => Object.assign(persistence.options, options);


// Adds a new state to the accumilator 
// May create a new frame to do so.
const addNewState = (state, identity) => {
    const currentTimeStamp = Date.now();
    const mergeFidelity = persistence.options.mergeFidelity;
    // Check unique states and add the state if does not yet exist.
    // Directly reference the existing state.
    const clonedState = cloneObject(state);
    const stateAsString = JSON.stringify(clonedState);
    const uniqueStateReferencesLength = uniqueStateReferences.length;

    let stateExist = false;
    let directReference;
    for (let i = 0; i < uniqueStateReferencesLength; i++) {
        const uniqueState = uniqueStateReferences[i];
        const hasExistingState = JSON
            .stringify(uniqueState) === stateAsString;
        if (hasExistingState) {
            directReference = uniqueState;
            stateExist = true;
            break;
        }
    }

    if (stateExist === false) {
        uniqueStateReferences.push(clonedState);
        directReference = clonedState;
    }

    // Find frame by timestamp
    const accumilatorLength = accumilator.length;
    const lastFrame = accumilator[accumilatorLength - 1];
    const lastFrameTimeStamp = lastFrame[0];

    // If within proximity merge. 
    const withinMergePeriod = lastFrameTimeStamp + mergeFidelity > currentTimeStamp;
    if (withinMergePeriod) {
        // merge to last frame
        lastFrame.push([identity, directReference]);
    } else {
        // Add new frame.
        accumilator.push([
            currentTimeStamp, [
                identity,
                directReference
            ]
        ]);
    }

    // console.log('cache',cache)
    const subscriptions = cache.subscriptions;
    // Execute subscriptions
    if (subscriptions[identity] === undefined) {
        subscriptions[identity] = {};
    }
    const subIdentity = subscriptions[identity];
    const subIdentityLength = Object.keys(subIdentity).length;

    for (let ref in subIdentity) {
        subIdentity[ref](directReference, identity, currentTimeStamp);
    }

    // console.log('accumilator', JSON.stringify(accumilator, null, '\t'));
}

const getCurrentState = (identity) => {
    const accumilatorLength = accumilator.length;
    for (let i = accumilatorLength; i > -1; --i) {
        const frame = accumilator[i] || [];
        const frameLength = frame.length;
        for (let j = 0; j < frameLength; j++) {
            if (frame[j][0] === identity) {
                return frame[j][1];
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
        const lastState = state === null ? getCurrentState(identity) : state;
        const newState = callback(lastState);

        // We only update state if return is undefined.
        if (newState !== undefined) {
            addNewState(newState, identity);
            if (state !== null) {
                state = null;
            }
        }
        return newState;
    }
    /** 
     * subscribe method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
    stateModifier.subscribe = (ref, callback) => {
        if (cache.subscriptions[identity] === undefined) {
            cache.subscriptions[identity] = {};
            cache.suspend[identity] = {};
        }
        if (cache.subscriptions[identity][ref] === undefined) {
            cache.suspend[identity][ref] = false;
            cache.subscriptions[identity][ref] = (...parameters) => {
                if (!cache.suspend[identity][ref]) {
                    callback(...parameters);
                }
            };
        } else {
            console.error(`The subscriptions reference ${ref} is already in use for identity ${identity}`);
        }
    }

    /** 
     * suspend method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
    stateModifier.suspend = ref => {
        cache.suspend[identity][ref] = true;
    }

    /** 
     * suspend method.
     * @param {string} ref - subscription reference.
     * @param {Function} callback - On subscribe callback
     */
    stateModifier.unsubscribe = ref => {
        delete cache.subscriptions[identity][ref];
    }

    return stateModifier;
}


let identity = -1;
/** 
 * @param {Array} addressParts - Namespaces separated by > 
 * @param {number} count - 0.
 * @param {*} state
 * @param {number} length - Number of namespaces.
 * @param {boolean} isCollection - false.
 * @param {*} nextPart - null.
 */
const createAddress = (addressParts, count, state, length, isCollection, nextPart) => {
    const newPart = (addressParts[count] + '').trim();
    if (nextPart === null) {
        // Creates the next property as an object.
        // And assigns the nextPart as that property to 
        // recycle into it's self to add additional levels.
        // Once!
        if (o[newPart] === undefined) {
            nextPart = o[newPart] = {};
        } else {
            nextPart = o[newPart];
        }
    } else {
        // Creates the next property as an object.
        // And assigns the nextPart as that property to 
        // recycle into it's self to add additional levels.
        // beyond the first (I think)
        const isEndOfPath = count === length - 1;
        if (nextPart[newPart] === undefined) {
            identity++;
            const machine = isEndOfPath ? isCollection ? state : stateMachine(state, identity) : {};
            nextPart = nextPart[newPart] = machine; // Creates the next property as an object.
            if (isEndOfPath) {
                return;
            }
        } else {
            nextPart = nextPart[newPart];
            if (isEndOfPath) {
                // @testing
                if(isTesting) {
                    return {
                        newPart,
                        nextPart,
                        identity,
                        count
                    }
                }
                return
            }
        }
    }
    count++;
    createAddress(addressParts, count, state, length, isCollection, nextPart);
}

/** 
 * State object is a side effect represented by the "o" letter.
 * It takes a namespace address separeated by forward arrows and 
 * an inital state.
 *
 * @param {string} address - The namespace address of the state object.
 * @param {*} state - The value of the state.
 * @returns {Function} o.
 */
const o = (address) => {
    const addressParts = address[0].split('>');
    const addressPartsLength = addressParts.length;

    return (state = pending) => {
        createAddress(
            addressParts,
            0,
            state,
            addressPartsLength,
            false,
            null
        )
        return o
    }
}


// Internal test imports
const __internal = isTesting ? {
    createAddress
} : undefined

if (isTesting) console.info('[[[[[[ NODE_ENV TESTING ]]]]]]')

export {
    o,
    pending,
    __internal
}
