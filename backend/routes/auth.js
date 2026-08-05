const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/init');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: payload });
});

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['teacher', 'student'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Email must contain an @ symbol' });
  }
  const alphaCount = (password.match(/[a-zA-Z]/g) || []).length;
  const numCount = (password.match(/[0-9]/g) || []).length;
  if (password.length !== 8 || alphaCount !== 3 || numCount !== 5) {
    return res.status(400).json({ error: 'Password must be exactly 8 characters long, containing 3 letters and 5 numbers' });
  }
  try {
    const hash = bcrypt.hashSync(password, 8);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, hash, role);
    const payload = { id: info.lastInsertRowid, name, email, role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
    res.status(201).json({ token, user: payload });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const token = jwt.sign({ id: user.id, intent: 'reset_password' }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ token, message: 'Simulated email sent' });
});

router.post('/reset-password', (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: 'Token and new password required' });
  
  const alphaCount = (new_password.match(/[a-zA-Z]/g) || []).length;
  const numCount = (new_password.match(/[0-9]/g) || []).length;
  if (new_password.length !== 8 || alphaCount !== 3 || numCount !== 5) {
    return res.status(400).json({ error: 'Password must be exactly 8 characters long, containing 3 letters and 5 numbers' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.intent !== 'reset_password') throw new Error('Invalid token intent');
    const hash = bcrypt.hashSync(new_password, 8);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, payload.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
