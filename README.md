# React PureStore

Hooks in React are a little revolution. You can write your pure functions without worrying about the states and components. Everything is components. Everything can be turned into stateful component. But why not everything could be store connected as easily? That’s one of the points that PureStore tries to address.

What could be simpler than `useStore`? First, write your component. Then, use `useStore`. You’re done and connected to the store. Only your connected components will repaint on store update.

```jsx
import React from 'react'
import { useStore } from 'react-purestore'

const Counter = () => {
  const store = useStore() // Connects to the store!

  // Below the classic counter!
  const [state, setState] = useState(0)
  return (
    <div className="counter">
      <button onClick={() => setState(state + 1)}>+</button>
      <div>{state}</value>
      <button onClick={() => setState(state - 1)}>-</button>
    </div>
  )
}
```

# The Store

The store is implemented as pure JavaScript, without any framework. It is compound of two parts: `state` and `dispatch`.

`state` is the content of the store when you ask for data. Just like in above example, `state` contains the value stored into the store. If you want to get your data, get the store, and access state.

`dispatch` is the main function of the store. It accepts a function name and potentially a payload, and run the store-function  against the latest state and the payload. It works like a combination of Redux and Vuex.

Let’s take an example with the above code: let’s add an increment and decrement handler in the component.

```jsx
import React from 'react'
import { useStore } from 'react-purestore'

const Counter = () => {
  const { state, dispatch } = useStore()
  return (
    <div className="counter">
      <button onClick={() => dispatch('increment')}>+</button>
      <div>{state}</value>
      <button onClick={() => dispatch('decrement')}>-</button>
    </div>
  )
}
```

## Creating a store and defining handlers

> So you can use a store and call handlers. But, wait a minute, how do you define handlers? If I’m calling `increment` and `decrement` like this, I just get an error!

That’s correct. When calling a handler via `dispatch`, it calls the corresponding handler defined in the store. And in our examples, we never defined a store! So let’s defining a store. A store is made up of three parts: an initial state, an object of `actions`, and an object of `mutations`. The initial state is how the store should be initialized the first time. The `actions` and `mutations` are extremely similar, but let’s start only with `mutations`.

An initial state could be what you want, but a `mutation` is a function accepting a state as first parameter, and potentially a payload, and returning the new state. The new state will take place of the old state. It’s up to you to take care to not break things. So, for our early example `increment`, we could write the function like this:

```javascript
const increment = state => {
  return state + 1
}
```

And similarly for `decrement`:

```javascript
const decrement = state => {
  return state - 1
}
```

That’s cool, but how could we wire up all of this? Let’s use the `Store` contructor!

```javascript
// store.js
import { Store } from 'react-purestore'

const initialState = 0

const mutations = {
  increment,
  decrement,
}

const store = new Store(initialState, mutations)

// Here, store is a Store object containing state and dispatch.
export default store
```

Now we can call `store.dispatch('increment')` and `store.dispatch('decrement')` whenever we want because we have access to the `store`!  
All we have to do now is to connect the store into `React` to get our store widely available. And for this, we got a `Provider`.

```jsx
import React from 'react'
import * as PureStore from 'react-purestore'
import store from './store'

const App = () => (
  <PureStore.Provider store={store}>
    {/* Everything in there could call useStore whenever needed to
      connect to the store. */}
    <Counter />
  </PureStore.Provider>
)
```

Now, everytime you need to call the store, just use `useStore` in your components and you get connected!

## What about side effects?

Until then, if you have been attentive, we never talked about asynchronous programming. And for a reason: side effects are complicated and error-prone in an application written in a functional style. Indeed, if you take a closer look at your React components, none of them contains side effects: the store take care of them for you. You can just focus on writing your code, your functions and your components without thinking about wiring this up. But someday you have to make some asynchronous tasks, and all of your beautiful model will be destroyed. But fortunately, you don’t need to worry about them, because the store can handle them for you directly, and in global manner, avoiding you to think about `useEffect`. Let’s introduce `actions`!

## Actions

Actions are functions you define in the store, at the creation. They behave exactly like mutations, but they return an object instead of a state. This object contains up to two fields: a combination of `state`, `effect` and `effects`. `state` should contain the new state, just like a mutation. The different point is for `effect` and `effects`. They both contains side effects functions, described, ready to be run. The effects are `Effect`, a class which is part of PureStore.

An `Effect` is a little bit like a `Promise`, in the sense that it is an object that will contain asynchronous behavior and which will be resolved later. It is made of two things: a bunch of messages (success and failure) and an asynchronous `run` function which should return a `Promise`.

