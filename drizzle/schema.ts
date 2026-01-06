import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * ChoirOS Database Schema
 * Multitenant architecture with tenant_id isolation
 * All timestamps in UTC
 */

// ============================================================================
// ORGANIZATIONS (Tenants)
// ============================================================================

export const organizations = mysqlTable(
  "organizations",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    logoUrl: text("logo_url"),
    colors: json("colors").$type<{
      primary: string;
      secondary: string;
      accent: string;
    }>(),
    settings: json("settings").$type<{
      timezone: string;
      language: string;
      features: string[];
      allowGuests: boolean;
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex("org_slug_idx").on(table.slug),
  })
);

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

// ============================================================================
// USERS (Core Auth)
// ============================================================================

export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }),
    name: text("name"),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["super_admin", "admin", "user"]).default("user").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    openIdIdx: uniqueIndex("user_openid_idx").on(table.openId),
    emailIdx: index("user_email_idx").on(table.email),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// MEMBERSHIPS (User-Organization relationship with role)
// ============================================================================

export const memberships = mysqlTable(
  "memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    role: mysqlEnum("role", ["admin", "director", "secretary", "capo_section", "member", "guest"]).notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
    leftAt: timestamp("left_at"),
    status: mysqlEnum("status", ["active", "suspended", "exited"]).default("active").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userOrgIdx: index("membership_user_org_idx").on(table.userId, table.organizationId),
  })
);

export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = typeof memberships.$inferInsert;

// ============================================================================
// USER PROFILES (Extended user information per organization)
// ============================================================================

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 20 }),
    birthDate: timestamp("birth_date"),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 100 }),
    voiceSection: mysqlEnum("voice_section", ["soprano", "mezzo_soprano", "alto", "tenor", "baritone", "bass"]),
    status: mysqlEnum("status", ["active", "suspended", "exited"]).default("active").notNull(),
    notes: text("notes"),
    tags: json("tags").$type<string[]>(),
    documents: json("documents").$type<Array<{ type: string; url: string; expiresAt?: string }>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userOrgIdx: uniqueIndex("profile_user_org_idx").on(table.userId, table.organizationId),
  })
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ============================================================================
// REGISTRATIONS (Self-service sign-ups)
// ============================================================================

export const registrations = mysqlTable(
  "registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 320 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    voiceSection: varchar("voice_section", { length: 50 }),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    reviewedBy: int("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orgStatusIdx: index("reg_org_status_idx").on(table.organizationId, table.status),
  })
);

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

// ============================================================================
// VENUES (Event locations)
// ============================================================================

export const venues = mysqlTable(
  "venues",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 320 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("venue_org_idx").on(table.organizationId),
  })
);

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = typeof venues.$inferInsert;

// ============================================================================
// EVENTS (Rehearsals, concerts, meetings)
// ============================================================================

export const events = mysqlTable(
  "events",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["rehearsal", "concert", "meeting", "other"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    startAt: timestamp("start_at").notNull(),
    endAt: timestamp("end_at"),
    venueId: int("venue_id").references(() => venues.id),
    locationString: text("location_string"),
    dressCode: varchar("dress_code", { length: 255 }),
    callTime: timestamp("call_time"),
    notes: text("notes"),
    attachments: json("attachments").$type<Array<{ name: string; url: string }>>(),
    mapLink: text("map_link"),
    createdBy: int("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orgTypeIdx: index("event_org_type_idx").on(table.organizationId, table.type),
    orgStartIdx: index("event_org_start_idx").on(table.organizationId, table.startAt),
  })
);

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

// ============================================================================
// RSVP (Event responses)
// ============================================================================

export const rsvp = mysqlTable(
  "rsvp",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["attending", "not_attending", "maybe"]).notNull(),
    motivation: text("motivation"),
    respondedAt: timestamp("responded_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("rsvp_event_user_idx").on(table.eventId, table.userId),
  })
);

export type Rsvp = typeof rsvp.$inferSelect;
export type InsertRsvp = typeof rsvp.$inferInsert;

// ============================================================================
// ATTENDANCE (Check-in records)
// ============================================================================

