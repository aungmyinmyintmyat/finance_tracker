const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 1. GET ALL TRANSACTIONS (Joined with Categories for the UI)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT t.*, c.name as category_name, c.icon 
             FROM transactions t
             JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ? 
             ORDER BY t.date DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching data' });
  }
});

// 2. ADD A TRANSACTION
router.post('/', auth, async (req, res) => {
  // Added category_id here to match your init.sql
  const { description, amount, type, date, category_id } = req.body;
  const userId = req.user.id;

  if (!description || !amount || !type || !date || !category_id) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    await pool.query(
      'INSERT INTO transactions (user_id, category_id, description, amount, type, date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, category_id, description, amount, type, date]
    );
    res.status(201).json({ message: 'Transaction added successfully' });
  } catch (error) {
    console.error("Finance Post Error:", error.message);
    res.status(500).json({ message: 'Error saving transaction' });
  }
});

module.exports = router;