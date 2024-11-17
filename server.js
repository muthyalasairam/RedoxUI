const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const app = express();
const crypto = require('crypto');
const cors = require('cors');
app.use(cors());
require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let db;
// MySQL connection
function initializeDbConnection() {
  db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0,
    connectTimeout: 10000,
  });
  console.log('MySQL pool created');
}
initializeDbConnection();

async function retryQuery(query, params, attempts = 3) {
  return new Promise((resolve, reject) => {
    const executeQuery = (attemptsLeft) => {
      db.query(query, params, (err, results) => {
        if (err) {
          const connectionErrors = ['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'ER_SERVER_LOST', 'ER_CONN_REFUSED'];
          if (connectionErrors.includes(err.code) && attemptsLeft > 0) {
            console.warn(`Database connection error (${err.code}). Retrying... Attempts left: ${attemptsLeft - 1}`);
            setTimeout(() => {
              if (attemptsLeft === 1) {
                console.log('Reinitializing MySQL pool connection...');
                initializeDbConnection();
              }
              executeQuery(attemptsLeft - 1);
            }, 1000);
          } else {
            reject(err);
          }
        } else {
          resolve(results);
        }
      });
    };
    executeQuery(attempts);
  });
}

// Register endpoint (no authentication needed)
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);
  const query = 'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)';

  try {
    await retryQuery(query, [username, hashedPassword, role]);
    res.status(200).send('User registered successfully');
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('There was a problem registering the user');
  }
});

// Login endpoint (no authentication needed)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ?';

  try {
    const results = await retryQuery(query, [username]);
    if (!results.length) return res.status(404).send('No user found');
    res.status(200).send({ auth: true });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Error on the server');
  }
});

// GET endpoint for level1questions (no authentication required)
app.get('/level1questions', async (req, res) => {
  const query = 'SELECT * FROM level1questions';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem finding the questions' });
  }
});

// POST endpoint to add level1questions (no authentication required)
app.post('/level1questions', async (req, res) => {
  const { question_text, options } = req.body;
  const query = 'INSERT INTO level1questions (question_text, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) VALUES (?, ?, ?, ?, ?)';

  try {
    await retryQuery(query, [question_text, options[0], options[1], options[2], options[3]]);
    res.status(200).json({ message: 'Question added successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem adding the question' });
  }
});

// PUT endpoint to update level1questions (no authentication required)
app.put('/level1questions/:id', async (req, res) => {
  const { question_text, options } = req.body;
  const query = 'UPDATE level1questions SET question_text = ?, correctOption = ?, incorrectOption1 = ?, incorrectOption2 = ?, incorrectOption3 = ? WHERE id = ?';

  try {
    await retryQuery(query, [question_text, options[0], options[1], options[2], options[3], req.params.id]);
    res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem updating the question' });
  }
});

// DELETE endpoint to remove level1questions (no authentication required)
app.delete('/level1questions/:id', async (req, res) => {
  const query = 'DELETE FROM level1questions WHERE id = ?';

  try {
    await retryQuery(query, [req.params.id]);
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem deleting the question' });
  }
});

// GET endpoint for level3questions
app.get('/level3questions', async (req, res) => {
  const query = 'SELECT * FROM level3questions';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem finding the questions' });
  }
});


app.get('/level4questions', async (req, res) => {
  const query = 'SELECT * FROM level4questionspart1';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem finding the questions' });
  }
});


app.get('/level5questions', async (req, res) => {
  const query = 'SELECT * FROM level4questionspart2';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem finding the questions' });
  }
});


// POST endpoint to add level3questions
app.post('/level3questions', async (req, res) => {
  const { question_text, options } = req.body;
  const query = 'INSERT INTO level3questions (question_text, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) VALUES (?, ?, ?, ?, ?)';

  try {
    await retryQuery(query, [question_text, options[0], options[1], options[2], options[3]]);
    res.status(200).json({ message: 'Question added successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem adding the question' });
  }
});

app.post('/level4questions', async (req, res) => {
  const { question_text, equation,correctOption,options } = req.body;
  const optionsJson = JSON.stringify(options);
  const query = 'INSERT INTO level4questionspart1 (question_text, equation, correctOption, options) VALUES (?, ?, ?, ?)';

  try {
    await retryQuery(query, [question_text, equation,correctOption,optionsJson]);
    res.status(200).json({ message: 'Question added successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem adding the question' });
  }
});

app.post('/level5questions', async (req, res) => {
  const { question_text, equation,correctOption, options } = req.body;
  const optionsJson = JSON.stringify(options);
  const query = 'INSERT INTO level4questionspart2 (question_text, equation, correctOption, options) VALUES (?, ?, ?, ?)';

  try {
    await retryQuery(query, [question_text, equation,correctOption,optionsJson]);
    res.status(200).json({ message: 'Question added successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem adding the question' });
  }
});

// PUT endpoint to update level3questions
app.put('/level3questions/:id', async (req, res) => {
  const { question_text, options } = req.body;
 
  const query = 'UPDATE level3questions SET question_text = ?, correctOption = ?, incorrectOption1 = ?, incorrectOption2 = ?, incorrectOption3 = ? WHERE id = ?';

  try {
    await retryQuery(query, [question_text, options[0], options[1], options[2], options[3], req.params.id]);
    res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem updating the question' });
  }
});

