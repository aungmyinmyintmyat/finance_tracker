const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306
});

// Fix: Prevent immediate pod crash by validating the pool connection handle safely
pool.getConnection((err, connection) => {
  if (err) {
    console.error('⚠️ Database is initializing... Backend will auto-retry connections on incoming API requests.');
  } else {
    console.log('✅ Database connection pool successfully initialized.');
    connection.release(); // Return the connection back to the pool immediately
  }
});

module.exports = pool.promise();