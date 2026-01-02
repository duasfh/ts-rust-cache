import libms, { type StringValue as MsStringValue }  from 'ms'

export const isSerializable = (obj: object) => {
  try {
    structuredClone(obj)
    return true
  } catch {
    return false
  }
}

/** @note strict version of 'ms', since it's not shipped in 2.1.3 */
export const ms = (string: MsStringValue) => {
  return libms(string) ?? (() => { throw new Error('Error parsing ttl.') })()
}
