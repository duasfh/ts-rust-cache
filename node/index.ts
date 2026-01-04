export * from './bridge'

import { cache } from './bridge'
import type { CacheDesc } from './bridge'
import type { StringValue as MsStringValue } from 'ms'

type TypedCache<CD extends CacheDesc> = {
  set<K extends keyof CD>(
    key: K,
    value: CD[K],
    ttl: number | MsStringValue
  ): void
  get<K extends keyof CD>(key: K): CD[K] | undefined
  delete<K extends keyof CD>(key: K): void
}

export const init = <T extends CacheDesc> () => {
  return cache as TypedCache<T>
}

// todo ad as example:
// type Cache = {
//   staticKey: number
// } & {
//   [K in `email-verification-${string}`]: string
// }
// const a = init<Cache>()
// a.set('staticKey', 2, 2)
// a.set('email-verification-string', '2', 2)
// const b = a.get('staticKey')
// const b2 = a.get('email-verification-string')
