import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { organizations, users, memberships } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

export async function setupTestOrganization() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create test organization
  const [org] = await db
    .insert(organizations)
    .values({
      name: "Test Choir",
      slug: "test-tenant",
      settings: {
        timezone: "Europe/Rome",
        language: "it",
        features: [],
        allowGuests: false,
      },
    })
    .$returningId();

  return org.id;
}

export async function setupTestUser(organizationId: number, role: string = "member") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "manus",
      role: "user",
    })
    .$returningId();

  // Create membership
  await db.insert(memberships).values({
    userId: user.id,
    organizationId,
    role: role as any,
    status: "active",
  });

  return user.id;
}

export function createTestContext(userId: number, organizationId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
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

  // Inject tenant context directly to bypass middleware
  (ctx as any).tenant = {
    organizationId,
    userId,
    role: "member",
    status: "active",
  };

  return ctx;
}

export async function cleanupTestData(organizationId: number) {
  const db = await getDb();
  if (!db) return;

  // Note: In a real scenario, you'd delete all related data
  // For now, we'll leave cleanup minimal since tests run in isolation
}
