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
 * Parse a storage URL with protocol prefix (resume://, private://)
 * Returns bucket and path, or null if it's a regular URL
 */
export function parseStorageUrl(url: string): { bucket: StorageBucket; path: string } | null {
  if (url.startsWith('resume://')) {
    return { bucket: 'resume-storage', path: url.replace('resume://', '') };
  }
  if (url.startsWith('private://')) {
    return { bucket: 'private-documents', path: url.replace('private://', '') };
  }
  return null;
}

/**
 * Resolve a storage URL to a viewable URL.
 * - Public URLs (https://) are returned as-is
 * - Private URLs (resume://, private://) are resolved to signed URLs
 */
export async function resolveStorageUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  
  const parsed = parseStorageUrl(url);
  if (!parsed) {
    // Regular URL (legacy public URL or external URL)
    return url;
  }
  
  try {
    return await getSignedUrl(parsed.bucket, parsed.path);
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    return null;
  }
}

/**
 * Check if a URL is a private storage URL
 */
export function isPrivateStorageUrl(url: string | null): boolean {
  if (!url) return false;
  return url.startsWith('resume://') || url.startsWith('private://');
}
