# ChoirOS - Project TODO

## Phase 1: Core Gestionale + Multitenant

### Architettura e Database
- [x] Schema database multitenant (organizations, users, memberships)
- [x] Tabella user_profiles (phone, address, voice_section, status, documents, tags)
- [x] Tabella events (type, title, start_at, end_at, venue, notes)
- [x] Tabella venues (name, address, coordinates)
- [x] Tabella payments (amount, status, due_date, type)
- [x] Tabella rsvp (event_id, user_id, status, motivation)
- [x] Tabella registrations (email, fullName, voiceSection, status)

### Backend RBAC e Middleware
- [x] Middleware estrazione tenant da subdomain/slug
- [x] Context utente con tenant_id e organization
- [x] Protezione endpoint con RBAC middleware
- [x] Procedure per 7 ruoli: super_admin, admin, director, secretary, capo_section, member, guest
- [x] Endpoint auth.me e auth.logout

### Gestione Utenti e Ruoli
- [x] Endpoint users.list con filtri (role, section, status)
- [x] Endpoint users.get e users.update
- [x] Endpoint users.changeRole (admin only)
- [x] DB helpers: getUserProfile, upsertUserProfile, getUserMembership

### Iscrizioni Self-Service
- [x] Endpoint registrations.create (pubblico)
- [x] Endpoint registrations.list (secretary)
- [x] Endpoint registrations.approve (secretary)
- [x] Endpoint registrations.reject (secretary)
- [x] Workflow: pending → approved/rejected

### Gestione Eventi
- [x] Endpoint events.list (con filtri per tipo, data)
- [x] Endpoint events.get (dettagli evento)
- [x] Endpoint events.create (director/secretary)
- [x] Endpoint events.update e events.delete
- [x] Endpoint events.rsvp (attending/not_attending/maybe)
- [x] Endpoint events.getRsvpList (admin)

### Gestione Pagamenti
- [x] Endpoint payments.create
- [x] Endpoint payments.list (storico)
- [x] Endpoint payments.updateStatus
- [x] Stati: pending, completed, failed

### UI Dashboard Corista
- [x] Layout responsive mobile-first
- [x] Card prossimi eventi
- [x] Status pagamenti (quote in scadenza)
- [x] Statistiche presenze personali
- [x] Link rapidi (check-in, profilo)

### UI Calendario Eventi
- [x] Vista mese con grid responsive
- [ ] Vista settimana (swipe mobile)
- [x] Dettagli evento (modal/drawer)
- [x] RSVP inline
- [x] Filtri per tipo evento
- [x] Indicatori visivi (colori per tipo)

### UI Amministrazione
- [ ] AdminPanel.tsx - Hub centrale con menu navigazione
- [x] AdminMembers.tsx - Anagrafica coristi con form completo
- [ ] AdminSections.tsx - Gestione sezioni vocali
- [x] AdminPayments.tsx - Gestione quote con statistiche
- [x] AdminEvents.tsx - Gestione eventi con RSVP
- [ ] AdminMemberPayments.tsx - Stato pagamenti per membro

## Phase 2: Check-in Presenze

### Check-in QR
- [x] Tabella attendance (event_id, user_id, check_in_at, status)
- [x] Endpoint attendance.checkIn (validazione QR)
- [x] Endpoint attendance.list (filtri per evento, utente)
- [x] Generazione QR code con validità temporale
- [ ] Endpoint attendance.getReport (export CSV/PDF)

### Scanner QR Mobile
- [x] UI scanner con accesso camera
- [x] Validazione QR (anti-frode, timing)
- [x] Feedback visivo check-in riuscito/fallito

### Offline-First Check-in
- [x] Service Worker per caching
- [x] IndexedDB per salvataggio check-in offline
- [x] Sincronizzazione automatica quando online
- [x] Hook useOfflineStorage per gestione offline
- [x] Indicatore stato online/offline

## Phase 3: Notifiche Email

### Sistema Email
- [ ] Setup queue asincrona (Bull + Redis)
- [ ] Template email HTML responsive
- [ ] Job email invito evento
- [ ] Job email promemoria 24h prima evento
- [ ] Job email conferma iscrizione
- [ ] Job email approvazione/rifiuto iscrizione
- [ ] Job email scadenza pagamento

## Phase 4: Repository Brani

### Database Brani
- [ ] Tabella songs (title, composer, arranger, difficulty, tempo, key)
- [ ] Tabella song_arrangements (version, arranger, notes)
- [ ] Tabella song_assets (type: score_pdf, reference_audio, section_stem)
- [ ] Tabella setlists (event_id, title, notes)
- [ ] Tabella setlist_items (setlist_id, song_id, order)

