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
- [x] Setup Mailjet con sistema mock per sviluppo (node-mailjet installato)
- [x] Template email HTML responsive (6 template implementati)
- [x] Email invito evento (inviata automaticamente alla creazione)
- [ ] Job email promemoria 24h prima evento (richiede scheduler - TODO)
- [x] Email conferma iscrizione (inviata automaticamente)
- [x] Email approvazione/rifiuto iscrizione (inviata automaticamente)
- [x] Email scadenza pagamento (inviata se dueAt è impostato)
- [x] Email conferma pagamento (inviata quando status diventa completed)

## Phase 4: Repository Brani [IN CORSO]

### Database Brani
- [x] Tabella songs (title, composer, arranger, difficulty, tempo, key) - GIÀ PRESENTE
- [x] Tabella song_assets (type: score_pdf, reference_audio, section_stem, lyrics, youtube_link) - GIÀ PRESENTE
- [x] Tabella setlists (event_id, title, notes) - GIÀ PRESENTE
- [x] Tabella setlist_items (setlist_id, song_id, order) - GIÀ PRESENTE

### Backend Brani
- [x] Endpoint songs.list (ricerca, filtri)
- [x] Endpoint songs.get (dettagli + assets)
- [x] Endpoint songs.create (director)
- [x] Endpoint songs.update e songs.delete
- [x] Endpoint songs.uploadAsset (S3)
- [x] Endpoint songs.deleteAsset
- [x] Ricerca full-text su titolo, compositore, arrangiatore (LIKE pattern)

### Setlist
- [x] Endpoint setlists.list
- [x] Endpoint setlists.get (con items)
- [x] Endpoint setlists.create
- [x] Endpoint setlists.update
- [x] Endpoint setlists.delete
- [x] Endpoint setlists.addSong
- [x] Endpoint setlists.removeSong
- [x] Endpoint setlists.reorderItems

### UI Repository Brani
- [x] Pagina lista brani con ricerca (Songs.tsx)
- [x] Form creazione brano (CreateSongDialog.tsx)
- [x] Route /t/:slug/songs in App.tsx
- [x] Link menu "Brani" in DashboardLayout
- [x] Pagina dettaglio brano con assets
  - [x] Componente SongDetail.tsx con visualizzazione metadati
  - [x] Sezione assets con lista spartiti, audio, testi, link YouTube
  - [x] Dialog modifica metadati (EditSongDialog)
  - [x] Upload assets su S3 con progress indicator (UploadAssetDialog)
  - [x] Eliminazione brano con conferma (AlertDialog)
  - [x] Eliminazione singoli assets con conferma
  - [x] Route /t/:slug/songs/:id in App.tsx
  - [x] Permessi director+ per modifica/eliminazione
- [x] Gestione Setlist (Scalette Eventi)
  - [x] Pagina lista setlist (Setlists.tsx)
  - [x] Dialog creazione setlist con selezione evento (CreateSetlistDialog)
  - [x] Pagina dettaglio setlist (SetlistDetail.tsx)
  - [x] Drag-and-drop riordino brani con @dnd-kit
  - [x] Dialog aggiunta brani dal repository (AddSongsDialog)
  - [x] Route /t/:slug/setlists e /t/:slug/setlists/:id
  - [x] Link menu "Scalette" in DashboardLayout
  - [ ] Visualizzazione setlist da pagina evento (opzionale)
  - [ ] Link "Visualizza scaletta" in EventDetail (opzionale)

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


## Task: Aggiornamento Link Navigazione DashboardLayout

- [x] Leggere DashboardLayout per identificare tutti i link
- [x] Aggiornare link sidebar per usare pattern /t/:slug/
- [x] Recuperare slug organizzazione da URL params o user context
- [x] Generare menu items dinamicamente con tenant slug
- [x] Aggiungere menu condizionale per admin (membri, eventi, pagamenti)
- [x] Mostrare nome organizzazione nell'header sidebar


## Bug Fix: Dashboard Non Si Carica

- [x] Verificare errore caricamento infinito dashboard
- [x] Identificato problema: endpoint myOrganizations non rigenerato nei tipi
- [x] Soluzione: usare user.organization da context invece di query separata
- [x] Modificato Home.tsx per redirect diretto con user.organization.slug
- [x] Semplificato SelectOrganization.tsx per mostrare info account demo
- [x] Rimossi errori TypeScript su myOrganizations
- [ ] Testare login con utenti demo di vari ruoli


## Bug Fix: Redirect OAuth Non Mantiene Tenant Context

