import { API_BASE_URL } from '../config';

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/api/assets/')) return `${API_BASE_URL}${path}`;
  return path;
}
