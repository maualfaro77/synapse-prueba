const mongoose = require('mongoose')

const blockSchema = new mongoose.Schema({
  title: { type: String },
  day: { type: Number, required: true, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday ... 6 = Saturday
  start: { type: String, required: true }, // HH:mm
  end: { type: String, required: true }, // HH:mm
  tag: { type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }
}, { _id: true })

const scheduleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  user: { type: String }, // optional user identifier (email/id)
  blocks: [blockSchema]
}, { timestamps: true })

module.exports = mongoose.model('Schedule', scheduleSchema)
