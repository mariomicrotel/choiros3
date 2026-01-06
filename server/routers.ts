import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  tenantProcedure,
  tenantProtectedProcedure,
  adminProcedure,
  directorProcedure,
  secretaryProcedure,
  memberProcedure,
  superAdminProcedure,
} from "./_core/tenantProcedures";
import { z } from "zod";
import {
  getDb,
  getOrganizationBySlug,
  createRegistration,
  getPendingRegistrations,
  updateRegistrationStatus,
  getUserProfile,
  upsertUserProfile,
  getUserMembership,
  getEventsByOrganization,
  getEventById,
  upsertRsvp,
  getRsvpByEvent,
  getPaymentsByUser,
  getPaymentsByOrganization,
  createAttendance,
  getAttendanceByEvent,
  getAttendanceByUser,
  getSongsByOrganization,
  getSongById,
  getSongAssets,
  getSetlistsByOrganization,
  getSetlistById,
  getSetlistItems,
} from "./db";
import { eq, and, count } from "drizzle-orm";
import {
  organizations,
  users,
  memberships,
  userProfiles,
  events,
  venues,
  payments,
  attendance,
  songs,
  songAssets,
  setlists,
  setlistItems,
} from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,

  // ============================================================================
  // AUTH ROUTES
  // ============================================================================
  auth: router({
    me: publicProcedure.query(async (opts) => {
      const user = opts.ctx.user;
      // Try to extract tenant context if available
      const { extractTenantContext } = await import("./_core/tenantContext");
      const tenantCtx = await extractTenantContext(opts.ctx);

      return {
        user,
        organization: tenantCtx
          ? {
              id: tenantCtx.organization.id,
              slug: tenantCtx.organization.slug,
              name: tenantCtx.organization.name,
              logoUrl: tenantCtx.organization.logoUrl,
              colors: tenantCtx.organization.colors,
            }
          : null,
        role: tenantCtx?.userRole || null,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    // Get user's organizations
    myOrganizations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const { getTableColumns } = await import("drizzle-orm");
      const orgColumns = getTableColumns(organizations);

      const results = await db
        .select({
          ...orgColumns,
          role: memberships.role,
          status: memberships.status,
        })
        .from(memberships)
        .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
        .where(eq(memberships.userId, ctx.user!.id));

      return results;
    }),
  }),

  // ============================================================================
  // TENANT ROUTES (Organization Management)
  // ============================================================================
  tenant: router({
    get: tenantProcedure.query(async ({ ctx }) => {
      return {
        id: ctx.organizationId,
        slug: ctx.organizationSlug,
        name: ctx.organization?.name,
        logoUrl: ctx.organization?.logoUrl,
        colors: ctx.organization?.colors,
        settings: ctx.organization?.settings,
      };
    }),

    membership: tenantProcedure.query(async ({ ctx }) => {
      return ctx.membership;
    }),

    update: adminProcedure
      .input(
        z.object({
          name: z.string().optional(),
          logoUrl: z.string().optional(),
          colors: z
            .object({
              primary: z.string(),
              secondary: z.string(),
              accent: z.string(),
            })
            .optional(),
          settings: z
            .object({
              timezone: z.string(),
              language: z.string(),
              features: z.array(z.string()),
              allowGuests: z.boolean(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db || !ctx.organizationId) {
          throw new Error("Database not available");
        }

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.logoUrl) updateData.logoUrl = input.logoUrl;
        if (input.colors) updateData.colors = input.colors;
        if (input.settings) updateData.settings = input.settings;
        updateData.updatedAt = new Date();

        await db.update(organizations).set(updateData).where(eq(organizations.id, ctx.organizationId));

        return { success: true };
      }),
  }),

  // ============================================================================
  // USERS ROUTES
  // ============================================================================
  users: router({
    list: tenantProcedure
      .input(
        z.object({
          role: z.string().optional(),
          voiceSection: z.string().optional(),
          status: z.string().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db || !ctx.organizationId) return [];

        const conditions: any[] = [eq(userProfiles.organizationId, ctx.organizationId)];

        if (input.voiceSection) {
          conditions.push(eq(userProfiles.voiceSection, input.voiceSection as any));
        }
        if (input.status) {
          conditions.push(eq(userProfiles.status, input.status as any));
        }

        // Join with users table to get name and email
        const { getTableColumns } = await import("drizzle-orm");
        const profileColumns = getTableColumns(userProfiles);
        
        const results = await db
          .select({
            ...profileColumns,
            name: users.name,
            email: users.email,
          })
          .from(userProfiles)
          .leftJoin(users, eq(userProfiles.userId, users.id))
          .where(and(...conditions))
          .limit(input.limit)
          .offset(input.offset);

        return results;
      }),

    get: tenantProcedure.input(z.object({ userId: z.number() })).query(async ({ ctx, input }) => {
      const profile = await getUserProfile(input.userId, ctx.organizationId!);
      return profile;
    }),

    update: tenantProtectedProcedure
      .input(
        z.object({
          userId: z.number(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          voiceSection: z.enum(["soprano", "mezzo_soprano", "alto", "tenor", "baritone", "bass"]).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { userId, ...data } = input;
        const profile = await upsertUserProfile(userId, ctx.organizationId!, data as any);
        return profile;
      }),

    changeRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          newRole: z.enum(["admin", "director", "secretary", "capo_section", "member", "guest"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db || !ctx.organizationId) {
          throw new Error("Database not available");
        }

        const membership = await getUserMembership(input.userId, ctx.organizationId);
        if (!membership) {
          throw new Error("Membership not found");
        }

        await db
          .update(memberships)
          .set({ role: input.newRole as any, updatedAt: new Date() })
          .where(eq(memberships.id, membership.id));

        return { success: true };
      }),
  }),

  // ============================================================================
  // REGISTRATIONS ROUTES (Iscrizioni)
  // ============================================================================
  registrations: router({
    create: publicProcedure
      .input(
        z.object({
          organizationSlug: z.string(),
          email: z.string().email(),
          fullName: z.string(),
          voiceSection: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const org = await getOrganizationBySlug(input.organizationSlug);
        if (!org) {
          throw new Error("Organization not found");
        }

        const registration = await createRegistration({
          organizationId: org.id,
          email: input.email,
          fullName: input.fullName,
          voiceSection: input.voiceSection,
          phone: input.phone,
          status: "pending",
        });

        return registration;
      }),

    list: secretaryProcedure.query(async ({ ctx }) => {
      return getPendingRegistrations(ctx.organizationId!);
    }),

    approve: secretaryProcedure
      .input(
        z.object({
          registrationId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const registration = await updateRegistrationStatus(input.registrationId, "approved", ctx.user!.id);
        return registration;
      }),

    reject: secretaryProcedure
      .input(
        z.object({
          registrationId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const registration = await updateRegistrationStatus(input.registrationId, "rejected", ctx.user!.id, input.reason);
        return registration;
      }),
  }),

  // ============================================================================
  // EVENTS ROUTES
  // ============================================================================
  events: router({
    list: tenantProcedure
      .input(
        z.object({
          type: z.enum(["rehearsal", "concert", "meeting", "other"]).optional(),
          startDate: z.date().optional(),
          endDate: z.date().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getEventsByOrganization(ctx.organizationId!, {
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    get: tenantProcedure.input(z.object({ eventId: z.number() })).query(async ({ ctx, input }) => {
      return getEventById(input.eventId, ctx.organizationId!);
    }),

    create: directorProcedure
      .input(
        z.object({
          type: z.enum(["rehearsal", "concert", "meeting", "other"]),
          title: z.string(),
          description: z.string().optional(),
          startAt: z.date(),
          endAt: z.date().optional(),
          locationString: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(events).values({
          organizationId: ctx.organizationId!,
          createdBy: ctx.user!.id,
          ...input,
        } as any);

        return { success: true, eventId: Number(result[0].insertId) };
      }),

    update: directorProcedure
      .input(
        z.object({
          eventId: z.number(),
          type: z.enum(["rehearsal", "concert", "meeting", "other"]).optional(),
          title: z.string().optional(),
          description: z.string().optional(),
          startAt: z.date().optional(),
          endAt: z.date().optional(),
          locationString: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { eventId, ...updateData } = input;

        await db
          .update(events)
          .set({ ...updateData, updatedAt: new Date() })
          .where(and(eq(events.id, eventId), eq(events.organizationId, ctx.organizationId!))!);

        return { success: true };
      }),

    delete: directorProcedure.input(z.object({ eventId: z.number() })).mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(events).where(and(eq(events.id, input.eventId), eq(events.organizationId, ctx.organizationId!))!);

      return { success: true };
    }),

    rsvp: memberProcedure
      .input(
        z.object({
          eventId: z.number(),
          status: z.enum(["attending", "not_attending", "maybe"]),
          motivation: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const rsvpRecord = await upsertRsvp({
          eventId: input.eventId,
          userId: ctx.user!.id,
          status: input.status,
          motivation: input.motivation,
        });

        return rsvpRecord;
      }),

    getRsvpList: tenantProtectedProcedure.input(z.object({ eventId: z.number() })).query(async ({ ctx, input }) => {
      return getRsvpByEvent(input.eventId);
    }),
  }),

  // ============================================================================
  // ATTENDANCE ROUTES
  // ============================================================================
  attendance: router({
    checkIn: memberProcedure
      .input(
        z.object({
          eventId: z.number(),
          qrCode: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // TODO: Validate QR code if provided
        const attendanceRecord = await createAttendance({
          eventId: input.eventId,
          userId: ctx.user!.id,
          status: "present",
        });

        return attendanceRecord;
      }),

    list: tenantProtectedProcedure.input(z.object({ eventId: z.number() })).query(async ({ ctx, input }) => {
      return getAttendanceByEvent(input.eventId);
    }),

    myAttendance: memberProcedure.query(async ({ ctx }) => {
      return getAttendanceByUser(ctx.user!.id, ctx.organizationId!);
    }),

    stats: memberProcedure.input(z.object({}).optional()).query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get total events for the organization
      const totalEventsResult = await db
        .select({ count: count(events.id) })
        .from(events)
        .where(eq(events.organizationId, ctx.organizationId!));

      const totalEvents = totalEventsResult[0]?.count || 0;

      // Get attended events for the user
      const attendedEventsResult = await db
        .select({ count: count(attendance.id) })
        .from(attendance)
        .where(
          and(
            eq(attendance.userId, ctx.user!.id),
            eq(attendance.status, "present")
          )!
        );

      const attendedEvents = attendedEventsResult[0]?.count || 0;

      // Calculate attendance rate
      const attendanceRate = totalEvents > 0 ? (attendedEvents / totalEvents) * 100 : 0;

      return {
        totalEvents,
        attendedEvents,
        attendanceRate,
      };
    }),
  }),

  // ============================================================================
  // PAYMENTS ROUTES
  // ============================================================================
  payments: router({
    create: secretaryProcedure
      .input(
        z.object({
          userId: z.number(),
          type: z.enum(["membership_fee", "event_fee", "donation"]),
          amountCents: z.number(),
          currency: z.string().default("EUR"),
          description: z.string().optional(),
          dueAt: z.date().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(payments).values({
          organizationId: ctx.organizationId!,
          ...input,
          status: "pending",
        } as any);

        return { success: true, paymentId: Number(result[0].insertId) };
      }),

    list: tenantProtectedProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          status: z.enum(["pending", "completed", "failed"]).optional(),
          type: z.enum(["membership_fee", "event_fee", "donation"]).optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        if (input.userId) {
          return getPaymentsByUser(input.userId, ctx.organizationId!);
        }

        return getPaymentsByOrganization(ctx.organizationId!, {
          status: input.status,
          type: input.type,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    updateStatus: secretaryProcedure
      .input(
        z.object({
          paymentId: z.number(),
          status: z.enum(["pending", "completed", "failed"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(payments)
          .set({
            status: input.status,
            paidAt: input.status === "completed" ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(and(eq(payments.id, input.paymentId), eq(payments.organizationId, ctx.organizationId!))!);

        return { success: true };
      }),

    myPayments: tenantProtectedProcedure
      .input(
        z.object({
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getPaymentsByUser(ctx.user!.id, ctx.organizationId!);
      }),
  }),

  // ============================================================================
  // SONGS ROUTES
  // ============================================================================
  songs: router({
    list: tenantProcedure
      .input(
        z.object({
          search: z.string().optional(),
          difficulty: z.number().optional(),
          limit: z.number().default(50),
          offset: z.number().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return getSongsByOrganization(ctx.organizationId!, {
          search: input.search,
          difficulty: input.difficulty,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    get: tenantProcedure.input(z.object({ songId: z.number() })).query(async ({ ctx, input }) => {
      const song = await getSongById(input.songId, ctx.organizationId!);
      if (!song) return null;

      const assets = await getSongAssets(input.songId);

      return {
        ...song,
        assets,
      };
    }),

    create: directorProcedure
      .input(
        z.object({
          title: z.string(),
          composer: z.string().optional(),
          arranger: z.string().optional(),
          language: z.string().optional(),
          durationSeconds: z.number().optional(),
          difficulty: z.number().optional(),
          tempoBpm: z.number().optional(),
          key: z.string().optional(),
          categories: z.array(z.string()).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(songs).values({
          organizationId: ctx.organizationId!,
          createdBy: ctx.user!.id,
          ...input,
        } as any);

        return { success: true, songId: Number(result[0].insertId) };
      }),

    uploadAsset: directorProcedure
      .input(
        z.object({
          songId: z.number(),
          type: z.enum(["score_pdf", "reference_audio", "section_stem", "lyrics", "youtube_link"]),
          url: z.string(),
          fileKey: z.string().optional(),
          voiceSection: z.enum(["soprano", "mezzo_soprano", "alto", "tenor", "baritone", "bass", "all"]).optional(),
          mimeType: z.string().optional(),
          fileSize: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(songAssets).values({
          ...input,
          uploadedBy: ctx.user!.id,
        } as any);

        return { success: true, assetId: Number(result[0].insertId) };
      }),
  }),

  // ============================================================================
  // SETLISTS ROUTES
  // ============================================================================
  setlists: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return getSetlistsByOrganization(ctx.organizationId!);
    }),

    get: tenantProcedure.input(z.object({ setlistId: z.number() })).query(async ({ ctx, input }) => {
      const setlist = await getSetlistById(input.setlistId, ctx.organizationId!);
      if (!setlist) return null;

      const items = await getSetlistItems(input.setlistId);

      return {
        ...setlist,
        items,
      };
    }),

    create: directorProcedure
      .input(
        z.object({
          eventId: z.number().optional(),
          title: z.string(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(setlists).values({
          organizationId: ctx.organizationId!,
          createdBy: ctx.user!.id,
          ...input,
        } as any);

        return { success: true, setlistId: Number(result[0].insertId) };
      }),

    addSong: directorProcedure
      .input(
        z.object({
          setlistId: z.number(),
          songId: z.number(),
          order: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(setlistItems).values(input as any);

        return { success: true, itemId: Number(result[0].insertId) };
      }),

    removeSong: directorProcedure
      .input(
        z.object({
          itemId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db.delete(setlistItems).where(eq(setlistItems.id, input.itemId));

        return { success: true };
      }),
  }),

  // ============================================================================
  // SUPERADMIN ROUTES
  // ============================================================================
  superadmin: router({
    createTenant: superAdminProcedure
      .input(
        z.object({
          slug: z.string().min(3).max(64),
          name: z.string(),
          logoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const result = await db.insert(organizations).values({
          slug: input.slug,
          name: input.name,
          logoUrl: input.logoUrl,
          settings: {
            timezone: "UTC",
            language: "it",
            features: [],
            allowGuests: false,
          },
        } as any);

        return { id: Number(result[0].insertId), slug: input.slug };
      }),

    listTenants: superAdminProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];

      return db.select().from(organizations);
    }),
  }),
});

export type AppRouter = typeof appRouter;
