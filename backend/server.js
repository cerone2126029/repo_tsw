require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Permette al frontend (il tuo sito) di comunicare con questo backend
app.use(express.json()); // Permette al server di leggere i dati inviati dai form

// --- INIZIALIZZA SUPABASE ---
// Prende in automatico le chiavi che hai messo nel file .env nascosto
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. ROTTA: REGISTRAZIONE UTENTE
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    // Chiama l'autenticazione di Supabase
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Registrazione completata!' });
});

// ==========================================
// 2. ROTTA: LOGIN UTENTE
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) return res.status(401).json({ error: 'Credenziali errate' });
    res.status(200).json({ message: 'Login effettuato', user: data.user.email });
});

// 3. ROTTA: CREA PRENOTAZIONE

app.post('/api/prenotazioni', async (req, res) => {
    const { email, dataVisita, oraVisita, motivo } = req.body;

    // Fase A: Controllo se esiste già una prenotazione in quella data e a quell'ora
    const { data: prenotazioniEsistenti, error: checkError } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('data', dataVisita)
        .eq('ora', oraVisita);

    if (checkError) return res.status(500).json({ error: 'Errore nel controllo del database' });

    // Se l'array ha almeno un elemento, l'orario è occupato!
    if (prenotazioniEsistenti.length > 0) {
        return res.status(409).json({ error: 'Orario non disponibile. Scegli un altro orario.' });
    }

    // Fase B: L'orario è libero, procedo a salvare la nuova prenotazione
    const { data, error: insertError } = await supabase
        .from('prenotazioni')
        .insert([
            { user_email: email, data: dataVisita, ora: oraVisita, motivo: motivo }
        ]);

    if (insertError) return res.status(500).json({ error: 'Errore durante il salvataggio' });

    res.status(201).json({ message: 'Prenotazione confermata con successo!' });
});

// AVVIO DEL SERVER (Con il trucco per lo smartphone)
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    console.log(`✅ Server in ascolto su http://localhost:${PORT}`);
    console.log(`📱 Per testarlo da smartphone: connettiti allo stesso Wi-Fi e digita l'indirizzo IP locale del tuo PC seguito da :${PORT}`);
});