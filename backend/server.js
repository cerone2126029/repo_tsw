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

// ==========================================
// 1. ROTTA: REGISTRAZIONE UTENTE
// ==========================================
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            // Mettiamo il link alla nuova pagina di conferma
            emailRedirectTo: 'http://127.0.0.1:5500/frontend/conferma-registrazione.html'
        }
    });

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Ti abbiamo inviato un\'email! Clicca sul link contenuto per attivare il tuo account.' });
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

    if (error) {
        // Se l'errore è specifico sulla mail non confermata
        if (error.message.includes("Email not confirmed")) {
            return res.status(401).json({ error: 'Devi prima confermare la tua email per accedere!' });
        }
        return res.status(401).json({ error: 'Email o password errati' });
    }
    
    res.status(200).json({ message: 'Login effettuato', user: data.user.email });
});

// ==========================================
// 3. ROTTA: CREA PRENOTAZIONE
// ==========================================
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

// ==========================================
// 4. ROTTA: LEGGI PRENOTAZIONI UTENTE
// ==========================================
app.get('/api/prenotazioni', async (req, res) => {
    const emailUtente = req.query.email;

    if (!emailUtente) {
        return res.status(400).json({ error: "Email utente non fornita" });
    }

    // Cerchiamo su Supabase tutte le prenotazioni che hanno quell'email
    const { data, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('user_email', emailUtente);

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.status(200).json(data);
});

// ==========================================
// 5. ROTTA: INSERISCI NUOVA RECENSIONE
// ==========================================
app.post('/api/recensioni', async (req, res) => {
    // Estraiamo i dati in arrivo dal frontend (corretto in user_email!)
    const { user_email, data, valutazione, messaggio } = req.body;

    // Controllo di sicurezza base
    if (!user_email || !data || !valutazione || !messaggio) {
        return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    // Inviamo i dati alla tabella 'recensioni' di Supabase
    const { error } = await supabase
        .from('recensioni')
        .insert([
            {
                user_email: user_email,
                data: data,
                valutazione: valutazione,
                messaggio: messaggio
            }
        ]);

    if (error) {
        console.error("Errore salvataggio recensione:", error.message);
        return res.status(500).json({ error: "Impossibile salvare la recensione nel database." });
    }

    res.status(200).json({ message: 'Recensione salvata con successo!' });
});

// ==========================================
// 6. ROTTA: OTTIENI TUTTE LE RECENSIONI
// ==========================================
app.get('/api/recensioni', async (req, res) => {
    // Chiediamo a Supabase tutti i campi della tabella 'recensioni'
    const { data, error } = await supabase
        .from('recensioni')
        .select('*')
        .order('data', { ascending: false }); // Le ordiniamo dalla più recente alla più vecchia

    if (error) {
        console.error("Errore recupero recensioni:", error.message);
        return res.status(500).json({ error: "Errore nel recupero delle recensioni." });
    }

    // Inviamo i dati al sito web
    res.status(200).json(data);
});

// ==========================================
// 6.B ROTTA: MODIFICA RECENSIONE
// ==========================================

app.put('/api/recensioni/:id', async (req, res) => {
    const { id } = req.params;
    const { user_email, valutazione, messaggio } = req.body;

    // Controllo recensione esistente
    const { data: recensione, error: findError } = await supabase
        .from('recensioni')
        .select('*')
        .eq('id', id)
        .eq('user_email', user_email.toLowerCase());

    if (findError || !recensione || recensione.length === 0) {
        return res.status(403).json({ error: 'Non puoi modificare questa recensione.' });
    }

    // Update sicuro
    const { error: updateError } = await supabase
        .from('recensioni')
        .update({
            valutazione,
            messaggio
        })
        .eq('id', id)
        .eq('user_email', user_email.toLowerCase());

    if (updateError) {
        console.error(updateError);
        return res.status(500).json({ error: 'Errore durante la modifica.' });
    }

    res.status(200).json({ message: 'Recensione modificata con successo!' });
});
// ==========================================
// 7. ROTTA: INVIA LINK RECUPERO PASSWORD
// ==========================================
app.post('/api/recupero-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: "L'email è obbligatoria." });
    }

    try {
        // Chiediamo a Supabase di inviare l'email di reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            // Indirizzo della pagina dove l'utente atterrerà dopo aver cliccato il link nell'email
            redirectTo: 'http://127.0.0.1:5500/frontend/imposta-password.html',
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Risposta di successo
        res.json({ message: "Link di recupero inviato correttamente." });
    } catch (err) {
        console.error("Errore server:", err);
        res.status(500).json({ error: "Errore interno del server." });
    }
});

// ==========================================
// 8. ROTTA: SALVA LA NUOVA PASSWORD
// ==========================================
app.post('/api/aggiorna-password', async (req, res) => {
    const { access_token, refresh_token, new_password } = req.body;

    if (!access_token || !new_password) {
        return res.status(400).json({ error: "Dati mancanti per l'aggiornamento." });
    }

    try {
        // 1. Accediamo temporaneamente come se fossimo l'utente che ha cliccato il link
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token,
            refresh_token: refresh_token
        });

        if (sessionError) throw sessionError;

        // 2. Aggiorniamo la password
        const { error: updateError } = await supabase.auth.updateUser({
            password: new_password
        });

        if (updateError) throw updateError;

        // 3. "Slogghiamo" l'utente dal server per pulire la sessione ed evitare accavallamenti
        await supabase.auth.signOut();

        // 4. Diamo l'ok al sito web
        res.json({ message: "Password aggiornata con successo." });

    } catch (err) {
        console.error("Errore salvataggio password:", err);
        res.status(400).json({ error: "Impossibile aggiornare la password. Il link potrebbe essere scaduto." });
    }
});

// ==========================================
// 9. ROTTA: COMPLETA PROFILO (NOME E COGNOME)
// ==========================================
app.post('/api/completa-registrazione', async (req, res) => {
    const { access_token, refresh_token, full_name } = req.body;

    try {
        // 1. Validiamo la sessione arrivata dal link
        const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token,
            refresh_token: refresh_token
        });
        if (sessionError) throw sessionError;

        // 2. Aggiorniamo i metadati dell'utente con il nome completo
        const { error: updateError } = await supabase.auth.updateUser({
            data: { full_name: full_name }
        });
        if (updateError) throw updateError;

        res.json({ message: "Profilo aggiornato con successo." });
    } catch (err) {
        console.error("Errore completamento profilo:", err);
        res.status(400).json({ error: "Impossibile completare la registrazione." });
    }
});

// ==========================================
// AVVIO DEL SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`✅ Server in ascolto su http://localhost:${PORT}`);
});