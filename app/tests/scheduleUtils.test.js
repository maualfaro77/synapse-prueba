const { computeModules } = require('../utils/scheduleUtils')

// helper to build schedule
function buildSchedule(blocks){
  return { blocks: blocks.map((b,i)=> ({ _id: `b${i}`, ...b })) }
}

test('computeModules encuentra módulo actual entre bloques', () => {
  const schedule = buildSchedule([
    { day: 1, start: '08:00', end: '10:00', title: 'Clase A' },
    { day: 1, start: '10:30', end: '12:00', title: 'Clase B' }
  ])
  const now = new Date('2025-11-03T09:00:00') // lunes = 1 (depending locale) -> JS: Mon is 1
  const res = computeModules(schedule, now)
  expect(res.current).not.toBeNull()
  expect(res.current.title).toBe('Clase A')
  expect(res.previous).toBeNull()
  expect(res.next.title).toBe('Clase B')
})

test('computeModules devuelve no actividades si no hay bloques', () => {
  const schedule = buildSchedule([])
  const now = new Date('2025-11-03T09:00:00')
  const res = computeModules(schedule, now)
  expect(res.current).toBeNull()
  expect(res.previous).toBeNull()
  expect(res.next).toBeNull()
})

test('computeModules encuentra siguiente cuando es tiempo posterior a todos los bloques de hoy', () => {
  const schedule = buildSchedule([
    { day: 1, start: '08:00', end: '10:00', title: 'Clase A' }
  ])
  const now = new Date('2025-11-03T18:00:00')
  const res = computeModules(schedule, now)
  // previous should be last today
  expect(res.previous).not.toBeNull()
  // next should be first block of next day (none in this schedule), so null
})
