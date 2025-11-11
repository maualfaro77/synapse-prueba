const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../../app') // app/app.js exports the express app

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})

beforeEach(async () => {
  // limpiar colecciones
  const collections = Object.keys(mongoose.connection.collections)
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({})
  }
})

test('POST /api/schedules/:id/blocks devuelve 409 y conflictingBlocks cuando hay solapamiento', async () => {
  // crear horario
  const createRes = await request(app)
    .post('/api/schedules')
    .send({ name: 'Horario Test' })
    .expect(201)
  const scheduleId = createRes.body.schedule._id

  // agregar bloque inicial
  await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .send({ day: 1, start: '08:00', end: '10:00', title: 'Clase A' })
    .expect(201)

  // intentar agregar bloque que se solapa
  const conflictRes = await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .send({ day: 1, start: '09:00', end: '09:30', title: 'Solapado' })
    .expect(409)

  expect(conflictRes.body).toHaveProperty('conflictingBlocks')
  expect(Array.isArray(conflictRes.body.conflictingBlocks)).toBe(true)
  expect(conflictRes.body.conflictingBlocks.length).toBeGreaterThan(0)
  expect(conflictRes.body.conflictingBlocks[0]).toMatchObject({ day: 1, start: '08:00', end: '10:00' })
})

test('Detecta conflicto con bloque que cruza medianoche', async () => {
  const createRes = await request(app)
    .post('/api/schedules')
    .send({ name: 'Horario Noche' })
    .expect(201)
  const scheduleId = createRes.body.schedule._id

  // bloque que cruza medianoche
  await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .send({ day: 1, start: '22:00', end: '02:00', title: 'Turno Noche' })
    .expect(201)

  // conflicto en día 1 noche
  const r1 = await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .send({ day: 1, start: '23:00', end: '23:30', title: 'Overlap Noche' })
    .expect(409)
  expect(r1.body.conflictingBlocks.length).toBeGreaterThan(0)

  // conflicto en día 2 madrugada
  const r2 = await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .send({ day: 2, start: '01:00', end: '01:30', title: 'Overlap Madrugada' })
    .expect(409)
  expect(r2.body.conflictingBlocks.length).toBeGreaterThan(0)
})
