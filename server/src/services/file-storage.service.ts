import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

const storageDriver = process.env.FILE_STORAGE_DRIVER || (process.env.AWS_S3_BUCKET ? 's3' : 'local');
const s3Bucket = process.env.AWS_S3_BUCKET;
const s3Region = process.env.AWS_REGION || 'ap-northeast-2';
const s3PublicBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;

const s3Client = new S3Client({ region: s3Region });

export function isS3StorageEnabled() {
  return storageDriver === 's3';
}

export function isAllowedImageType(mimetype: string) {
  return allowedImageTypes.has(mimetype);
}

export async function saveProfileImage(file: Express.Multer.File) {
  if (!isAllowedImageType(file.mimetype)) {
    throw new Error('Unsupported image type');
  }

  const extension = getExtension(file.originalname, file.mimetype);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;

  if (isS3StorageEnabled()) {
    if (!s3Bucket) {
      throw new Error('AWS_S3_BUCKET is required when FILE_STORAGE_DRIVER=s3');
    }

    const key = `profile-images/${filename}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    }));

    return buildS3PublicUrl(key);
  }

  const uploadsDir = path.join(__dirname, '../uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

function buildS3PublicUrl(key: string) {
  if (s3PublicBaseUrl) {
    return `${s3PublicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
}

function getExtension(originalname: string, mimetype: string) {
  const ext = path.extname(originalname).toLowerCase();
  if (ext) return ext;

  switch (mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return '';
  }
}
