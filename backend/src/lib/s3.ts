import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "stream";

const REGION = process.env.AWS_REGION ?? "us-east-1";
const BUCKET = process.env.S3_BUCKET_NAME ?? "";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: REGION,
      ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
          }
        : {})
    });
  }
  return client;
}

export function useS3(): boolean {
  return !!BUCKET;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | Blob | Readable | string,
  contentType?: string
): Promise<string> {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await getClient().send(cmd);
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await getClient().send(cmd);
}

export function urlToKey(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return url.startsWith("/") ? url.replace(/^\//, "") : null;
  }
}
