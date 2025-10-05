const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true, trim: true },
  description: { type: String, trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state: { type: String, enum: ['draft','published'], default: 'draft' },
  read_count: { type: Number, default: 0 },
  reading_time: { type: Number, default: 0 }, // minutes
  tags: { type: [String], default: [] },
  body: { type: String, required: true }
 // 
}, { timestamps: { createdAt: 'timestamp', updatedAt: 'updatedAt' } });

module.exports = mongoose.model('Blog', BlogSchema);
