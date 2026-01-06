import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: string = "member"): { ctx: TrpcContext } {
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

describe("payments router", () => {
  it("should create a payment with valid data", async () => {
    const { ctx } = createAuthContext("secretary");
    const caller = appRouter.createCaller(ctx);

    const paymentData = {
      userId: 1,
      type: "membership_fee" as const,
      amountCents: 5000,
      currency: "EUR",
      description: "Quota annuale 2025",
      dueAt: new Date("2025-12-31"),
    };

    const result = await caller.payments.create(paymentData);

    expect(result).toBeDefined();
    expect(result.id).toBeGreaterThan(0);
    expect(result.amountCents).toBe(paymentData.amountCents);
    expect(result.status).toBe("pending");
  });

  it("should list payments with filters", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payments.list({
      status: "pending",
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should update payment status", async () => {
    const { ctx } = createAuthContext("secretary");
    const caller = appRouter.createCaller(ctx);

    // First create a payment
    const payment = await caller.payments.create({
      userId: 1,
      type: "membership_fee" as const,
      amountCents: 3000,
      currency: "EUR",
    });

    // Then update its status
    const updated = await caller.payments.updateStatus({
      paymentId: payment.id,
      status: "completed",
    });

    expect(updated).toBeDefined();
    expect(updated.status).toBe("completed");
  });

  it("should get user payments", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.payments.myPayments({
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});
