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

const setNumber = (key: string, value: number) => {
  const buf = new ArrayBuffer(8)
  new DataView(buf).setFloat64(0, value, true)
  const u8 = new Uint8Array(buf)

  rs.set(key, u8, ValueType.F64, 100)
}

const getNumber = (buf: Uint8Array<ArrayBufferLike>) => {
  return new DataView(
    buf.buffer,
    buf.byteOffset,
    buf.byteLength,
  ).getFloat64(0, true);
}

const get = (key: string) => {
  const packedEntry = rs.get(key)
  if (!packedEntry) return undefined

  const vtn = vtFromBuf(packedEntry[0])
  const buf = packedEntry.slice(1)
  if (vtn === ValueType.F64) return getNumber(buf)
}

const debug = () => {
  setNumber('a', 123)
  console.log(get('a'))
}

debug()
