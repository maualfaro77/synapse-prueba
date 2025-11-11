const { parseHMToMinutes, overlaps, hasOverlapWithList } = require('../utils/timeUtils')
const { blockToIntervals } = require('../utils/timeUtils')

test('parseHMToMinutes convierte HH:mm a minutos', () => {
  expect(parseHMToMinutes('00:00')).toBe(0)
  expect(parseHMToMinutes('01:30')).toBe(90)
  expect(parseHMToMinutes('23:59')).toBe(23*60+59)
  expect(parseHMToMinutes('invalid')).toBeNull()
})

test('overlaps detecta solapamientos correctamente', () => {
  expect(overlaps(60,120,30,70)).toBe(true) // partial
  expect(overlaps(60,120,120,180)).toBe(false) // touch at boundary
  expect(overlaps(60,120,30,60)).toBe(false)
  expect(overlaps(60,120,80,100)).toBe(true)
})

test('hasOverlapWithList detecta solapamiento dentro de una lista de bloques', () => {
  const blocks = [
    { day: 1, start: '08:00', end: '10:00' },
    { day: 1, start: '10:30', end: '12:00' }
  ]
  expect(hasOverlapWithList(blocks, { day: 1, start: '09:00', end: '09:30' })).toBe(true)
  expect(hasOverlapWithList(blocks, { day: 1, start: '10:00', end: '10:30' })).toBe(false)
  expect(hasOverlapWithList(blocks, { day: 2, start: '09:00', end: '09:30' })).toBe(false)
})

test('blockToIntervals y solapamiento con bloques que cruzan medianoche', () => {
  const crossing = { day: 1, start: '22:00', end: '02:00' }
  const intervals = blockToIntervals(crossing)
  expect(intervals.length).toBe(2)
  expect(intervals[0].day).toBe(1)
  expect(intervals[1].day).toBe(2)

  const blocks = [crossing]
  // overlap on same start day late night
  expect(hasOverlapWithList(blocks, { day: 1, start: '23:00', end: '23:30' })).toBe(true)
  // overlap on next day early morning
  expect(hasOverlapWithList(blocks, { day: 2, start: '01:00', end: '01:30' })).toBe(true)
  // no overlap just after end
  expect(hasOverlapWithList(blocks, { day: 2, start: '02:00', end: '03:00' })).toBe(false)
})