app.put('/level4questions/:id', async (req, res) => {
  const { question_text, equation,correctOption,options } = req.body;
  const optionsJson = JSON.stringify(options);
  console.log(equation)
  const query = 'UPDATE level4questionspart1 SET question_text = ?, equation = ?, correctOption = ?, options = ? WHERE id = ?';

  try {
    await retryQuery(query, [question_text, equation,correctOption,optionsJson, req.params.id]);
    res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem updating the question' });
  }
});


app.put('/level5questions/:id', async (req, res) => {
  const { question_text, equation,correctOption,options } = req.body;
  const query = 'UPDATE level4questionspart2 SET question_text = ?, equation = ?, correctOption = ?, options = ? WHERE id = ?';
  const optionsJson = JSON.stringify(options);
  try {
    await retryQuery(query, [question_text, equation,correctOption,optionsJson, req.params.id]);
    res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem updating the question' });
  }
});

// DELETE endpoint to remove level3questions
app.delete('/level3questions/:id', async (req, res) => {
  const query = 'DELETE FROM level3questions WHERE id = ?';

  try {
    await retryQuery(query, [req.params.id]);
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem deleting the question' });
  }
});

app.delete('/level4questions/:id', async (req, res) => {
  const query = 'DELETE FROM level4questionspart1 WHERE id = ?';

  try {
    await retryQuery(query, [req.params.id]);
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem deleting the question' });
  }
});
app.delete('/level5questions/:id', async (req, res) => {
  const query = 'DELETE FROM level4questionspart2 WHERE id = ?';

  try {
    await retryQuery(query, [req.params.id]);
    res.status(200).json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem deleting the question' });
  }
});
// Register Game User endpoint
app.post('/registerGameUser', async (req, res) => {
  const { firstName, lastName, email,section } = req.body;
  const query = `INSERT INTO gameusers (Email, Level1Score, Level2Score, Level3Score, Level4Score, FirstName, LastName,section) VALUES (?, 0, 0, 0, 0, ?, ?,?)`;

  try {
    await retryQuery(query, [email, firstName, lastName,section]);
    res.status(200).json({ message: 'Student registered successfully', name: `${firstName} ${lastName}` });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Error registering the student');
  }
});

// GET user progress endpoint
app.get('/get_user_progress/:email', async (req, res) => {
  const query = `SELECT Level1Score, Level2Score, Level3Score FROM gameusers WHERE Email = ?`;

  try {
    const results = await retryQuery(query, [req.params.email]);
    if (results.length > 0) {
      res.status(200).json(results[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching progress' });
  }
});

// POST to update score
app.post('/update_score', async (req, res) => {
  const { email, score, level } = req.body;
  let query;

  if (level === 'level1score') {
    query = 'UPDATE gameusers SET Level1Score = ? WHERE email = ? AND (Level1Score < ? OR Level1Score IS NULL)';
  } else if (level === 'level2score') {
    query = 'UPDATE gameusers SET Level2Score = ? WHERE email = ? AND (Level2Score < ? OR Level2Score IS NULL)';
  } else if (level === 'level3score') {
    query = 'UPDATE gameusers SET Level3Score = ? WHERE email = ? AND (Level3Score < ? OR Level3Score IS NULL)';
  } else {
    return res.status(400).json({ message: 'Invalid level' });
  }

  try {
    const result = await retryQuery(query, [score, email, score]);
    if (result.affectedRows > 0) {
      res.status(200).json({ message: `Score for ${level} updated successfully` });
    } else {
      res.status(404).json({ message: 'User not found or score is not higher' });
    }
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error updating score' });
  }
});

// GET all user info
app.get('/get_all_user_info', async (req, res) => {
  const query = 'SELECT FirstName, LastName, Level1Score, Level2Score, Level3Score, Level4Score,section FROM gameusers';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching user info' });
  }
});

// GET all user info
app.get('/sections', async (req, res) => {
  const query = 'SELECT * from sections';

  try {
    const results = await retryQuery(query, []);
    res.status(200).json(results);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Error fetching sections'});
  }
});

app.put('/sections', async (req, res) => {
  const { section1, section2, section3, section4 } = req.body;
  const query = `
      UPDATE sections SET
      section1 = ?,
      section2 = ?,
      section3 = ?,
      section4 = ?
      WHERE id = 1
  `;
  try {
    await retryQuery(query, [section1, section2,section3,section4]);
    res.status(200).json({ message: 'Codes updated successfully' });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'There was a problem updating the code' });
  }
});

// Game stats endpoint
app.get('/game/stats', async (req, res) => {
  const stats = {};
  try {
    const totalStudents = await retryQuery('SELECT COUNT(*) as total_students FROM gameusers', []);
    stats.total_students = totalStudents[0].total_students;

    const level1Completed = await retryQuery('SELECT COUNT(*) as level1_completed FROM gameusers WHERE Level1Score >= 70', []);
    stats.level1_completed = level1Completed[0].level1_completed;

    const level2Completed = await retryQuery('SELECT COUNT(*) as level2_completed FROM gameusers WHERE Level2Score >= 70', []);
    stats.level2_completed = level2Completed[0].level2_completed;

    const level3Completed = await retryQuery('SELECT COUNT(*) as level3_completed FROM gameusers WHERE Level3Score >= 70', []);
    stats.level3_completed = level3Completed[0].level3_completed;

    const level4Completed = await retryQuery('SELECT COUNT(*) as level4_completed FROM gameusers WHERE Level4Score >= 70', []);
    stats.level4_completed = level4Completed[0].level4_completed;

    res.status(200).json(stats);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
