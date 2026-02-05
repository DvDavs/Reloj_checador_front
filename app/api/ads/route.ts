import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic'; // Asegurar que no se cachee estáticamente

type MediaType = 'image' | 'video';

interface AdConfigItem {
  name: string;
  active: boolean;
  order?: number;
}

interface AdConfig {
  items: AdConfigItem[];
}

const ADS_DIR = join(process.cwd(), 'public', 'ads');
const CONFIG_FILE = join(ADS_DIR, 'config.json');

function getMediaTypeByExtension(filename: string): MediaType | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  const imageExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'svg']);
  const videoExts = new Set(['mp4', 'webm']);
  if (imageExts.has(ext)) return 'image';
  if (videoExts.has(ext)) return 'video';
  return null;
}

async function readConfig(): Promise<AdConfig> {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { items: [] };
  }
}

async function saveConfig(config: AdConfig) {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export async function GET() {
  try {
    // 1. Asegurar que existe el directorio
    try {
      await fs.access(ADS_DIR);
    } catch {
      await fs.mkdir(ADS_DIR, { recursive: true });
    }

    // 2. Leer archivos reales
    const entries = await fs.readdir(ADS_DIR, { withFileTypes: true });
    const realFiles = entries
      .filter(
        (e) => e.isFile() && e.name !== 'config.json' && e.name !== '.gitkeep'
      )
      .map((e) => e.name)
      .filter((name) => !!getMediaTypeByExtension(name));

    // 3. Leer configuración
    const config = await readConfig();

    // 4. Sincronizar:
    //    - Añadir archivos nuevos a la config (como activos por defecto)
    //    - Eliminar de la config archivos que ya no existen
    let configChanged = false;
    const currentConfigMap = new Map(config.items.map((i) => [i.name, i]));

    const mergedItems: AdConfigItem[] = [];

    // Procesar archivos reales
    for (const filename of realFiles) {
      if (currentConfigMap.has(filename)) {
        mergedItems.push(currentConfigMap.get(filename)!);
      } else {
        // Nuevo archivo encontrado
        mergedItems.push({ name: filename, active: true, order: 999 });
        configChanged = true;
      }
    }

    // Si la longitud cambió o hubo nuevos, guardamos
    if (configChanged || mergedItems.length !== config.items.length) {
      // Ordenar por 'order' o alfabéticamente si order es igual
      const sorted = mergedItems.sort((a, b) => {
        if ((a.order ?? 999) !== (b.order ?? 999))
          return (a.order ?? 999) - (b.order ?? 999);
        return a.name.localeCompare(b.name);
      });
      await saveConfig({ items: sorted });

      // Devolver respuesta construida
      const responseItems = sorted.map((item) => ({
        type: getMediaTypeByExtension(item.name),
        src: `/ads/${item.name}`,
        alt: item.name,
        active: item.active,
        id: item.name, // Usamos nombre como ID
      }));

      return NextResponse.json({ items: responseItems });
    }

    const responseItems = mergedItems
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map((item) => ({
        type: getMediaTypeByExtension(item.name),
        src: `/ads/${item.name}`,
        alt: item.name,
        active: item.active,
        id: item.name,
      }));

    return NextResponse.json({ items: responseItems });
  } catch (err) {
    console.error('Error reading ads:', err);
    return NextResponse.json({ items: [] });
  }
}

// POST: Subir archivo
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Sanitize filename simple
    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = join(ADS_DIR, filename);

    await fs.writeFile(filePath, buffer);

    // Actualizar config
    const config = await readConfig();
    if (!config.items.some((i) => i.name === filename)) {
      config.items.push({
        name: filename,
        active: true,
        order: config.items.length + 1,
      });
      await saveConfig(config);
    }

    return NextResponse.json({ success: true, filename });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

// DELETE: Borrar archivo
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename)
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });

    // Borrar archivo
    const filePath = join(ADS_DIR, filename);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignorar si no existe, limpiaremos config igual
    }

    // Actualizar config
    const config = await readConfig();
    config.items = config.items.filter((i) => i.name !== filename);
    await saveConfig(config);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

// PATCH: Actualizar estado (active/inactive)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { filename, active } = body;

    if (!filename || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const config = await readConfig();
    const item = config.items.find((i) => i.name === filename);
    if (item) {
      item.active = active;
      await saveConfig(config);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
