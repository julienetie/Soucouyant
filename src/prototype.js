const defaults = {
    storeUnique: true,
}


const store = {
    uniqueStore: null,
    config: {}
}

const uniqueStoreManager = {
    addItem: stateOrIndex => {

    },
    removeItem: stateOrIndex => {

    },
}


const primaryChain = {

}







const config = configuration => {
    store.config.storeUnique = Object.hasOwn(configuration, 'storeUnique') ? configuration.storeUnique : defaults.storeUnique
    store.config.uniqueStoreArrayType = Object.hasOwn(configuration, 'uniqueStoreArrayType') ? configuration.uniqueStoreArrayType : defaults.uniqueStoreArrayType
    store.config.uniqueStoreInitialLength = Object.hasOwn(configuration, 'uniqueStoreInitialLength') ? configuration.uniqueStoreInitialLength : defaults.uniqueStoreInitialLength
    store.config.uniqueStoreIncrementBy = Object.hasOwn(configuration, 'uniqueStoreIncrementBy') ? configuration.uniqueStoreIncrementBy : defaults.uniqueStoreIncrementBy
}



export {
    config
}