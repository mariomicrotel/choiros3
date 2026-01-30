import { eq, and, gte, lte, desc, isNull, or, like, sql, inArray } from "drizzle-orm";
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
  subscriptions,
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
  type Subscription,
  type InsertSubscription,
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
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [eq(payments.organizationId, organizationId)];

  if (filters?.status) {
    conditions.push(eq(payments.status, filters.status));
  }
  if (filters?.type) {
    conditions.push(eq(payments.type, filters.type));
  }

  // Join with users and userProfiles to get name and voice section
  const { getTableColumns } = await import("drizzle-orm");
  const paymentColumns = getTableColumns(payments);
  
  let query = db
    .select({
      ...paymentColumns,
      userName: users.name,
      userEmail: users.email,
      voiceSection: userProfiles.voiceSection,
    })
    .from(payments)
    .leftJoin(users, eq(payments.userId, users.id))
    .leftJoin(userProfiles, and(
      eq(userProfiles.userId, users.id),
      eq(userProfiles.organizationId, organizationId)
    ))
    .where(and(...conditions))
    .orderBy(desc(payments.createdAt));

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

export async function createSong(data: {
  organizationId: number;
  title: string;
  composer?: string;
  arranger?: string;
  language?: string;
  durationSeconds?: number;
  difficulty?: number;
  tempoBpm?: number;
  key?: string;
  categories?: string[];
  tags?: string[];
  createdBy: number;
}): Promise<Song | null> {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(songs).values({
    organizationId: data.organizationId,
    title: data.title,
    composer: data.composer,
    arranger: data.arranger,
    language: data.language,
    durationSeconds: data.durationSeconds,
    difficulty: data.difficulty,
    tempoBpm: data.tempoBpm,
    key: data.key,
    categories: data.categories || [],
    tags: data.tags || [],
    createdBy: data.createdBy,
  }).$returningId();
  if (!result?.id) return null;
  return await getSongById(result.id, data.organizationId);
}

export async function updateSong(
  songId: number,
  organizationId: number,
  data: Partial<Omit<Song, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">>
): Promise<Song | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(songs)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(songs.id, songId), eq(songs.organizationId, organizationId)));

  return await getSongById(songId, organizationId);
}

export async function deleteSong(songId: number, organizationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(songs)
    .where(and(eq(songs.id, songId), eq(songs.organizationId, organizationId)));

  return true;
}

export async function createSongAsset(data: {
  songId: number;
  type: "score_pdf" | "reference_audio" | "section_stem" | "lyrics" | "youtube_link";
  url: string;
  fileKey?: string;
  voiceSection?: "soprano" | "mezzo_soprano" | "alto" | "tenor" | "baritone" | "bass" | "all";
  mimeType?: string;
  fileSize?: number;
  uploadedBy: number;
}): Promise<SongAsset | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(songAssets).values(data).$returningId();
  if (!result?.id) return null;

  const [asset] = await db.select().from(songAssets).where(eq(songAssets.id, result.id));
  return asset || null;
}

export async function deleteSongAsset(assetId: number, songId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(songAssets)
    .where(and(eq(songAssets.id, assetId), eq(songAssets.songId, songId)));

  return true;
}

// ============================================================================
// SETLIST MANAGEMENT
// ============================================================================

