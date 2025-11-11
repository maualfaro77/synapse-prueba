const express = require('express')
const router = express.Router()
const ctrl = require('../controllers/scheduleController')
const auth = require('../middleware/auth')

// tags
router.post('/tags', ctrl.createTag)
router.get('/tags', ctrl.listTags)

// schedules
// crear schedule requiere autenticación
router.post('/schedules', auth, ctrl.createSchedule)
router.get('/schedules', ctrl.listSchedules)
router.get('/schedules/:id', ctrl.getSchedule)
router.put('/schedules/:id', auth, ctrl.updateSchedule)
router.delete('/schedules/:id', ctrl.deleteSchedule)

// blocks inside schedules
// modificar bloques requiere autenticación
router.post('/schedules/:id/blocks', auth, ctrl.addBlock)
router.put('/schedules/:id/blocks/:blockId', auth, ctrl.updateBlock)
router.delete('/schedules/:id/blocks/:blockId', auth, ctrl.removeBlock)

// current module
router.get('/schedules/:id/current', ctrl.currentModule)

module.exports = router
