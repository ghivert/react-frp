import React, { useState, useContext } from 'react'

const StoreContext = React.createContext()

const Provider = ({ store, children }) => {
  const [state, setState] = useState(0)
  store.addEventListener('updated', event => setState(state + 1))
  return (
    <StoreContext.Provider value={{ state, store }}>
      {children}
    </StoreContext.Provider>
  )
}

const useStore = () => {
  const { store } = useContext(StoreContext)
  return store
}

const runAction = (store, eventName, payload) => {
  const action = store.actions[eventName]
  const stateAction = store.stateActions[eventName]
  if (action && action instanceof Function) {
    return action(store.state, payload)
  } else if (stateAction && stateAction instanceof Function) {
    return { state: stateAction(store.state, payload) }
  } else {
    throw new Error(`${eventName} is not an action`)
  }
}

class Store extends EventTarget {
  constructor(value, actions = {}, stateActions = {}) {
    super()
    this.state = value
    this.actions = actions
    this.stateActions = stateActions
  }

  dispatch = (eventName, payload) => {
    const response = runAction(this, eventName, payload)
    if (response) {
      const { state, effects } = response
      if (state) {
        this.state = state
        this.dispatchEvent(new Event('updated'))
      }
      if (effects) {
        if (effects instanceof Array) {
          effects.map(effect => effect(this))
        } else {
          effects(this)
        }
      }
    }
  }
}

export { Provider, useStore, Store }
