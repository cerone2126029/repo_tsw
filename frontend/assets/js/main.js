document.addEventListener("DOMContentLoaded", () => {
    // --- HIGHLIGHT PAGINA ATTIVA ---
    const currentPage = window.location.pathname.split("/").pop() || "home.html";
    const navLinksElems = document.querySelectorAll(".nav-links a");
    navLinksElems.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active-link");
        }
    });

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
                if (res.ok) {
                    sessionStorage.setItem("activeUser", usernameInput.value); updateUI(); if (typeof loadReviews === 'function') {
                        loadReviews();
                    }
                } else { alert(data.error); }
            } catch (err) { alert("Server backend non raggiungibile."); }
        };
    }

    // Registrazione API
    if (btnRegister) {
        btnRegister.onclick = async () => {
            if (!usernameInput.value || !passwordInput.value) return alert("Inserisci email e password.");
            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: usernameInput.value, password: passwordInput.value })
                });

                const data = await res.json();

                if (res.ok) {
                    // Mostra il messaggio del server (Ti abbiamo inviato un'email...)
                    alert(data.message);
                    // Pulisce i campi per comodità
                    usernameInput.value = '';
                    passwordInput.value = '';
                } else {
                    alert("Errore: " + data.error);
                }
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

            // Prendo tutti i valori dai campi HTML
            const dataInserita = document.getElementById("booking-date").value;
            const oraInserita = document.getElementById("booking-time").value;
            const motivoInserito = document.getElementById("booking-reason").value;
            const descrizioneInserita = document.getElementById("booking-description").value; // NUOVO

            if (oraInserita >= "13:30" && oraInserita < "14:30") return alert("Studio chiuso per pausa pranzo (13:30 - 14:30).");

            try {
                const res = await fetch(`${API_URL}/prenotazioni`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: currentUser,
                        dataVisita: dataInserita,
                        oraVisita: oraInserita,
                        motivo: motivoInserito,
                        descrizione: descrizioneInserita // Invia la descrizione al server
                    })
                });

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

        if (!currentUser) {
            window.location.href = "home.html";
        } else {
            displayUsername.textContent = currentUser;
            const initialIcon = document.getElementById("user-initial");
            if (initialIcon) initialIcon.textContent = currentUser.charAt(0).toUpperCase();

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
                            const oraFormattata = book.ora.substring(0, 5);

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

            const btnLogoutTop = document.getElementById("btn-logout-top");
            if (btnLogoutTop) {
                btnLogoutTop.onclick = () => {
                    sessionStorage.removeItem("activeUser");
                    window.location.href = "home.html";
                };
            }
        }
    }

    // --- 7. FILTRO PER I COMMENTI AGGIORNATO ---
    const ordinaSelect = document.getElementById("ordina");
    if (ordinaSelect) {
        ordinaSelect.addEventListener("change", function () {
            const valore = this.value;
            const container = document.getElementById("reviews-container");
            const recensioni = Array.from(document.querySelectorAll(".card-recensione"));

            if (valore === "recenti") {
                recensioni.sort((a, b) => getTimeValue(b) - getTimeValue(a));
            } else if (valore === "valutazione") {
                recensioni.sort((a, b) => getStars(b) - getStars(a));
            }

            recensioni.forEach(rec => container.appendChild(rec));
        });
    }

    // --- 8. ANIMAZIONI AL CARICAMENTO/SCROLL (REVEAL DA DESTRA/SINISTRA) ---
    const observerOptions = {
        threshold: 0.15
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // --- 9. INVIO NUOVA RECENSIONE ---
    const reviewForm = document.getElementById("review-form");
    if (reviewForm) {
        reviewForm.onsubmit = async function (e) {
            e.preventDefault();

            const currentUser = sessionStorage.getItem("activeUser");
            if (!currentUser) return alert("⚠️ Devi accedere o registrarti per poter lasciare una recensione.");

            const selectedStar = document.querySelector('input[name="rating"]:checked');
            if (!selectedStar) return alert("Per favore, seleziona una valutazione in stelle.");

            const stars = parseInt(selectedStar.value);
            const text = document.getElementById("review-text").value;

            const today = new Date();
            const dataOdierna = today.toISOString().split('T')[0];

            try {
                const res = await fetch(`${API_URL}/recensioni`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_email: currentUser,
                        data: dataOdierna,
                        valutazione: stars,
                        messaggio: text
                    })
                });

                const dataRes = await res.json();

                if (res.ok) {
                    alert(dataRes.message);
                    reviewForm.reset();
                    if (typeof loadReviews === 'function') loadReviews();
                } else {
                    alert("Errore: " + dataRes.error);
                }
            } catch (error) {
                alert("Errore di connessione al database. Riprova più tardi.");
            }
        };
    }

    // --- 10. CARICAMENTO RECENSIONI DAL DATABASE ---
    const reviewsContainer = document.getElementById("reviews-container");
    if (reviewsContainer) {
        window.loadReviews = async function () {
            try {
                const response = await fetch(`${API_URL}/recensioni`);
                const recensioni = await response.json();

                // ==========================================
                // CALCOLO STATISTICHE BARRE E MEDIA GLOBALE
                // ==========================================
                const totaleRecensioniEl = document.getElementById("totale-recensioni");
                if (totaleRecensioniEl) {
                    const totale = recensioni.length;
                    totaleRecensioniEl.textContent = totale;

                    // --- NUOVO: Calcolo Voto Medio ---
                    if (totale > 0) {
                        let sommaVoti = 0;
                        recensioni.forEach(rec => sommaVoti += rec.valutazione);

                        // Calcola la media e arrotonda a 1 decimale (es. 4.7)
                        let media = (sommaVoti / totale).toFixed(1);

                        // Inserisce il numero nel DOM
                        const votoMedioEl = document.getElementById("voto-medio");
                        if (votoMedioEl) votoMedioEl.textContent = media;

                        // Calcola quante stelle piene mostrare
                        const stelleMedieEl = document.getElementById("stelle-medie");
                        if (stelleMedieEl) {
                            let stelleHTML = "";
                            for (let i = 1; i <= 5; i++) {
                                if (i <= Math.round(media)) {
                                    stelleHTML += "★"; // Stella piena
                                } else {
                                    stelleHTML += "☆"; // Stella vuota
                                }
                            }
                            stelleMedieEl.textContent = stelleHTML;
                        }
                    }
                    // ---------------------------------

                    let conteggioStelle = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

                    recensioni.forEach(rec => {
                        if (conteggioStelle[rec.valutazione] !== undefined) {
                            conteggioStelle[rec.valutazione]++;
                        }
                    });

                    for (let i = 1; i <= 5; i++) {
                        const bar = document.getElementById(`bar-${i}`);
                        const percentText = document.getElementById(`percent-${i}`);

                        let percentuale = 0;
                        if (totale > 0) {
                            percentuale = Math.round((conteggioStelle[i] / totale) * 100);
                        }

                        if (bar && percentText) {
                            setTimeout(() => {
                                bar.style.width = `${percentuale}%`;
                                percentText.textContent = `${percentuale}%`;
                            }, 100);
                        }
                    }
                }
                // ==========================================

                const loadingMsg = document.getElementById("loading-reviews");
                if (loadingMsg) loadingMsg.remove();

                if (recensioni.length === 0) {
                    reviewsContainer.innerHTML = "<p style='text-align:center; width:100%;'>Non ci sono ancora recensioni. Lascia la prima!</p>";
                    return;
                }

                reviewsContainer.innerHTML = "";

                recensioni.forEach(rec => {
                    const stelle = "⭐".repeat(rec.valutazione);
                    const nomeUtente = rec.user_email.split('@')[0];
                    const dataFormattata = new Date(rec.data).toLocaleDateString('it-IT');

                    const currentUser = sessionStorage.getItem('activeUser');
                    //const isMia = currentUser && rec.user_email === currentUser;
                    const isMia = currentUser && rec.user_email.toLowerCase() === currentUser.toLowerCase();

                    const cardHTML = `
    <div class="card-recensione" id="card-${rec.id}" style="position:relative;">

        ${isMia ? `
        <div style="position:absolute; top:10px; right:10px; display:flex; gap:6px;">
            <button title="Modifica" style="background:none; border:none; cursor:pointer; font-size:1.2rem; padding:4px;"
                onclick="apriModifica(${rec.id}, ${rec.valutazione}, '${rec.messaggio.replace(/'/g, "\\'")}')">
                ✏️
            </button>
            <button title="Elimina" style="background:none; border:none; cursor:pointer; font-size:1.2rem; padding:4px;"
                onclick="eliminaRecensione(${rec.id})">
                🗑️
            </button>
        </div>` : ''}

        <div class="nome">${nomeUtente}</div>
        <div class="star" data-val="${rec.valutazione}">${stelle}</div>
        <div class="commento" id="testo-${rec.id}">${rec.messaggio}</div>
        <div class="time" data-date="${rec.data}" style="margin-top:10px;">Scritta il ${dataFormattata}</div>

        ${isMia ? `
        <div id="form-modifica-${rec.id}" style="display:none; margin-top:12px;">
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
                ${[1, 2, 3, 4, 5].map(n => `
                    <label style="font-size:1.1rem; cursor:pointer;">
                        ${n}⭐ <input type="radio" name="rating-modifica-${rec.id}" value="${n}" ${rec.valutazione === n ? 'checked' : ''}>
                    </label>
                `).join('')}
            </div>
            <textarea id="testo-modifica-${rec.id}" maxlength="100" rows="3"
                style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px; font-family:inherit; font-size:0.9rem; box-sizing:border-box;"
            ></textarea>
            <div style="display:flex; gap:10px; margin-top:8px;">
                <button style="background:var(--accent-mint); color:white; border:none; padding:8px 18px; border-radius:6px; cursor:pointer; font-weight:600;"
                    onclick="salvaModifica(${rec.id})">Salva</button>
                <button style="background:#ccc; color:#333; border:none; padding:8px 18px; border-radius:6px; cursor:pointer;"
                    onclick="chiudiModifica(${rec.id})">Annulla</button>
            </div>
        </div>` : ''}

    </div>
`;
                    reviewsContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            } catch (error) {
                reviewsContainer.innerHTML = "<p style='color:red; text-align:center; width:100%;'>Errore di connessione al database.</p>";
            }
        }

        loadReviews();
    }

    // --- 11. GESTIONE RECUPERO PASSWORD (POPUP + RESET) ---
    const forgotPwdLink = document.getElementById("forgot-pwd-link");
    const forgotPwdModal = document.getElementById("forgot-password-modal");
    const closeModalBtn = document.getElementById("close-modal");
    const forgotForm = document.getElementById("forgot-password-form");
    const loginEmailInput = document.getElementById("username");
    const resetEmailInput = document.getElementById("reset-email");

    if (forgotPwdLink && forgotPwdModal) {
        forgotPwdLink.addEventListener("click", (e) => {
            e.preventDefault();
            forgotPwdModal.style.display = "flex";
            if (loginEmailInput && loginEmailInput.value) {
                resetEmailInput.value = loginEmailInput.value;
            }
        });

        if (closeModalBtn) {
            closeModalBtn.addEventListener("click", () => forgotPwdModal.style.display = "none");
        }

        window.addEventListener("click", (e) => {
            if (e.target === forgotPwdModal) forgotPwdModal.style.display = "none";
        });

        if (forgotForm) {
            forgotForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const emailToReset = resetEmailInput.value;
                try {
                    const res = await fetch(`${API_URL}/recupero-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: emailToReset })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        alert("Se l'email è registrata, riceverai a breve un link di ripristino.");
                        forgotPwdModal.style.display = "none";
                    } else {
                        alert("Errore: " + data.error);
                    }
                } catch (err) { alert("Errore di connessione al server."); }
            });
        }
    }

    // GESTIONE FORM DI RESET (Nella pagina imposta-password.html)
    const newPwdForm = document.getElementById('new-password-form');
    if (newPwdForm) {
        newPwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pwd1 = document.getElementById('pwd1').value;
            const pwd2 = document.getElementById('pwd2').value;
            const msgEl = document.getElementById('status-msg');

            if (pwd1 !== pwd2) {
                msgEl.style.color = 'red';
                msgEl.textContent = 'Le password non coincidono!';
                return;
            }

            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");

            try {
                const res = await fetch(`${API_URL}/aggiorna-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                        new_password: pwd1
                    })
                });

                if (res.ok) {
                    msgEl.style.color = 'green';
                    msgEl.textContent = '✅ Password aggiornata! Reindirizzamento...';
                    setTimeout(() => window.location.href = 'home.html', 3000);
                } else {
                    msgEl.style.color = 'red';
                    msgEl.textContent = 'Errore: Link scaduto o non valido.';
                }
            } catch (err) { alert("Errore di connessione al server."); }
        });
    }

    // --- 12. GESTIONE INVIO CANDIDATURE ---
    const formRecruitment = document.getElementById('recruitment-form');
    if (formRecruitment) {
        formRecruitment.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('work-name').value;
            const cognome = document.getElementById('work-surname').value;
            const email = document.getElementById('work-email').value;
            const file = document.getElementById('work-cv').files[0];

            if (!file) {
                alert("Per favore, seleziona un file PDF per il tuo CV.");
                return;
            }

            try {
                // Caricamento nello Storage
                const nomeFile = `${Date.now()}_${nome}_${cognome}.pdf`;
                const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                    .from('curriculums')
                    .upload(nomeFile, file);

                if (uploadError) throw uploadError;

                // Ottenimento URL
                const { data: linkData } = window.supabaseClient.storage.from('curriculums').getPublicUrl(nomeFile);
                const publicUrl = linkData.publicUrl;

                // Salvataggio nel Database
                const { error: dbError } = await window.supabaseClient
                    .from('candidature')
                    .insert([{ nome, cognome, email, cv_url: publicUrl }]);

                if (dbError) throw dbError;

                alert("Candidatura inviata con successo! Ti contatteremo presto.");
                formRecruitment.reset();

            } catch (err) {
                console.error("Errore completo:", err);
                alert("Errore durante l'invio: " + (err.message || "riprova più tardi"));
            }
        });
    }
    // --- 13. GESTIONE LOGIN DA PAGINA DI CONFERMA ---
    const confirmLoginForm = document.getElementById('confirm-login-form');
    if (confirmLoginForm) {
        confirmLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('confirm-email').value;
            const password = document.getElementById('confirm-pwd').value;
            const msgEl = document.getElementById('status-msg');

            try {
                // Usiamo la TUA rotta di login standard!
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                const data = await res.json();

                if (res.ok) {
                    msgEl.style.color = 'green';
                    msgEl.textContent = '✅ Accesso effettuato! Reindirizzamento in corso...';

                    // Salviamo l'utente in sessione proprio come nel login normale
                    sessionStorage.setItem("activeUser", email);

                    // Lo rimandiamo alla home dopo un secondo
                    setTimeout(() => window.location.href = 'home.html', 1500);
                } else {
                    msgEl.style.color = 'red';
                    // Se sbaglia a scrivere, gli diamo errore
                    msgEl.textContent = "Errore: " + data.error;
                }
            } catch (err) {
                msgEl.style.color = 'red';
                msgEl.textContent = 'Errore di connessione al server.';
            }
        });
    }
});

