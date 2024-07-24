// backend/server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Change this line
const db = mysql.createConnection(process.env.DATABASE_URL);

// Add error handling for database connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database successfully');

  // Move this inside the connect callback
  db.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_name VARCHAR(255) NOT NULL,
      member_names TEXT NOT NULL,
      score INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating leaderboard table:', err);
    } else {
      console.log('Leaderboard table created or already exists');
    }
  });
});

app.get('/api/questions', (req, res) => {
  const query = 'SELECT * FROM questions ORDER BY RAND() LIMIT 10';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching questions:', err);
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
      console.error('Error fetching leaderboard:', err);
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
      console.error('Error adding score to leaderboard:', err);
      res.status(500).json({ error: 'Error adding score to leaderboard' });
    } else {
      res.json({ message: 'Score added successfully', id: result.insertId });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
