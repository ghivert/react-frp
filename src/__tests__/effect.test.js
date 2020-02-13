import { Effect } from '../effect'

const success = 'success'
const failure = 'failure'
const options = { success, failure }

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
  test('should be mappable', async () => {
    const effect = new Effect(options, () => Promise.resolve('test'))
    const newEffect = effect.map(content => content + 'test')
    const result = await newEffect.resolve()
    expect(result).toBe('testtest')
  })
  test('should be chainable', async () => {
    const effect = new Effect(options, () => Promise.resolve(2))
    const newEffect = effect.then(
      content => new Effect(options, () => Promise.resolve(content + 2))
    )
    const result = await newEffect.resolve()
    expect(result).toBe(4)
  })
  test('should be chainable and mappable', async () => {
    const effect = new Effect(options, () => Promise.resolve(2))
    const effect2 = effect
      .then(content => new Effect(options, () => Promise.resolve(content + 2)))
      .map(content => content * 1000)
      .then(content => new Effect(options, () => Promise.resolve(content + 2)))
    const result = await effect2.resolve()
    expect(await effect.resolve()).toBe(2)
    expect(result).toBe(4002)
  })
  test('should crash if a promise is false', async () => {
    try {
      const effect = new Effect(options, () => Promise.resolve(2))
        .then(cont => new Effect(options, () => Promise.resolve(cont + 2)))
        .map(cont => cont * 1000)
        .then(cont => new Effect(options, () => Promise.reject(cont + 2)))
      await effect.resolve()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(error).toBe(4002)
    }
  })
  test('should be able to automatically fail an effect', async () => {
    try {
      const effect = Effect.fail(failure, 4)
      await effect.resolve()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(error).toBe(4)
    }
  })
  test('should be able to automatically success an effect', async () => {
    const effect = Effect.success(success, 4)
    const result = await effect.resolve()
    expect(result).toBe(4)
  })
  test('should be composable', async () => {
    const effect1 = Effect.success(success, 4)
    const effect2 = Effect.success(success, 5)
    const effect3 = Effect.success(success, 6)
    const effects = Effect.all(success, [effect1, effect2, effect3])
    const result = await effects.resolve()
    expect(result).toEqual([4, 5, 6])
  })
  test('should crash if one of composable crash', async () => {
    try {
      const effect1 = Effect.success(success, 4)
      const effect2 = Effect.fail(success, 5)
      const effect3 = Effect.success(success, 6)
      const effects = Effect.all(failure, [effect1, effect2, effect3])
      await effects.resolve()
      expect(false).toBeTruthy()
    } catch (error) {
      expect(error).toBe(5)
    }
  })
})
