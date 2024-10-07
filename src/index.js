import stateObjectPartial from './state-object.js'

// Create main chain
const o = stateObjectPartial('main')

// Create additional timeline chains
o.createChain = (chainName, config) => {
  o[chainName] = stateObjectPartial(chainName, config)
}

export { o }
