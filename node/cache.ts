import { cache } from './bridge'

const int32Max = 2147483647

const sharedMemoryExample = () => {
  let a = 20

  console.log('a before:', a)

  cache.mutate(a)

  console.log('a after:', a)
}

sharedMemoryExample()
