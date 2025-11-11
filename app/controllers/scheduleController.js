const Schedule = require('../models/scheduleModel')
const Tag = require('../models/tagModel')
const mongoose = require('mongoose')
const { parseHMToMinutes, hasOverlapWithList } = require('../utils/timeUtils')
const { computeModules } = require('../utils/scheduleUtils')

// Crear un horario
async function createSchedule(req, res){
  try{
    const s = new Schedule(req.body)
    const saved = await s.save()
    return res.status(201).send({ message: 'Horario creado', schedule: saved })
  }catch(e){
    return res.status(400).send({ message: 'Error creando horario', e })
  }
}

async function listSchedules(req, res){
  try{
    const list = await Schedule.find({})
    return res.status(200).send({ schedules: list })
  }catch(e){
    return res.status(500).send({ message: 'Error listando horarios', e })
  }
}

async function getSchedule(req, res){
  try{
    const s = await Schedule.findById(req.params.id).populate('blocks.tag')
    if(!s) return res.status(404).send({ message: 'Horario no encontrado' })
    return res.status(200).send({ schedule: s })
  }catch(e){
    return res.status(400).send({ message: 'Error obteniendo horario', e })
  }
}

async function deleteSchedule(req, res){
  try{
    await Schedule.findByIdAndDelete(req.params.id)
    return res.status(200).send({ message: 'Horario eliminado' })
  }catch(e){
    return res.status(400).send({ message: 'Error eliminando horario', e })
  }
}

async function updateSchedule(req, res){
  try{
    const data = req.body
    const schedule = await Schedule.findById(req.params.id)
    if(!schedule) return res.status(404).send({ message: 'Horario no encontrado' })
    // permitir actualizar campos básicos (name, user)
    schedule.name = data.name ?? schedule.name
    schedule.user = data.user ?? schedule.user
    // no permitir reemplazar blocks directamente por este endpoint
    await schedule.save()
    return res.status(200).send({ message: 'Horario actualizado', schedule })
  }catch(e){
    return res.status(400).send({ message: 'Error actualizando horario', e })
  }
}

async function addBlock(req, res){
  try{
    const schedule = await Schedule.findById(req.params.id)
    if(!schedule) return res.status(404).send({ message: 'Horario no encontrado' })
    const newBlock = req.body
    // validar campos start/end
    const sMin = parseHMToMinutes(newBlock.start)
    const eMin = parseHMToMinutes(newBlock.end)
    if (sMin === null || eMin === null) return res.status(400).send({ message: 'Formato de hora inválido, usar HH:mm' })
    if (sMin === eMin) return res.status(400).send({ message: 'El inicio y fin no pueden ser iguales' })
  // verificar superposición considerando medianoche y devolver detalles de conflicto
  const conflicts = require('../utils/timeUtils').findOverlaps(schedule.blocks, newBlock)
  if (conflicts && conflicts.length) return res.status(409).send({ message: 'El bloque se solapa con otro existente', conflictingBlocks: conflicts.map(b => ({ id: b._id, day: b.day, start: b.start, end: b.end, title: b.title })) })
    schedule.blocks.push(newBlock)
    await schedule.save()
    return res.status(201).send({ message: 'Bloque agregado', schedule })
  }catch(e){
    return res.status(400).send({ message: 'Error agregando bloque', e })
  }
}

async function removeBlock(req, res){
  try{
    const schedule = await Schedule.findById(req.params.id)
    if(!schedule) return res.status(404).send({ message: 'Horario no encontrado' })
    const blockId = req.params.blockId
  const block = schedule.blocks.id(blockId)
  if (!block) return res.status(404).send({ message: 'Bloque no encontrado' })
  // eliminar usando filter para evitar problemas con subdocument.remove en algunos contextos
  const before = schedule.blocks.length
  schedule.blocks = schedule.blocks.filter(b => b._id.toString() !== blockId.toString())
  if (schedule.blocks.length === before) return res.status(404).send({ message: 'Bloque no encontrado' })
  await schedule.save()
  return res.status(200).send({ message: 'Bloque eliminado', schedule })
  }catch(e){
    return res.status(400).send({ message: 'Error eliminando bloque', e })
  }
}

