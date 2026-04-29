document.addEventListener("DOMContentLoaded", () => {
    // --- HIGHLIGHT PAGINA ATTIVA ---
    // Capisce su che pagina sei (es. "chi-siamo.html") e le assegna la classe "active-link"
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
                // Ordina dalla data più vecchia alla più nuova
                recensioni.sort((a, b) => getTimeValue(a) - getTimeValue(b));
            } else if (valore === "valutazione") {
                // Ordina per stelle dalla più alta alla più bassa
                recensioni.sort((a, b) => getStars(b) - getStars(a));
            }

            // Riappende le card in ordine (Senza doverle ricaricare dal database)
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
                        user_mail: currentUser,
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
                // NUOVO BLOCCO: CALCOLO STATISTICHE BARRE
                // ==========================================
                const totaleRecensioniEl = document.getElementById("totale-recensioni");
                if (totaleRecensioniEl) {
                    const totale = recensioni.length;
                    totaleRecensioniEl.textContent = totale; // Aggiorna il numero totale

                    // Prepariamo i contatori per ogni stella
                    let conteggioStelle = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

                    // Contiamo quante recensioni ci sono per ogni valutazione
                    recensioni.forEach(rec => {
                        if (conteggioStelle[rec.valutazione] !== undefined) {
                            conteggioStelle[rec.valutazione]++;
                        }
                    });

                    // Calcoliamo le percentuali e aggiorniamo l'HTML
                    for (let i = 1; i <= 5; i++) {
                        const bar = document.getElementById(`bar-${i}`);
                        const percentText = document.getElementById(`percent-${i}`);
                        
                        let percentuale = 0;
                        if (totale > 0) {
                            percentuale = Math.round((conteggioStelle[i] / totale) * 100);
                        }

                        if (bar && percentText) {
                            // setTimeout serve a far partire la fluidità dell'animazione CSS
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

                reviewsContainer.innerHTML = ""; // Svuota il contenitore

                recensioni.forEach(rec => {
                    const stelle = "⭐".repeat(rec.valutazione);
                    const nomeUtente = rec.user_mail.split('@')[0]; // Prende la prima parte dell'email
                    const dataFormattata = new Date(rec.data).toLocaleDateString('it-IT');

                    // Stampa diretta della card: niente testi tagliati e niente bottoni!
                    const cardHTML = `
                        <div class="card-recensione">
                            <div class="nome">${nomeUtente}</div>
                            <div class="star" data-val="${rec.valutazione}">${stelle}</div>
                            <div class="commento">
                                ${rec.messaggio}
                            </div>
                            <div class="time" data-date="${rec.data}" style="margin-top:10px;">Scritta il ${dataFormattata}</div>
                        </div>
                    `;
                    reviewsContainer.insertAdjacentHTML('beforeend', cardHTML);
                });
            } catch (error) {
                reviewsContainer.innerHTML = "<p style='color:red; text-align:center; width:100%;'>Errore di connessione al database.</p>";
            }
        }

        loadReviews(); // Lancia la funzione appena apri la pagina
    }
});

// --- FUNZIONI GLOBALI (Fuori dal DOMContentLoaded) ---

// Funzione per leggere le stelle dal tag "data-val"
function getStars(recensione) {
    const starEl = recensione.querySelector(".star");
    return starEl ? parseInt(starEl.getAttribute("data-val")) || 0 : 0;
}

// Funzione per leggere la data esatta dal tag "data-date"
function getTimeValue(recensione) {
    const timeEl = recensione.querySelector(".time");
    if (!timeEl) return 0;
    const dateStr = timeEl.getAttribute("data-date");
    return new Date(dateStr).getTime();
}