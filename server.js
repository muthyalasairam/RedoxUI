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

// MySQL connection
const db = mysql.createPool({
  host: process.env.DB_HOST,  
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 30,  // Increased limit
  queueLimit: 0,
  connectTimeout: 10000 
});


// Register endpoint (no authentication needed)
app.post('/register', (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const query = 'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, role], (err, result) => {
        if (err) return res.status(500).send('There was a problem registering the user');
        else console.log("My Sql users table")
        res.status(200).send('User registered successfully');
    });
});

// Login endpoint (no authentication needed)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';
    console.log(`Username login ${username}`);
    db.query(query, [username], (err, results) => {
        if (err) {
            console.log(err)
            return res.status(500).send('Error on the server');}
        else console.log("My Sql users table")
        if (!results.length) return res.status(404).send('No user found');
        
        const user = results[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        res.status(200).send({ auth: true });
    });
});

// GET endpoint for level1questions (no authentication required)
app.get('/level1questions', (req, res) => {
    db.query('SELECT * FROM level1questions', (err, results) => {
        if (err) return res.status(500).json({ error: 'There was a problem finding the questions' });
        else console.log("My Sql level1Questions table")
        res.status(200).json(results);
    });
});

// POST endpoint to add questions (no authentication required)
app.post('/level1questions', (req, res) => {
    const { question_text, options } = req.body;
    const query = 'INSERT INTO level1questions (question_text, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [question_text, options[0], options[1], options[2], options[3]], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem adding the question' });
        res.status(200).json({ message: 'Question added successfully' });
    });
});

// PUT endpoint to update questions (no authentication required)
app.put('/level1questions/:id', (req, res) => {
    const { question_text, options } = req.body;
    const query = 'UPDATE level1questions SET question_text = ?, correctOption = ?, incorrectOption1 = ?, incorrectOption2 = ?, incorrectOption3 = ? WHERE id = ?';
    db.query(query, [question_text, options[0], options[1], options[2], options[3], req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem updating the question' });
        res.status(200).json({ message: 'Question updated successfully' });
    });
});

// DELETE endpoint to remove questions (no authentication required)
app.delete('/level1questions/:id', (req, res) => {
    const query = 'DELETE FROM level1questions WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem deleting the question' });
        res.status(200).json({ message: 'Question deleted successfully' });
    });
});

app.get('/level3questions', (req, res) => {
    db.query('SELECT * FROM level3questions', (err, results) => {
        if (err) return res.status(500).json({ error: 'There was a problem finding the questions' });
        else console.log("My Sql level1Questions table")
        res.status(200).json(results);
    });
});

// POST endpoint to add questions (no authentication required)
app.post('/level3questions', (req, res) => {
    const { question_text, options } = req.body;
    const query = 'INSERT INTO level3questions (question_text, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [question_text, options[0], options[1], options[2], options[3]], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem adding the question' });
        res.status(200).json({ message: 'Question added successfully' });
    });
});

// PUT endpoint to update questions (no authentication required)
app.put('/level3questions/:id', (req, res) => {
    const { question_text, options } = req.body;
    const query = 'UPDATE level3questions SET question_text = ?, correctOption = ?, incorrectOption1 = ?, incorrectOption2 = ?, incorrectOption3 = ? WHERE id = ?';
    db.query(query, [question_text, options[0], options[1], options[2], options[3], req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem updating the question' });
        res.status(200).json({ message: 'Question updated successfully' });
    });
});

// DELETE endpoint to remove questions (no authentication required)
app.delete('/level3questions/:id', (req, res) => {
    const query = 'DELETE FROM level3questions WHERE id = ?';
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'There was a problem deleting the question' });
        res.status(200).json({ message: 'Question deleted successfully' });
    });
});

app.post('/registerGameUser', (req, res) => {
    const {firstName,lastName,email, section, professorname, } = req.body;
    console.log(req.body)
    // Manually insert studentID
    const query = `INSERT INTO gameusers (Email, Section, ProfessorName, Level1Score, Level2Score, Level3Score, Level4Score,FirstName,LastName) 
                   VALUES (?, ?, ?, 0, 0, 0, 0,?,?)`;

    db.query(query, [email, section, professorname,firstName,lastName], (err, result) => {
        if (err) {
            console.error('Error while inserting into database:', err);
            return res.status(500).send('Error registering the student');
        }
        res.status(200).json({ message: 'Student registered successfully', name: firstName + " " + lastName });
    });
});

app.get('/get_user_progress/:email', (req, res) => {
    const email = req.params.email;
    const query = `SELECT Level1Score, Level2Score, Level3Score FROM gameusers WHERE Email = ?`;

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error:', err); // Log the error
            return res.status(500).json({ error: 'Error fetching progress' });
        }

        if (results.length > 0) {
            res.status(200).json(results[0]);  // Ensure you return JSON
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    });
});
app.post('/update_score', (req, res) => {
    const { email, score, level } = req.body;
    
    let query = '';
    console.log(req.body)
    // Check the string value of 'level'
    if (level === "level1score") {
        query = `UPDATE gameusers SET Level1Score = ? WHERE email = ? AND (Level1Score < ? OR Level1Score IS NULL)`;
    } else if (level === "level2score") {
        query = `UPDATE gameusers SET Level2Score = ? WHERE email = ? AND (Level2Score < ? OR Level2Score IS NULL)`;
    } 
    else if (level === "level3score") {
        query = `UPDATE gameusers SET Level3Score = ? WHERE email = ? AND (Level3Score < ? OR Level3Score IS NULL)`;
    } 
    else {
        return res.status(400).json({ message: 'Invalid level' });
    }
    console.log(query)
    db.query(query, [score, email, score], (err, result) => {
        console.log(err)
        console.log(result)
        if (err) {
            return res.status(500).json({ error: 'Error updating score' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ message: `Score for ${level} updated successfully` });
        } else {
            res.status(404).json({ message: 'User not found or score is not higher' });
        }
    });
});

app.get('/get_all_user_info', (req, res) => {
    const query = `
        SELECT FirstName, LastName, ProfessorName, level1score, level2score, level3score,level4score 
        FROM gameusers
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Error fetching user info' });
        }
        
        res.status(200).json(results);
    });
});

app.get('/game/stats', (req, res) => {
    const stats = {};
    console.log("stats");
    db.query('SELECT COUNT(*) as total_students FROM gameusers', (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.total_students = result[0].total_students;

        db.query('SELECT COUNT(*) as level1_completed FROM gameusers WHERE level1score > 70', (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            stats.level1_completed = result[0].level1_completed;

            db.query('SELECT COUNT(*) as level2_completed FROM gameusers WHERE level2score > 70', (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                stats.level2_completed = result[0].level2_completed;

                db.query('SELECT COUNT(*) as level3_completed FROM gameusers WHERE level3score > 70', (err, result) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    stats.level3_completed = result[0].level3_completed;

                    db.query('SELECT COUNT(*) as level4_completed FROM gameusers WHERE level4score > 70', (err, result) => {
                        if (err) return res.status(500).json({ error: 'Database error' });
                        stats.level4_completed = result[0].level4_completed;
                        console.log(stats)
                        res.status(200).json(stats);
                    });
                });
            });
        });
    });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
