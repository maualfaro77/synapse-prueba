const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../../app') // app/app.js exports the express app

let mongoServer
let token

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
  // registrar usuario de prueba y obtener token
  await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'secret123' })
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'secret123' })
  token = loginRes.body.token
})

test('PUT /api/tags/:id actualiza un tag', async () => {
  const createRes = await request(app)
    .post('/api/tags')
    .send({ name: 'Original', color: '#111111', description: 'antes' })
    .expect(201)
  const tagId = createRes.body.tag._id

  const updateRes = await request(app)
    .put(`/api/tags/${tagId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Actualizado', description: 'despues' })
    .expect(200)

  expect(updateRes.body).toHaveProperty('tag')
  expect(updateRes.body.tag.name).toBe('Actualizado')
  expect(updateRes.body.tag.description).toBe('despues')
})

test('DELETE /api/tags/:id elimina tag y limpia referencias en schedules', async () => {
  // crear tag
  const createRes = await request(app)
    .post('/api/tags')
    .send({ name: 'ParaBorrar', color: '#222222' })
    .expect(201)
  const tagId = createRes.body.tag._id

  // crear schedule
  const sch = await request(app)
    .post('/api/schedules')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'SchParaTag' })
    .expect(201)
  const scheduleId = sch.body.schedule._id

  // agregar bloque referenciando el tag
  await request(app)
    .post(`/api/schedules/${scheduleId}/blocks`)
    .set('Authorization', `Bearer ${token}`)
    .send({ day: 1, start: '08:00', end: '09:00', title: 'ConTag', tag: tagId })
    .expect(201)

  // eliminar tag
  await request(app)
    .delete(`/api/tags/${tagId}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  // obtener schedule y verificar que el bloque ya no tiene tag (populate devuelve null)
  const g = await request(app)
    .get(`/api/schedules/${scheduleId}`)
    .expect(200)

  const blocks = g.body.schedule.blocks
  expect(blocks.length).toBeGreaterThan(0)
  expect(blocks[0].tag === null || blocks[0].tag === undefined).toBeTruthy()
})
