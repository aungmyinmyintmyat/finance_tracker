require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const authMiddleware = require('./middleware/auth');

//allow frontend<-->backend
// app.use(cors({
//     origin: '*',
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(cors({
//     origin: 'http://127.0.0.1:5500',
//     credentials: true
// }));
// app.use(express.json());

app.use(cors());
//main api to call
app.get('/api', (req, res) => {
    res.json({
        message: "Welcome to the Finance API",
        endpoints: ["/auth", "/finance", "/budget", "/check"]
    });
});

//health-check
app.get('/api/check', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is running' });
});

// Routes
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const budgetRoutes = require('./routes/budget');

app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/budget', budgetRoutes);

//Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server active on port ${PORT}`);
    console.log(`Database Host: ${process.env.DB_HOST}`);
});