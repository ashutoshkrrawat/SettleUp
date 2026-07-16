const mongoose = require('mongoose');
const GroupSchema = new mongoose.Schema({
     name: {
    type: String,
    required: [true, 'Please add a group name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  members:[
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Option B: Storing cached running balances for fast reads
  balances: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      balance: {
        type: Number,
        default: 0 // Starts at 0. Positive = owed money, Negative = owes money
      }
    }
  ]
}, {timestamps: true});

module.exports = mongoose.model('Group', GroupSchema);