export const attendance = mysqlTable(
  "attendance",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    checkInAt: timestamp("check_in_at").defaultNow().notNull(),
    checkOutAt: timestamp("check_out_at"),
    status: mysqlEnum("status", ["present", "absent", "justified_absence", "late"]).default("present").notNull(),
    notes: text("notes"),
    syncedAt: timestamp("synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    eventUserIdx: uniqueIndex("attendance_event_user_idx").on(table.eventId, table.userId),
    eventIdx: index("attendance_event_idx").on(table.eventId),
  })
);

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = typeof attendance.$inferInsert;

// ============================================================================
// PAYMENTS (Membership fees, event fees)
// ============================================================================

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    userId: int("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["membership_fee", "event_fee", "donation"]).notNull(),
    amountCents: int("amount_cents").notNull(),
    currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
    status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orgUserIdx: index("payment_org_user_idx").on(table.organizationId, table.userId),
    statusIdx: index("payment_status_idx").on(table.status),
  })
);

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ============================================================================
// SONGS (Music repertoire)
// ============================================================================

export const songs = mysqlTable(
  "songs",
  {
    id: int("id").autoincrement().primaryKey(),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    composer: varchar("composer", { length: 255 }),
    arranger: varchar("arranger", { length: 255 }),
    language: varchar("language", { length: 50 }),
    durationSeconds: int("duration_seconds"),
    difficulty: int("difficulty"),
    tempoBpm: int("tempo_bpm"),
    key: varchar("key", { length: 10 }),
    categories: json("categories").$type<string[]>(),
    tags: json("tags").$type<string[]>(),
    createdBy: int("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    orgIdx: index("song_org_idx").on(table.organizationId),
    titleIdx: index("song_title_idx").on(table.title),
  })
);

export type Song = typeof songs.$inferSelect;
export type InsertSong = typeof songs.$inferInsert;

// ============================================================================
// SONG ASSETS (Scores, audio files)
// ============================================================================

export const songAssets = mysqlTable(
  "song_assets",
  {
    id: int("id").autoincrement().primaryKey(),
    songId: int("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ["score_pdf", "reference_audio", "section_stem", "lyrics", "youtube_link"]).notNull(),
    url: text("url").notNull(),
    fileKey: varchar("file_key", { length: 255 }),
    voiceSection: mysqlEnum("voice_section", ["soprano", "mezzo_soprano", "alto", "tenor", "baritone", "bass", "all"]),
    mimeType: varchar("mime_type", { length: 100 }),
    fileSize: int("file_size"),
    uploadedBy: int("uploaded_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    songIdx: index("asset_song_idx").on(table.songId),
  })
);

export type SongAsset = typeof songAssets.$inferSelect;
export type InsertSongAsset = typeof songAssets.$inferInsert;

// ============================================================================
// SETLISTS (Song lists for events)
// ============================================================================

export const setlists = mysqlTable(
  "setlists",
  {
    id: int("id").autoincrement().primaryKey(),
    eventId: int("event_id").references(() => events.id, { onDelete: "cascade" }),
    organizationId: int("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    notes: text("notes"),
    createdBy: int("created_by").notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    eventIdx: index("setlist_event_idx").on(table.eventId),
    orgIdx: index("setlist_org_idx").on(table.organizationId),
  })
);

export type Setlist = typeof setlists.$inferSelect;
export type InsertSetlist = typeof setlists.$inferInsert;

// ============================================================================
// SETLIST ITEMS (Songs in a setlist)
// ============================================================================

export const setlistItems = mysqlTable(
  "setlist_items",
  {
    id: int("id").autoincrement().primaryKey(),
    setlistId: int("setlist_id").notNull().references(() => setlists.id, { onDelete: "cascade" }),
    songId: int("song_id").notNull().references(() => songs.id, { onDelete: "cascade" }),
    order: int("order").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    setlistIdx: index("setlist_item_setlist_idx").on(table.setlistId),
  })
);

export type SetlistItem = typeof setlistItems.$inferSelect;
export type InsertSetlistItem = typeof setlistItems.$inferInsert;
