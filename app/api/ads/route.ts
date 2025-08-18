import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

type MediaType = 'image' | 'video';

function getMediaTypeByExtension(filename: string): MediaType | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  const imageExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg']);
  const videoExts = new Set(['mp4', 'webm']);
  if (imageExts.has(ext)) return 'image';
  if (videoExts.has(ext)) return 'video';
  return null;
}

export async function GET() {
  try {
    const adsDir = join(process.cwd(), 'public', 'ads');
    const entries = await fs.readdir(adsDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => !!getMediaTypeByExtension(name))
      .sort((a, b) => a.localeCompare(b));

    const items = files.map((name) => ({
      type: getMediaTypeByExtension(name),
      src: `/ads/${name}`,
      alt: name,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    // Si la carpeta no existe o hay error, regresamos lista vacía
    return NextResponse.json({ items: [] });
  }
}