export async function getSetlistsByOrganization(organizationId: number) {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      setlist: setlists,
      event: events,
    })
    .from(setlists)
    .leftJoin(events, eq(setlists.eventId, events.id))
    .where(eq(setlists.organizationId, organizationId))
    .orderBy(desc(setlists.createdAt));

  // Get item counts for each setlist
  const setlistIds = results.map((r) => r.setlist.id);
  const itemCounts = setlistIds.length > 0
    ? await db
        .select({
          setlistId: setlistItems.setlistId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(setlistItems)
        .where(inArray(setlistItems.setlistId, setlistIds))
        .groupBy(setlistItems.setlistId)
    : [];

  const countMap = new Map(itemCounts.map((c) => [c.setlistId, c.count]));

  return results.map((r) => ({
    ...r.setlist,
    event: r.event,
    _count: {
      items: countMap.get(r.setlist.id) || 0,
    },
  }));
}

export async function getSetlistById(setlistId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({
      setlist: setlists,
      event: events,
    })
    .from(setlists)
    .leftJoin(events, eq(setlists.eventId, events.id))
    .where(and(eq(setlists.id, setlistId), eq(setlists.organizationId, organizationId)))
    .limit(1);

  if (!result[0]) return null;

  // Get setlist items with songs
  const items = await db
    .select({
      item: setlistItems,
      song: songs,
    })
    .from(setlistItems)
    .innerJoin(songs, eq(setlistItems.songId, songs.id))
    .where(eq(setlistItems.setlistId, setlistId))
    .orderBy(setlistItems.order);

  return {
    ...result[0].setlist,
    event: result[0].event,
    items: items.map((i) => ({
      ...i.item,
      song: i.song,
    })),
  };
}

export async function getSetlistItems(setlistId: number): Promise<SetlistItem[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(setlistItems).where(eq(setlistItems.setlistId, setlistId)).orderBy(setlistItems.order);
}

export async function createSetlist(data: {
  organizationId: number;
  eventId?: number;
  title: string;
  notes?: string;
  createdBy: number;
}): Promise<Setlist | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(setlists).values(data).$returningId();
  if (!result?.id) return null;

  return await getSetlistById(result.id, data.organizationId);
}

export async function updateSetlist(
  setlistId: number,
  organizationId: number,
  data: Partial<Omit<Setlist, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">>
): Promise<Setlist | null> {
  const db = await getDb();
  if (!db) return null;

  await db
    .update(setlists)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(setlists.id, setlistId), eq(setlists.organizationId, organizationId)));

  return await getSetlistById(setlistId, organizationId);
}

export async function deleteSetlist(setlistId: number, organizationId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(setlists)
    .where(and(eq(setlists.id, setlistId), eq(setlists.organizationId, organizationId)));

  return true;
}

export async function addSongToSetlist(data: {
  setlistId: number;
  songId: number;
  order: number;
  notes?: string;
}): Promise<SetlistItem | null> {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(setlistItems).values(data).$returningId();
  if (!result?.id) return null;

  const [item] = await db.select().from(setlistItems).where(eq(setlistItems.id, result.id));
  return item || null;
}

export async function removeSongFromSetlist(itemId: number, setlistId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(setlistItems)
    .where(and(eq(setlistItems.id, itemId), eq(setlistItems.setlistId, setlistId)));

  return true;
}

export async function reorderSetlistItems(
  setlistId: number,
  itemOrders: Array<{ id: number; order: number }>
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  for (const item of itemOrders) {
    await db
      .update(setlistItems)
      .set({ order: item.order })
      .where(and(eq(setlistItems.id, item.id), eq(setlistItems.setlistId, setlistId)));
  }

  return true;
}


// ============================================================================
// PROFILE STATISTICS
// ============================================================================

