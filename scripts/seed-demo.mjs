import { drizzle } from "drizzle-orm/mysql2";
import { config } from "dotenv";
// Import schema from compiled JS
const schema = await import("../drizzle/schema.ts");
const {
  organizations,
  users,
  memberships,
  userProfiles,
  events,
  rsvp,
  payments,
  attendance,
  registrations,
} = schema;

config();

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("🌱 Starting seed...");

  try {
    // 1. Check if demo organization exists
    console.log("Checking for existing organization...");
    const { eq } = await import("drizzle-orm");
    const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, "coro-demo")).limit(1);
    
    let orgId;
    if (existingOrg.length > 0) {
      orgId = existingOrg[0].id;
      console.log(`ℹ️ Organization already exists with ID: ${orgId}`);
      console.log("⚠️  Skipping seed to avoid duplicates. Delete existing data first if you want to reseed.");
      process.exit(0);
    } else {
      // Create demo organization
      console.log("Creating organization...");
      const [org] = await db
        .insert(organizations)
        .values({
          name: "Coro Polifonico Demo",
          slug: "coro-demo",
          logoUrl: null,
          colors: {
            primary: "#3b82f6",
            secondary: "#8b5cf6",
            accent: "#10b981",
          },
          settings: {
            timezone: "Europe/Rome",
            language: "it",
            features: ["check-in", "payments", "songs"],
            allowGuests: true,
          },
        })
        .$returningId();

      orgId = org.id;
      console.log(`✅ Organization created with ID: ${orgId}`);
    }

    // 2. Create users with different roles
    console.log("Creating users...");
    const usersList = [
      {
        openId: "admin-demo",
        name: "Mario Rossi",
        email: "admin@corodemo.it",
        loginMethod: "local",
        role: "admin",
        voiceSection: null,
      },
      {
        openId: "director-demo",
        name: "Laura Bianchi",
        email: "direttore@corodemo.it",
        loginMethod: "local",
        role: "director",
        voiceSection: null,
      },
      {
        openId: "secretary-demo",
        name: "Giuseppe Verdi",
        email: "segretario@corodemo.it",
        loginMethod: "local",
        role: "secretary",
        voiceSection: null,
      },
      {
        openId: "capo-soprano",
        name: "Anna Soprano",
        email: "anna@corodemo.it",
        loginMethod: "local",
        role: "capo_section",
        voiceSection: "soprano",
      },
      {
        openId: "capo-tenor",
        name: "Marco Tenore",
        email: "marco@corodemo.it",
        loginMethod: "local",
        role: "capo_section",
        voiceSection: "tenor",
      },
      {
        openId: "member-soprano-1",
        name: "Giulia Rossini",
        email: "giulia@corodemo.it",
        loginMethod: "local",
        role: "member",
        voiceSection: "soprano",
      },
      {
        openId: "member-soprano-2",
        name: "Elena Verdi",
        email: "elena@corodemo.it",
        loginMethod: "local",
        role: "member",
        voiceSection: "soprano",
      },
      {
        openId: "member-alto-1",
        name: "Francesca Puccini",
        email: "francesca@corodemo.it",
        loginMethod: "local",
        role: "member",
        voiceSection: "alto",
      },
      {
        openId: "member-tenor-1",
        name: "Luca Donizetti",
        email: "luca@corodemo.it",
        loginMethod: "local",
        role: "member",
        voiceSection: "tenor",
      },
      {
        openId: "member-bass-1",
        name: "Paolo Bellini",
        email: "paolo@corodemo.it",
        loginMethod: "local",
        role: "member",
        voiceSection: "bass",
      },
      {
        openId: "guest-1",
        name: "Sofia Ospite",
        email: "sofia@corodemo.it",
        loginMethod: "local",
        role: "guest",
        voiceSection: "mezzo_soprano",
      },
    ];

    const createdUsers = [];
    for (const userData of usersList) {
      const [user] = await db
        .insert(users)
        .values({
          openId: userData.openId,
          name: userData.name,
          email: userData.email,
          loginMethod: userData.loginMethod,
          role: "user",
        })
        .$returningId();

      // Create membership
      await db.insert(memberships).values({
        userId: user.id,
        organizationId: orgId,
        role: userData.role,
        status: "active",
      });

      // Create user profile
      await db.insert(userProfiles).values({
        userId: user.id,
        organizationId: orgId,
        phone: `+39 ${Math.floor(Math.random() * 1000000000)}`,
        address: `Via ${userData.name.split(" ")[1]} ${Math.floor(Math.random() * 100)}`,
        city: ["Roma", "Milano", "Firenze", "Bologna", "Torino"][Math.floor(Math.random() * 5)],
        postalCode: `${Math.floor(10000 + Math.random() * 90000)}`,
        country: "Italia",
        voiceSection: userData.voiceSection,
        status: "active",
        joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      });

      createdUsers.push({ ...userData, id: user.id });
    }

    console.log(`✅ Created ${createdUsers.length} users`);

    // 3. Create events
    console.log("Creating events...");
    const now = Date.now();
    const eventsList = [
      {
        type: "rehearsal",
        title: "Prova Generale - Repertorio Natalizio",
        description: "Prova completa del repertorio per il concerto di Natale",
        startAt: new Date(now + 3 * 24 * 60 * 60 * 1000), // In 3 giorni
        endAt: new Date(now + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        locationString: "Sala Prove Comunale - Via della Musica 15",
      },
      {
        type: "concert",
        title: "Concerto di Natale 2025",
        description: "Grande concerto natalizio con brani tradizionali e moderni",
        startAt: new Date(now + 10 * 24 * 60 * 60 * 1000), // In 10 giorni
        endAt: new Date(now + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        locationString: "Teatro Comunale - Piazza Grande 1",
      },
      {
        type: "rehearsal",
        title: "Prova Sezione Voci Bianche",
        description: "Prova dedicata alle sezioni soprano e mezzosoprano",
        startAt: new Date(now + 7 * 24 * 60 * 60 * 1000), // In 7 giorni
        endAt: new Date(now + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
        locationString: "Sala Prove Comunale",
      },
      {
        type: "meeting",
        title: "Riunione Organizzativa",
        description: "Pianificazione stagione primaverile 2025",
        startAt: new Date(now + 14 * 24 * 60 * 60 * 1000), // In 14 giorni
        endAt: new Date(now + 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        locationString: "Sede del Coro - Via Armonia 8",
      },
      // Eventi passati
      {
        type: "rehearsal",
        title: "Prova Settimanale",
        description: "Prova di routine",
        startAt: new Date(now - 7 * 24 * 60 * 60 * 1000), // 7 giorni fa
        endAt: new Date(now - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        locationString: "Sala Prove Comunale",
      },
      {
        type: "concert",
        title: "Concerto d'Autunno",
        description: "Repertorio classico italiano",
        startAt: new Date(now - 30 * 24 * 60 * 60 * 1000), // 30 giorni fa
        endAt: new Date(now - 30 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        locationString: "Chiesa di San Marco",
      },
    ];

    const createdEvents = [];
    for (const eventData of eventsList) {
      const [event] = await db
        .insert(events)
        .values({
          organizationId: orgId,
          ...eventData,
        })
        .$returningId();

      createdEvents.push({ ...eventData, id: event.id });

      // Add RSVP for some users
      const numRsvp = Math.floor(Math.random() * createdUsers.length);
      for (let i = 0; i < numRsvp; i++) {
        const user = createdUsers[i];
        const statuses = ["attending", "not_attending", "maybe"];
        await db.insert(rsvp).values({
          eventId: event.id,
          userId: user.id,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          motivation: Math.random() > 0.5 ? "Confermo la presenza" : null,
        });
      }

      // Add attendance for past events
      if (new Date(eventData.startAt) < new Date()) {
        const attendees = createdUsers.filter(() => Math.random() > 0.3); // 70% attendance
        for (const user of attendees) {
          await db.insert(attendance).values({
            eventId: event.id,
            userId: user.id,
            checkInAt: new Date(eventData.startAt.getTime() - 10 * 60 * 1000), // 10 min before
            status: "present",
          });
        }
      }
    }

    console.log(`✅ Created ${createdEvents.length} events`);

    // 4. Create payments
    console.log("Creating payments...");
    const paymentTypes = ["membership_fee", "event_fee", "donation"];
    const paymentStatuses = ["pending", "completed", "failed"];

    for (const user of createdUsers.filter((u) => u.role === "member" || u.role === "capo_section")) {
      // Quota annuale
      await db.insert(payments).values({
        userId: user.id,
        organizationId: orgId,
        type: "membership_fee",
        amountCents: 10000, // €100
        currency: "EUR",
        status: Math.random() > 0.3 ? "completed" : "pending",
        description: "Quota associativa 2025",
        dueAt: new Date(now + 60 * 24 * 60 * 60 * 1000), // Scadenza tra 60 giorni
      });

      // Quota concerto (random)
      if (Math.random() > 0.5) {
        await db.insert(payments).values({
          userId: user.id,
          organizationId: orgId,
          type: "event_fee",
          amountCents: 2000, // €20
          currency: "EUR",
          status: paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
          description: "Quota partecipazione Concerto di Natale",
          dueAt: new Date(now + 5 * 24 * 60 * 60 * 1000),
        });
      }
    }

    console.log("✅ Created payments");

    // 5. Create pending registrations
    console.log("Creating pending registrations...");
    const pendingRegs = [
      {
        email: "nuovo1@example.com",
        fullName: "Roberto Nuovi",
        phone: "+39 3331234567",
        voiceSection: "baritone",
        motivation: "Canto da 5 anni in un altro coro, vorrei unirmi a voi",
      },
      {
        email: "nuovo2@example.com",
        fullName: "Chiara Cantante",
        phone: "+39 3339876543",
        voiceSection: "soprano",
        motivation: "Ho esperienza corale e sono molto interessata",
      },
      {
        email: "nuovo3@example.com",
        fullName: "Davide Basso",
        phone: "+39 3335551234",
        voiceSection: "bass",
        motivation: "Principiante ma molto motivato",
      },
    ];

    for (const reg of pendingRegs) {
      await db.insert(registrations).values({
        organizationId: orgId,
        ...reg,
        status: "pending",
      });
    }

    console.log(`✅ Created ${pendingRegs.length} pending registrations`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📋 Demo Users:");
    console.log("━".repeat(60));
    console.log("Email                    | Role          | Password");
    console.log("━".repeat(60));
    for (const user of usersList) {
      console.log(`${user.email.padEnd(24)} | ${user.role.padEnd(13)} | demo123`);
    }
    console.log("━".repeat(60));
    console.log("\n🌐 Organization: Coro Polifonico Demo");
    console.log(`📊 Stats: ${createdUsers.length} users, ${createdEvents.length} events`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
