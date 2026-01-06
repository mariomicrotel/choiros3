import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure } from "./trpc";
import { requireTenantContext, requireRole, type TenantContext } from "./tenantContext";

/**
 * Procedure that requires tenant context (organization must be identified)
 * User authentication is optional
 */
export const tenantProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const tenantCtx = await requireTenantContext(ctx);
  return next({ ctx: tenantCtx });
});

/**
 * Procedure that requires both authentication and tenant context
 */
export const tenantProtectedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const tenantCtx = await requireTenantContext(ctx);
  
  if (!tenantCtx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  
  return next({ ctx: tenantCtx });
});

/**
 * Procedure for admin-only operations
 */
export const adminProcedure = tenantProtectedProcedure.use(async ({ ctx, next }) => {
  await requireRole("admin")(ctx);
  return next({ ctx });
});

/**
 * Procedure for director and admin
 */
export const directorProcedure = tenantProtectedProcedure.use(async ({ ctx, next }) => {
  await requireRole("admin", "director")(ctx);
  return next({ ctx });
});

/**
 * Procedure for secretary, director and admin
 */
export const secretaryProcedure = tenantProtectedProcedure.use(async ({ ctx, next }) => {
  await requireRole("admin", "director", "secretary")(ctx);
  return next({ ctx });
});

/**
 * Procedure for capo_section and above
 */
export const capoSectionProcedure = tenantProtectedProcedure.use(async ({ ctx, next }) => {
  await requireRole("admin", "director", "secretary", "capo_section")(ctx);
  return next({ ctx });
});

/**
 * Procedure for all members (excluding guests)
 */
export const memberProcedure = tenantProtectedProcedure.use(async ({ ctx, next }) => {
  await requireRole("admin", "director", "secretary", "capo_section", "member")(ctx);
  return next({ ctx });
});

/**
 * Super admin procedure (platform-level access)
 */
export const superAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Super admin access required",
    });
  }
  return next({ ctx });
});
