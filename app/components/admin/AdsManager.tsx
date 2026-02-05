'use client';

import React, { useEffect, useState } from 'react';
import { Upload, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface AdItem {
  id: string;
  type: 'image' | 'video';
  src: string;
  alt: string;
  active: boolean;
}

export default function AdsManager() {
  const [items, setItems] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadAds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ads', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los anuncios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch('/api/ads', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      toast({
        title: 'Éxito',
        description: 'Anuncio subido correctamente.',
      });
      loadAds();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al subir el archivo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;

    try {
      const res = await fetch(
        `/api/ads?filename=${encodeURIComponent(filename)}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Delete failed');

      toast({ title: 'Anuncio eliminado' });
      loadAds();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el anuncio.',
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (filename: string, currentState: boolean) => {
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.id === filename ? { ...item, active: !currentState } : item
        )
      );

      const res = await fetch('/api/ads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, active: !currentState }),
      });

      if (!res.ok) {
        // Revert on failure
        setItems((prev) =>
          prev.map((item) =>
            item.id === filename ? { ...item, active: currentState } : item
          )
        );
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h2 className='text-2xl font-bold tracking-tight'>
          Gestión de Anuncios
        </h2>
        <div className='relative'>
          <input
            type='file'
            accept='image/*,video/mp4,video/webm'
            onChange={handleUpload}
            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
            disabled={uploading}
          />
          <Button disabled={uploading}>
            {uploading ? (
              <Loader2 className='animate-spin mr-2 h-4 w-4' />
            ) : (
              <Upload className='mr-2 h-4 w-4' />
            )}
            {uploading ? 'Subiendo...' : 'Subir Anuncio'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center p-12'>
          <Loader2 className='animate-spin h-8 w-8 text-primary' />
        </div>
      ) : items.length === 0 ? (
        <div className='text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground'>
          No hay anuncios. Sube uno para comenzar.
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {items.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all ${!item.active ? 'opacity-60 grayscale' : ''}`}
            >
              <div className='aspect-video bg-black relative'>
                {item.type === 'video' ? (
                  <video
                    src={item.src}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <img
                    src={item.src}
                    alt={item.alt}
                    className='w-full h-full object-cover'
                  />
                )}
                <div className='absolute top-2 right-2 flex gap-2'>
                  {/* Status Badge */}
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold ${item.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}
                  >
                    {item.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
              <CardContent className='p-4 flex items-center justify-between'>
                <div
                  className='truncate text-sm font-medium flex-1 mr-4'
                  title={item.alt}
                >
                  {item.alt}
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleToggle(item.id, item.active)}
                    title={item.active ? 'Desactivar' : 'Activar'}
                  >
                    {item.active ? (
                      <Eye className='h-4 w-4' />
                    ) : (
                      <EyeOff className='h-4 w-4' />
                    )}
                  </Button>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive'
                    onClick={() => handleDelete(item.id)}
                    title='Eliminar'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
