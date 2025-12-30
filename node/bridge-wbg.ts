import rs from './pkg/ltsrust_cache.js'

// await init()


const debug_full = () => {
  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()
  rs.del_int('c')

  console.log(rs.get_int('a'))
  rs.set_int('a', 23, BigInt(10000))
  console.log(rs.get_int('a'))

  console.log(rs.get_size())
  console.log(rs.get_mem())
  rs.del_int('a')
  console.log(rs.get_int('a'))

  rs.set_int('b', 24, BigInt(10000))
  console.log(rs.get_int('b'))
  rs.clear()
  console.log(rs.get_int('b'))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()
}

const debug_mem = () => {
  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.set_int('a', 23, BigInt(10000))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.set_int('a', 24, BigInt(10000))
  rs.set_int('b', 25, BigInt(10000))
  rs.set_int('c', 26, BigInt(10000))

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.del_int('a')

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()

  console.log(rs.get_size())
  console.log(rs.get_mem())

  rs.clear()
}

const debug_exp = async () => {
  rs.set_int('a', 24, BigInt(50))
  console.log(rs.get_int('a'))
  await new Promise(r => setTimeout(r, 100))
  console.log(rs.get_int('a'))

  rs.clear()
}

debug_mem()
debug_exp()
debug_full()

// todo debug_concurrency
// todo and move it to jest, after merged