// --- FUNZIONI GLOBALI (Fuori dal DOMContentLoaded) ---
function getStars(recensione) {
    const starEl = recensione.querySelector(".star");
    return starEl ? parseInt(starEl.getAttribute("data-val")) || 0 : 0;
}

function getTimeValue(recensione) {
    const timeEl = recensione.querySelector(".time");
    if (!timeEl) return 0;
    const dateStr = timeEl.getAttribute("data-date");
    return new Date(dateStr).getTime();
}
//javaScript della linea temporale 
(function () {

    const totale = 5;
    const ritardi = [0, 180, 360, 540, 720];

    const riempimento = document.getElementById('riempimento');
    const freccia = document.getElementById('freccia');
    const riga = document.getElementById('riga-temporale');

    if (!riempimento || !freccia || !riga) return;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function attiva(i) {
        const pallino = document.getElementById('pallino-' + (i + 1));
        const scheda = document.getElementById('scheda-' + (i + 1));

        if (pallino) pallino.classList.add('attivo');
        if (scheda) scheda.classList.add('visibile');

        const percentuale = i === totale - 1 ? 100 : (i / (totale - 1)) * 100;

        if (isMobile()) {
            riempimento.style.height = percentuale + '%';
            riempimento.style.width = '2px';
        } else {
            riempimento.style.width = percentuale + '%';
        }

        if (i === totale - 1) {
            setTimeout(() => freccia.classList.add('attiva'), 1200);
        }
    }

    function reset() {
        riempimento.style.width = '0%';
        riempimento.style.height = '0%';
        freccia.classList.remove('attiva');

        for (let i = 1; i <= totale; i++) {
            const pallino = document.getElementById('pallino-' + i);
            const scheda = document.getElementById('scheda-' + i);
            if (pallino) pallino.classList.remove('attivo');
            if (scheda) scheda.classList.remove('visibile');
        }
    }

    let avviato = false;

    const osservatore = new IntersectionObserver(function (voci) {
        voci.forEach(function (voce) {
            if (voce.isIntersecting && !avviato) {
                avviato = true;
                ritardi.forEach(function (r, i) {
                    setTimeout(function () { attiva(i); }, r);
                });
            }
        });
    }, { threshold: 0.3 });

    osservatore.observe(riga);

    window.addEventListener('resize', function () {
        if (!avviato) return;
        reset();
        avviato = false;
        osservatore.observe(riga);
    });

})();

