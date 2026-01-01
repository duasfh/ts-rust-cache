import rs from './pkg/ltsrust_cache.js'
import { isSerializable } from './utils.js'

type Value = boolean | number | string | object

enum ValueType {
  Bool = 0,
  F64 = 1,
  Str = 2,
  Obj = 3,
}

const vtMap = {
  0: ValueType.Bool,
  1: ValueType.F64,
  2: ValueType.Str,
  3: ValueType.Obj,
} as const

let cleanupInterval: NodeJS.Timeout | undefined

// todo Date support
// todo BigInt support??

const isValueType = (vt: number): vt is ValueType =>
  !!ValueType[vt]

const vtFromBuf = (bufEl: number): ValueType => {
  if (!isValueType(bufEl)) throw new Error()
  return vtMap[bufEl]
}

const encodeNumber = (value: number) => {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setFloat64(0, value, true)
  const u8arr = new Uint8Array(buf)
  return u8arr

}

const decodeNumber = (buf: Uint8Array<ArrayBufferLike>) => {
  return new DataView(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength,
  ).getFloat64(0, true);
}

const encodeString = (value: string) => {
  const encoder = new TextEncoder()
  const u8arr = encoder.encode(value)
  return u8arr
}

const decodeString = (buf: Uint8Array<ArrayBufferLike>) => {
  const decoder = new TextDecoder()
  return decoder.decode(buf)
}

const encodeObject = (obj: object) => {
  if (!isSerializable(obj)) throw new Error('e_obj_nonserializable')

  return encodeString(JSON.stringify(obj))
}

const decodeObject = (buf: Uint8Array<ArrayBufferLike>) => {
  return JSON.parse(decodeString(buf))
}

const getTypeAndBuffer = (value: Value): [ValueType, Uint8Array<ArrayBuffer>] => {
  if (typeof value === 'boolean') throw new Error('e_not_implemented')
  if (typeof value === 'number') {
    if (!isNaN(value)) return [ValueType.F64, encodeNumber(value)]
  }
  if (typeof value === 'string') return [ValueType.Str, encodeString(value)]
  if (typeof value === 'object') return [ValueType.Obj, encodeObject(value)]

  throw new Error('e_unsupported_type')
}

const set = (
  key: string,
  value: Value,
  /** ms */
  ttl: number
) => {
  if (!cleanupInterval) throw new Error('cache \'set\' is called after closing.')

  const [vt, u8arr] = getTypeAndBuffer(value)

  rs.set(key, u8arr, vt, ttl)
}

const get = (key: string) => {
  const packedEntry = rs.get(key)
  if (!packedEntry) return undefined

  const vtn = vtFromBuf(packedEntry[0])
  const buf = packedEntry.slice(1)
  if (vtn === ValueType.Bool) throw new Error('e_not_implemented')
  if (vtn === ValueType.F64) return decodeNumber(buf)
  if (vtn === ValueType.Str) return decodeString(buf)
  if (vtn === ValueType.Obj) return decodeObject(buf)

  throw new Error('Cache corrupted state. Cannot extract type.')
}

const initIntervalCleanup = () => {
  cleanupInterval = setInterval(() => {
    rs.cleanup()
  }, 60000)
}

const debug = async () => {
  const a = { a: '23', b: 24 }
  console.log(a)

  set('a', a, 100)
  console.log(get('a'))

  close()
}

const close = () => {
  cleanupInterval = clearInterval(cleanupInterval) as undefined
  rs.clear()
}

initIntervalCleanup()

export const cache = {
  get,
  set,
  del: rs.del,
  clear: rs.clear,

  /** @description Current used memory of cache. Includes expired entries, which were not yet picked up by cleanup. */
  getMemRaw: () => rs.get_mem_raw(),
  /** @description Current count of items in cache. Includes expired entries, which were not yet picked up by cleanup. */
  getSizeRaw: () => rs.get_size_raw(),

  /**
   * @description Clears cache and cancels cleanup interval. You wont be able to use the cache after calling `close`.
   * @note Does not dispose wasm instance.
   * */
  close,
}

debug()
