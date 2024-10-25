const express = require('express');
const mysql = require('mysql2/promise');  // Use promise-based MySQL
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const cors = require('cors');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

let connection;

// Asynchronous function to initialize MySQL connection
const initializeConnection = async () => {
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
        });
        console.log('MySQL connection established successfully.');
    } catch (err) {
        console.error('Error establishing MySQL connection:', err);
        setTimeout(initializeConnection, 2000);  // Retry connection after 2 seconds
    }
};

// Initialize connection on server start
initializeConnection();

// Register endpoint
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    try {
        const query = 'INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)';
        await connection.execute(query, [username, hashedPassword, role]);
        console.log("User registered successfully.");
        res.status(200).send('User registered successfully');
    } catch (err) {
        console.error('There was a problem registering the user:', err);
        res.status(500).send('There was a problem registering the user');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const query = 'SELECT * FROM users WHERE username = ?';
        const [results] = await connection.execute(query, [username]);
        if (!results.length) return res.status(404).send('No user found');

        const user = results[0];
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        // If password validation is needed, compare it here

        res.status(200).send({ auth: true });
    } catch (err) {
        console.error('Error on the server:', err);
        res.status(500).send('Error on the server');
    }
});

// GET level1questions
app.get('/level1questions', async (req, res) => {
    try {
        const [results] = await connection.execute('SELECT * FROM level1questions');
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching level 1 questions:', err);
        res.status(500).json({ error: 'There was a problem finding the questions' });
    }
});

// POST level1questions
app.post('/level1questions', async (req, res) => {
    const { question_text, options } = req.body;

    try {
        const query = 'INSERT INTO level1questions (question_text, correctOption, incorrectOption1, incorrectOption2, incorrectOption3) VALUES (?, ?, ?, ?, ?)';
        await connection.execute(query, [question_text, options[0], options[1], options[2], options[3]]);
        res.status(200).json({ message: 'Question added successfully' });
    } catch (err) {
        console.error('Error adding level 1 question:', err);
        res.status(500).json({ error: 'There was a problem adding the question' });
    }
});

// PUT level1questions
app.put('/level1questions/:id', async (req, res) => {
    const { question_text, options } = req.body;

    try {
        const query = 'UPDATE level1questions SET question_text = ?, correctOption = ?, incorrectOption1 = ?, incorrectOption2 = ?, incorrectOption3 = ? WHERE id = ?';
        await connection.execute(query, [question_text, options[0], options[1], options[2], options[3], req.params.id]);
        res.status(200).json({ message: 'Question updated successfully' });
    } catch (err) {
        console.error('Error updating level 1 question:', err);
        res.status(500).json({ error: 'There was a problem updating the question' });
    }
});

// DELETE level1questions
app.delete('/level1questions/:id', async (req, res) => {
    try {
        const query = 'DELETE FROM level1questions WHERE id = ?';
        await connection.execute(query, [req.params.id]);
        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('Error deleting level 1 question:', err);
        res.status(500).json({ error: 'There was a problem deleting the question' });
    }
});

// Register game user
app.post('/registerGameUser', async (req, res) => {
    const { firstName, lastName, email, section, professorname } = req.body;

    try {
        const query = `INSERT INTO gameusers (Email, Section, ProfessorName, Level1Score, Level2Score, Level3Score, Level4Score, FirstName, LastName) 
                       VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?)`;
        await connection.execute(query, [email, section, professorname, firstName, lastName]);
        res.status(200).json({ message: 'Student registered successfully', name: firstName + " " + lastName });
    } catch (err) {
        console.error('Error registering game user:', err);
        res.status(500).send('Error registering the student');
    }
});

// Update user score
app.post('/update_score', async (req, res) => {
    const { email, score, level } = req.body;

    let query = '';
    if (level === "level1score") {
        query = `UPDATE gameusers SET Level1Score = ? WHERE email = ? AND (Level1Score < ? OR Level1Score IS NULL)`;
    } else if (level === "level2score") {
        query = `UPDATE gameusers SET Level2Score = ? WHERE email = ? AND (Level2Score < ? OR Level2Score IS NULL)`;
    } else if (level === "level3score") {
        query = `UPDATE gameusers SET Level3Score = ? WHERE email = ? AND (Level3Score < ? OR Level3Score IS NULL)`;
    } else {
        return res.status(400).json({ message: 'Invalid level' });
    }

    try {
        const [result] = await connection.execute(query, [score, email, score]);
        if (result.affectedRows > 0) {
            res.status(200).json({ message: `Score for ${level} updated successfully` });
        } else {
            res.status(404).json({ message: 'User not found or score is not higher' });
        }
    } catch (err) {
        console.error('Error updating score:', err);
        res.status(500).json({ error: 'Error updating score' });
    }
});

// Get all user info (updated)
app.get('/get_all_user_info', async (req, res) => {
    try {
        const query = `SELECT FirstName, LastName, ProfessorName, level1Score, level2Score, level3Score, level4Score FROM gameusers`;
        const [results] = await connection.execute(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error fetching user info:', err);
        res.status(500).json({ error: 'Error fetching user info' });
    }
});

// Get user progress (updated)
app.get('/get_user_progress/:email', async (req, res) => {
    const email = req.params.email;
    
    try {
        const query = `SELECT Level1Score, Level2Score, Level3Score FROM gameusers WHERE Email = ?`;
        const [results] = await connection.execute(query, [email]);

        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('Error fetching progress:', err);
        res.status(500).json({ error: 'Error fetching progress' });
    }
});

// Get game statistics
app.get('/game/stats', async (req, res) => {
    const stats = {};

    try {
        const [result1] = await connection.execute('SELECT COUNT(*) as total_students FROM gameusers');
        stats.total_students = result1[0].total_students;

        const [result2] = await connection.execute('SELECT COUNT(*) as level1_completed FROM gameusers WHERE level1score > 70');
        stats.level1_completed = result2[0].level1_completed;

        const [result3] = await connection.execute('SELECT COUNT(*) as level2_completed FROM gameusers WHERE level2score > 70');
        stats.level2_completed = result3[0].level2_completed;

        const [result4] = await connection.execute('SELECT COUNT(*) as level3_completed FROM gameusers WHERE level3score > 70');
        stats.level3_completed = result4[0].level3_completed;

        const [result5] = await connection.execute('SELECT COUNT(*) as level4_completed FROM gameusers WHERE level4score > 70');
        stats.level4_completed = result5[0].level4_completed;

        res.status(200).json(stats);
    } catch (err) {
        console.error('Database error fetching stats:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
