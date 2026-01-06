import { eq, and, desc, gte, lte, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  organizations,
  memberships,
  userProfiles,
  registrations,
  venues,
  events,
  rsvp,
  attendance,
  payments,
  songs,
  songAssets,
  setlists,
  setlistItems,
  type Organization,
  type Membership,
  type UserProfile,
  type Registration,
  type Event,
  type Venue,
  type Rsvp,
  type Attendance,
  type Payment,
  type Song,
  type SongAsset,
  type Setlist,
  type SetlistItem,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// ORGANIZATION MANAGEMENT
// ============================================================================

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return result[0] || null;
}

export async function getOrganizationById(id: number): Promise<Organization | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0] || null;
}

// ============================================================================
// MEMBERSHIP MANAGEMENT
// ============================================================================

export async function getUserMembership(userId: number, organizationId: number): Promise<Membership | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

export async function getOrganizationMembers(organizationId: number): Promise<Membership[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(memberships).where(eq(memberships.organizationId, organizationId));
}

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

export async function getUserProfile(userId: number, organizationId: number): Promise<UserProfile | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userProfiles)
    .where(and(eq(userProfiles.userId, userId), eq(userProfiles.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

export async function upsertUserProfile(
  userId: number,
  organizationId: number,
  data: Partial<UserProfile>
): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserProfile(userId, organizationId);

  if (existing) {
    await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProfiles.id, existing.id));

    return (await getUserProfile(userId, organizationId))!;
  } else {
    const result = await db.insert(userProfiles).values({
      userId,
      organizationId,
      ...data,
    } as any);

    return (await getUserProfile(userId, organizationId))!;
  }
}

// ============================================================================
// REGISTRATION MANAGEMENT
// ============================================================================

export async function createRegistration(data: {
  organizationId: number;
  email: string;
  fullName: string;
  voiceSection?: string;
  phone?: string;
  status: "pending" | "approved" | "rejected";
}): Promise<Registration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(registrations).values(data as any);
  const insertId = Number(result[0].insertId);
  const inserted = await db.select().from(registrations).where(eq(registrations.id, insertId)).limit(1);

  return inserted[0]!;
}

export async function getPendingRegistrations(organizationId: number): Promise<Registration[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(registrations)
    .where(and(eq(registrations.organizationId, organizationId), eq(registrations.status, "pending")))
    .orderBy(desc(registrations.createdAt));
}

export async function updateRegistrationStatus(
  registrationId: number,
  status: "approved" | "rejected",
  reviewedBy: number,
  rejectionReason?: string
): Promise<Registration> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(registrations)
    .set({
      status,
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: rejectionReason || null,
      updatedAt: new Date(),
    })
    .where(eq(registrations.id, registrationId));

  const result = await db.select().from(registrations).where(eq(registrations.id, registrationId)).limit(1);
  return result[0]!;
}

// ============================================================================
// VENUE MANAGEMENT
// ============================================================================

export async function getVenuesByOrganization(organizationId: number): Promise<Venue[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(venues).where(eq(venues.organizationId, organizationId));
}

// ============================================================================
// EVENT MANAGEMENT
// ============================================================================

