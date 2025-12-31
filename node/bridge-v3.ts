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

let cleanupInterval: NodeJS.Timeout | undefined

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
  if (!cleanupInterval) throw new Error('cache \'set\' is called after closing.')

  const encoder = new TextEncoder()
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

const initIntervalCleanup = () => {
  cleanupInterval = setInterval(() => {
    rs.cleanup()
  }, 60000)
}

const debug = async () => {
  setNumber('a', 123, 50)
  console.log(get('a'))
  console.log(rs.get_size_raw())

  await new Promise(r => setTimeout(r, 100))
  rs.cleanup()

  console.log(rs.get_size_raw())

  close()
}

const close = () => {
  cleanupInterval = clearInterval(cleanupInterval) as undefined
  rs.clear()
  // it doesn't actually unload wasm instance
}

initIntervalCleanup()

debug()
