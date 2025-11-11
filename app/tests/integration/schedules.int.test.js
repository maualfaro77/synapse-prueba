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
  await request(app).post('/api/auth/register').send({ email: 'test@example.com', password: 'secret123' })
  const loginRes = await request(app).post('/api/auth/login').send({ email: 'test@example.com', password: 'secret123' })
  token = loginRes.body.token
})

test('PUT /api/schedules/:id actualiza nombre del schedule', async () => {
  const createRes = await request(app).post('/api/schedules').set('Authorization', `Bearer ${token}`).send({ name: 'Horario Inicial' }).expect(201)
  const scheduleId = createRes.body.schedule._id

  const putRes = await request(app).put(`/api/schedules/${scheduleId}`).set('Authorization', `Bearer ${token}`).send({ name: 'Horario Actualizado' }).expect(200)
  expect(putRes.body.schedule).toBeDefined()
  expect(putRes.body.schedule.name).toBe('Horario Actualizado')
})
