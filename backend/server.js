const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'temporary_secret_key_for_testing';

// Temporary In-Memory Database (Resets when server restarts)
const users = [];

// --- Register Route ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  const cleanEmail = email.trim().toLowerCase();

  // Check if user exists
  const existingUser = users.find(u => u.email === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ msg: 'User already exists' });
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create User Object
  const newUser = { 
    id: Date.now().toString(), 
    email: cleanEmail, 
    password: hashedPassword 
  };
  
  users.push(newUser); // Save to memory

  // Create Token
  const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ msg: 'Signup successful', token });
});

// --- Login Route ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email.trim().toLowerCase();

  // Find User
  const user = users.find(u => u.email === cleanEmail);
  if (!user) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  // Check Password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ msg: 'Invalid credentials' });
  }

  // Create Token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ msg: 'Login successful', token });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log('NOTE: Running with an IN-MEMORY database. Users will be wiped if the server stops.');
});