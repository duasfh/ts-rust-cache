export const isSerializable = (obj: object) => {
  try {
    structuredClone(obj)
    return true
  } catch {
    return false
  }
}