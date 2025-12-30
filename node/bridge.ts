import fs from 'fs'

let memory: WebAssembly.ExportValue
const imports = {
  console: {
    now: () => {
      return BigInt(Date.now())
    },
    log: (ptr: number, len: number) => {
      console.log(readStringFromBuf(ptr, len))
    },
  },
}

const readStringFromBuf = (ptr: number, len: number) => {
  // @ts-expect-error todo check why `buffer` is linted
  const bytes = new Uint8Array(memory.buffer, ptr, len)
  return new TextDecoder("utf-8").decode(bytes)
}

const wasm = fs.readFileSync(new URL('../rs/target/wasm32-unknown-unknown/release/ltsrust_cache.wasm', import.meta.url))
const { instance } = await WebAssembly.instantiate(wasm, imports)

memory = instance.exports.memory

const rs = instance.exports as WebAssembly.Instance['exports'] & {
  has: (key: string) => boolean
  set_int: (key: string, value: number, ttl: BigInt) => void
  get_int: (key: string) => number
  del_int: (key: string) => void
  clear: () => void
  get_size: () => number
  get_mem: () => number
}

/** @max 2147483647 */
const setInt32 = (num: number) => {}

const getInt32 = (key: string) => {
  return rs.get_int(key)
}

/**
 * @description IEEE-754 Double
 * @note fits ~15–16 decimal digits
 * */
const setFloat = (num: number) => {}

const setString = (str: string) => {}

const deleteKey = (key: string) => {}

const clear = () => {}

const configute = (conf: never) => {
  throw new Error('e_not_implemented')
}

// todo
const __debugError = () => {}

const utilGetSize = () => {
  return rs.get_size()
}

const utilGetMem = () => {}

const debug_full = () => {
  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()
  rs.del_int('c')

  console.log(getInt32('a'))
  rs.set_int('a', 23, BigInt(10000))
  console.log(getInt32('a'))
  return

  console.log(rs.get_size())
  console.log(rs.get_mem())
  rs.del_int('a')
  console.log(getInt32('a'))

  rs.set_int('b', 24, BigInt(10000))
  console.log(getInt32('b'))
  rs.clear()
  console.log(getInt32('b'))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  // todo ttl
}

const debug_mem = () => {
  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.set_int('a', 23, BigInt(10000))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.set_int('a', 24, BigInt(10000))
  rs.set_int('b', 25, BigInt(10000))
  rs.set_int('c', 26, BigInt(10000))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.del_int('a')

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()

  console.log(rs.get_size())
  console.log(rs.get_mem())

  /**
    ->
    0
    0
    1
    16
    1
    64
    0
    48
    0
    0
  */
}

debug_full()
