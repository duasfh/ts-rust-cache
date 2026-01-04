export * from './bridge'

import { cache } from './bridge'
import type { CacheDesc } from './bridge'
import type { StringValue as MsStringValue } from 'ms'

type TypedCache<CD extends CacheDesc> = Omit<typeof cache, 'set' | 'get' | 'delete'> & {
  set<K extends keyof CD>(
    key: K,
    value: CD[K],
    /** String for 'ms' library. Example: `'2m'` */
    ttl: MsStringValue
  ): void
  set<K extends keyof CD>(
    key: K,
    value: CD[K],
    /** Milliseconds */
    ttl_ms: number
  ): void
  get<K extends keyof CD>(key: K): CD[K] | undefined
  delete<K extends keyof CD>(key: K): void
}

export const init = <T extends CacheDesc> () => {
  return cache as TypedCache<T>
}
