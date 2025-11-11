const mongoose = require('mongoose')

const tagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#1976D2' },
  description: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Tag', tagSchema)
