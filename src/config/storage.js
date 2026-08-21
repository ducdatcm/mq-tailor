const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 client (S3-compatible). Used instead of local disk because
 * this host's "Deploy Web App" product gives every deploy a brand-new,
 * disposable folder — anything written to the local filesystem is gone the
 * next time the app redeploys. R2 is a separate, persistent service, so
 * uploaded photos survive redeploys, restarts, everything.
 */
/**
 * R2_ACCOUNT_ID is meant to be the bare account ID (Cloudflare also shows
 * the full "https://<id>.r2.cloudflarestorage.com" endpoint right next to
 * it on the same page, which is an easy thing to paste in by mistake) — so
 * accept either form here instead of producing a broken double-https://
 * endpoint.
 */
function resolveEndpoint(rawAccountId) {
  const value = (rawAccountId || '').trim().replace(/\/+$/, '');
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}.r2.cloudflarestorage.com`;
}

function getClient() {
  const accountId = (process.env.R2_ACCOUNT_ID || '').trim();
  const accessKeyId = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 storage is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.'
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint: resolveEndpoint(accountId),
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Uploads a buffer to R2 under `key` and returns its public URL. */
async function putObject(key, buffer, contentType) {
  const bucket = (process.env.R2_BUCKET_NAME || '').trim();
  const publicUrl = (process.env.R2_PUBLIC_URL || '').trim();
  if (!bucket || !publicUrl) {
    throw new Error('R2_BUCKET_NAME and R2_PUBLIC_URL must be set.');
  }

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

/** Deletes an object given its public URL (reverses the URL built above). */
async function deleteObjectByUrl(url) {
  const publicUrl = (process.env.R2_PUBLIC_URL || '').trim().replace(/\/$/, '');
  const bucket = (process.env.R2_BUCKET_NAME || '').trim();
  if (!publicUrl || !bucket || !url || !url.startsWith(publicUrl)) return;

  const key = url.slice(publicUrl.length + 1);
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = { putObject, deleteObjectByUrl };
