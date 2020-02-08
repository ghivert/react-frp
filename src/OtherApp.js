import React from 'react'
import { Provider, Store, useStore } from './Store'
import { http } from './effects'

const initialState = 0

const myStore = new Store({
  initialState,
  actions: {
    update(oldState, payload) {
      const state = oldState + 1
      return { state }
    },
    updateAnd(state, payload) {
      return {
        state: state + 1,
        effects: [
          http({ url: 'https://google.com' }, 'google', 'fail'),
          http({ url: 'https://microsoft.com' }, 'google', 'fail'),
        ],
      }
    },
    google(state, payload) {
      console.log(state)
      console.log(payload)
    },
    fail(state, payload) {
      console.log(state)
      console.log(payload)
    },
  },
})

const Counter = props => {
  const { state, dispatch } = useStore()
  return (
    <div>
      <button onClick={() => dispatch('update')}>+</button>
      <div>{state}</div>
      <button onClick={() => dispatch('updateAnd')}>-</button>
    </div>
  )
}

const App = () => (
  <Provider store={myStore}>
    <div className="App">
      <Counter />
    </div>
  </Provider>
)

export default App