export async function getProfileStats(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return null;

  const { eq, and, count, sum, desc } = await import("drizzle-orm");

  // Get user profile
  const profile = await getUserProfile(userId, organizationId);
  if (!profile) return null;

  // Get attendance stats
  const attendanceStats = await db
    .select({ count: count(attendance.id) })
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, userId),
        eq(attendance.status, "present")
      )!
    );

  const totalAttended = attendanceStats[0]?.count || 0;

  // Get total events for organization
  const totalEventsStats = await db
    .select({ count: count(events.id) })
    .from(events)
    .where(eq(events.organizationId, organizationId));

  const totalEvents = totalEventsStats[0]?.count || 0;

  // Get payment stats
  const paymentStats = await db
    .select({
      total: count(payments.id),
      completed: count(payments.id),
      pending: count(payments.id),
      totalAmount: sum(payments.amountCents),
    })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.organizationId, organizationId)
      )!
    );

  // Get completed and pending separately
  const completedPayments = await db
    .select({ count: count(payments.id), amount: sum(payments.amountCents) })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.organizationId, organizationId),
        eq(payments.status, "completed")
      )!
    );

  const pendingPayments = await db
    .select({ count: count(payments.id), amount: sum(payments.amountCents) })
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.organizationId, organizationId),
        eq(payments.status, "pending")
      )!
    );

  // Get recent payments
  const recentPayments = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.userId, userId),
        eq(payments.organizationId, organizationId)
      )!
    )
    .orderBy(desc(payments.createdAt))
    .limit(5);

  // Get recent attendance
  const recentAttendance = await db
    .select({
      id: attendance.id,
      eventId: attendance.eventId,
      status: attendance.status,
      checkInAt: attendance.checkInAt,
      eventTitle: events.title,
      eventType: events.type,
      eventStartAt: events.startAt,
    })
    .from(attendance)
    .leftJoin(events, eq(attendance.eventId, events.id))
    .where(eq(attendance.userId, userId))
    .orderBy(desc(attendance.checkInAt))
    .limit(5);

  // Get user email for registration lookup
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Get registration info
  const registration = user[0]?.email
    ? await db
        .select()
        .from(registrations)
        .where(
          and(
            eq(registrations.organizationId, organizationId),
            eq(registrations.email, user[0].email)
          )!
        )
        .limit(1)
    : [];

  return {
    profile,
    attendance: {
      total: totalAttended,
      totalEvents,
      rate: totalEvents > 0 ? (totalAttended / totalEvents) * 100 : 0,
      recent: recentAttendance,
    },
    payments: {
      total: paymentStats[0]?.total || 0,
      completed: completedPayments[0]?.count || 0,
      pending: pendingPayments[0]?.count || 0,
      totalAmount: Number(completedPayments[0]?.amount || 0),
      pendingAmount: Number(pendingPayments[0]?.amount || 0),
      recent: recentPayments,
    },
    registration: registration[0] || null,
  };
}


// ============================================================================
// SUPERADMIN - ORGANIZATIONS & SUBSCRIPTIONS
// ============================================================================

/**
 * Get all organizations with subscription info (superadmin only)
 */
export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      fiscalCode: organizations.fiscalCode,
      vatNumber: organizations.vatNumber,
      billingEmail: organizations.billingEmail,
      phone: organizations.phone,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      country: organizations.country,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      // Subscription info
      subscriptionId: subscriptions.id,
      subscriptionPlan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      subscriptionStartDate: subscriptions.startDate,
      subscriptionEndDate: subscriptions.endDate,
      subscriptionNextBillingDate: subscriptions.nextBillingDate,
      priceMonthly: subscriptions.priceMonthly,
      priceAnnual: subscriptions.priceAnnual,
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(organizations.id, subscriptions.organizationId))
    .orderBy(desc(organizations.createdAt));
}

/**
 * Get organization by ID with subscription (superadmin only)
 */
export async function getOrganizationWithSubscription(orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      logoUrl: organizations.logoUrl,
      fiscalCode: organizations.fiscalCode,
      vatNumber: organizations.vatNumber,
      billingEmail: organizations.billingEmail,
      phone: organizations.phone,
      address: organizations.address,
      city: organizations.city,
      postalCode: organizations.postalCode,
      country: organizations.country,
      colors: organizations.colors,
      settings: organizations.settings,
      createdAt: organizations.createdAt,
      updatedAt: organizations.updatedAt,
      // Subscription info
      subscriptionId: subscriptions.id,
      subscriptionPlan: subscriptions.plan,
      subscriptionStatus: subscriptions.status,
      subscriptionStartDate: subscriptions.startDate,
      subscriptionEndDate: subscriptions.endDate,
      subscriptionNextBillingDate: subscriptions.nextBillingDate,
      subscriptionCancelledAt: subscriptions.cancelledAt,
      priceMonthly: subscriptions.priceMonthly,
      priceAnnual: subscriptions.priceAnnual,
      subscriptionNotes: subscriptions.notes,
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(organizations.id, subscriptions.organizationId))
    .where(eq(organizations.id, orgId))
    .limit(1);

  return result[0] || null;
}