- [x] Verificare callback OAuth e dove reindirizza dopo login
- [x] Modificato getLoginUrl per accettare parametro returnTo
- [x] Aggiunto returnTo come query param nella callback URL
- [x] Modificato oauth.ts per leggere returnTo e reindirizzare correttamente
- [x] Aggiornato DashboardLayout per passare window.location.pathname come returnTo
- [ ] Testare flusso completo: /t/coro-demo/dashboard → login → callback → /t/coro-demo/dashboard


## Bug Fix: Loop Redirect Home.tsx

- [x] Problema: Home.tsx fa redirect anche quando utente è già su URL con tenant
- [x] Soluzione: rimossa logica redirect automatico da Home.tsx
- [x] Aggiunto messaggio "Benvenuto in ChoirOS" con pulsante per accedere a coro demo
- [x] TenantRoute gestisce correttamente protezione route con tenant context


## Bug Fix: Utente Senza Membership

- [x] Verificare membership per utente loggato (mariomicrotel@gmail.com) - OK
- [x] Membership esiste già nel database
- [x] Problema: tenant context non estratto da URL API
- [x] Soluzione: passare tenant slug via header x-tenant-slug
- [x] Modificato main.tsx per includere header nelle richieste tRPC
- [x] Modificato tenantContext.ts per leggere header x-tenant-slug
- [ ] Testare accesso a /t/coro-demo/dashboard dopo fix


## Bug Fix: Errori Pagina Profilo

- [x] Errore SQL: query count malformata `select (select count(*) from 'id')`
- [x] Errore React Hooks: "Rendered fewer hooks than expected" in Profile.tsx
- [x] Identificata query problematica: db.$count() in routers.ts riga 478 e 486
- [x] Corretto: importato count da drizzle-orm e usato count(events.id)
- [x] Corretto: spostato return condizionale dopo tutti gli hooks in Profile.tsx


## Phase 5: Redesign UI con Stile Sneat

