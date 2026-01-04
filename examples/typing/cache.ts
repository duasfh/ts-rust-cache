import { init } from '@duasfh/ts-rust-cache'

type Cache = {
  'a': number
  'other-static-key': string
} & {
  [K in `email-verification-${string}`]: string
} & {
  [K in `other-dynamic-key-${number}-${string}`]: Date
}

export const cache = init<Cache>()
