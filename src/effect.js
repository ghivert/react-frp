const toMapper = mapper => ({ type: 'map', mapper })
const toThener = mapper => ({ type: 'then', mapper })

const duplicate = effect => {
  const { success, failure, run } = effect
  const eff = new Effect({ success, failure }, run)
  return eff
}

const getSuccessOrFailure = store => async effect => {
  const { success, failure } = effect
  try {
    const result = await effect.resolve(store)
    return { success, content: result }
  } catch (error) {
    return { failure, content: error }
  }
}

const acceptAllOrReject = (acc, { success, failure, content }) => {
  if (success) {
    return acc.then(acc => [...acc, content])
  } else {
    return Promise.reject(content)
  }
}

class Effect {
  static all(options, effects) {
    return new Effect(options, async store => {
      const results = await Promise.all(effects.map(getSuccessOrFailure(store)))
      const total = await results.reduce(acceptAllOrReject, Promise.resolve([]))
      return total
    })
  }

  static fail(failure, data) {
    return new Effect({ failure }, () => Promise.reject(data))
  }

  static success(success, data) {
    return new Effect({ success }, () => Promise.resolve(data))
  }

  constructor({ success, failure }, run) {
    if (run instanceof Function) {
      this.run = run
    } else {
      if (!this.run instanceof Function) {
        console.warn('Effect non runnable.')
      }
    }
    this.success = success
    this.failure = failure
    this.chain = []
  }

  map(mapper) {
    const eff = duplicate(this)
    const chainer = toMapper(mapper)
    eff.chain = [...this.chain, chainer]
    return eff
  }

  then(mapper) {
    const eff = duplicate(this)
    const chainer = toThener(mapper)
    eff.chain = [...this.chain, chainer]
    return eff
  }

  async resolve(store) {
    let result = await this.run(store)
    let i = 0
    while (this.chain[i]) {
      const { type, mapper } = this.chain[i]
      if (type === 'map') {
        result = mapper(result)
      } else {
        result = mapper(result)
        const newResult = this.chain
          .slice(i + 1)
          .reduce((result, { type, mapper }) => {
            if (type === 'map') {
              return result.map(mapper)
            } else {
              return result.then(mapper)
            }
          }, result)
        return newResult.resolve(store)
      }
      i += 1
    }
    return result
  }
}

export { Effect }
