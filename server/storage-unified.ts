/**
 * Unified Storage Helper
 * 
 * Provides a unified API for file storage that delegates to either:
 * - Local filesystem storage (/storage/organizations/{orgId}/)
 * - Amazon S3 storage (using existing storagePut/storageGet)
 * 
 * The storage type is determined by the organization's storageType field.
 */

import { promises as fs } from "fs";
import path from "path";
import { storagePut, storageGet } from "./storage";
import { getDb } from "./db";
import { organizations } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const LOCAL_STORAGE_BASE = "/storage/organizations";

/**
 * Get the storage type for an organization
 */
async function getOrganizationStorageType(
  organizationId: number
): Promise<"local" | "s3"> {
  const db = await getDb();
  if (!db) return "s3"; // Default to S3 if DB unavailable

  const [org] = await db
    .select({ storageType: organizations.storageType })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  return (org?.storageType as "local" | "s3") || "s3";
}

/**
 * Ensure local storage directory exists for an organization
 */
async function ensureLocalStorageDir(organizationId: number): Promise<string> {
  const orgDir = path.join(LOCAL_STORAGE_BASE, organizationId.toString());
  await fs.mkdir(orgDir, { recursive: true });
  return orgDir;
}

/**
 * Put a file into storage (local or S3 based on organization config)
 * 
 * @param organizationId - The organization ID
 * @param key - The file key/path (relative to organization storage)
 * @param data - File content (Buffer, Uint8Array, or string)
 * @param contentType - MIME type (optional, used for S3)
 * @returns Object with key and url
 */
export async function putFile(
  organizationId: number,
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const storageType = await getOrganizationStorageType(organizationId);

  if (storageType === "local") {
    // Local filesystem storage
    const orgDir = await ensureLocalStorageDir(organizationId);
    const filePath = path.join(orgDir, key);
    const fileDir = path.dirname(filePath);
    
    // Ensure subdirectories exist
    await fs.mkdir(fileDir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, data);
    
    // Return local file URL (served via Express static middleware)
    const url = `/storage/organizations/${organizationId}/${key}`;
    return { key, url };
  } else {
    // S3 storage
    const s3Key = `organizations/${organizationId}/${key}`;
    return await storagePut(s3Key, data, contentType);
  }
}

/**
 * Get a file URL from storage (local or S3 based on organization config)
 * 
 * @param organizationId - The organization ID
 * @param key - The file key/path
 * @param expiresIn - Expiration time in seconds (only for S3 presigned URLs)
 * @returns Object with key and url
 */
export async function getFile(
  organizationId: number,
  key: string,
  expiresIn?: number
): Promise<{ key: string; url: string }> {
  const storageType = await getOrganizationStorageType(organizationId);

  if (storageType === "local") {
    // Local filesystem - return static URL
    const url = `/storage/organizations/${organizationId}/${key}`;
    return { key, url };
  } else {
    // S3 storage - return presigned URL
    const s3Key = `organizations/${organizationId}/${key}`;
    return await storageGet(s3Key);
  }
}

/**
 * Delete a file from storage (local or S3 based on organization config)
 * 
 * @param organizationId - The organization ID
 * @param key - The file key/path
 * @returns True if deleted successfully
 */
export async function deleteFile(
  organizationId: number,
  key: string
): Promise<boolean> {
  const storageType = await getOrganizationStorageType(organizationId);

  if (storageType === "local") {
    // Local filesystem storage
    try {
      const orgDir = path.join(LOCAL_STORAGE_BASE, organizationId.toString());
      const filePath = path.join(orgDir, key);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete local file: ${key}`, error);
      return false;
    }
  } else {
    // S3 storage - Note: current storage.ts doesn't export deleteFile
    // This would need to be implemented in storage.ts
    console.warn("S3 file deletion not yet implemented");
    return false;
  }
}

/**
 * List files in a directory (local or S3 based on organization config)
 * 
 * @param organizationId - The organization ID
 * @param prefix - Directory prefix/path
 * @returns Array of file keys
 */
export async function listFiles(
  organizationId: number,
  prefix: string = ""
): Promise<string[]> {
  const storageType = await getOrganizationStorageType(organizationId);

  if (storageType === "local") {
    // Local filesystem storage
    try {
      const orgDir = path.join(LOCAL_STORAGE_BASE, organizationId.toString());
      const dirPath = path.join(orgDir, prefix);
      const files = await fs.readdir(dirPath, { recursive: true });
      return files.filter((f) => !f.endsWith("/")); // Filter out directories
    } catch (error) {
      console.error(`Failed to list local files in: ${prefix}`, error);
      return [];
    }
  } else {
    // S3 storage - Note: current storage.ts doesn't export listFiles
    // This would need to be implemented in storage.ts
    console.warn("S3 file listing not yet implemented");
    return [];
  }
}