/**
 * Create new organization with subscription (superadmin only)
 */
export async function createOrganizationWithSubscription(data: {
  // Organization data
  slug: string;
  name: string;
  logoUrl?: string;
  fiscalCode?: string;
  vatNumber?: string;
  billingEmail?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  // Subscription data
  plan: "monthly" | "annual";
  priceMonthly: number;
  priceAnnual?: number;
  startDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Insert organization
  const orgResult = await db.insert(organizations).values({
    slug: data.slug,
    name: data.name,
    logoUrl: data.logoUrl,
    fiscalCode: data.fiscalCode,
    vatNumber: data.vatNumber,
    billingEmail: data.billingEmail,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country || "IT",
  });

  const orgId = orgResult[0].insertId;

  // Calculate next billing date
  const nextBillingDate = new Date(data.startDate);
  if (data.plan === "monthly") {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  // Insert subscription
  await db.insert(subscriptions).values({
    organizationId: orgId,
    plan: data.plan,
    status: "active",
    priceMonthly: data.priceMonthly,
    priceAnnual: data.priceAnnual,
    startDate: data.startDate,
    nextBillingDate,
  });

  return orgId;
}

/**
 * Update organization (superadmin only)
 */
export async function updateOrganization(
  orgId: number,
  data: Partial<{
    name: string;
    logoUrl: string;
    fiscalCode: string;
    vatNumber: string;
    billingEmail: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(organizations).set(data).where(eq(organizations.id, orgId));
}

/**
 * Update subscription (superadmin only)
 */
export async function updateSubscription(
  subscriptionId: number,
  data: Partial<{
    plan: "monthly" | "annual";
    status: "active" | "suspended" | "expired" | "cancelled";
    priceMonthly: number;
    priceAnnual: number;
    nextBillingDate: Date;
    endDate: Date;
    notes: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set(data)
    .where(eq(subscriptions.id, subscriptionId));
}

/**
 * Cancel subscription (superadmin only)
 */
export async function cancelSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId));
}

/**
 * Get superadmin dashboard statistics
 */
export async function getSuperadminStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count organizations by status
  const orgStats = await db
    .select({
      total: organizations.id,
      activeSubscriptions: subscriptions.status,
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(organizations.id, subscriptions.organizationId));

  const totalOrgs = orgStats.length;
  const activeOrgs = orgStats.filter((o) => o.activeSubscriptions === "active").length;
  const suspendedOrgs = orgStats.filter((o) => o.activeSubscriptions === "suspended").length;

  // Calculate monthly recurring revenue (MRR)
  const revenueData = await db
    .select({
      priceMonthly: subscriptions.priceMonthly,
      priceAnnual: subscriptions.priceAnnual,
      plan: subscriptions.plan,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  const mrr = revenueData.reduce((sum, sub) => {
    if (sub.plan === "monthly") {
      return sum + (sub.priceMonthly || 0);
    } else {
      // Annual plans contribute 1/12 to MRR
      return sum + (sub.priceAnnual || 0) / 12;
    }
  }, 0);

  // Get upcoming renewals (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const upcomingRenewals = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.nextBillingDate, thirtyDaysFromNow)
      )!
    );

  return {
    organizations: {
      total: totalOrgs,
      active: activeOrgs,
      suspended: suspendedOrgs,
      cancelled: totalOrgs - activeOrgs - suspendedOrgs,
    },
    revenue: {
      mrr: Math.round(mrr), // in cents
      arr: Math.round(mrr * 12), // Annual Recurring Revenue
    },
    upcomingRenewals: upcomingRenewals.length,
  };
}

