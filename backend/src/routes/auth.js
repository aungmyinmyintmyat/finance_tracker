const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  console.log("Register attempt:", req.body.username); // DEBUG LOG
  const { username, password, monthly_income, account_number } = req.body;

  // Get a single dedicated connection client from the pool to handle the transaction safely
  const connection = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Turn on the transaction lock
    await connection.beginTransaction();

    // 1. Create User
    const [userResult] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    const userId = userResult.insertId;

    // 2. Create Profile
    await pool.query(
      'INSERT INTO user_profiles (user_id, monthly_income, account_number) VALUES (?, ?, ?)',
      [userId, monthly_income || 0, account_number || null]
    );

    await connection.commit();
    res.status(201).json({ message: "User created!" });
  } catch (err) {
    // Fix: Roll back all partial modifications immediately if any step fails
    await connection.rollback();
    console.error("DB Error during registration:", err.message);
    res.status(500).json({ error: "Registration failed" });
  } finally {
    // Always return the connection handle back to the main engine pool
    connection.release();
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  console.log("Login attempt:", req.body.username); // DEBUG LOG
  const { username, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: users[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: { id: users[0].id, username: users[0].username }
    });
  } catch (err) {
    console.error("Login Crash:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

//profile
router.get('/profile', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT monthly_income, account_number FROM user_profiles WHERE user_id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Profile not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;