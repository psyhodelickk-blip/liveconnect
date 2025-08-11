import express from 'express';
import cors from 'cors';

// Import ruta (pazi da ovi fajlovi postoje u folderu routes)
import authRoutes from './routes/auth.js';
import messagesRoutes from './routes/messages.js';

const app = express();

// Omogućavamo da frontend na localhost:3000 može da šalje zahteve (CORS)
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,
}));

// Ovo omogućava da server razume JSON u telu zahteva
app.use(express.json());

// Povezujemo rute sa URL prefiksima
app.use('/api/auth', authRoutes);
app.use('/api/messages', messagesRoutes);

// Pokrećemo server na portu 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server radi na portu ${PORT}`);
});
