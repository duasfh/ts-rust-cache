
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
- del
- clear

Additionally:
- getMemRaw
- getSizeRaw

Lifecycle:
- close
> `close` is typically only needed for cli applications

See more at [examples](./examples/nodejs/index.ts)
