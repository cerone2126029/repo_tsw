document.addEventListener("DOMContentLoaded", () => {
    // --- 1. CONFIGURAZIONE API ---
    const currentIP = window.location.hostname;
    const API_URL = `http://${currentIP}:3000/api`;

    // --- 2. MENU MOBILE ---
    const mobileMenuBtn = document.getElementById("mobile-menu");
    const navbar = document.querySelector(".navbar");
    if (mobileMenuBtn && navbar) {
        mobileMenuBtn.addEventListener("click", () => navbar.classList.toggle("active"));
    }

    // --- 3. AUTENTICAZIONE E UI ---
    const authForm = document.getElementById("auth-form");
    const btnRegister = document.getElementById("btn-register");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const loggedInArea = document.getElementById("logged-in-area");
    const welcomeMessage = document.getElementById("welcome-message");
    const userIcon = document.querySelector(".user-icon");
    const btnLogout = document.getElementById("btn-logout");

    function updateUI() {
        const currentUser = sessionStorage.getItem("activeUser");
        if (authForm && loggedInArea) {
            if (currentUser) {
                authForm.style.display = "none";
                loggedInArea.style.display = "flex";
                if (welcomeMessage) welcomeMessage.textContent = "Ciao, " + currentUser.split('@')[0] + "!";
                if (userIcon) userIcon.textContent = currentUser.charAt(0).toUpperCase();
            } else {
                authForm.style.display = "flex";
                loggedInArea.style.display = "none";
            }
        }
    }
    updateUI();

    // Login API
    if (authForm) {
        authForm.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: usernameInput.value, password: passwordInput.value }) });
                const data = await res.json();
                if (res.ok) { sessionStorage.setItem("activeUser", usernameInput.value); updateUI(); } else { alert(data.error); }
            } catch (err) { alert("Server backend non raggiungibile."); }
        };
    }

    // Registrazione API
    if (btnRegister) {
        btnRegister.onclick = async () => {
            if (!usernameInput.value || !passwordInput.value) return alert("Inserisci email e password.");
            try {
                const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: usernameInput.value, password: passwordInput.value }) });
                const data = await res.json();
                alert(res.ok ? "Registrato con successo! Ora puoi accedere." : "Errore: " + data.error);
            } catch (err) { alert("Server backend non raggiungibile."); }
        };
    }

    // Logout Generale
    if (btnLogout) {
        btnLogout.onclick = () => { sessionStorage.removeItem("activeUser"); updateUI(); };
    }

    // --- 4. PRENOTAZIONI (Solo in Home) ---
    const bookingForm = document.getElementById("booking-form");
    const dateInput = document.getElementById("booking-date");

    if (dateInput) {
        const today = new Date();
        const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        dateInput.setAttribute("min", localDate);
        dateInput.addEventListener("change", function () {
            const dataScelta = new Date(this.value);
            if (dataScelta.getDay() === 0 || dataScelta.getDay() === 6) {
                alert("⚠️ Lo studio è chiuso il sabato e la domenica.");
                this.value = "";
            }
        });
    }

    if (bookingForm) {
        bookingForm.onsubmit = async function (e) {
            e.preventDefault();
            const currentUser = sessionStorage.getItem("activeUser");
            if (!currentUser) return alert("⚠️ Devi accedere o registrarti per prenotare.");
            const dataInserita = document.getElementById("booking-date").value;
            const oraInserita = document.getElementById("booking-time").value;
            if (oraInserita >= "13:30" && oraInserita < "14:30") return alert("Studio chiuso per pausa pranzo (13:30 - 14:30).");

            try {
                const res = await fetch(`${API_URL}/prenotazioni`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: currentUser, dataVisita: dataInserita, oraVisita: oraInserita, motivo: document.getElementById("booking-reason").value }) });
                const data = await res.json();
                alert(res.ok ? data.message : "Errore: " + data.error);
                if (res.ok) bookingForm.reset();
            } catch (error) { alert("Errore connessione."); }
        };
    }

    // --- 5. ANIMAZIONI "CHI SIAMO" ---
    const rotatingSpan = document.getElementById("rotating-words");
    if (rotatingSpan) {
        const words = ["prevenzione", "cura", "professionalità", "affidabilità"];
        let i = 0;
        setInterval(() => { rotatingSpan.textContent = words[i]; i = (i + 1) % words.length; }, 2000);
    }

    const elements = document.querySelectorAll('.fade-in');
    if (elements.length > 0) {
        function checkScroll() {
            elements.forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight * 0.85) el.classList.add('show');
            });
        }
        window.addEventListener('scroll', checkScroll);
        checkScroll();
    }

    // --- 6. GESTIONE AREA PERSONALE ---
    const displayUsername = document.getElementById("display-username");
    if (displayUsername) {
        const currentUser = sessionStorage.getItem("activeUser");

        // Protezione: se non sei loggato e provi ad accedere all'area personale, vieni cacciato in Home
        if (!currentUser) {
            window.location.href = "home.html";
        } else {
            // Mostra nome utente
            displayUsername.textContent = currentUser;
            const initialIcon = document.getElementById("user-initial");
            if (initialIcon) initialIcon.textContent = currentUser.charAt(0).toUpperCase();

            // Richiesta delle prenotazioni a Node.js / Supabase
            const listContainer = document.getElementById("bookings-list");
            const noBookingsMsg = document.getElementById("no-bookings");
            const table = document.getElementById("bookings-table");

            fetch(`${API_URL}/prenotazioni?email=${currentUser}`)
                .then(response => response.json())
                .then(userBookings => {
                    if (userBookings.length === 0) {
                        if (table) table.style.display = "none";
                        if (noBookingsMsg) noBookingsMsg.style.display = "block";
                    } else {
                        userBookings.forEach(book => {
                            const dataFormattata = new Date(book.data).toLocaleDateString('it-IT');
                            const oraFormattata = book.ora.substring(0, 5); // Es. 10:30:00 -> 10:30

                            const row = `
                                <tr>
                                    <td><strong>${dataFormattata}</strong></td>
                                    <td>${oraFormattata}</td>
                                    <td>${book.motivo}</td>
                                    <td><span class="status-badge">Confermata</span></td>
                                </tr>
                            `;
                            if (listContainer) listContainer.innerHTML += row;
                        });
                    }
                })
                .catch(error => {
                    console.error("Errore recupero prenotazioni:", error);
                    if (table) table.style.display = "none";
                    if (noBookingsMsg) {
                        noBookingsMsg.style.display = "block";
                        noBookingsMsg.innerHTML = `<p style="color: red;">Errore di connessione al database. Impossibile caricare le prenotazioni.</p>`;
                    }
                });

            // Bottone Logout specifico per la Navbar dell'Area Personale
            const btnLogoutTop = document.getElementById("btn-logout-top");
            if (btnLogoutTop) {
                btnLogoutTop.onclick = () => {
                    sessionStorage.removeItem("activeUser");
                    window.location.href = "home.html";
                };
            }
        }
    }
});

// --- 7. FUNZIONE RECENSIONI GLOBALE ---
window.toggle = function (btn) {
    const full = btn.nextElementSibling;
    if (full.style.display === "block") { full.style.display = "none"; btn.textContent = "Mostra di più"; }
    else { full.style.display = "block"; btn.textContent = "Mostra meno"; }
};