### Design System
- [x] Analizzare template Sneat e estrarre design tokens
- [x] Aggiornare palette colori (primary #696cff, success #71dd37, danger #ff3e1d, warning #ffab00, info #03c3ec)
- [x] Aggiornare tipografia e spacing
- [x] Definire border-radius system (0.5rem)

### Layout Components
- [x] Ridisegnare DashboardLayout con sidebar stile Sneat
- [x] Implementare menu sidebar con icone colorate e hover effects
- [x] Aggiornare header con design Sneat

### UI Components
- [x] Aggiornare stile Card con ombre morbide (shadow-md hover:shadow-lg) e bordi arrotondati (rounded-lg)
- [x] Aggiornare Badge con rounded-full e colori vibranti
- [x] Applicare design tokens Sneat a tutti i componenti


## Fix: Visualizzazione Utente in Gestione Pagamenti

- [x] Modificare query backend payments.list per includere nome, cognome e sezione vocale utente
- [x] Aggiornare frontend AdminPayments per mostrare "Nome Cognome (Sezione)" invece di "Utente #ID"
- [x] Testare visualizzazione con dati demo
- [x] Committare modifiche localmente (commit a68206f)
- [ ] Push su GitHub (problema autenticazione token - richiede intervento utente)


## Feature: Pagina Profilo Completa

- [x] Aggiungere campo profilePhotoUrl allo schema userProfiles
- [x] Eseguire db:push per applicare modifiche schema
- [x] Creare query backend per statistiche profilo (eventi, pagamenti, iscrizioni)
- [x] Implementare UI pagina profilo con sezioni:
  - [x] Header con foto profilo e dati anagrafici
  - [x] Card statistiche partecipazione eventi
  - [x] Card storico pagamenti
  - [x] Card cronologia iscrizioni
- [x] Implementare upload foto profilo (base64 temporaneo)
- [x] Testare funzionalità completa
- [x] Committare modifiche (commit 8ddbfa3)


## Task: Dati Demo per Test Completi

- [x] Creare script Node.js con Drizzle ORM per dati demo (eventi, presenze, pagamenti, RSVP)
- [x] Eseguire script e verificare inserimento corretto (6 eventi, 3 presenze, 3 RSVP, 4 pagamenti)
- [x] Testare pagina profilo con statistiche popolate (3 presenze, 50% tasso, €70 pagato, €65 in sospeso)
- [x] Testare dashboard con dati realistici (2 pagamenti in sospeso, 100% tasso presenze)
- [ ] Committare script demo su GitHub


## Feature: Sistema Multi-Tenant con Pannello Superadmin

### Database Schema
- [x] Aggiungere tabella `subscriptions` per sottoscrizioni SaaS
- [x] Estendere tabella `organizations` con campi: fiscal_code, vat_number, billing_email, phone, address, city, postal_code, country
- [x] Aggiungere enum per piani sottoscrizione (monthly, annual)
- [x] Aggiungere enum per stati sottoscrizione (active, suspended, expired, cancelled)
- [x] Eseguire db:push per applicare migrazioni (0003_whole_gambit.sql)

### Backend API
- [x] Creare router `superadmin` con procedure protette per role=super_admin
- [x] Implementare CRUD organizzazioni (create, list, get, update)
- [x] Implementare CRUD sottoscrizioni (update, cancel)
- [ ] Implementare upload logo organizzazione su S3
- [x] Implementare query statistiche superadmin (tenant attivi, MRR, ARR, rinnovi)
- [x] Aggiungere helper database per gestione sottoscrizioni (8 funzioni)

### Frontend UI
- [x] Creare pagina SuperadminDashboard con statistiche globali (MRR, ARR, tenant attivi, rinnovi)
- [x] Creare pagina SuperadminOrganizations con lista tenant
- [x] Creare dialog/form per creazione nuova organizzazione (dati fiscali + sottoscrizione)
- [x] Aggiungere route /superadmin e /superadmin/organizations in App.tsx
- [ ] Creare dialog/form per modifica organizzazione esistente
- [ ] Implementare upload logo con preview
- [ ] Creare pagina SuperadminSubscriptions per gestione sottoscrizioni
- [x] Aggiungere badge stati sottoscrizione colorati (active, suspended, expired, cancelled)
- [ ] Implementare filtri e ricerca organizzazioni

### Testing & Deployment
- [ ] Testare creazione nuova organizzazione con logo (richiede logout/login per refresh sessione JWT)
- [ ] Testare gestione sottoscrizioni (attivazione, rinnovo, cancellazione)
- [x] Testare dashboard superadmin con statistiche (query SQL funzionante)
- [x] Verificare permessi (middleware superAdminProcedure funzionante)
- [ ] Committare modifiche su GitHub

### Known Issues
- [ ] Cookie JWT non si aggiorna automaticamente dopo cambio ruolo utente - richiede logout/login manuale per refresh sessione
- [ ] Pagina SuperadminOrganizations mostra skeleton infinito se sessione non è aggiornata con ruolo super_admin


## Fix: Risoluzione Known Issues JWT Session Refresh

### Problema
- [x] Cookie JWT non si aggiorna automaticamente dopo cambio ruolo utente
- [x] Pagine superadmin mostrano skeleton infinito se sessione non è aggiornata

### Soluzione Implementata
- [x] Creare endpoint auth.refreshSession per rigenerare JWT con dati DB aggiornati
- [x] Aggiungere hook useSessionRefresh per auto-refresh in pagine protette
- [x] Implementare auto-refresh in SuperadminDashboard
- [x] Implementare auto-refresh in SuperadminOrganizations
- [x] Testare flusso: cambio ruolo DB → auto-refresh → accesso superadmin (SUCCESSO!)
- [x] Committare fix su GitHub (commit 5cd3555)


## Task: Dialog Modifica Organizzazione

### Backend
- [x] Endpoint superadmin.updateOrganization già esistente

### Frontend
- [x] Creare componente EditOrganizationDialog con form completo
- [x] Aggiungere pulsante "Modifica" nelle card organizzazioni
- [x] Implementare mutation updateOrganization con invalidazione cache
- [x] Gestire stati loading/success/error nel dialog
- [x] Popolare form con dati organizzazione esistente

### Form Fields
- [x] Dati base: nome organizzazione
- [x] Contatti: billing_email, phone
- [x] Dati fiscali: fiscal_code, vat_number
- [x] Indirizzo: address, city, postal_code, country

### Testing
- [x] Implementazione completata e testata
- [x] Dialog modifica creato con form completo
- [x] Pulsante modifica aggiunto nelle card
- [x] Mutation updateOrganization funzionante

### Commit
- [x] Committare dialog modifica organizzazione (commit 275c3ef)
- [x] Aggiornare todo.md con task completati


## Task: Creazione README.md per Repository GitHub

- [x] Creare README.md completo con:
  - [x] Descrizione progetto e obiettivi
  - [x] Lista funzionalità principali
  - [x] Stack tecnologico (React, TypeScript, tRPC, Drizzle, PostgreSQL)
  - [x] Architettura multi-tenant SaaS
  - [x] Istruzioni installazione e setup
  - [x] Configurazione variabili ambiente
  - [x] Script disponibili (dev, build, db:push, test)
  - [x] Documentazione API tRPC
  - [x] Screenshot interfaccia utente
  - [x] Roadmap e funzionalità future
  - [x] Contributing guidelines
  - [x] Licenza
