import { API_BASE_URL } from '../api/apiClient';

/**
 * Resolves a media or document URL by handling:
 * 1. Relative paths starting with '/' (prepends backend base URL).
 * 2. Hardcoded localhost/127.0.0.1 hosts (replaces with active backend host for physical devices/emulators).
 * 3. Cloudinary raw resource uploads (replaces '/raw/upload/' with '/image/upload/' so they render as images).
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // 1. Get backend host from API_BASE_URL (strip /v1)
  const apiBase = API_BASE_URL;
  const backendBase = apiBase.endsWith('/v1') ? apiBase.slice(0, -3) : apiBase;

  // 2. If it's a relative path starting with /
  if (url.startsWith('/')) {
    return `${backendBase}${url}`;
  }

  // 3. If it contains localhost:8000 or 127.0.0.1:8000, replace with backendBase host
  if (url.includes('localhost:8000') || url.includes('127.0.0.1:8000')) {
    const backendHost = backendBase.replace(/^https?:\/\//, '');
    return url.replace(/localhost:8000/g, backendHost).replace(/127\.0\.0\.1:8000/g, backendHost);
  }

  // 4. If it's a Cloudinary raw upload, replace /raw/upload/ with /image/upload/ to serve with proper MIME headers
  if (url.includes('res.cloudinary.com') && url.includes('/raw/upload/')) {
    return url.replace(/\/raw\/upload\//g, '/image/upload/');
  }

  return url;
}