export async function getEventsByOrganization(
  organizationId: number,
  filters?: {
    type?: "rehearsal" | "concert" | "meeting" | "other";
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<Event[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [eq(events.organizationId, organizationId)];

  if (filters?.type) {
    conditions.push(eq(events.type, filters.type));
  }
  if (filters?.startDate) {
    conditions.push(gte(events.startAt, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(events.startAt, filters.endDate));
  }

  let query = db.select().from(events).where(and(...conditions)).orderBy(events.startAt);

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

export async function getEventById(eventId: number, organizationId: number): Promise<Event | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// RSVP MANAGEMENT
// ============================================================================

export async function upsertRsvp(data: {
  eventId: number;
  userId: number;
  status: "attending" | "not_attending" | "maybe";
  motivation?: string;
}): Promise<Rsvp> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(rsvp)
    .where(and(eq(rsvp.eventId, data.eventId), eq(rsvp.userId, data.userId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(rsvp)
      .set({
        status: data.status,
        motivation: data.motivation || null,
        updatedAt: new Date(),
      })
      .where(eq(rsvp.id, existing[0].id));

    const updated = await db.select().from(rsvp).where(eq(rsvp.id, existing[0].id)).limit(1);
    return updated[0]!;
  } else {
    const result = await db.insert(rsvp).values(data as any);
    const insertId = Number(result[0].insertId);
    const inserted = await db.select().from(rsvp).where(eq(rsvp.id, insertId)).limit(1);
    return inserted[0]!;
  }
}

export async function getRsvpByEvent(eventId: number): Promise<Rsvp[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(rsvp).where(eq(rsvp.eventId, eventId));
}

// ============================================================================
// ATTENDANCE MANAGEMENT
// ============================================================================

export async function createAttendance(data: {
  eventId: number;
  userId: number;
  checkInAt?: Date;
  status?: "present" | "absent" | "justified_absence" | "late";
  notes?: string;
}): Promise<Attendance> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(attendance).values({
    ...data,
    checkInAt: data.checkInAt || new Date(),
    status: data.status || "present",
  } as any);

  const insertId = Number(result[0].insertId);
  const inserted = await db.select().from(attendance).where(eq(attendance.id, insertId)).limit(1);
  return inserted[0]!;
}

export async function getAttendanceByEvent(eventId: number): Promise<Attendance[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(attendance).where(eq(attendance.eventId, eventId));
}

export async function getAttendanceByUser(userId: number, organizationId: number): Promise<Attendance[]> {
  const db = await getDb();
  if (!db) return [];

  // Get all attendance records for user, then filter by organization via event join
  const userAttendance = await db.select().from(attendance).where(eq(attendance.userId, userId));
  
  // Filter by organization
  const filtered: Attendance[] = [];
  for (const record of userAttendance) {
    const event = await getEventById(record.eventId, organizationId);
    if (event) {
      filtered.push(record);
    }
  }
  
  return filtered;
}

// ============================================================================
// PAYMENT MANAGEMENT
// ============================================================================

export async function getPaymentsByUser(userId: number, organizationId: number): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, userId), eq(payments.organizationId, organizationId)))
    .orderBy(desc(payments.createdAt));
}

export async function getPaymentsByOrganization(
  organizationId: number,
  filters?: {
    status?: "pending" | "completed" | "failed";
    type?: "membership_fee" | "event_fee" | "donation";
    limit?: number;
    offset?: number;
  }
): Promise<Payment[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [eq(payments.organizationId, organizationId)];

  if (filters?.status) {
    conditions.push(eq(payments.status, filters.status));
  }
  if (filters?.type) {
    conditions.push(eq(payments.type, filters.type));
  }

  let query = db.select().from(payments).where(and(...conditions)).orderBy(desc(payments.createdAt));

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

// ============================================================================
// SONG MANAGEMENT
// ============================================================================

export async function getSongsByOrganization(
  organizationId: number,
  filters?: {
    search?: string;
    difficulty?: number;
    limit?: number;
    offset?: number;
  }
): Promise<Song[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [eq(songs.organizationId, organizationId)];

  // Note: Full-text search would require MySQL FULLTEXT index
  // For now, we use simple LIKE search
  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        eq(songs.title, searchPattern),
        eq(songs.composer, searchPattern),
        eq(songs.arranger, searchPattern)
      )!
    );
  }

  if (filters?.difficulty) {
    conditions.push(eq(songs.difficulty, filters.difficulty));
  }

  let query = db.select().from(songs).where(and(...conditions)).orderBy(songs.title);

  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

export async function getSongById(songId: number, organizationId: number): Promise<Song | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(songs)
    .where(and(eq(songs.id, songId), eq(songs.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

export async function getSongAssets(songId: number): Promise<SongAsset[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(songAssets).where(eq(songAssets.songId, songId));
}

// ============================================================================
// SETLIST MANAGEMENT
// ============================================================================

export async function getSetlistsByOrganization(organizationId: number): Promise<Setlist[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(setlists)
    .where(eq(setlists.organizationId, organizationId))
    .orderBy(desc(setlists.createdAt));
}

export async function getSetlistById(setlistId: number, organizationId: number): Promise<Setlist | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(setlists)
    .where(and(eq(setlists.id, setlistId), eq(setlists.organizationId, organizationId)))
    .limit(1);

  return result[0] || null;
}

export async function getSetlistItems(setlistId: number): Promise<SetlistItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(setlistItems).where(eq(setlistItems.setlistId, setlistId)).orderBy(setlistItems.order);
}
