import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { getOrganizationBySlug, getUserMembership, getOrganizationById } from "../db";
import type { Organization, Membership } from "../../drizzle/schema";

export interface TenantContext extends TrpcContext {
  organizationId: number;
  organizationSlug: string;
  organization: Organization;
  userRole?: "admin" | "director" | "secretary" | "capo_section" | "member" | "guest";
  membership?: Membership;
}

/**
 * Extract tenant from request (subdomain or slug in path)
 * Supports both:
 * - Subdomain: coro1.choiros.app
 * - Slug in path: /t/coro1/...
 */
export async function extractTenantContext(ctx: TrpcContext): Promise<TenantContext | null> {
  const req = ctx.req;
  let tenantSlug: string | null = null;

  // Try to extract from subdomain first
  const host = req.headers.host || "";
  const subdomain = host.split(".")[0];
  
  // Check if subdomain is not the main domain
  if (subdomain && subdomain !== "localhost" && subdomain !== "choiros" && !subdomain.includes(":")) {
    tenantSlug = subdomain;
  }

  // If no subdomain, try to extract from path /t/{slug}/...
  if (!tenantSlug) {
    const pathMatch = req.url?.match(/^\/t\/([^\/]+)/);
    if (pathMatch) {
      tenantSlug = pathMatch[1];
    }
  }

  if (!tenantSlug) {
    return null;
  }

  // Get organization from database
  const organization = await getOrganizationBySlug(tenantSlug);
  if (!organization) {
    return null;
  }

  // Get user membership if user is authenticated
  let membership: Membership | undefined;
  let userRole: TenantContext["userRole"];

  if (ctx.user) {
    membership = (await getUserMembership(ctx.user.id, organization.id)) || undefined;
    userRole = membership?.role;
  }

  return {
    ...ctx,
    organizationId: organization.id,
    organizationSlug: tenantSlug,
    organization,
    userRole,
    membership,
  };
}

/**
 * Middleware to require tenant context
 */
export async function requireTenantContext(ctx: TrpcContext): Promise<TenantContext> {
  const tenantCtx = await extractTenantContext(ctx);
  
  if (!tenantCtx) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found. Please check the URL.",
    });
  }

  return tenantCtx;
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...allowedRoles: Array<"admin" | "director" | "secretary" | "capo_section" | "member" | "guest">) {
  return async (ctx: TenantContext): Promise<TenantContext> => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    if (!ctx.userRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    if (!allowedRoles.includes(ctx.userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    return ctx;
  };
}
