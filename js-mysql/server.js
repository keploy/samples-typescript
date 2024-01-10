const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(bodyParser.json());

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'mydb'
});
const initializeDatabase = () => {
    connection.query(`
        CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) throw err;
        console.log('Table created or already exists');
    });
};
initializeDatabase()
app.get('/items', (req, res) => {
    connection.query('SELECT * FROM items', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.post('/items', (req, res) => {
    const item = req.body;
    connection.query('INSERT INTO items SET ?', item, (err, results) => {
        if (err) throw err;
        res.status(201).send(`Item added with ID: ${results.insertId}`);
    });
});

app.put('/items/:id', (req, res) => {
    const id = req.params.id;
    const item = req.body;
    connection.query('UPDATE items SET ? WHERE id = ?', [item, id], (err, results) => {
        if (err) throw err;
        res.send('Item updated successfully.');
    });
});

app.delete('/items/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM items WHERE id = ?', id, (err, results) => {
        if (err) throw err;
        res.send('Item deleted successfully.');
    });
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});