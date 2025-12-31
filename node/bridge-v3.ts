import rs from './pkg/ltsrust_cache.js'

enum ValueType {
  Bool = 0,
  F64 = 1,
  Str = 2,
}

const vtMap = {
  0: ValueType.Bool,
  1: ValueType.F64,
  2: ValueType.Str,
} as const

const vtFromBuf = (bufEl: number): ValueType => {
  if (bufEl !== 0 && bufEl !== 1 && bufEl !== 2) throw new Error()
  return vtMap[bufEl]
}

// todo as encodeNumber
const setNumber = (key: string, value: number, ttl: number) => {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setFloat64(0, value, true)
  const u8arr = new Uint8Array(buf)

  rs.set(key, u8arr, ValueType.F64, ttl)
}

const decodeNumber = (buf: Uint8Array<ArrayBufferLike>) => {
  return new DataView(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength,
  ).getFloat64(0, true);
}

const setString = (key: string, value: string, ttl: number) => {
  const encoder = new TextEncoder()  // todo browser compatibility
  const u8 = encoder.encode(value)

  rs.set(key, u8, ValueType.Str, ttl)
}

const decodeString = (buf: Uint8Array<ArrayBufferLike>) => {
  const decoder = new TextDecoder()
  return decoder.decode(buf)
}

const get = (key: string) => {
  const packedEntry = rs.get(key)
  if (!packedEntry) return undefined

  const vtn = vtFromBuf(packedEntry[0])
  const buf = packedEntry.slice(1)
  if (vtn === ValueType.F64) return decodeNumber(buf)
  if (vtn === ValueType.Str) return decodeString(buf)
}

const debug = () => {
  setNumber('a', 123, 1000)
  console.log(get('a'))

  setString('b', '23', 1000)
  console.log(get('b'))
}

debug()
