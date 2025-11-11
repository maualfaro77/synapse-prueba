const { findOverlaps } = require('../utils/timeUtils')

test('findOverlaps retorna bloques que colisionan (mismo día)', () => {
  const blocks = [
    { _id: 'a', day: 1, start: '08:00', end: '10:00', title: 'A' },
    { _id: 'b', day: 1, start: '10:30', end: '12:00', title: 'B' }
  ]
  const conflicts = findOverlaps(blocks, { day:1, start: '09:00', end: '09:30' })
  expect(conflicts.length).toBe(1)
  expect(conflicts[0]._id).toBe('a')
})

test('findOverlaps detecta conflicto con bloque que cruza medianoche', () => {
  const blocks = [ { _id: 'x', day: 1, start: '22:00', end: '02:00', title: 'Noche' } ]
  // overlap late night on day 1
  const c1 = findOverlaps(blocks, { day:1, start: '23:00', end: '23:30' })
  expect(c1.length).toBe(1)
  // overlap early morning on day 2
  const c2 = findOverlaps(blocks, { day:2, start: '01:00', end: '01:30' })
  expect(c2.length).toBe(1)
  // no overlap after end
  const c3 = findOverlaps(blocks, { day:2, start: '02:00', end: '03:00' })
  expect(c3.length).toBe(0)
})
