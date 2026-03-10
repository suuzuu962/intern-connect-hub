import { supabase } from '@/integrations/supabase/client';

export type StorageBucket = 'public-assets' | 'private-documents' | 'resume-storage';

/**
 * Determines the correct bucket for a file type
 */
export function getBucketForFileType(fileType: 'logo' | 'cover' | 'avatar' | 'resume' | 'document' | 'college-id'): StorageBucket {
  switch (fileType) {
    case 'logo':
    case 'cover':
    case 'avatar':
      return 'public-assets';
    case 'resume':
      return 'resume-storage';
    case 'document':
    case 'college-id':
      return 'private-documents';
  }
}

/**
 * Upload a file to the appropriate bucket
 */
export async function uploadFile(
  file: File,
  userId: string,
  fileType: 'logo' | 'cover' | 'avatar' | 'resume' | 'document' | 'college-id',
  customFileName?: string
) {
  const bucket = getBucketForFileType(fileType);
  const ext = file.name.split('.').pop();
  const fileName = customFileName || `${userId}/${fileType}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  // For public buckets, return public URL
  if (bucket === 'public-assets') {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    return { url: publicUrl, path: fileName, bucket };
  }

  // For private buckets, return the path (use signed URLs when needed)
  return { url: null, path: fileName, bucket };
}

/**
 * Get a signed URL for a private file (valid for 1 hour)
 */
export async function getSignedUrl(bucket: StorageBucket, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Get public URL for a public bucket file
 */
export function getPublicUrl(bucket: 'public-assets', path: string) {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
}

/**
 * Extract storage path from a full Supabase storage URL
 * Handles both public URLs and signed URLs
 */
export function extractStoragePath(url: string): { bucket: string; path: string } | null {
  try {
    const urlObj = new URL(url);
    // Pattern: /storage/v1/object/public/bucket-name/path
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)/);
    if (match) {
      return { bucket: match[1], path: match[2] };
    }
    return null;
  } catch {
    return null;
  }
}
