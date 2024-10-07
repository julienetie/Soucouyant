
// import { addNewState, getCurrentState } from './accumulator.js';
import { chainFactory } from './accumulator.js';
import cache from './cache.js';


const startsWithUppercase = string => /^[A-Z]/.test(string)

/** 
 * @param {*} state
 * @param {number} identity - the unique state subscription identifier
 */
const stateMachine = (chain, identity, state) => {

    const stateModifier = callback => {
        const lastState = state === null ? chain.getState(identity) : state
        const newState = callback(lastState)

        // We only update state if return is undefined.
        if (newState !== undefined) {
            chain.setState(identity, newState)
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

const reservedWords = [
    'createChain',
    'config'
]

let hasMain = 0
/** 
 * State object is a side effect represented by the "o" letter.
 * It takes a namespace address separeated by forward arrows and 
 * an inital state.
 *
 * @param {string} address - The namespace address of the state object.
 * @param {*} state - The value of the state.
 * @returns {Function} StateObject.
 */
const stateObjectPartial = (chainName, config = {}) => {
    if (hasMain === 0 && chainName === 'main') {
        hasMain++
    } else {
        if (chainName === 'main' || chainName === 'Main') return console.error(`There can only be one main chain`)

        if (reservedWords.includes(chainName)) return console
            .error(`Soucouyant: Cannot create chain as ${chainName} is a reserved word.`)

        if (!(chainName.startsWith('_') || startsWithUppercase(chainName))) return console
            .error(`Soucouyant: ${chainName} is invalid. chianName should begin with an _ or capital letter.`)
    }
    // Identity ensures that each 
    // state has a unique key for the: 
    // cacne.subscriptions[identity]
    // as an object.
    // That object then stores references for each
    // subscription. See above.
    let identity = -1;
    /** 
     * 
     * @param {Array} addressParts - Namespaces separated by > 
     * @param {number} count - 0.
     * @param {*} state
     * @param {number} length - Number of namespaces.
     * @param {boolean} isCollection - false.
     * @param {*} nextPart - null.
     */
    const createAddress = (chain, addressParts, count, state, length, isCollection, nextPart) => {
        const newPart = (addressParts[count] + '').trim();
        if (nextPart === null) {
            // Creates the next property as an object.
            // And assigns the nextPart as that property to 
            // recycle into it's self to add additional levels.
            // Once!
            if (stateObject[newPart] === undefined) {
                nextPart = stateObject[newPart] = {};
            } else {
                nextPart = stateObject[newPart];
            }
        } else {
            // Creates the next property as an object.
            // And assigns the nextPart as that property to 
            // recycle into it's self to add additional levels.
            // beyond the first (I think)
            const isEndOfPath = count === length - 1;
            if (nextPart[newPart] === undefined) {
                identity++
                const machine = isEndOfPath ? isCollection ? state : stateMachine(chain, identity, state) : {};
                nextPart = nextPart[newPart] = machine // Creates the next property as an object.
                if (isEndOfPath) return

            } else {
                nextPart = nextPart[newPart];
                if (isEndOfPath) {
                    return;
                }
            }
        }
        count++;
        createAddress(chain, addressParts, count, state, length, isCollection, nextPart);
    }

    const stateObject = (address, state) => {
        const addressParts = address[0].split('>')
        const addressPartsLength = addressParts.length
        const chain = chainFactory(chainName, config)
        createAddress(
            chain,
            addressParts,
            0,
            state,
            addressPartsLength,
            false,
            null,
            stateObject
        )
        return stateObject
    }
    return stateObject
}

export default stateObjectPartial