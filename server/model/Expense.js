const mongoose = require('mongoose')
const expenseSchema = new mongoose.Schema({
    group:{
        type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: [true, 'Expense must belong to a group']
    },
    paidBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Expense must have a payer']
    },
    description: {
        type: String,
        required: [true, 'Please add a description for the expense'],
        trim: true
    },
    amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be greater than 0']
    },
    splitType: {
    type: String,
    enum: ['EQUAL', 'PERCENT', 'EXACT'],
    default: 'EQUAL'
  },
  splits: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Owed amount cannot be negative']
      },
      // Optional: Store percentage if splitType is PERCENT
      percentage: {
        type: Number,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100']
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }

}, {timestamps: true})

module.exports = mongoose.model('Expense', expenseSchema);