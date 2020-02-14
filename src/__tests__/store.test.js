import { Effect, Store } from '../index'

const initialState = { todos: [] }
const success = 'success'
const failure = 'failure'
const options = { success, failure }

const sleep = timeout => {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

const createStore = () => {
  const actions = {
    testSuccess(state) {
      const effect = new Effect(options, () => Promise.resolve())
      return { state, effect }
    },
    testFailure(state) {
      const effect = new Effect(options, () => Promise.reject())
      return { state, effect }
    },
    addTodo({ todos, ...rest }, todo) {
      const state = { ...rest, todos: [...todos, todo] }
      return { state }
    },
  }
  const mutations = {
    addPlainTodo({ todos, ...rest }, todo) {
      return { ...rest, todos: [...todos, todo] }
    },
    success(state) {
      return { ...state, success: true }
    },
    failure(state) {
      return { ...state, failure: true }
    },
  }
  return new Store(initialState, mutations, actions)
}

describe('Store', () => {
  test('should initialize with empty state', () => {
    const store = new Store(initialState)
    expect(store).toHaveProperty('state')
    expect(store).toHaveProperty('dispatch')
    expect(store.state).toEqual(initialState)
    expect(store.dispatch instanceof Function).toBeTruthy()
  })
  test('should accept a function to dispatch', async () => {
    const store = createStore()
    store.dispatch('addTodo', 'test')
    store.dispatch('addPlainTodo', 'test2')
    await sleep(200)
    expect(store.state).toEqual({ todos: ['test', 'test2'] })
  })
  test('should resolve a side effect', async () => {
    const store = createStore()
    store.dispatch('testSuccess')
    await sleep(200)
    expect(store.state).toEqual({ todos: [], success: true })
  })
  test('should reject a side effect', async () => {
    const store = createStore()
    store.dispatch('testFailure')
    await sleep(200)
    expect(store.state).toEqual({ todos: [], failure: true })
  })
})