### Backend Brani
- [ ] Endpoint songs.list (ricerca, filtri)
- [ ] Endpoint songs.get (dettagli + assets)
- [ ] Endpoint songs.create (director)
- [ ] Endpoint songs.update e songs.delete
- [ ] Endpoint songs.uploadAsset (S3)
- [ ] Ricerca full-text su titolo, compositore, arrangiatore

### Setlist
- [ ] Endpoint setlists.create
- [ ] Endpoint setlists.update
- [ ] Endpoint setlists.addSong
- [ ] Endpoint setlists.removeSong
- [ ] Vista setlist con ordine brani

### UI Repository Brani
- [ ] Pagina lista brani con ricerca
- [ ] Form creazione/modifica brano
- [ ] Upload spartiti PDF
- [ ] Upload audio MP3
- [ ] Visualizzazione setlist per evento
- [ ] Download spartiti per coristi

## Phase 5: Test e Deployment

- [ ] Test E2E flussi principali
- [ ] Seed data demo
- [ ] Documentazione utente
- [ ] Checkpoint finale


## Nuove Funzionalità: Pagine Profilo per Ruolo

### Profilo Corista Base
- [x] Pagina profilo con dati personali (nome, email, telefono, indirizzo)
- [x] Modifica sezione vocale e informazioni di contatto
- [x] Visualizzazione statistiche presenze personali
- [x] Storico eventi partecipati
- [ ] Upload foto profilo
- [ ] Gestione documenti personali

### Profilo Capo Sezione
- [x] Vista membri della propria sezione vocale con dettagli
- [x] Statistiche membri attivi/totali per sezione
- [x] Lista prossimi eventi
- [ ] Report presenze sezione (export CSV)
- [ ] Comunicazioni interne sezione

### Profilo Segretario
- [x] Dashboard iscrizioni pending con statistiche
- [x] Approvazione/rifiuto iscrizioni con motivazione
- [x] Vista completa membri con stato
- [ ] Export lista membri (CSV/PDF)
- [ ] Gestione comunicazioni massive

### Profilo Direttore
- [x] Dashboard statistiche coro complete
- [x] Vista distribuzione sezioni vocali con grafici
- [x] Visualizzazione repertorio musicale
- [x] Analisi eventi per tipologia
- [ ] Report presenze per sezione vocale
- [ ] Pianificazione stagione artistica

### Profilo Admin
- [x] Vista informazioni organizzazione
- [x] Statistiche membri per stato e ruolo
- [x] Statistiche finanziarie complete (entrate, pending, falliti)
- [x] Dashboard sistema con metriche
- [ ] Configurazione impostazioni coro
- [ ] Gestione ruoli e permessi
- [ ] Backup e export dati


### Sistema Login e Seed Dati
- [ ] Pagina login personalizzata con form credenziali
- [ ] Integrazione autenticazione locale (email/password)
- [x] Script seed dati demo completo
- [x] Organizzazione demo con tutti i ruoli
- [x] Eventi demo (prove, concerti passati e futuri)
- [x] Pagamenti demo con vari stati
- [x] Presenze registrate per statistiche
- [x] Iscrizioni pending per test approvazioni


## Task Corrente: Profili Specializzati per Ruoli

### Implementazione Profili
- [ ] ProfileCapoSezione.tsx - Vista membri sezione, statistiche presenze
- [ ] ProfileSegretario.tsx - Dashboard iscrizioni, approvazione membri
- [ ] ProfileDirettore.tsx - Statistiche globali coro, gestione repertorio
- [ ] ProfileAdmin.tsx - Configurazione organizzazione, gestione completa
- [ ] Routing dinamico basato su ruolo utente
- [ ] Endpoint backend per statistiche per sezione
- [ ] Endpoint backend per statistiche globali coro


## Bug Fix Completato: Membership e Tenant Context

- [x] Risolto errore "Organization not found" 
- [x] Creata membership per utente loggato nel database
- [x] Aggiunto endpoint auth.myOrganizations
- [x] Creata pagina SelectOrganization per multi-tenant
- [x] Sistema funzionante con tenant context corretto


## Fix: Redirect Automatico Organizzazione

- [x] Modificare Home.tsx per controllare membership utente
- [x] Implementare redirect automatico a /t/{slug}/ se utente ha organizzazione
- [x] Mostrare pagina SelectOrganization se utente ha multiple membership
- [x] Gestire caso utente senza organizzazione
- [x] Creato componente TenantRoute per proteggere route
- [x] Wrappate tutte le route dashboard/admin/checkin con TenantRoute


## Fix: Routing Tenant Pattern /t/{slug}/

- [x] Aggiungere route pattern /t/:slug/* in App.tsx
- [x] Configurare tutte le route per accettare prefisso tenant
- [x] Aggiornate route: dashboard, calendar, profile, admin/*, checkin, events/:id/qr
- [x] Mantenuta route legacy /dashboard per backward compatibility
