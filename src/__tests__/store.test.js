import { Effect, Store } from '../index'

const initialState = { todos: [] }
const success = 'success'
const failure = 'failure'
const options = { success, failure }

describe('Store', () => {
  test('should initialize with empty state', () => {
    const store = new Store(initialState)
    expect(store).toHaveProperty('state')
    expect(store).toHaveProperty('dispatch')
    expect(store.state).toEqual(initialState)
    expect(store.dispatch instanceof Function).toBeTruthy()
  })
})
