const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- 1. Import bcryptjs

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

// <-- 2. Encrypt password using bcrypt before saving to DB
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// <-- 3. Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
