const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/scheduleController')

// tags
router.post('/tags', ctrl.createTag)
router.get('/tags', ctrl.listTags)

// schedules
router.post('/schedules', ctrl.createSchedule)
router.get('/schedules', ctrl.listSchedules)
router.get('/schedules/:id', ctrl.getSchedule)
router.delete('/schedules/:id', ctrl.deleteSchedule)

// blocks inside schedules
router.post('/schedules/:id/blocks', ctrl.addBlock)
router.put('/schedules/:id/blocks/:blockId', ctrl.updateBlock)
router.delete('/schedules/:id/blocks/:blockId', ctrl.removeBlock)

// current module
router.get('/schedules/:id/current', ctrl.currentModule)

module.exports = router
