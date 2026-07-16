const mongoose = require('mongoose');

const UserSchema  = new mongoose.Schema ({
    name: {
        type: String,
        required:[true, 'Please add a name'],
        trim: true,
    },
    email:{
        type: String,
        required:[true, 'Please add a email'],
        unique: true,
         trim: true,
        match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
        ]
    },
    password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {timestamps: true});

module.exports = mongoose.model('User', UserSchema)