const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// GET all budgets WITH live spending totals
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // This SQL "JOIN" query is the secret sauce. 
    // It pulls the budget limit AND sums up transactions for that category.
    const query = `
            SELECT 
                b.category_id, 
                c.name as category_name, 
                b.limit_amount,
                COALESCE(SUM(t.amount), 0) as spent_amount
            FROM budgets b
            JOIN categories c ON b.category_id = c.id
            LEFT JOIN transactions t ON b.user_id = t.user_id 
                AND b.category_id = t.category_id 
                AND t.type = 'expense'
            WHERE b.user_id = ?
            GROUP BY b.category_id, c.name, b.limit_amount
        `;

    const [rows] = await pool.query(query, [userId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SAVE/UPDATE a budget
router.post('/save', auth, async (req, res) => {
  const { category_id, limit_amount } = req.body;
  try {
    // ON DUPLICATE KEY UPDATE ensures that if the budget exists, it just updates the limit
    await pool.query(
      `INSERT INTO budgets (user_id, category_id, limit_amount) 
             VALUES (?, ?, ?) AS new_data
             ON DUPLICATE KEY UPDATE limit_amount = new_data.limit_amount`,
      [req.user.id, category_id, limit_amount]
    );
    res.json({ message: "Budget updated!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET categories filtered by type (income vs expense)
// URL Example: /api/budgets/categories?type=income
router.get('/categories', auth, async (req, res) => {
  try {
    // 1. Grab the type parameter from the query string (?type=income)
    // If they don't specify one, default to 'expense'
    const transactionType = req.query.type || 'expense';

    // 2. Query the database using your existing pool connection
    const query = 'SELECT id, name, icon FROM categories WHERE type = ?';
    const [rows] = await pool.query(query, [transactionType]);

    // 3. Return the filtered categories
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;