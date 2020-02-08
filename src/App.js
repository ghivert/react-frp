import React from 'react'
import { Provider, Store, useStore } from './Store'
import { http } from './effects'

const initialState = { users: [], lastPage: '' }

const actions = {
  updateAnd(state, payload) {
    return {
      state: { ...state, users: [...state.users, 'testtest'] },
      effects: [
        http({ url: 'http://google.com' }, 'google', 'fail'),
        http({ url: 'https://microsoft.com' }, 'google', 'fail'),
      ],
    }
  },
}

const stateActions = {
  update: (state, payload) => {
    const users = [...state.users, 'test']
    return { ...state, users }
  },
  google: (state, payload) => ({ ...state, lastPage: payload }),
  fail: (state, payload) => ({ ...state, lastPage: 'Nope' }),
}

const myStore = new Store(initialState, actions, stateActions)

const useUsers = () => {
  const { state } = useStore()
  return state.users
}

const useUsersAndNames = () => {
  const users = useUsers()
  const { state } = useStore()
  return users.map((user, index) => `${user} + ${state.users[index]}`)
}

const Counter = props => {
  const { state, dispatch } = useStore()
  const users = useUsersAndNames()
  return (
    <div>
      <button onClick={() => dispatch('update')}>+</button>
      <div>{users.join(' ')}</div>
      <pre>{state.lastPage}</pre>
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
