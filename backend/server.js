const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const { verificaSiTrimite } = require('./services/pushService');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vehicles', require('./routes/vehicleRoutes'));
app.use('/api/reminders', require('./routes/reminderRoutes'));
app.use('/api/ocr', require('./routes/ocrRoutes'));
app.use('/api/specs', require('./routes/specRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/push', require('./routes/pushRoutes'));

// Verifică zilnic la 09:00 documentele care expiră și trimite notificări push
cron.schedule('0 9 * * *', () => {
  verificaSiTrimite().catch(err => console.error('Eroare cron notificari:', err.message));
});

app.get('/', (req, res) => {
  res.json({ message: 'Auto-Mentenanta API functioneaza' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server pornit pe portul ${PORT}`);
});