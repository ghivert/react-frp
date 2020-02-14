import React, { useState, useContext } from 'react'
import { Effect } from './effect'

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

const lookForEvent = (actions, eventsParts) => {
  if (eventsParts.length === 0) {
    return null
  } else {
    const [name, ...names] = eventsParts
    const action = actions[name]
    if (!action) {
      return null
    } else {
      if (names.length === 0 && action instanceof Function) {
        return action
      } else {
        return lookForEvent(action, names)
      }
    }
  }
}

const runAction = (store, eventName, payload) => {
  const action = lookForEvent(store.actions, eventName.split('.'))
  const mutation = lookForEvent(store.mutations, eventName.split('.'))
  if (action instanceof Function) {
    return action(store.state, payload)
  } else if (mutation instanceof Function) {
    return { state: mutation(store.state, payload) }
  } else {
    throw new Error(`${eventName} is not an action`)
  }
}

const dispatchEffect = store => async effect => {
  try {
    const result = await effect.resolve(store)
    store.dispatch(effect.success, result)
  } catch (error) {
    store.dispatch(effect.failure, error)
  }
}

class Store extends EventTarget {
  constructor(value, mutations = {}, actions = {}) {
    super()
    this.state = value
    this.actions = actions
    this.mutations = mutations
  }

  dispatch = async (eventName, payload) => {
    const response = runAction(this, eventName, payload)
    if (response) {
      const { state, effect, effects } = response
      if (state) {
        this.state = state
        this.dispatchEvent(new Event('updated'))
      }
      if (effect) {
        dispatchEffect(this)(effect)
      } else if (effects instanceof Array) {
        effects.forEach(dispatchEffect(this))
      }
    }
  }
}

export { Provider, Store, Effect, useStore }
