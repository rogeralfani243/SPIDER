const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Route API vers Django
app.get('/api/main', async (req, res) => {
  try {
    console.log('📡 Récupération des données depuis Django...');
    
    const response = await axios.get('http://127.0.0.1:8000/api/main/');
    
    console.log('✅ Données reçues de Django');
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ Erreur Django:', error.message);
    res.status(500).json({ 
      error: 'Erreur Django',
      details: error.message 
    });
  }
});

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Express fonctionne!',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Express sur http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/main`);
});