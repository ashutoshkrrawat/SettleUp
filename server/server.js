require('dotenv').config(); //environment varaibles loading
const express = require('express')
const mongoose = require('mongoose')
const {connectDB} = require('./config/db')

//connecting database
connectDB()

const app = express()
app.use(express.json());

app.get('/home', (req, res)=>{
    res.json({status: "OK", message: "servere is running"});
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`)
})