import fs from 'fs'

const wasm = fs.readFileSync(new URL('../rs/target/wasm32-unknown-unknown/release/ltsrust_cache.wasm', import.meta.url))
const { instance } = await WebAssembly.instantiate(wasm)

// didn't find a way to properly `declare` via `.d.ts` for wasm
type RustCacheModule = {
  mutate(a: number): void
}

const mutate = (ar: number[]) => {
  const mem = new Int32Array(instance.exports.memory.buffer)
  const index = 0
  mem[index] = 42

  instance.exports.mutate(index * 4)
}

export const cache = instance.exports as RustCacheModule
