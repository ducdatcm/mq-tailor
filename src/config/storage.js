const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} = require('@aws-sdk/client-s3');

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

/**
 * Uploads a buffer to R2 under `key` and returns its public URL.
 * Photos are cached for a year (their URLs never change); pass `cacheControl`
 * for anything that should not be cached that long.
 */
async function putObject(key, buffer, contentType, cacheControl = 'public, max-age=31536000, immutable') {
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
      CacheControl: cacheControl,
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

function bucketName() {
  const bucket = (process.env.R2_BUCKET_NAME || '').trim();
  if (!bucket) throw new Error('R2_BUCKET_NAME must be set.');
  return bucket;
}

/** True when every R2 setting needed to read and write objects is present. */
function isConfigured() {
  return ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'].every((k) =>
    (process.env[k] || '').trim()
  );
}

/** Lists objects under a key prefix: [{ key, size, lastModified }], oldest first. */
async function listObjects(prefix) {
  const client = getClient();
  const found = [];
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: bucketName(), Prefix: prefix, ContinuationToken: token })
    );
    (out.Contents || []).forEach((o) => found.push({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return found.sort((a, b) => a.lastModified - b.lastModified);
}

/** Downloads an object as a Buffer. */
async function getObjectBuffer(key) {
  const client = getClient();
  const out = await client.send(new GetObjectCommand({ Bucket: bucketName(), Key: key }));
  return Buffer.from(await out.Body.transformToByteArray());
}

/** Deletes an object by its key. */
async function deleteObjectByKey(key) {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}

module.exports = { putObject, deleteObjectByUrl, isConfigured, listObjects, getObjectBuffer, deleteObjectByKey };
