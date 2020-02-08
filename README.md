# React FRP

The idea is to reimplement a small subset of a store with sagas to get a fully
working pure functionnal setup of React. Setup your store, add it in a Context
Provider, and then you can just subscribe to the modifications using `useStore`.
This give access to an object shaped like `{ state, dispatch }`. `state` is the
last state accessible from the Store, and `dispatch` is the dispatcher function.
The dispatcher accepts one string as first argument and a payload. The string
should be exactly the name of either an action or a state action. When called,
dispatch will trigger the action with the payload and automatically provide the
latest store available. The result should be an object containing a `state` field,
an `effects` field or both. The `state` field will update the state in the the store.
The `effects` field shoud be an effect or an array of effect. Those effects will
be run against the latest store available and they should commit all of their
results in the store like every other action. An example of an effect can be found
in `effects.js`.

# The Store

```javascript
import { Store } from 'Store'
import http from 'Store/Effects'

// This is the initial state, used only during initialization.
const initialState = {
  users: [],
}

// This is an object of functions, following all the same convention.
//   (state, payload) => { state: newState, effects: [Effect] }
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

// This is an object of functions, same as actions, but with { state: newState }
//   automatically implied.
const stateActions = {
  update: (state, payload) => {
    const users = [...state.users, 'test']
    return { ...state, users }
  },
  google: (state, payload) => ({ ...state, users: ['Google'] }),
  fail: (state, payload) => ({ ...state, users: [] }),
}

const myStore = new Store(initialState, actions, stateActions)
```

# The getters | Create your graph of connections.

```javascript
const useUsers = () => {
  const { state } = useStore()
  return state.users
}

const useUsersAndNames = () => {
  const users = useUsers()
  const { state } = useStore()
  return users.map((user, index) => `${user} + ${state.users[index]}`)
}
```

# The Connection

```javascript
import React from 'react'
import { useStore } from 'Store'

// Connect the component by using useStore.
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

// Add the Provider to your application tree.
const App = () => (
  <Provider store={myStore}>
    <div className="App">
      <Counter />
    </div>
  </Provider>
)
```