When you give an effect to the runtime as an action return value, this effect will be resolved by the runtime, and it will ping the store with the correct message according to the `Promise` result (success for a successful promise, failure for a failed promise). Let’s take an example with an HTTP request.

```javascript
import { Effect } from 'react-purestore'

// First we define the HTTP Effect.
const http = ({ success, failure, url, json, method }) => {
  return new Effect({ success, failure }, async () => {
    const response = await fetch('url', { method: method || 'GET' })
    if (json) {
      return response.json()
    } else {
      return response.text()
    }
  })
}

// Then we define the store with the actions.
const initialState = {
  content: null,
  error: null,
}

const mutations = {
  // Here, we will process the response of the request if the request passed.
  treatResponse(state, content) {
    return { ...state, content }
  },
  // Here, we will process the response of the request if it failed.
  showFailure(state, error) {
    return { ...state, error }
  },
}

const actions = {
  // In this function, all we’ll do is giving the side effect to runtime.
  //   Note that the Effect is not running for now. We defined the Effect earlier,
  //   But this will be run only when the runtime need to get response.
  doHTTPRequest(state) {
    const effect = http({
      success: 'treatResponse',
      failure: 'showFailure',
      url: '/api/content',
      method: 'GET',
    })
    // We won't change the state here, but we will run the http effect.
    return { state, effect }
  },
}

const store = new Store(initialState, mutations, actions)
```

We can see all the different steps: the `http` function define the Effect, and define the `run` function. It is the line `new Effect({ success, failure }, async () => {})`. You can think of it a little like a promise: the first options are the message functions-name that will be called when the run function resolves, and the second is the run function. The structure is **always the same**.

You can define nearly all side effects you need: you just need to define them with a `new Effect`. And don’t worry, Effect is defined like an ES6 class, so calling it without `new` will just throw an Error!

# Recap

Phew, that was huge! Now you have everything you need to get started with you first app! I would love to hear about you if you like it and improve it! Of course, contributions are more than welcome, and like all of my work, I try to do as much as possible publicly.

## Advanced tips

If you’re here, you’re probably used to the framework. Nice! Here are some tips to help you design your applications.

## Effects

> Having `Effect`s is cool, but why are they here? I mean, you can mimic the behavior of effects with just simple Promise.

And you’re right. But `Effect`s are a little more complex. They are composable. To do so, they expose different functions: `map`, `then` and `Effect.all`. First things first, `map` and `then`. `map` is a function allowing to transform the result of Effects before they will be returned to the store. `then` allow to chain Effects in order to change context after an Effect has been run.

```javascript
// We’ll keep the http effect defined earlier.
const jsonResult = http({
  success: 'httpResponse',
  failure: 'httpFailure',
  url: '/api/content',
  method: 'GET',
  json: true,
})

// Let’s say extractIdFromPage is defined and returns an ID.
const idResult = jsonResult.map(content => extractIdFromPage(content))
const otherThing = idResult.then(content => http({
  success: 'secondHttpResponse',
  failure: 'secondHttpFailure',
  url: `/api/post/${content}`,
  method: 'GET',
}))
```

Be careful, you cannot return an Effect in a map, and you should return an `Efffect` in then. Of course any failure in the chain will automatically stop the chain.

Finally all, the composability function. It behaves a little like `Promise.all`.

```javascript
const firstEffect = http({
  success: 'firstSuccess',
  failure: 'firstFailure',
  url: '/api/content',
})

const secondEffect = http({
  success: 'secondSuccess',
  failure: 'secondFailure',
  url: '/api/content',
})

const options = { success: 'allSuccess', failure: 'allFailure' }

const alls = Effect.all(options, [firstEffect, secondEffect])
// Once ran, the store will be called with allSuccess with the payload equal to
//   { firstSuccess: [result], secondSuccess: [result] } or with allFailure with
//   an object similar to success but with messages of failed Effects.
```

## Custom Hook gets

What’s cool about hook is that you can easily define yours. And that’s the same with PureStore. Let’s see it with `useStore`. Imagine your store is defined like this:

```javascript
const initialState = {
  users: [{
    id: '6b393624-fbe0-4318-a2b5-3240874a683d',
    name: 'Alan Turing'
  }],
  posts: [{
    title: 'A Turing Machine is great!',
    content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    id: '56a5b3d1-6386-4d99-ac72-01a3990b89da',
    authorId: '6b393624-fbe0-4318-a2b5-3240874a683d'
  }],
}
```

A store like this is great because you have only one source of truth in your application. If something refers to the users, they always will refer to their id, nothing else. No data duplication, nothing more than an id. That’s cool, but what if you have a render like this:

