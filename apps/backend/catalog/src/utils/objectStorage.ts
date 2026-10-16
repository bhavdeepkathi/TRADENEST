import { Client } from 'minio';

const bucket = process.env.MINIO_BUCKET || 'tradenest';
const isProduction = process.env.NODE_ENV === 'production';

function storageSetting(name: string, developmentDefault: string) {
  const value = process.env[name] || (isProduction ? undefined : developmentDefault);
  if (!value) throw new Error(`${name} must be configured for product image storage`);
  return value;
}

let client: Client | undefined;

function getClient() {
  if (!client) {
    client = new Client({
      endPoint: storageSetting('MINIO_ENDPOINT', 'localhost'),
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: storageSetting('MINIO_ACCESS_KEY', 'minioadmin'),
      secretKey: storageSetting('MINIO_SECRET_KEY', 'minioadmin'),
    });
  }
  return client;
}

let bucketReady: Promise<void> | undefined;

async function ensureBucket() {
  const storage = getClient();
  if (!bucketReady) {
    bucketReady = (async () => {
      if (await storage.bucketExists(bucket)) return;
      try {
        await storage.makeBucket(bucket, 'us-east-1');
      } catch (error) {
        if (!(await storage.bucketExists(bucket))) throw error;
      }
    })().catch((error: unknown) => {
      bucketReady = undefined;
      throw error;
    });
  }
  await bucketReady;
}

export async function storeProductImage(filename: string, image: Buffer, contentType: string) {
  await ensureBucket();
  await getClient().putObject(bucket, filename, image, image.length, { 'Content-Type': contentType });
}

export async function getProductImage(filename: string) {
  await ensureBucket();
  return getClient().getObject(bucket, filename);
}
