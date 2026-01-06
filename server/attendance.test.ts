import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
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

describe("attendance router", () => {
  it("should record check-in for an event", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create an event
    const event = await caller.events.create({
      type: "rehearsal" as const,
      title: "Prova Check-in Test",
      startAt: new Date(),
    });

    // Then check-in
    const attendance = await caller.attendance.checkIn({
      eventId: event.id,
    });

    expect(attendance).toBeDefined();
    expect(attendance.eventId).toBe(event.id);
    expect(attendance.userId).toBe(ctx.user!.id);
    expect(attendance.checkInAt).toBeDefined();
  });

  it("should list attendance records", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.attendance.list({
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should get user's attendance history", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.attendance.myAttendance({
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should calculate attendance statistics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.attendance.stats({});

    expect(stats).toBeDefined();
    expect(typeof stats.totalEvents).toBe("number");
    expect(typeof stats.attendedEvents).toBe("number");
    expect(typeof stats.attendanceRate).toBe("number");
    expect(stats.attendanceRate).toBeGreaterThanOrEqual(0);
    expect(stats.attendanceRate).toBeLessThanOrEqual(100);
  });
});
