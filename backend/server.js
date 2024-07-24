// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Update leaderboard table structure
db.query(`
  CREATE TABLE IF NOT EXISTS leaderboard (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(255) NOT NULL,
    member_names TEXT NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

app.get('/api/questions', (req, res) => {
  const query = 'SELECT * FROM questions ORDER BY RAND() LIMIT 10';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching questions' });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/leaderboard', (req, res) => {
  const query = 'SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error fetching leaderboard' });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/leaderboard', (req, res) => {
  const { team_name, member_names, score } = req.body;
  const query = 'INSERT INTO leaderboard (team_name, member_names, score) VALUES (?, ?, ?)';
  db.query(query, [team_name, JSON.stringify(member_names), score], (err, result) => {
    if (err) {
      res.status(500).json({ error: 'Error adding score to leaderboard' });
    } else {
      res.json({ message: 'Score added successfully', id: result.insertId });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
