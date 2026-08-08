require('dotenv').config(); // environment variables loading
const express = require('express');
const http = require('http'); // Node native HTTP module
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/group');
const expenseRoutes = require('./routes/expense');
const { initReminderWorker } = require('./config/reminderWorker');

// connecting database
connectDB();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/home', (req, res) => {
    res.json({ status: "OK", message: "server is running" });
});

// Wrap express app in HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start BullMQ Background Worker
initReminderWorker();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
