import rs from './pkg/ts_rust_cache'
import { isSerializable, ms } from './utils'
import type { StringValue as MsStringValue } from 'ms'

type Value = boolean | number | string | object | Date

enum ValueType {
  Bool = 0,
  F64 = 1,
  Str = 2,
  Obj = 16,
  Date = 17,
}

const vtMap = {
  0: ValueType.Bool,
  1: ValueType.F64,
  2: ValueType.Str,
  16: ValueType.Obj,
  17: ValueType.Date,
} as const

let cleanupInterval: NodeJS.Timeout | undefined

const isValueType = (vt: number): vt is ValueType =>
  !!ValueType[vt]

const vtFromBuf = (bufEl: number): ValueType => {
  if (!isValueType(bufEl)) throw new Error('Cache corrupted state. Cannot extract type.')
  return vtMap[bufEl]
}

const encodeBool = (value: boolean) => {
  const u8arr = new Uint8Array(1)
  u8arr[0] = +value
  // yep, 254 extra bits, for cost of uniformity/simplicity
  // for rest of the types
  return u8arr
}

const decodeBool = (buf: Uint8Array<ArrayBufferLike>) => {
  return !!buf[0]
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

const encodeObject = (value: object) => {
  if (!isSerializable(value)) throw new Error('e_obj_nonserializable')

  return encodeString(JSON.stringify(value))
}

const decodeObject = (buf: Uint8Array<ArrayBufferLike>) => {
  return JSON.parse(decodeString(buf))
}

const encodeDate = (value: Date) => {
  const ms = value.getTime()
  return encodeNumber(ms)
}

const decodeDate = (buf: Uint8Array<ArrayBufferLike>) => {
  const ms = decodeNumber(buf)
  return new Date(ms)
}

const getTypeAndBuffer = (value: Value): [ValueType, Uint8Array<ArrayBuffer>] => {
  if (typeof value === 'boolean') return [ValueType.Bool, encodeBool(value)]
  if (typeof value === 'number') {
    if (!isNaN(value)) return [ValueType.F64, encodeNumber(value)]
  }
  if (typeof value === 'string') return [ValueType.Str, encodeString(value)]

  if (value instanceof Date) return [ValueType.Date, encodeDate(value)]
  if (typeof value === 'object') return [ValueType.Obj, encodeObject(value)]

  throw new Error('e_unsupported_type')
}

const decodeFMap: Record<ValueType, (buf: Uint8Array<ArrayBufferLike>) => Value> = {
  [ValueType.Bool]: decodeBool,
  [ValueType.F64]: decodeNumber,
  [ValueType.Str]: decodeString,
  [ValueType.Obj]: decodeObject,
  [ValueType.Date]: decodeDate,
}

const set: {
  (key: string, value: Value, /** String for 'ms' library. @example '2m' */ ttl: MsStringValue): void;
  (key: string, value: Value, /** Milliseconds, integer */ ttl_ms: number): void;
} = (
  key: string,
  value: Value,
  ttl: number | MsStringValue
) => {
  if (!cleanupInterval) throw new Error('cache \'set\' is called after closing.')

  const ttl_ms = typeof ttl === 'number' ? ttl : ms(ttl)

  const [vt, u8arr] = getTypeAndBuffer(value)

  rs.set(key, u8arr, vt, ttl_ms)
}

const get = (key: string) => {
  const packedEntry = rs.get(key)
  if (!packedEntry) return undefined

  const vtn = vtFromBuf(packedEntry[0])
  const buf = packedEntry.slice(1)

  const decodeF = decodeFMap[vtn]
  return decodeF(buf)
}

const initIntervalCleanup = () => {
  clearInterval(cleanupInterval)
  cleanupInterval = setInterval(() => {
    rs.cleanup()
  }, 60000)
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
  _initIntervalCleanup: initIntervalCleanup,
}
