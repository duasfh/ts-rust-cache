import rs from './pkg/ltsrust_cache.js'

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
} as const

let cleanupInterval: NodeJS.Timeout | undefined

// todo Date support
// todo BigInt support??

const vtFromBuf = (bufEl: number): ValueType => {
  if (bufEl !== 0 && bufEl !== 1 && bufEl !== 2) throw new Error()
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

const encMap = {
  [ValueType.Bool]: (_: boolean) => { throw new Error('e_not_implemented') },
  [ValueType.F64]: encodeNumber,
  [ValueType.Str]: encodeString,
  [ValueType.Obj]: (_: object) => { throw new Error('e_not_implemented') },
} as const

const getValueTypeFromValue = <V extends Value> (value: Value) => {
  if (typeof value === 'boolean') return ValueType.Bool
  if (typeof value === 'number') {
    if (!isNaN(value)) return ValueType.F64
  }
  if (typeof value === 'string') return ValueType.Str
  if (typeof value === 'object') return ValueType.Obj

  throw new Error('e_unsupported_type')
}

const set = (
  key: string,
  value: Value,
  /** ms */
  ttl: number
) => {
  if (!cleanupInterval) throw new Error('cache \'set\' is called after closing.')

  const vt = getValueTypeFromValue(value)
  // @ts-expect-error todo fix typing, or simplify
  const u8arr = encMap[vt](value)

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
  if (vtn === ValueType.Obj) return JSON.parse(decodeString(buf))

  throw new Error('Cache corrupted state. Cannot extract type.')
}

const initIntervalCleanup = () => {
  cleanupInterval = setInterval(() => {
    rs.cleanup()
  }, 60000)
}

const debug = async () => {
  close()
}

const close = () => {
  cleanupInterval = clearInterval(cleanupInterval) as undefined
  rs.clear()
}

initIntervalCleanup()

debug()