```jsx
const Post = ({ title, content, name }) => (
  <div className="post">
    <h2 className="title">{title}</h2>
    <div className="author">{name}</div>
    <div className="content">{content}</div>
  </div>
)
```

You would probably write something like this:

```jsx
const AllPosts = () => {
  const { state } = useStore()
  const { posts, users } = state
  return posts.map(({ id, authorId, title, content }) => {
    const { name } = users.find(user => user.id === authorId)
    return (
      <Post
        key={id}
        title={title}
        content={content}
        name={name}
      />
    )
  })
}
```

That’s rather cool, but could we make it simpler? Because, if we’re reusing the posts regularly, we will be forced to refind the user each time. We can clearly make it better. With a custom hook.

```jsx
const usePosts = () => {
  const { state } = useStore()
  const { posts, users } = state
  return posts.map(({ id, authorId, title, content }) => {
    const { name } = users.find(user => user.id === authorId)
    return { id, authorId, title, content, name }
  })
}

const AllPosts = () => {
  const posts = usePosts()
  return posts.map(({ id, ...post }) => (
    <Post key={id} {...post} />
  ))
}
```

Phew, that removed a lot of code in the `AllPosts` function! And it’s cool, because `usePosts` is reusable anywhere you want, with all the data perfectly formed. No more problems with fetching the correct data from different fields. Just call the hook and you’re good to go. And you know what’s even cooler? You can nest the hooks!

To illustrate it, imagine the store is improved:

```javascript
const initialState = {
  companies: [{
    name: 'FrenchPastries',
    id: '2aef849f-afd3-4ca2-b843-627e3fcc57d2',
  }],
  users: [{
    id: '6b393624-fbe0-4318-a2b5-3240874a683d',
    name: 'Alan Turing',
    companyId: '2aef849f-afd3-4ca2-b843-627e3fcc57d2',
  }],
  posts: [{
    title: 'A Turing Machine is great!',
    content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    id: '56a5b3d1-6386-4d99-ac72-01a3990b89da',
    authorId: '6b393624-fbe0-4318-a2b5-3240874a683d'
  }],
}
```

Now imagine we want to get the final object Post defined like:

```javascript
const Post = {
  title: String,
  content: String,
  id: String,
  user: {
    id: String,
    name: String,
    company: {
      name: String,
      id: String,
    }
  }
}
```

To ease the call, we can nest the hooks!

```jsx
const useCompanyUsers = () => {
  const { state } = useStore()
  const { companies, users } = state
  return users.map(({ companyId, ...user }) => {
    const company = companies.find(company => company.id === companyId)
    return { ...user, company }
  })
}

const usePosts = () => {
  const { state } = useStore()
  const { posts } = state
  const users = useCompanyUsers()
  return posts.map(({ authorId, ...post }) => {
    const user = users.find(user => user.id === authorId)
    return { ...post, user }
  })
}
```

Here, when calling `usePosts`, we’ll directly have the correct posts, correctly formed. Hooray!

## Defining subscriptions

What a subscription is? It’s when your side effects is repeted often times. When you’re making an HTTP request, the request will be resolved once, and it’s over. But what about a `setInterval`? Or a WebSocket subscription? A message can come any time. To be able to put them into the Store correctly, we need to make it through to the `mutations` or the `actions` functions. We can do it easily once we have defined the store:

```javascript
import store from './store'
import ws from 'websocket'

const App = () => (...)

// This will ping the store every second.
setInterval(() => {
  store.dispatch('ping')
}, 1000)

// Every times a message is received from WS, ping the correct action or mutation
//   in the store with the message.
ws.connect('my.api', message => {
  store.dispatch('receivedWSMessage', message)
})
```

## Nesting action

If your store begins to be too big, it’s probably time to split it up, in order to reduce the mental overhead and to ease a lot of things, like team work. You can easily split the actions and mutations by nesting them.

```javascript
const initialState = { todos: [] }

// Nested actions.
const mutations = {
  todos: {
    add(state, todo) {
      return { ...state, todos: [...state.todos, todo] }
    }
  }
}

// Creates the store.
const store = new Store(initialState, mutations)

// And now we dispatch the action!
store.dispatch('todos.add', 'Think to split the store!')
```

As you can see, when dispatching `message1.message2...messageN`, it will try to lookup inside of the actions each time. For now, the state is not automatically opened to provide only the namespace, but is rather given entirely. This allow to properly open namespace the action, but still be able to work on the entire state. Open an issue if you think we should do differently.
