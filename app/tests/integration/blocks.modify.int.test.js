const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../../app')

let mongoServer
let token

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  const uri = mongoServer.getUri()
  await mongoose.connect(uri)
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongoServer) await mongoServer.stop()
})

beforeEach(async () => {
  const collections = Object.keys(mongoose.connection.collections)
  for (const name of collections) {
    await mongoose.connection.collections[name].deleteMany({})
  }
  // crear usuario de prueba y obtener token
  await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'secret123' })
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'secret123' })
  token = loginRes.body.token
})

test('PUT /api/schedules/:id/blocks/:blockId actualiza bloque no conflictivo', async () => {
  const createRes = await request(app).post('/api/schedules').set('Authorization', `Bearer ${token}`).send({ name: 'Horario PUT' }).expect(201)
  const scheduleId = createRes.body.schedule._id

  const addRes = await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ day: 1, start: '08:00', end: '10:00', title: 'Origen' })
    .expect(201)

  const blockId = addRes.body.schedule.blocks[0]._id

  // actualizar a un horario que no genera conflicto
  const putRes = await request(app)
    .put(`/api/schedules/${scheduleId}/blocks/${blockId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ start: '07:00', end: '09:00', title: 'Actualizado' })
    .expect(200)

  expect(putRes.body.schedule).toBeDefined()
  const updated = putRes.body.schedule.blocks.find(b => b._id === blockId)
  expect(updated.title).toBe('Actualizado')
  expect(updated.start).toBe('07:00')
})

test('PUT devuelve 409 cuando la actualización provoca solapamiento', async () => {
  const createRes = await request(app).post('/api/schedules').set('Authorization', `Bearer ${token}`).send({ name: 'Horario PUT Conflicto' }).expect(201)
  const scheduleId = createRes.body.schedule._id

  // dos bloques
  const r1 = await request(app).post(`/api/schedules/${scheduleId}/blocks`).set('Authorization', `Bearer ${token}`).send({ day:1, start: '08:00', end: '10:00', title: 'A' }).expect(201)
  const r2 = await request(app).post(`/api/schedules/${scheduleId}/blocks`).set('Authorization', `Bearer ${token}`).send({ day:1, start: '10:30', end: '12:00', title: 'B' }).expect(201)

  const blockBId = r2.body.schedule.blocks.find(b => b.title === 'B')._id

  // intentar mover B para que choque con A
  const conflict = await request(app)
    .put(`/api/schedules/${scheduleId}/blocks/${blockBId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ start: '09:00', end: '11:00' })
    .expect(409)

  expect(conflict.body).toHaveProperty('conflictingBlocks')
  expect(conflict.body.conflictingBlocks.some(cb => cb.title === 'A')).toBe(true)
})

test('DELETE /api/schedules/:id/blocks/:blockId elimina el bloque', async () => {
  const createRes = await request(app).post('/api/schedules').set('Authorization', `Bearer ${token}`).send({ name: 'Horario DELETE' }).expect(201)
  const scheduleId = createRes.body.schedule._id

  const addRes = await request(app).post(`/api/schedules/${scheduleId}/blocks`).set('Authorization', `Bearer ${token}`).send({ day:1, start:'08:00', end:'10:00', title:'ToDelete' }).expect(201)
  const blockId = addRes.body.schedule.blocks[0]._id

  const delRes = await request(app).delete(`/api/schedules/${scheduleId}/blocks/${blockId}`).set('Authorization', `Bearer ${token}`).expect(200)
  expect(delRes.body.schedule).toBeDefined()
  expect(delRes.body.schedule.blocks.length).toBe(0)
})

test('Tags: POST /api/tags y GET /api/tags', async () => {
  const tagRes = await request(app).post('/api/tags').send({ name: 'Matemáticas', color: '#ff0000' }).expect(201)
  expect(tagRes.body.tag).toBeDefined()
  const listRes = await request(app).get('/api/tags').expect(200)
  expect(Array.isArray(listRes.body.tags)).toBe(true)
  expect(listRes.body.tags.length).toBe(1)
  expect(listRes.body.tags[0].name).toBe('Matemáticas')
})
