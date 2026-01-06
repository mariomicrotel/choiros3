import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: string = "member", tenantId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        host: "test-tenant.choiros.app",
      },
      get: (header: string) => {
        if (header === "host") return "test-tenant.choiros.app";
        return undefined;
      },
    } as any,
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("events router", () => {
  it("should create an event with valid data", async () => {
    const { ctx } = createAuthContext("director");
    const caller = appRouter.createCaller(ctx);

    const eventData = {
      type: "rehearsal" as const,
      title: "Prova Generale",
      description: "Prova per il concerto di Natale",
      startAt: new Date("2025-12-20T18:00:00Z"),
      endAt: new Date("2025-12-20T20:00:00Z"),
      locationString: "Sala Prove Centrale",
    };

    const result = await caller.events.create(eventData);

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe(eventData.title);
    expect(result.type).toBe(eventData.type);
  });

  it("should list events with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.list({
      type: "rehearsal",
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should allow RSVP to an event", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an event
    const event = await caller.events.create({
      type: "concert" as const,
      title: "Concerto di Natale",
      startAt: new Date("2025-12-25T20:00:00Z"),
    });

    // Then RSVP to it
    const rsvp = await caller.events.rsvp({
      eventId: event.id,
      status: "attending",
      motivation: "Sarò presente!",
    });

    expect(rsvp).toBeDefined();
    expect(rsvp.status).toBe("attending");
  });

  it("should get RSVP list for an event", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);

    // Create an event
    const event = await caller.events.create({
      type: "rehearsal" as const,
      title: "Prova Settimanale",
      startAt: new Date("2025-12-15T18:00:00Z"),
    });

    // Get RSVP list (should be empty initially)
    const rsvpList = await caller.events.getRsvpList({
      eventId: event.id,
    });

    expect(Array.isArray(rsvpList)).toBe(true);
  });
});
