import { cache } from "ts-rust-cache"

const main = async () => {
  cache.set('a', '23', '0.5s')
  cache.set('b', 24, '0.5s')
  cache.set('c', { a: '23' }, 500)
  cache.set('d', new Date('1993'), 500)

  console.log('\n- Cached values:')
  console.log(typeof cache.get('a'), cache.get('a'))
  console.log(typeof cache.get('b'), cache.get('b'))
  console.log(typeof cache.get('c'), cache.get('c'))
  console.log(typeof cache.get('d'), cache.get('d'))

  await new Promise(r => setTimeout(r, 510))

  console.log('\n- After expiration:')
  console.log(typeof cache.get('a'), cache.get('a'))
  console.log(typeof cache.get('b'), cache.get('b'))
  console.log(typeof cache.get('c'), cache.get('c'))
  console.log(typeof cache.get('d'), cache.get('d'))

  cache.close()
}

main()
