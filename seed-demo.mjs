import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';

const DATABASE_URL = process.env.DATABASE_URL;

async function seed() {
  console.log('🌱 Starting demo data seed...');
  
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection, { schema, mode: 'default' });

  // Recupera IDs necessari
  const org = await db.query.organizations.findFirst({
    where: (orgs, { eq }) => eq(orgs.slug, 'coro-demo')
  });
  
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, 'mariomicrotel@gmail.com')
  });

  if (!org || !user) {
    console.error('❌ Organizzazione o utente non trovati');
    process.exit(1);
  }

  console.log(`✅ Trovati: org=${org.id}, user=${user.id}`);

  // Elimina dati esistenti
  console.log('🗑️  Eliminando dati demo esistenti...');
  const { eq } = await import('drizzle-orm');
  await db.delete(schema.attendance).where(eq(schema.attendance.userId, user.id));
  await db.delete(schema.rsvp).where(eq(schema.rsvp.userId, user.id));
  await db.delete(schema.payments).where(eq(schema.payments.userId, user.id));
  await db.delete(schema.events).where(eq(schema.events.organizationId, org.id));

  // Inserisci Eventi Demo
  console.log('📅 Inserendo eventi demo...');
  const eventIds = [];
  
  const eventsData = [
    {
      organizationId: org.id,
      type: 'rehearsal',
      title: 'Prova Generale - Repertorio Natalizio',
      description: 'Prova completa del repertorio per il concerto di Natale',
      startAt: new Date('2025-11-15T20:00:00'),
      endAt: new Date('2025-11-15T22:30:00'),
      locationString: 'Sala Prove Comunale',
      createdBy: user.id
    },
    {
      organizationId: org.id,
      type: 'concert',
      title: 'Concerto di Natale 2025',
      description: 'Concerto annuale con repertorio natalizio tradizionale e moderno',
      startAt: new Date('2025-12-20T21:00:00'),
      endAt: new Date('2025-12-20T23:00:00'),
      locationString: 'Teatro Comunale',
      createdBy: user.id
    },
    {
      organizationId: org.id,
      type: 'rehearsal',
      title: 'Prova Sezione Tenori',
      description: 'Prova dedicata alla sezione tenori per affinare le parti soliste',
      startAt: new Date('2026-01-10T19:30:00'),
      endAt: new Date('2026-01-10T21:00:00'),
      locationString: 'Sala Prove Comunale',
      createdBy: user.id
    },
    {
      organizationId: org.id,
      type: 'other',
      title: 'Cena Sociale di Inizio Anno',
      description: 'Cena conviviale per augurare buon anno a tutti i coristi',
      startAt: new Date('2026-01-18T20:00:00'),
      endAt: new Date('2026-01-18T23:30:00'),
      locationString: 'Ristorante Da Mario',
      createdBy: user.id
    },
    {
      organizationId: org.id,
      type: 'rehearsal',
      title: 'Prova Generale - Repertorio Primavera',
      description: 'Prima prova del nuovo repertorio primaverile',
      startAt: new Date('2026-02-05T20:00:00'),
      endAt: new Date('2026-02-05T22:30:00'),
      locationString: 'Sala Prove Comunale',
      createdBy: user.id
    },
    {
      organizationId: org.id,
      type: 'concert',
      title: 'Concerto di Primavera 2026',
      description: 'Concerto con brani rinascimentali e contemporanei',
      startAt: new Date('2026-03-21T21:00:00'),
      endAt: new Date('2026-03-21T23:00:00'),
      locationString: 'Chiesa di San Marco',
      createdBy: user.id
    }
  ];

  for (const eventData of eventsData) {
    const result = await db.insert(schema.events).values(eventData);
    eventIds.push(result[0].insertId);
  }

  console.log(`✅ Inseriti ${eventIds.length} eventi`);

  // Inserisci Presenze per eventi passati (primi 3)
  console.log('✅ Inserendo presenze...');
  await db.insert(schema.attendance).values([
    {
      eventId: eventIds[0],
      userId: user.id,
      status: 'present',
      checkInAt: new Date('2025-11-15T19:55:00')
    },
    {
      eventId: eventIds[1],
      userId: user.id,
      status: 'present',
      checkInAt: new Date('2025-12-20T20:45:00')
    },
    {
      eventId: eventIds[2],
      userId: user.id,
      status: 'present',
      checkInAt: new Date('2026-01-10T19:25:00')
    }
  ]);

  // Inserisci RSVP per eventi futuri (ultimi 3)
  console.log('📝 Inserendo RSVP...');
  await db.insert(schema.rsvp).values([
    {
      eventId: eventIds[3],
      userId: user.id,
      status: 'attending'
    },
    {
      eventId: eventIds[4],
      userId: user.id,
      status: 'attending'
    },
    {
      eventId: eventIds[5],
      userId: user.id,
      status: 'maybe'
    }
  ]);

  // Inserisci Pagamenti Demo
  console.log('💰 Inserendo pagamenti...');
  await db.insert(schema.payments).values([
    {
      organizationId: org.id,
      userId: user.id,
      amountCents: 5000,
      status: 'completed',
      type: 'membership_fee',
      description: 'Quota Associativa 2025',
      dueAt: new Date('2025-01-31'),
      completedAt: new Date('2025-01-15T10:30:00')
    },
    {
      organizationId: org.id,
      userId: user.id,
      amountCents: 2000,
      status: 'completed',
      type: 'event_fee',
      description: 'Quota Concerto di Natale',
      dueAt: new Date('2025-12-15'),
      completedAt: new Date('2025-12-10T14:20:00')
    },
    {
      organizationId: org.id,
      userId: user.id,
      amountCents: 1500,
      status: 'pending',
      type: 'event_fee',
      description: 'Quota Cena Sociale',
      dueAt: new Date('2026-01-17')
    },
    {
      organizationId: org.id,
      userId: user.id,
      amountCents: 5000,
      status: 'pending',
      type: 'membership_fee',
      description: 'Quota Associativa 2026',
      dueAt: new Date('2026-02-28')
    }
  ]);

  console.log('✅ Seed completato con successo!');
  console.log(`📊 Riepilogo:`);
  console.log(`   - ${eventIds.length} eventi`);
  console.log(`   - 3 presenze`);
  console.log(`   - 3 RSVP`);
  console.log(`   - 4 pagamenti`);

  await connection.end();
}

seed().catch(console.error);
