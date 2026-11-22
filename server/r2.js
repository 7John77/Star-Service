import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export function createBucket(env) {
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return undefined
  const client = new S3Client({
    endpoint: 'https://' + R2_ACCOUNT_ID + '.r2.cloudflarestorage.com',
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  async function head(key) {
    try {
      const result = await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
      return { key, size: result.ContentLength, customMetadata: { jsonSize: result.Metadata?.jsonsize, quoteEmail: result.Metadata?.quoteemail } }
    } catch (error) {
      if (error.$metadata?.httpStatusCode === 404) return null
      throw error
    }
  }
  return {
    head,
    async get(key, { range } = {}) {
      try {
        const Range = range && 'bytes=' + range.offset + '-' + (range.length ? range.offset + range.length - 1 : '')
        const { Body } = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key, Range }))
        return Body && new Response(Body.transformToWebStream())
      } catch (error) {
        if (error.$metadata?.httpStatusCode === 404) return null
        throw error
      }
    },
    async put(key, value, options) {
      try {
        return await client.send(new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: key,
          Body: typeof value === 'string' ? value : new Uint8Array(value),
          IfNoneMatch: options?.onlyIf?.etagDoesNotMatch,
          Metadata: options?.customMetadata,
        }))
      } catch (error) {
        if (options?.onlyIf && error.$metadata?.httpStatusCode === 412) return null
        throw error
      }
    },
    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }))
    },
    async list({ prefix, limit, cursor }) {
      const result = await client.send(new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME, Prefix: prefix, MaxKeys: limit, ContinuationToken: cursor,
      }))
      const objects = await Promise.all((result.Contents ?? []).map(({ Key }) => head(Key)))
      return { objects: objects.filter(Boolean), truncated: result.IsTruncated, cursor: result.NextContinuationToken }
    },
  }
}
