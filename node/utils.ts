// todo also allow to explicitly implement 'serialize/deserialize' interface?
export const isSerializable = (obj: object) => {
  try {
    structuredClone(obj)
    return true
  } catch {
    return false
  }
}