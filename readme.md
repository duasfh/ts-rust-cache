
Synchronous wasm cache implementation for js, compiled from Rust.

### Installation

> [!WARNING]
> **Do not use it in production!** Only use it at your own risk.

```bash
pnpm i @duasfh/ts-rust-cache
```

Or

```bash
npm i @duasfh/ts-rust-cache
```

```bash
yarn add @duasfh/ts-rust-cache
```

### Usage

It has pretty standard cache api:
- set
- get
- delete
- clear

Additionally:
- getMemRaw
- getSizeRaw

Lifecycle:
- close
> `close` is typically only needed for cli applications or tests

See more at [examples](./examples/nodejs/index.ts)

### Typescript

Example of type usage:

```typescript
type Cache = {
  'a': number
  'other-static-key': string
} & {
  [K in `email-verification-${string}`]: string
} & {
  [K in `other-dynamic-key-${number}-${string}`]: Date
}

export const cache = init<Cache>()
```

And use that exported `cache` in your app files.
Type examples:

```typescript
cache.set('a', '1', '15m')  // -> Error: Argument of type 'string' is not assignable to parameter of type 'number'
cache.set('a', 1, '15m')  // -> Correct

const a = cache.get('a')
// -> a: number | undefined

cache.set('email-verification', 1, '15m')  // -> Error: Argument of type '"email-verification"' is not assignable to parameter of type '`email-verification-${string}` | ...
cache.set('email-verification-123', 1, '15m')  // -> Error: Argument of type 'number' is not assignable to parameter of type 'string'
cache.set('email-verification-123', '123123', '15m')  // -> Correct

const date = cache.get('other-dynamic-key-123-aaa')
// -> date: Date | undefined
```

See more at [examples](./examples/typing/cache.ts)

### Notes

- When storing an object, nested dates (`{ date: new Date() }`) will result in the returned date string (`{ date: "0001-12-31T:01:01:01.000Z" }`)