// FUNZIONI PER MODIFICA RECENSIONE
function apriModifica(id, valutazione, messaggio) {
    document.getElementById(`form-modifica-${id}`).style.display = 'block';
    document.getElementById(`testo-modifica-${id}`).value = messaggio;

    //}

}

function chiudiModifica(id) {
    document.getElementById(`form-modifica-${id}`).style.display = 'none';
}

async function salvaModifica(id) {
    if (!confirm('Sei sicuro di voler salvare le modifiche?')) return;

    const emailUtente = sessionStorage.getItem('activeUser');
    if (!emailUtente) { alert('Devi essere loggato!'); return; }

    const valutazioneSelezionata = document.querySelector(`input[name="rating-modifica-${id}"]:checked`);
    const nuovoTesto = document.getElementById(`testo-modifica-${id}`).value.trim();

    if (!valutazioneSelezionata) { alert('Seleziona una valutazione!'); return; }
    if (!nuovoTesto) { alert('Il messaggio non può essere vuoto!'); return; }

    const currentIP = window.location.hostname;
    const API_URL = `http://${currentIP}:3000/api`;

    try {
        const risposta = await fetch(`${API_URL}/recensioni/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_email: emailUtente.toLowerCase(),
                valutazione: parseInt(valutazioneSelezionata.value),
                messaggio: nuovoTesto
            })
        });

        const risultato = await risposta.json();
        if (!risposta.ok) { alert('Errore: ' + risultato.error); return; }

        alert('Recensione modificata con successo!');
        loadReviews();
    } catch (err) {
        alert('Errore di connessione. Riprova.');
    }
}

//elimina recensione 
async function eliminaRecensione(id) {
    if (!confirm('Sei sicuro di voler eliminare questa recensione?')) return;

    const emailUtente = sessionStorage.getItem('activeUser');
    if (!emailUtente) { alert('Devi essere loggato!'); return; }

    const currentIP = window.location.hostname;
    const API_URL = `http://${currentIP}:3000/api`;

    try {
        const risposta = await fetch(`${API_URL}/recensioni/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: emailUtente })
        });

        const risultato = await risposta.json();
        if (!risposta.ok) { alert('Errore: ' + risultato.error); return; }

        alert('Recensione eliminata!');
        loadReviews(); // Ricarica le recensioni aggiornate
    } catch (err) {
        alert('Errore di connessione. Riprova.');
    }
}