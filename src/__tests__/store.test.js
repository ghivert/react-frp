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

describe('Effect', () => {
  test('should be resolvable', async () => {
    const effect = new Effect(options, () => Promise.resolve('test'))
    const result = await effect.resolve()
    expect(result).toEqual('test')
  })
  test('should throw when resolve if effect failing', async () => {
    try {
      const effect = new Effect(options, () => Promise.reject('test'))
      await effect.resolve()
    } catch (error) {
      expect(error).toEqual('test')
    }
  })
})
