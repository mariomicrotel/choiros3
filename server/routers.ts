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
import { sendEmail } from "./emailService";
import {
  generateEventInviteEmail,
  generateRegistrationConfirmationEmail,
  generateRegistrationApprovalEmail,
  generateRegistrationRejectionEmail,
  generatePaymentDueEmail,
  generatePaymentConfirmationEmail,
} from "./emailTemplates";
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
  createSong,
  updateSong,
  deleteSong,
  createSongAsset,
  deleteSongAsset,
  getSetlistsByOrganization,
  getSetlistById,
  getSetlistItems,
  createSetlist,
  updateSetlist,
  deleteSetlist,
  addSongToSetlist,
  removeSongFromSetlist,
  reorderSetlistItems,
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
  registrations,
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

    /**
     * Refresh session - forces re-fetch of user data from database
     * This invalidates any cached user info and returns fresh data
     */
    refreshSession: protectedProcedure.query(async (opts) => {
      const user = opts.ctx.user;
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Extract tenant context with fresh DB data
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
        refreshed: true,
      };
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

        // Send confirmation email
        try {
          const emailData = generateRegistrationConfirmationEmail({
            recipientName: input.fullName,
            voiceSection: input.voiceSection || "Non specificata",
            organizationName: org.name,
          });

          await sendEmail({
            to: input.email,
            toName: input.fullName,
            subject: "Richiesta di iscrizione ricevuta",
            htmlContent: emailData.html,
            textContent: emailData.text,
          });
        } catch (error) {
          console.error("Error sending registration confirmation email:", error);
        }

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

        // Send approval email
        try {
          const db = await getDb();
          if (db) {
            const reg = await db.select().from(registrations).where(eq(registrations.id, input.registrationId)).limit(1);
            const org = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId!)).limit(1);

            if (reg[0] && org[0]) {
              const emailData = generateRegistrationApprovalEmail({
                recipientName: reg[0].fullName || "Corista",
                loginUrl: `${process.env.VITE_OAUTH_PORTAL_URL}`,
                organizationName: org[0].name,
              });

              await sendEmail({
                to: reg[0].email,
                toName: reg[0].fullName || "Corista",
                subject: "Iscrizione approvata!",
                htmlContent: emailData.html,
                textContent: emailData.text,
              });
            }
          }
        } catch (error) {
          console.error("Error sending approval email:", error);
        }

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

        // Send rejection email
        try {
          const db = await getDb();
          if (db) {
            const reg = await db.select().from(registrations).where(eq(registrations.id, input.registrationId)).limit(1);
            const org = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId!)).limit(1);

            if (reg[0] && org[0]) {
              const emailData = generateRegistrationRejectionEmail({
                recipientName: reg[0].fullName || "Corista",
                reason: input.reason,
                organizationName: org[0].name,
              });

              await sendEmail({
                to: reg[0].email,
                toName: reg[0].fullName || "Corista",
                subject: "Richiesta di iscrizione",
                htmlContent: emailData.html,
                textContent: emailData.text,
              });
            }
          }
        } catch (error) {
          console.error("Error sending rejection email:", error);
        }

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

        const eventId = Number(result[0].insertId);

        // Send email invitations to all active members
        try {
          const members = await db
            .select()
            .from(memberships)
            .innerJoin(users, eq(memberships.userId, users.id))
            .where(and(eq(memberships.organizationId, ctx.organizationId!), eq(memberships.status, "active"))!);

          const org = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId!)).limit(1);
          const organizationName = org[0]?.name || "Coro";

          for (const member of members) {
            const emailData = generateEventInviteEmail({
              recipientName: member.users.name || member.users.email || "Corista",
              eventTitle: input.title,
              eventType: input.type,
              eventDate: input.startAt,
              eventLocation: input.locationString,
              eventUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL}/events/${eventId}`,
              organizationName,
            });

            await sendEmail({
              to: member.users.email || "",
              toName: member.users.name || member.users.email || "Corista",
              subject: `Nuovo evento: ${input.title}`,
              htmlContent: emailData.html,
              textContent: emailData.text,
            });
          }
        } catch (error) {
          console.error("Error sending event invitation emails:", error);
        }

        return { success: true, eventId };
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

        const paymentId = Number(result[0].insertId);

        // Send payment due email if dueAt is set
        if (input.dueAt) {
          try {
            const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
            const org = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId!)).limit(1);

            if (user[0] && org[0]) {
              const emailData = generatePaymentDueEmail({
                recipientName: user[0].name || user[0].email || "Corista",
                amount: input.amountCents,
                dueDate: input.dueAt,
                description: input.description || "Pagamento",
                paymentUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL}/payments/${paymentId}`,
                organizationName: org[0].name,
              });

              await sendEmail({
                to: user[0].email || "",
                toName: user[0].name || user[0].email || "Corista",
                subject: "Pagamento in scadenza",
                htmlContent: emailData.html,
                textContent: emailData.text,
              });
            }
          } catch (error) {
            console.error("Error sending payment due email:", error);
          }
        }

        return { success: true, paymentId };
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

        // Send payment confirmation email if completed
        if (input.status === "completed") {
          try {
            const payment = await db.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1);
            if (payment[0]) {
              const user = await db.select().from(users).where(eq(users.id, payment[0].userId)).limit(1);
              const org = await db.select().from(organizations).where(eq(organizations.id, ctx.organizationId!)).limit(1);

              if (user[0] && org[0]) {
                const emailData = generatePaymentConfirmationEmail({
                  recipientName: user[0].name || user[0].email || "Corista",
                  amount: payment[0].amountCents,
                  paymentDate: new Date(),
                  description: payment[0].description || "Pagamento",
                  organizationName: org[0].name,
                });

                await sendEmail({
                  to: user[0].email || "",
                  toName: user[0].name || user[0].email || "Corista",
                  subject: "Pagamento confermato",
                  htmlContent: emailData.html,
                  textContent: emailData.text,
                });
              }
            }
          } catch (error) {
            console.error("Error sending payment confirmation email:", error);
          }
        }

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

    update: directorProcedure
      .input(
        z.object({
          songId: z.number(),
          title: z.string().optional(),
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
        const { updateSong } = await import("./db");
        const { songId, ...data } = input;
        const song = await updateSong(songId, ctx.organizationId!, data);
        return { success: !!song, song };
      }),

    delete: directorProcedure
      .input(z.object({ songId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSong } = await import("./db");
        const success = await deleteSong(input.songId, ctx.organizationId!);
        return { success };
      }),

    deleteAsset: directorProcedure
      .input(z.object({ assetId: z.number(), songId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSongAsset } = await import("./db");
        const success = await deleteSongAsset(input.assetId, input.songId);
        return { success };
      }),
  }),

  // ============================================================================
  // PROFILE ROUTES
  // ============================================================================
  profile: router({
    stats: memberProcedure.query(async ({ ctx }) => {
      const { getProfileStats } = await import("./db");
      return getProfileStats(ctx.user!.id, ctx.organizationId!);
    }),

    updatePhoto: memberProcedure
      .input(z.object({ photoUrl: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(userProfiles)
          .set({ profilePhotoUrl: input.photoUrl, updatedAt: new Date() })
          .where(
            and(
              eq(userProfiles.userId, ctx.user!.id),
              eq(userProfiles.organizationId, ctx.organizationId!)
            )!
          );

        return { success: true };
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

    update: directorProcedure
      .input(
        z.object({
          setlistId: z.number(),
          title: z.string().optional(),
          notes: z.string().optional(),
          eventId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateSetlist } = await import("./db");
        const { setlistId, ...data } = input;
        const setlist = await updateSetlist(setlistId, ctx.organizationId!, data);
        return { success: !!setlist, setlist };
      }),

    delete: directorProcedure
      .input(z.object({ setlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteSetlist } = await import("./db");
        const success = await deleteSetlist(input.setlistId, ctx.organizationId!);
        return { success };
      }),

    reorderItems: directorProcedure
      .input(
        z.object({
          setlistId: z.number(),
          itemOrders: z.array(z.object({ id: z.number(), order: z.number() })),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { reorderSetlistItems } = await import("./db");
        const success = await reorderSetlistItems(input.setlistId, input.itemOrders);
        return { success };
      }),
  }),

  // ============================================================================
  // SUPERADMIN ROUTES
  // ============================================================================
  superadmin: router({
    // Dashboard statistics
    stats: superAdminProcedure.query(async () => {
      const { getSuperadminStats } = await import("./db");
      return getSuperadminStats();
    }),

    // List all organizations with subscriptions
    listOrganizations: superAdminProcedure.query(async () => {
      const { getAllOrganizations } = await import("./db");
      return getAllOrganizations();
    }),

    // Get organization details with subscription
    getOrganization: superAdminProcedure
      .input(z.object({ orgId: z.number() }))
      .query(async ({ input }) => {
        const { getOrganizationWithSubscription } = await import("./db");
        return getOrganizationWithSubscription(input.orgId);
      }),

    // Create new organization with subscription
    createOrganization: superAdminProcedure
      .input(
        z.object({
          slug: z.string().min(3).max(64),
          name: z.string(),
          logoUrl: z.string().optional(),
          fiscalCode: z.string().optional(),
          vatNumber: z.string().optional(),
          billingEmail: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
          // Subscription
          plan: z.enum(["monthly", "annual"]),
          priceMonthly: z.number(),
          priceAnnual: z.number().optional(),
          startDate: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        const { createOrganizationWithSubscription } = await import("./db");
        const orgId = await createOrganizationWithSubscription(input);
        return { success: true, orgId };
      }),

    // Update organization
    updateOrganization: superAdminProcedure
      .input(
        z.object({
          orgId: z.number(),
          name: z.string().optional(),
          logoUrl: z.string().optional(),
          fiscalCode: z.string().optional(),
          vatNumber: z.string().optional(),
          billingEmail: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          postalCode: z.string().optional(),
          country: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateOrganization } = await import("./db");
        const { orgId, ...data } = input;
        await updateOrganization(orgId, data);
        return { success: true };
      }),

    // Update subscription
    updateSubscription: superAdminProcedure
      .input(
        z.object({
          subscriptionId: z.number(),
          plan: z.enum(["monthly", "annual"]).optional(),
          status: z.enum(["active", "suspended", "expired", "cancelled"]).optional(),
          priceMonthly: z.number().optional(),
          priceAnnual: z.number().optional(),
          nextBillingDate: z.date().optional(),
          endDate: z.date().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateSubscription } = await import("./db");
        const { subscriptionId, ...data } = input;
        await updateSubscription(subscriptionId, data);
        return { success: true };
      }),

    // Cancel subscription
    cancelSubscription: superAdminProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ input }) => {
        const { cancelSubscription } = await import("./db");
        await cancelSubscription(input.subscriptionId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