async function updateBlock(req, res){
  try{
    const schedule = await Schedule.findById(req.params.id)
    if(!schedule) return res.status(404).send({ message: 'Horario no encontrado' })
    const block = schedule.blocks.id(req.params.blockId)
    if(!block) return res.status(404).send({ message: 'Bloque no encontrado' })
  const newData = req.body
  // construir candidate para ver solapamiento (excluir el mismo bloque)
  const candidate = { day: newData.day ?? block.day, start: newData.start ?? block.start, end: newData.end ?? block.end }
  const sMin = parseHMToMinutes(candidate.start)
  const eMin = parseHMToMinutes(candidate.end)
  if (sMin === null || eMin === null) return res.status(400).send({ message: 'Formato de hora inválido, usar HH:mm' })
  if (sMin === eMin) return res.status(400).send({ message: 'El inicio y fin no pueden ser iguales' })
  const otherBlocks = schedule.blocks.filter(b => b._id.toString() !== block._id.toString())
  const conflicts = require('../utils/timeUtils').findOverlaps(otherBlocks, candidate)
  if (conflicts && conflicts.length) return res.status(409).send({ message: 'El bloque actualizado se solapa', conflictingBlocks: conflicts.map(b => ({ id: b._id, day: b.day, start: b.start, end: b.end, title: b.title })) })
    block.title = newData.title ?? block.title
    block.day = newData.day ?? block.day
    block.start = newData.start ?? block.start
    block.end = newData.end ?? block.end
    block.tag = newData.tag ?? block.tag
    await schedule.save()
    return res.status(200).send({ message: 'Bloque actualizado', schedule })
  }catch(e){
    return res.status(400).send({ message: 'Error actualizando bloque', e })
  }
}

// Determina módulo anterior/actual/siguiente para un horario dado
async function currentModule(req, res){
  try{
    const schedule = await Schedule.findById(req.params.id).populate('blocks.tag')
    if(!schedule) return res.status(404).send({ message: 'Horario no encontrado' })

    const nowParam = req.query.now // opcional ISO string
    const now = nowParam ? new Date(nowParam) : new Date()
    if (isNaN(now.getTime())) return res.status(400).send({ message: 'Parametro now inválido' })

    const result = computeModules(schedule, now)
    if (!result.previous && !result.current && !result.next) return res.status(200).send({ message: 'No hay actividades en este horario' })
    return res.status(200).send({ ...result, now: now.toISOString() })

  }catch(e){
    return res.status(400).send({ message: 'Error calculando módulo actual', e })
  }
}

// CRUD sencillo para tags
async function createTag(req,res){
  try{ const t = new Tag(req.body); await t.save(); return res.status(201).send({ tag: t }) }catch(e){ return res.status(400).send({ e }) }
}
async function listTags(req,res){ try{ const t = await Tag.find({}); return res.status(200).send({ tags: t }) }catch(e){ return res.status(500).send({ e }) } }

async function updateTag(req, res){
  try{
    const t = await Tag.findById(req.params.id)
    if(!t) return res.status(404).send({ message: 'Tag no encontrado' })
    const data = req.body
    t.name = data.name ?? t.name
    t.color = data.color ?? t.color
    t.description = data.description ?? t.description
    await t.save()
    return res.status(200).send({ message: 'Tag actualizado', tag: t })
  }catch(e){
    return res.status(400).send({ message: 'Error actualizando tag', e })
  }
}

async function deleteTag(req, res){
  try{
    const t = await Tag.findById(req.params.id)
    if(!t) return res.status(404).send({ message: 'Tag no encontrado' })
    const tagId = t._id
    await Tag.deleteOne({ _id: tagId })
    // limpiar referencias en schedules: establecer tag a null en bloques que lo referencian
    await Schedule.updateMany(
      { 'blocks.tag': tagId },
      { $set: { 'blocks.$[elem].tag': null } },
      { arrayFilters: [{ 'elem.tag': tagId }] }
    )
    return res.status(200).send({ message: 'Tag eliminado' })
  }catch(e){
    return res.status(400).send({ message: 'Error eliminando tag', e })
  }
}

module.exports = {
  createSchedule, listSchedules, getSchedule, deleteSchedule, updateSchedule,
  addBlock, removeBlock, updateBlock, currentModule,
  createTag, listTags,
  updateTag, deleteTag
}
