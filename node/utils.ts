import libms, { type StringValue as MsStringValue }  from 'ms'

export const isSerializable = (obj: object) => {
  if (isClassInstance(obj)) return false

  try {
    structuredClone(obj)
    return true
  } catch {
    return false
  }
}

const isClassInstance = (obj: unknown) => {
  if (obj === null || typeof obj !== 'object') return false
  return Object.getPrototypeOf(obj) !== Object.prototype
}


/** @note strict version of 'ms', since it's not shipped in 2.1.3 */
export const ms = (string: MsStringValue) => {
  return libms(string) ?? (() => { throw new Error('Error parsing ttl.') })()
}
