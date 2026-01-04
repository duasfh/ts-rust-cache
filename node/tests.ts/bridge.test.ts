import { cache } from '../bridge'

describe('bridge', () => {
  beforeEach(() => {
    cache.clear()
  })

  afterAll(() => {
    cache.close()
  })

  describe('keys', () => {
    it('must return `undefined` when accessing non-existent key', () => {
      const value = cache.get('a')
      expect(value).toBeUndefined()
    })

    it('must return the value when accessing existing key', () => {
      cache.set('a', 1, '1s')
      const value = cache.get('a')
      expect(value).toBeDefined()
    })

    it('must overwrite existing key', () => {
      cache.set('a', 1, '1s')
      cache.set('a', 2, '1s')
      const value = cache.get('a')

      expect(value).toBe(2)
    })
  })

  describe('data types', () => {
    it('must return type `number` for number', () => {
      cache.set('a', 1, '1s')
      const value = cache.get('a')

      expect(typeof value).toBe('number')
    })

    it('must return type `string` for string', () => {
      cache.set('a', '1', '1s')
      const value = cache.get('a')

      expect(typeof value).toBe('string')
    })

    it('must return type `object` for object', () => {
      cache.set('a', { a: '23' }, '1s')
      const value = cache.get('a')

      expect(typeof value).toBe('object')
    })

    it('must return type `Date` for Date', () => {
      cache.set('a', new Date(), '1s')
      const value = cache.get('a')

      expect(value).toBeInstanceOf(Date)
    })

    it('must throw when adding BigInt', () => {
      // @ts-expect-error testing purposes
      const call = () => cache.set('a', BigInt(1), '1s')

      expect(call).toThrow('e_unsupported_type')
    })
  })

  describe('expiration', () => {
    beforeAll(() => {
      jest.useFakeTimers()
      cache._initIntervalCleanup()
    })

    afterAll(() => {
      jest.useRealTimers()
    })


    it('it must return `undefined`, when time is expired', () => {
      cache.set('a', 1, '1s')
      expect(cache.get('a')).toBeDefined()

      jest.advanceTimersByTime(1001)

      expect(cache.get('a')).toBeUndefined()
    })

    it('it must accept number ms as ttl argument', () => {
      cache.set('a', 1, 1000)
      expect(cache.get('a')).toBeDefined()

      jest.advanceTimersByTime(1001)

      expect(cache.get('a')).toBeUndefined()
    })

    it('it must accept parse string ms with m unit', () => {
      cache.set('a', 1, '15m')
      expect(cache.get('a')).toBeDefined()

      jest.advanceTimersByTime(15 * 60 * 1000)

      expect(cache.get('a')).toBeDefined()

      jest.advanceTimersByTime(1)

      expect(cache.get('a')).toBeUndefined()
    })

    describe('cleanup', () => {
      it('must clean expired values on cleanup period', async () => {
        cache.set('a', 1, '5ms')

        expect(cache.get('a')).toBeDefined()
        expect(cache.getSizeRaw()).toBe(1)

        jest.advanceTimersByTime(6)

        expect(cache.get('a')).toBeUndefined()
        expect(cache.getSizeRaw()).toBe(1)

        jest.advanceTimersByTime(60 * 1000)

        expect(cache.get('a')).toBeUndefined()
        expect(cache.getSizeRaw()).toBe(0)
      })
    })
  })

  describe('serialization', () => {
    const testObject = {
      a: '23',
      b: 24,
      c: { a: '25' },
    }

    it('it must return equal object, but different pointer', () => {
      cache.set('a', testObject, '1s')
      const value = cache.get('a') as typeof testObject

      expect(value).toEqual(testObject)
      expect(value).not.toBe(testObject)
      expect(value.c).not.toBe(testObject.c)
      expect(value.a).toBe(testObject.a)
    })

    it('it must preserve object property types', () => {
      cache.set('a', testObject, '1s')
      const value = cache.get('a') as typeof testObject

      expect(typeof value.a).toBe(typeof testObject.a)
      expect(typeof value.b).toBe(typeof testObject.b)
      expect(typeof value.c).toBe(typeof testObject.c)
    })

    it('it should returned nested date as date string', () => {
      const withDate = {
        date: new Date(),
        d: { date: new Date() }
      }
      cache.set('a', withDate, '1s')
      const value = cache.get('a') as typeof withDate

      expect(typeof value.date).toBe('string')
      expect(typeof value.d.date).toBe('string')
    })

    it('it must return type Date, and ms must equal', () => {
      const date = new Date('1972')
      cache.set('a', date, '1s')
      const value = cache.get('a') as Date

      expect(value).toBeInstanceOf(Date)
      expect(value.getTime()).toBe(date.getTime())
      expect(value.getTime()).not.toBe(new Date().getTime())
      expect(value.getFullYear()).toBe(1972)
    })

    it('it must return date with time NaN on invalid date', () => {
      const date = new Date('invalid')
      cache.set('a', date, '1s')
      const value = cache.get('a') as Date

      expect(value).toBeInstanceOf(Date)
      expect(value.getTime()).toBe(NaN)
    })

    it('it must throw, when trying to store unserializable object', () => {
      class AGeter { a = '23'; get aGetter() { return '23' } }
      class APlain { a = '23' }

      const call1 = () => cache.set('a1', new Error(), '1s')
      const call2 = () => cache.set('a2', new AGeter(), '1s')
      const call3 = () => cache.set('a3', new APlain(), '1s')

      expect(call1).toThrow('e_obj_nonserializable')
      expect(call2).toThrow('e_obj_nonserializable')
      expect(call3).toThrow('e_obj_nonserializable')
    })
  })
})
