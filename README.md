# 🎵 ChoirOS - Sistema di Gestione Corale Multi-Tenant

**ChoirOS** è una piattaforma SaaS completa per la gestione di associazioni corali, progettata per semplificare l'amministrazione di cori attraverso un'architettura multi-tenant moderna. Il sistema offre funzionalità avanzate per la gestione di membri, eventi, presenze, pagamenti e comunicazioni, con un'interfaccia intuitiva e responsive.

## 📋 Indice

- [Funzionalità Principali](#-funzionalità-principali)
- [Stack Tecnologico](#-stack-tecnologico)
- [Architettura](#-architettura)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Script Disponibili](#-script-disponibili)
- [Struttura del Progetto](#-struttura-del-progetto)
- [API Documentation](#-api-documentation)
- [Sistema Multi-Tenant](#-sistema-multi-tenant)
- [Sistema di Ruoli](#-sistema-di-ruoli)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Licenza](#-licenza)

## ✨ Funzionalità Principali

### Gestione Membri e Iscrizioni
Il sistema offre un completo workflow di gestione dei membri del coro, dall'iscrizione iniziale alla gestione quotidiana. Le iscrizioni possono essere effettuate autonomamente dai candidati attraverso un modulo pubblico, e vengono poi gestite dal segretario che può approvarle o rifiutarle con motivazione. Ogni membro ha un profilo completo con informazioni anagrafiche, sezione vocale, documenti e storico partecipazione.

### Gestione Eventi e Calendario
Gli eventi (prove, concerti, manifestazioni) vengono gestiti attraverso un calendario interattivo con vista mensile. Ogni evento include dettagli completi come luogo, orario, note e lista partecipanti. I membri possono confermare la loro presenza (RSVP) direttamente dal calendario, permettendo al direttore e agli amministratori di avere una visione chiara delle disponibilità.

### Check-in Presenze con QR Code
Il sistema di check-in basato su QR code permette di registrare le presenze agli eventi in modo rapido e sicuro. Ogni evento genera un QR code univoco con validità temporale, che può essere scansionato dai membri tramite l'app mobile. Il sistema supporta anche la modalità offline, salvando i check-in localmente e sincronizzandoli automaticamente quando la connessione è disponibile.

### Gestione Pagamenti
La gestione finanziaria include il tracciamento di quote associative, contributi per eventi e donazioni. Ogni pagamento ha uno stato (in attesa, completato, fallito) e può avere una data di scadenza. Il sistema genera automaticamente statistiche finanziarie per gli amministratori, mostrando entrate totali, pagamenti in sospeso e tasso di riscossione.

### Sistema di Notifiche Email
Il sistema integra Mailjet per l'invio automatico di email transazionali, incluse conferme di iscrizione, inviti a eventi, promemoria pagamenti e notifiche di approvazione. Tutti i template email sono responsive e brandizzati con il logo dell'organizzazione.

### Pannello Superadmin SaaS
Per gestire l'architettura multi-tenant, il sistema include un pannello superadmin che permette di creare e gestire multiple organizzazioni corali, ognuna con la propria sottoscrizione (mensile o annuale). Il pannello mostra statistiche aggregate come MRR (Monthly Recurring Revenue), ARR (Annual Recurring Revenue) e numero di tenant attivi.

### Dashboard Personalizzate per Ruolo
Ogni ruolo utente (corista, capo sezione, segretario, direttore, admin, superadmin) ha una dashboard personalizzata con le informazioni e le azioni più rilevanti per il proprio livello di accesso. Le dashboard includono statistiche in tempo reale, grafici interattivi e accessi rapidi alle funzionalità più utilizzate.

## 🛠️ Stack Tecnologico

### Frontend
Il frontend è costruito con tecnologie moderne che garantiscono un'esperienza utente fluida e reattiva. **React 18** fornisce la base per l'interfaccia utente con il supporto per le ultime funzionalità come Concurrent Rendering e Automatic Batching. **TypeScript** assicura type-safety end-to-end, riducendo gli errori a runtime e migliorando la manutenibilità del codice.

**TailwindCSS 4** gestisce lo styling con un approccio utility-first, permettendo di creare interfacce responsive rapidamente. Il design system è basato sul template **Sneat**, con palette colori moderna (primary #696cff, success #71dd37) e componenti UI coerenti. **Wouter** fornisce il routing client-side con un'API minimale e performante.

### Backend
Il backend utilizza **Node.js** con **Express 4** per il server HTTP, mentre **tRPC 11** gestisce la comunicazione type-safe tra client e server eliminando la necessità di definire manualmente i contratti API. **Drizzle ORM** fornisce un query builder type-safe per interagire con il database **PostgreSQL**, con supporto per migrazioni automatiche e relazioni complesse.

L'autenticazione è gestita tramite **Manus OAuth** con JWT (JSON Web Tokens) per le sessioni utente. Il sistema supporta refresh automatico dei token per mantenere le sessioni attive senza interruzioni. **Mailjet** gestisce l'invio di email transazionali con template HTML responsive.

### Storage e Infrastruttura
I file (logo organizzazioni, foto profilo, documenti) vengono salvati su **AWS S3** tramite helper pre-configurati. Il sistema include **Service Worker** per il supporto offline e **IndexedDB** per la cache locale dei dati. La piattaforma è hostata su **Manus** con supporto per custom domain e deployment automatico.

### Testing e Quality Assurance
Il progetto utilizza **Vitest** per i test unitari e di integrazione, con copertura delle procedure tRPC critiche. **ESLint** e **TypeScript** assicurano la qualità del codice attraverso linting automatico e type checking.

## 🏗️ Architettura

### Multi-Tenant Architecture
ChoirOS implementa un'architettura multi-tenant dove ogni organizzazione corale opera in modo isolato con i propri dati, utenti ed eventi. Il tenant viene identificato tramite lo slug dell'organizzazione nell'URL (pattern `/t/{slug}/*`) e viene estratto automaticamente dal middleware backend per filtrare tutte le query al database.

Ogni richiesta HTTP include un header `x-tenant-slug` che permette al backend di caricare il contesto dell'organizzazione corretta. Le tabelle del database includono una colonna `organization_id` per garantire l'isolamento dei dati a livello di database. Questo approccio garantisce sicurezza, scalabilità e semplicità di gestione.

### Role-Based Access Control (RBAC)
Il sistema implementa un controllo degli accessi basato su 7 ruoli distinti, ognuno con permessi specifici. I **super_admin** gestiscono la piattaforma globale e possono creare nuove organizzazioni. Gli **admin** gestiscono la propria organizzazione con accesso completo a membri, eventi e pagamenti. I **director** (direttori artistici) gestiscono il repertorio musicale e gli eventi artistici.

I **secretary** (segretari) gestiscono le iscrizioni e le comunicazioni. I **capo_section** (capi sezione) visualizzano statistiche e membri della propria sezione vocale. I **member** (coristi) hanno accesso al proprio profilo, calendario eventi e pagamenti. I **guest** hanno accesso limitato solo alla visualizzazione pubblica.

Il middleware backend verifica automaticamente i permessi per ogni endpoint tRPC, bloccando le richieste non autorizzate con errore `FORBIDDEN`. Il frontend adatta dinamicamente l'interfaccia mostrando solo le funzionalità accessibili al ruolo corrente.

### Database Schema
Il database è strutturato con tabelle principali per **organizations** (dati fiscali, contatti, logo), **users** (autenticazione, ruolo), **user_profiles** (anagrafica, sezione vocale, documenti), **memberships** (relazione utente-organizzazione), **events** (prove, concerti), **attendance** (presenze con timestamp), **payments** (quote, contributi), **registrations** (iscrizioni pending) e **subscriptions** (piani SaaS).

Le relazioni tra tabelle sono gestite tramite foreign key con constraint di integrità referenziale. Gli indici sono ottimizzati per le query più frequenti (ricerca membri per sezione, eventi per data, pagamenti per stato).

### tRPC API Structure
Le API sono organizzate in router tematici: **auth** (login, logout, session refresh), **users** (CRUD membri, cambio ruolo), **profile** (statistiche personali, upload foto), **events** (CRUD eventi, RSVP), **attendance** (check-in QR), **payments** (CRUD pagamenti, statistiche), **registrations** (workflow iscrizioni) e **superadmin** (gestione tenant e sottoscrizioni).

Ogni procedura è tipizzata end-to-end con **Zod** per la validazione degli input e **Superjson** per la serializzazione automatica di tipi complessi come Date. Il client tRPC genera automaticamente i tipi TypeScript dalle definizioni backend, garantendo type-safety completo.

## 🚀 Installazione

### Prerequisiti
Prima di iniziare, assicurati di avere installato:
- **Node.js** versione 22.x o superiore
- **pnpm** versione 9.x o superiore (gestore pacchetti)
- **PostgreSQL** versione 14.x o superiore
- **Git** per il version control

### Setup Locale

Clona il repository dal tuo account GitHub:

```bash
git clone https://github.com/mariomicrotel/choiros3.git
cd choiros3
```

Installa le dipendenze del progetto utilizzando pnpm:

```bash
pnpm install
```

Crea un file `.env` nella root del progetto copiando il template di esempio:

```bash
cp .env.example .env
```

Configura le variabili d'ambiente nel file `.env` (vedi sezione Configurazione per i dettagli). Le variabili critiche includono `DATABASE_URL` per la connessione al database, `JWT_SECRET` per la firma dei token di sessione, e le credenziali Mailjet per l'invio email.

Esegui le migrazioni del database per creare le tabelle:

```bash
pnpm db:push
```

Opzionalmente, puoi popolare il database con dati demo per testare il sistema:

```bash
node seed-demo.mjs
```

Avvia il server di sviluppo:

```bash
pnpm dev
```

Il server sarà disponibile su `http://localhost:3000`. L'applicazione include hot-reload automatico per modifiche al codice frontend e backend.

## ⚙️ Configurazione

### Variabili d'Ambiente Essenziali

Il sistema richiede diverse variabili d'ambiente per funzionare correttamente. Queste sono organizzate in categorie funzionali.

**Database**: La variabile `DATABASE_URL` contiene la stringa di connessione PostgreSQL nel formato `postgresql://user:password@host:port/database`. Per ambienti di produzione, assicurati di abilitare SSL e utilizzare connection pooling.

**Autenticazione**: `JWT_SECRET` è una stringa casuale utilizzata per firmare i token JWT. Genera una chiave sicura con almeno 32 caratteri. Le variabili `OAUTH_SERVER_URL` e `VITE_OAUTH_PORTAL_URL` configurano l'integrazione con Manus OAuth. `VITE_APP_ID` identifica l'applicazione nel sistema OAuth.

**Email**: `MAILJET_API_KEY` e `MAILJET_SECRET_KEY` sono le credenziali per l'invio email tramite Mailjet. Puoi ottenerle registrandoti su mailjet.com. In ambiente di sviluppo, il sistema utilizza un mock che logga le email nella console.

**Storage**: Le variabili `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` e `AWS_S3_REGION` configurano l'accesso a S3 per il salvataggio di file. Queste sono pre-configurate automaticamente dalla piattaforma Manus.

**Applicazione**: `VITE_APP_TITLE` imposta il titolo dell'applicazione visualizzato nel browser. `VITE_APP_LOGO` è l'URL del logo mostrato nella sidebar. `OWNER_NAME` e `OWNER_OPEN_ID` identificano il proprietario della piattaforma.

### Esempio File .env

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/choiros

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# OAuth (Manus)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# Mailjet
MAILJET_API_KEY=your-mailjet-api-key
MAILJET_SECRET_KEY=your-mailjet-secret-key

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=eu-west-1

# App
VITE_APP_TITLE=ChoirOS
OWNER_NAME=Your Name
```

## 📜 Script Disponibili

### Sviluppo

**`pnpm dev`**: Avvia il server di sviluppo con hot-reload automatico. Il backend Express e il frontend Vite vengono eseguiti simultaneamente. Le modifiche al codice vengono ricaricate automaticamente senza dover riavviare il server.

**`pnpm db:push`**: Sincronizza lo schema del database definito in `drizzle/schema.ts` con il database PostgreSQL. Questo comando genera automaticamente le migrazioni SQL necessarie e le applica. Utilizzalo ogni volta che modifichi lo schema del database.

**`pnpm db:studio`**: Avvia Drizzle Studio, un'interfaccia web per esplorare e modificare i dati del database. Utile per debugging e gestione manuale dei dati durante lo sviluppo.

### Testing

**`pnpm test`**: Esegue tutti i test unitari e di integrazione con Vitest. I test coprono le procedure tRPC critiche, la logica di business e i helper del database. Il comando genera anche un report di copertura del codice.

**`pnpm test:watch`**: Esegue i test in modalità watch, rilanciandoli automaticamente quando i file vengono modificati. Utile durante lo sviluppo di nuove funzionalità con approccio TDD (Test-Driven Development).

### Build e Deploy

**`pnpm build`**: Compila il progetto per la produzione. Il frontend viene bundlato con Vite (minificazione, tree-shaking, code-splitting) e il backend TypeScript viene transpilato in JavaScript. Gli asset ottimizzati vengono salvati nella cartella `dist/`.

**`pnpm start`**: Avvia il server in modalità produzione utilizzando i file compilati nella cartella `dist/`. Questo comando viene utilizzato automaticamente dalla piattaforma Manus dopo il deploy.

### Utility

**`pnpm lint`**: Esegue ESLint su tutto il codebase per identificare problemi di stile e potenziali bug. Le regole di linting sono configurate per TypeScript e React best practices.

**`pnpm type-check`**: Esegue il type checking TypeScript senza compilare i file. Utile per verificare rapidamente la correttezza dei tipi prima di committare.

## 📁 Struttura del Progetto

```
choiros/
├── client/                      # Frontend React
│   ├── public/                  # Asset statici (favicon, immagini)
│   └── src/
│       ├── components/          # Componenti UI riutilizzabili
│       │   ├── ui/              # Componenti shadcn/ui
│       │   ├── DashboardLayout.tsx
│       │   ├── EditOrganizationDialog.tsx
│       │   └── ...
│       ├── contexts/            # React Context (auth, tenant)
│       ├── hooks/               # Custom hooks (useAuth, useSessionRefresh)
│       ├── lib/                 # Utility e configurazioni
│       │   └── trpc.ts          # Client tRPC
│       ├── pages/               # Pagine dell'applicazione
│       │   ├── admin/           # Pannello amministrazione
│       │   ├── superadmin/      # Pannello superadmin
│       │   ├── Dashboard.tsx
│       │   ├── Profile.tsx
│       │   └── ...
│       ├── App.tsx              # Router e layout principale
│       ├── main.tsx             # Entry point React
│       └── index.css            # Stili globali e design tokens
├── server/                      # Backend Node.js
│   ├── _core/                   # Framework e infrastruttura
│   │   ├── context.ts           # Context tRPC con tenant
│   │   ├── oauth.ts             # Autenticazione Manus
│   │   ├── llm.ts               # Integrazione LLM
│   │   └── ...
│   ├── db.ts                    # Helper database Drizzle
│   ├── routers.ts               # Definizione API tRPC
│   ├── emailService.ts          # Servizio email Mailjet
│   └── *.test.ts                # Test Vitest
├── drizzle/                     # Database
│   ├── schema.ts                # Schema Drizzle ORM
│   └── migrations/              # Migrazioni SQL generate
├── shared/                      # Codice condiviso client/server
│   ├── constants.ts             # Costanti (ruoli, stati)
│   └── types.ts                 # Tipi TypeScript condivisi
├── storage/                     # Helper S3
│   └── index.ts                 # storagePut, storageGet
├── seed-demo.mjs                # Script dati demo
├── package.json                 # Dipendenze e script
├── tsconfig.json                # Configurazione TypeScript
├── vite.config.ts               # Configurazione Vite
├── drizzle.config.ts            # Configurazione Drizzle
└── README.md                    # Questo file
```

### Convenzioni di Naming

**File e Cartelle**: I componenti React utilizzano PascalCase (es. `DashboardLayout.tsx`). I file utility e helper utilizzano camelCase (es. `emailService.ts`). Le cartelle utilizzano kebab-case per nomi composti (es. `user-profiles/`).

**Componenti UI**: I componenti shadcn/ui sono in `client/src/components/ui/` con nomi lowercase (es. `button.tsx`, `card.tsx`). I componenti custom sono nella root di `components/` con nomi PascalCase.

**Route e API**: Le route frontend seguono il pattern `/t/{slug}/{feature}` per le pagine tenant-specific. Le procedure tRPC sono organizzate in router tematici (es. `auth.*`, `users.*`, `events.*`).

## 📡 API Documentation

### Autenticazione (auth)

**`auth.me`**: Restituisce i dati dell'utente corrente autenticato, inclusi profilo, organizzazione e membership. Questa query viene utilizzata dal frontend per verificare lo stato di autenticazione e caricare il context utente.

**`auth.logout`**: Invalida la sessione corrente eliminando il cookie JWT. Dopo il logout, l'utente viene reindirizzato alla home page pubblica.

**`auth.refreshSession`**: Rigenera il token JWT con i dati aggiornati dal database. Utilizzato automaticamente dal hook `useSessionRefresh` quando il ruolo utente cambia per evitare logout/login manuali.

### Gestione Utenti (users)

**`users.list`**: Restituisce la lista dei membri dell'organizzazione con filtri opzionali per ruolo, sezione vocale e stato. Include dati del profilo (nome, cognome, email, telefono). Richiede ruolo admin o superiore.

**`users.get`**: Restituisce i dettagli completi di un utente specifico, inclusi profilo, statistiche presenze e pagamenti. Accessibile da admin o dall'utente stesso per il proprio profilo.

**`users.update`**: Aggiorna i dati del profilo utente (nome, cognome, telefono, indirizzo, sezione vocale). Gli utenti possono modificare il proprio profilo, gli admin possono modificare qualsiasi profilo.

**`users.changeRole`**: Modifica il ruolo di un utente nell'organizzazione. Richiede ruolo admin. Non può essere utilizzato per promuovere a super_admin (richiede accesso diretto al database).

### Profilo (profile)

**`profile.getStats`**: Restituisce statistiche personalizzate per l'utente corrente, inclusi numero di eventi partecipati, tasso di presenza, totale pagamenti completati e pagamenti in sospeso. Utilizzato nella pagina profilo.

**`profile.getAttendanceHistory`**: Restituisce lo storico completo delle presenze dell'utente con dettagli evento (titolo, data, tipo). Utilizzato nel tab "Partecipazione" del profilo.

**`profile.getPaymentHistory`**: Restituisce lo storico pagamenti dell'utente con dettagli (importo, tipo, stato, data scadenza). Utilizzato nel tab "Pagamenti" del profilo.

### Eventi (events)

**`events.list`**: Restituisce la lista eventi dell'organizzazione con filtri per tipo (prova, concerto, manifestazione) e intervallo date. Include conteggio RSVP per ogni evento.

**`events.get`**: Restituisce dettagli completi di un evento, inclusi luogo, orario, note, lista partecipanti con RSVP e statistiche presenze.

**`events.create`**: Crea un nuovo evento. Richiede ruolo director o admin. Invia automaticamente email di invito a tutti i membri attivi.

**`events.update`**: Modifica un evento esistente. Richiede ruolo director o admin.

**`events.delete`**: Elimina un evento. Richiede ruolo admin. Elimina anche RSVP e presenze associate.

**`events.rsvp`**: Registra la risposta dell'utente a un invito evento (attending, not_attending, maybe). Accessibile da tutti i membri.

**`events.getRsvpList`**: Restituisce la lista completa delle risposte RSVP per un evento con dati utente. Richiede ruolo admin.

### Presenze (attendance)

**`attendance.checkIn`**: Registra la presenza di un utente a un evento tramite QR code. Valida il token QR (scadenza, evento corretto) e previene check-in duplicati.

**`attendance.list`**: Restituisce la lista presenze con filtri per evento e utente. Include timestamp check-in e dati utente/evento.

### Pagamenti (payments)

**`payments.list`**: Restituisce la lista pagamenti dell'organizzazione con dati utente (nome, cognome, sezione vocale). Include filtri per stato e tipo. Richiede ruolo admin.

**`payments.create`**: Crea un nuovo pagamento per un utente. Richiede ruolo admin. Invia automaticamente email di notifica se è impostata una data di scadenza.

**`payments.updateStatus`**: Modifica lo stato di un pagamento (pending, completed, failed). Invia automaticamente email di conferma quando lo stato diventa completed.

### Iscrizioni (registrations)

**`registrations.create`**: Crea una nuova richiesta di iscrizione. Endpoint pubblico accessibile senza autenticazione. Invia email di conferma al candidato.

**`registrations.list`**: Restituisce la lista iscrizioni pending. Richiede ruolo secretary o admin.

**`registrations.approve`**: Approva un'iscrizione creando l'utente e il profilo. Richiede ruolo secretary o admin. Invia email di benvenuto con credenziali di accesso.

**`registrations.reject`**: Rifiuta un'iscrizione con motivazione. Richiede ruolo secretary o admin. Invia email di notifica al candidato.

### Superadmin (superadmin)

**`superadmin.getStats`**: Restituisce statistiche globali della piattaforma (numero organizzazioni, sottoscrizioni attive, MRR, ARR, rinnovi prossimi 30 giorni). Richiede ruolo super_admin.

**`superadmin.listOrganizations`**: Restituisce la lista di tutte le organizzazioni con dati sottoscrizione. Richiede ruolo super_admin.

**`superadmin.createOrganization`**: Crea una nuova organizzazione con sottoscrizione. Richiede ruolo super_admin.

**`superadmin.updateOrganization`**: Modifica i dati di un'organizzazione (nome, contatti, dati fiscali, indirizzo). Richiede ruolo super_admin.

**`superadmin.updateSubscription`**: Modifica il piano o lo stato di una sottoscrizione. Richiede ruolo super_admin.

## 🏢 Sistema Multi-Tenant

### Isolamento Dati

ChoirOS implementa un'architettura multi-tenant che permette a multiple organizzazioni corali di utilizzare la stessa istanza dell'applicazione mantenendo i dati completamente isolati. Ogni organizzazione ha il proprio slug univoco (es. `coro-demo`, `coro-verdi`) che viene utilizzato nell'URL per identificare il tenant corrente.

Il middleware backend estrae automaticamente lo slug dal header HTTP `x-tenant-slug` inviato dal client in ogni richiesta. Questo slug viene utilizzato per caricare i dati dell'organizzazione dal database e iniettarli nel context tRPC. Tutte le query successive filtrano automaticamente i risultati per `organization_id`, garantendo che ogni tenant veda solo i propri dati.

### Gestione Sottoscrizioni

Ogni organizzazione ha una sottoscrizione associata che determina l'accesso alle funzionalità della piattaforma. Le sottoscrizioni possono essere di tipo **monthly** (mensile) o **annual** (annuale) con prezzi configurabili. Gli stati possibili sono **active** (attiva), **suspended** (sospesa per mancato pagamento), **expired** (scaduta) e **cancelled** (cancellata dall'utente).

Il pannello superadmin mostra statistiche aggregate come MRR (Monthly Recurring Revenue) calcolato sommando tutte le sottoscrizioni mensili più le sottoscrizioni annuali divise per 12. L'ARR (Annual Recurring Revenue) è calcolato moltiplicando l'MRR per 12. Il sistema traccia anche i rinnovi in scadenza nei prossimi 30 giorni per permettere azioni proattive.

### Onboarding Nuove Organizzazioni

Il processo di creazione di una nuova organizzazione è gestito dal superadmin attraverso un dialog dedicato. Il form richiede nome organizzazione, email di fatturazione, codice fiscale, partita IVA, telefono, indirizzo completo e piano sottoscrizione. Alla creazione, il sistema genera automaticamente uno slug univoco dal nome dell'organizzazione (es. "Coro Verdi" → "coro-verdi").

Dopo la creazione, il superadmin può assegnare il ruolo admin al primo utente dell'organizzazione, che potrà poi gestire autonomamente membri, eventi e pagamenti. Ogni organizzazione può personalizzare il proprio logo, che viene salvato su S3 e mostrato nella sidebar e nelle email.

## 👥 Sistema di Ruoli

### Gerarchia Permessi

Il sistema implementa 7 ruoli con permessi crescenti, organizzati in una gerarchia chiara. I permessi sono cumulativi, quindi un ruolo superiore eredita tutti i permessi dei ruoli inferiori.

**Guest**: Accesso minimo, può solo visualizzare informazioni pubbliche come la pagina di iscrizione. Non può accedere alla dashboard o vedere dati riservati.

**Member (Corista)**: Può accedere alla propria dashboard, visualizzare il calendario eventi, confermare presenza (RSVP), effettuare check-in con QR code, visualizzare e modificare il proprio profilo, visualizzare i propri pagamenti e storico presenze.

**Capo Sezione**: Oltre ai permessi di member, può visualizzare la lista dei membri della propria sezione vocale (soprano, contralto, tenore, basso) con statistiche presenze aggregate per sezione.

**Secretary (Segretario)**: Oltre ai permessi di capo sezione, può gestire le iscrizioni (approvare/rifiutare), visualizzare la lista completa dei membri con filtri, inviare comunicazioni ai membri.

**Director (Direttore Artistico)**: Oltre ai permessi di secretary, può creare, modificare ed eliminare eventi, gestire il repertorio musicale (feature in roadmap), visualizzare statistiche globali del coro.

**Admin (Amministratore)**: Oltre ai permessi di director, può gestire tutti gli aspetti dell'organizzazione inclusi pagamenti, modificare ruoli utenti, accedere a tutte le statistiche finanziarie, configurare impostazioni organizzazione.

**Super Admin**: Accesso globale alla piattaforma, può creare e gestire multiple organizzazioni, modificare sottoscrizioni, visualizzare statistiche aggregate (MRR, ARR), accedere al pannello superadmin.

### Middleware di Protezione

Il backend implementa middleware tRPC specifici per ogni livello di accesso. Le procedure pubbliche utilizzano `publicProcedure` e sono accessibili senza autenticazione. Le procedure protette utilizzano `protectedProcedure` e richiedono un utente autenticato. Le procedure admin utilizzano `adminProcedure` e verificano che il ruolo sia admin o superiore. Le procedure superadmin utilizzano `superAdminProcedure` e richiedono esplicitamente il ruolo super_admin.

Se un utente tenta di accedere a una procedura senza i permessi necessari, il sistema restituisce un errore tRPC con codice `FORBIDDEN` e messaggio descrittivo. Il frontend gestisce questi errori mostrando un toast di notifica e reindirizzando alla pagina appropriata.

### Dashboard Personalizzate

Ogni ruolo ha una dashboard ottimizzata per le proprie esigenze. La dashboard del **corista** mostra prossimi eventi, pagamenti in sospeso e statistiche presenze personali. La dashboard del **capo sezione** aggiunge statistiche della propria sezione vocale. La dashboard del **segretario** mostra iscrizioni pending da gestire. La dashboard del **direttore** include statistiche globali del coro e distribuzione sezioni vocali. La dashboard dell'**admin** aggiunge statistiche finanziarie complete. La dashboard del **superadmin** mostra metriche aggregate di tutte le organizzazioni.

## 🗺️ Roadmap

### In Sviluppo
- **Upload Logo Organizzazione**: Implementazione completa upload logo su S3 con preview nel dialog creazione/modifica organizzazione
- **Pagina SuperadminSubscriptions**: Interfaccia dedicata per gestione sottoscrizioni con filtri, statistiche e azioni (cambio piano, cancellazione, riattivazione)
- **Filtri e Ricerca Organizzazioni**: Aggiungere filtri per stato sottoscrizione, piano e ricerca per nome nella lista organizzazioni superadmin

### Prossime Feature (Q1 2026)
- **Repository Brani**: Sistema completo di gestione repertorio musicale con upload spartiti PDF, audio MP3, gestione setlist per eventi, ricerca full-text su titolo/compositore/arrangiatore
- **Report e Export**: Export CSV/PDF per liste membri, presenze eventi, statistiche finanziarie, report personalizzati per direttore e admin
- **Vista Calendario Settimanale**: Vista calendario con swipe mobile per navigazione rapida tra settimane
- **Sistema Comunicazioni**: Invio email massive a membri con filtri per sezione/ruolo, template email personalizzabili, tracking aperture email

### Feature Future (Q2-Q3 2026)
- **App Mobile Nativa**: App iOS/Android con supporto offline completo, notifiche push per eventi e pagamenti, scanner QR code nativo
- **Integrazione Pagamenti Online**: Stripe/PayPal per pagamento quote online, generazione ricevute automatiche, reminder pagamenti automatici
- **Sistema Permessi Granulare**: Permessi custom per ruolo, gestione permessi a livello di feature, audit log delle azioni sensibili
- **Dashboard Analytics Avanzata**: Grafici interattivi con drill-down, export dati per analisi esterna, previsioni trend presenze/pagamenti
- **Gestione Documenti**: Upload documenti personali (certificati, liberatorie), scadenzario documenti con reminder, archivio digitale organizzazione
- **Integrazione Calendario Esterno**: Sincronizzazione con Google Calendar/Outlook, export eventi in formato iCal, reminder automatici pre-evento

### Miglioramenti Tecnici
- **Performance Optimization**: Implementazione caching Redis per query frequenti, lazy loading componenti pesanti, ottimizzazione bundle size
- **Testing Coverage**: Aumentare copertura test al 80%+, aggiungere test E2E con Playwright, test di carico per scenari multi-tenant
- **Documentation**: Documentazione API completa con esempi, guide utente per ogni ruolo, video tutorial onboarding
- **Accessibility**: Migliorare supporto screen reader, navigazione completa da tastiera, conformità WCAG 2.1 AA

## 🤝 Contributing

Contributi al progetto sono benvenuti! Segui queste linee guida per contribuire in modo efficace.

### Setup Ambiente di Sviluppo

Forka il repository sul tuo account GitHub e clona il fork localmente. Crea un branch dedicato per la tua feature o bugfix con naming convention `feature/nome-feature` o `fix/nome-bug`. Installa le dipendenze con `pnpm install` e configura le variabili d'ambiente copiando `.env.example` in `.env`.

Esegui i test per verificare che tutto funzioni correttamente con `pnpm test`. Avvia il server di sviluppo con `pnpm dev` e verifica che l'applicazione sia accessibile su `http://localhost:3000`.

### Workflow Contribuzione

Prima di iniziare a lavorare su una feature, apri una issue su GitHub descrivendo la funzionalità o il bug. Questo permette di discutere l'approccio migliore e evitare duplicazioni di lavoro. Assicurati che la issue sia approvata da un maintainer prima di procedere.

Sviluppa la tua feature seguendo le convenzioni di codice del progetto (TypeScript strict mode, ESLint rules, naming conventions). Scrivi test per la nuova funzionalità o per riprodurre il bug fixato. Assicurati che tutti i test passino con `pnpm test` e che non ci siano errori di linting con `pnpm lint`.

Committa le modifiche con messaggi descrittivi seguendo il formato Conventional Commits (es. `feat: add logo upload to organizations`, `fix: resolve QR code validation error`). Pusha il branch sul tuo fork e apri una Pull Request verso il repository principale.

### Code Review

Ogni Pull Request viene revisionata da almeno un maintainer prima del merge. Il reviewer verificherà la qualità del codice, la copertura dei test, la documentazione e la coerenza con l'architettura esistente. Potrebbero essere richieste modifiche prima dell'approvazione.

Una volta approvata, la Pull Request viene mergiata nel branch main e la feature sarà inclusa nel prossimo release. Il tuo nome verrà aggiunto automaticamente alla lista dei contributors nel repository.

### Reporting Bug

Se trovi un bug, apri una issue su GitHub con label "bug". Includi una descrizione dettagliata del problema, i passi per riprodurlo, il comportamento atteso vs quello attuale, screenshot se rilevanti, e informazioni sull'ambiente (browser, versione Node.js, sistema operativo).

Se possibile, includi un test case che riproduce il bug. Questo accelera notevolmente il processo di fix.

## 📄 Licenza

Questo progetto è rilasciato sotto licenza **MIT**. Sei libero di utilizzare, modificare e distribuire il codice per scopi personali o commerciali, a condizione di includere la nota di copyright originale.

```
MIT License

Copyright (c) 2026 Mario Microtel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Contatti e Supporto

Per domande, supporto o feedback sul progetto:

- **GitHub Issues**: [github.com/mariomicrotel/choiros3/issues](https://github.com/mariomicrotel/choiros3/issues)
- **Email**: mariomicrotel@gmail.com
- **Repository**: [github.com/mariomicrotel/choiros3](https://github.com/mariomicrotel/choiros3)

---

**Sviluppato con ❤️ per la comunità corale**
