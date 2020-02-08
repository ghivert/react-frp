const http = ({ url, ...options }, success, failure) => async store => {
  try {
    const response = await fetch(new Request(url, options))
    const body = await response.text()
    store.dispatch(success, body)
  } catch (error) {
    store.dispatch(failure, error)
  }
}

export { http }
