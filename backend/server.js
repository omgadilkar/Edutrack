require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const classesRoutes = require('./routes/classes');
const attendanceRoutes = require('./routes/attendance');
const gradesRoutes = require('./routes/grades');
const noticesRoutes = require('./routes/notices');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, usersRoutes);
app.use('/api/classes', authenticateToken, classesRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/grades', authenticateToken, gradesRoutes);
app.use('/api/notices', authenticateToken, noticesRoutes);

// Serve the static frontend from dist
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Catch-all route to serve index.html for SPA
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EduTrack backend running on http://localhost:${PORT}`);
});
