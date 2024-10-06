import o from './state-object.js'

const reservedWords = [
    'createChain'
]

// Create additional timeline chains
o.createChain = chainName => {
    if (reservedWords.includes(chainName)) return console
        .error(`Soucouyant: Cannot create chain as ${chainName} is a reserved word.`)

    o[chainName] = 'fake instance'
}


export { o }
