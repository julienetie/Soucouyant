let initOnce = true
let setConfigOnce = true
let lastUniqueStoreIndex = -1
const defaults = {
    storeUnique: true,
    uniqueStoreInitialLength: 10_000
}


const store = {
    uniqueStore: null, //
    uniqueRegister: null, // Array
    primaryChain: null,
    config: {},
}

const uniqueStoreManager = {
    init() {
        // Create unique store
        store.uniqueStore = Array(store.config.uniqueStoreInitialLength)
        store.uniqueRegister = new Uint32Array(store.config.uniqueStoreInitialLength)

        // switch (store.config.uniqueStoreArrayType) {
        //     // Create unique store
        //     case 'sparse':

        //         break
        //     // Create dynamic unique store
        //     case 'dynamic':
        //         store.uniqueStore = Array(store.config.uniqueStoreInitialLength)
        //         break
        // }

    },
    addItem: (state, index) => {
        if (state !== null) {
            lastUniqueStoreIndex++
            const stateIndex = store.uniqueStore.indexOf(state)

            // No existing state found
            if (stateIndex === -1) {
                store.uniqueStore[lastUniqueStoreIndex] = state
                store.uniqueRegister[lastUniqueStoreIndex] = 1
                console.log('store.uniqueStore', store.uniqueStore)
                console.log('store.uniqueRegister', store.uniqueRegister)
                return lastUniqueStoreIndex
            } else {
                // Existing state found
                store.uniqueRegister[stateIndex]++
                console.log('> store.uniqueStore', store.uniqueStore)
                console.log('> store.uniqueRegister', store.uniqueRegister)
                return stateIndex
            }
        }
    },
    removeItem: stateOrIndex => {

    },
}


const primaryChain = {

}







const config = (configuration = {}) => {
    if (setConfigOnce) {
        setConfigOnce = false
    }
    store.config.storeUnique = Object.hasOwn(configuration, 'storeUnique') ? configuration.storeUnique : defaults.storeUnique
    store.config.uniqueStoreArrayType = Object.hasOwn(configuration, 'uniqueStoreArrayType') ? configuration.uniqueStoreArrayType : defaults.uniqueStoreArrayType
    store.config.uniqueStoreInitialLength = Object.hasOwn(configuration, 'uniqueStoreInitialLength') ? configuration.uniqueStoreInitialLength : defaults.uniqueStoreInitialLength
    store.config.uniqueStoreIncrementBy = Object.hasOwn(configuration, 'uniqueStoreIncrementBy') ? configuration.uniqueStoreIncrementBy : defaults.uniqueStoreIncrementBy
    store.config.uniqueStoreBitSize
}

const o = () => {
    if (initOnce) {
        initOnce = false
        config()
    }

    uniqueStoreManager.init()
}

export {
    config,
    o,
    uniqueStoreManager
}