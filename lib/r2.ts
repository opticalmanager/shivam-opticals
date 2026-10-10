import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "shivam-optics-catalog";
const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// Detect if valid Cloudflare R2 credentials are provided
const isR2Configured = Boolean(
  accountId &&
  accessKeyId &&
  secretAccessKey &&
  accountId !== "your_cloudflare_account_id"
);

export const r2Client = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
});

/**
 * Upload a file buffer directly to Cloudflare R2 (with automatic local fallback if credentials not provided or offline)
 * @param fileBuffer Buffer or Uint8Array of the file
 * @param fileName Target filename in bucket (e.g. 'products/gast-noir-gold-1.webp')
 * @param contentType MIME type of the file (e.g. 'image/webp', 'image/jpeg', 'model/gltf-binary')
 * @returns Public CDN URL or local URL of the uploaded media
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  if (isR2Configured) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      });

      await r2Client.send(command);

      // Return public CDN URL if custom domain or pub url is set
      if (publicDomain) {
        const cleanDomain = publicDomain.replace(/\/$/, "");
        const cleanKey = fileName.replace(/^\//, "");
        return `${cleanDomain}/${cleanKey}`;
      }

      return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${fileName}`;
    } catch (error) {
      console.warn("[Cloudflare R2] Upload failed or credentials invalid, saving to local public directory fallback:", error);
    }
  }

  // Local fallback for offline/development resilience
  const localDir = path.join(process.cwd(), "public", "uploads", path.dirname(fileName));
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(process.cwd(), "public", "uploads", fileName);
  fs.writeFileSync(localPath, fileBuffer);

  return `/uploads/${fileName}`;
}

/**
 * Extract R2 object key from a full URL or local path
 * e.g. "https://pub-xxxxxx.r2.dev/products/frame-1.webp" -> "products/frame-1.webp"
 * e.g. "/uploads/products/frame-1.webp" -> "products/frame-1.webp"
 */
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    if (url.startsWith("/uploads/")) {
      return url.replace(/^\/uploads\//, "");
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/^\//, "");
      return pathname || null;
    }
    return url.replace(/^\//, "");
  } catch {
    return null;
  }
}

/**
 * Delete a file from Cloudflare R2 (and local fallback directory if present)
 * @param fileName Key of the file in the bucket (e.g. "products/frame-1.webp")
 */
export async function deleteFromR2(fileName: string): Promise<boolean> {
  const cleanKey = fileName.replace(/^\//, "");
  let deleted = false;

  if (isR2Configured) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: cleanKey,
      });
      await r2Client.send(command);
      deleted = true;
    } catch (error) {
      console.warn("[Cloudflare R2] Deletion error:", error);
    }
  }

  // Also clean up local fallback file if exists
  try {
    const localPath = path.join(process.cwd(), "public", "uploads", cleanKey);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      deleted = true;
    }
  } catch (err) {
    console.warn("Failed to delete local fallback file:", err);
  }

  return deleted;
}

/**
 * Generate presigned URL for direct client-to-R2 upload
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  if (!isR2Configured) return null;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn });
    const cleanDomain = (publicDomain || "").replace(/\/$/, "");
    const cleanKey = fileName.replace(/^\//, "");
    const publicUrl = cleanDomain ? `${cleanDomain}/${cleanKey}` : uploadUrl.split("?")[0];

    return { uploadUrl, publicUrl };
  } catch (error) {
    console.error("[Cloudflare R2] Presigned URL error:", error);
    return null;
  }
}
