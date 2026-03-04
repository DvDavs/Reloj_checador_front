'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { cn } from '@/lib/utils';

interface AdItem {
  filename: string;
  active: boolean;
  isDefault: boolean;
}

export default function PublicidadManager() {
  const [images, setImages] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDefaultFile, setSelectedDefaultFile] = useState<File | null>(
    null
  );

  // Preview URLs
  const [defaultPreview, setDefaultPreview] = useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<AdItem[]>('/api/publicidad/admin');
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las imágenes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (defaultPreview) URL.revokeObjectURL(defaultPreview);
      if (galleryPreview) URL.revokeObjectURL(galleryPreview);
    };
  }, [defaultPreview, galleryPreview]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isDefault: boolean
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      if (isDefault) {
        if (defaultPreview) URL.revokeObjectURL(defaultPreview);
        setSelectedDefaultFile(file);
        setDefaultPreview(previewUrl);
      } else {
        if (galleryPreview) URL.revokeObjectURL(galleryPreview);
        setSelectedFile(file);
        setGalleryPreview(previewUrl);
      }
    }
  };

  const clearSelection = (isDefault: boolean) => {
    if (isDefault) {
      setSelectedDefaultFile(null);
      if (defaultPreview) URL.revokeObjectURL(defaultPreview);
      setDefaultPreview(null);
      const input = document.getElementById(
        'default-ad-file'
      ) as HTMLInputElement;
      if (input) input.value = '';
    } else {
      setSelectedFile(null);
      if (galleryPreview) URL.revokeObjectURL(galleryPreview);
      setGalleryPreview(null);
      const input = document.getElementById(
        'ad-file-input'
      ) as HTMLInputElement;
      if (input) input.value = '';
    }
  };

  const handleUpload = async (isDefault: boolean) => {
    const file = isDefault ? selectedDefaultFile : selectedFile;
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = isDefault
        ? '/api/publicidad/default'
        : '/api/publicidad';

      await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: 'Éxito',
        description: isDefault
          ? 'Imagen predeterminada actualizada.'
          : 'Imagen subida correctamente.',
      });

      clearSelection(isDefault);
      fetchImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const msg = error.response?.data?.error || 'Error al subir la imagen.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) return;

    try {
      await apiClient.delete(`/api/publicidad/${filename}`);
      toast({
        title: 'Éxito',
        description: 'Imagen eliminada correctamente.',
      });
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      const msg =
        (error as any).response?.data?.error ||
        'No se pudo eliminar la imagen.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const handleToggle = async (filename: string) => {
    try {
      await apiClient.put(`/api/publicidad/${filename}/toggle`);
      toast({
        title: 'Éxito',
        description: 'Estado actualizado.',
      });
      fetchImages();
    } catch (error) {
      console.error('Error toggling image:', error);
      const msg =
        (error as any).response?.data?.error ||
        'No se pudo actualizar el estado.';
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const getImageUrl = (filename: string) => {
    return `${apiClient.defaults.baseURL}/api/publicidad/files/${filename}`;
  };

  const defaultAd = images.find((img) => img.isDefault);
  const galleryAds = images.filter((img) => !img.isDefault);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-20 space-y-4'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
        <p className='text-muted-foreground animate-pulse'>
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-10 max-w-6xl mx-auto'>
      {/* Sección Imagen Predeterminada */}
      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h3 className='text-xl font-bold tracking-tight'>
              Imagen Predeterminada
            </h3>
            <span className='px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full'>
              Base del Sistema
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          {/* Card de Visualización/Edición */}
          <div className='lg:col-span-12'>
            <EnhancedCard
              variant='bordered'
              padding='none'
              className='overflow-hidden group border-2'
            >
              <div className='flex flex-col md:flex-row'>
                {/* Lado de Imagen */}
                <div className='relative w-full md:w-[450px] aspect-video bg-muted shrink-0'>
                  {defaultPreview ? (
                    <>
                      <Image
                        src={defaultPreview}
                        alt='Preview'
                        fill
                        className='object-cover'
                      />
                      <div className='absolute inset-0 bg-primary/10 flex items-center justify-center'>
                        <span className='bg-primary text-primary-foreground text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/20 uppercase tracking-widest animate-in zoom-in-75'>
                          Previsualización
                        </span>
                      </div>
                      <button
                        onClick={() => clearSelection(true)}
                        className='absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors backdrop-blur-sm'
                        title='Cancelar cambio'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </>
                  ) : defaultAd ? (
                    <>
                      <Image
                        src={getImageUrl(defaultAd.filename)}
                        alt='Publicidad Predeterminada'
                        fill
                        className='object-cover transition-transform duration-500 group-hover:scale-105'
                        unoptimized
                      />
                      <div className='absolute top-3 right-3'>
                        <div className='bg-green-600/90 backdrop-blur-md text-white px-3 py-1 rounded-md text-[10px] font-black shadow-xl border border-white/20 uppercase tracking-[0.1em]'>
                          ACTIVA
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className='w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground'>
                      <ImageIcon className='h-12 w-12 opacity-20' />
                      <p className='text-sm font-medium'>
                        No hay imagen activa
                      </p>
                    </div>
                  )}
                </div>

                {/* Lado de Controles e Info */}
                <div className='flex-1 p-6 flex flex-col justify-between bg-card'>
                  <div className='space-y-6'>
                    <div className='space-y-2'>
                      <Label className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        {defaultPreview
                          ? 'NUEVA IMAGEN SELECCIONADA'
                          : 'ESTADO ACTUAL'}
                      </Label>
                      <div className='p-4 rounded-xl bg-muted/50 border border-border/50'>
                        <div className='flex items-start gap-3'>
                          <div className='mt-0.5 p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30'>
                            <AlertCircle className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                          </div>
                          <p className='text-sm leading-relaxed text-muted-foreground'>
                            Esta imagen es el{' '}
                            <strong>respaldo de seguridad</strong>. Se mostrará
                            automáticamente si no hay otros anuncios activos
                            para evitar que la pantalla quede en blanco.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <Label
                          htmlFor='default-ad-file'
                          className='text-sm font-semibold'
                        >
                          Actualizar Imagen Predeterminada
                        </Label>
                        <div className='flex gap-2'>
                          <div className='relative flex-1'>
                            <Input
                              id='default-ad-file'
                              type='file'
                              accept='image/*'
                              onChange={(e) => handleFileChange(e, true)}
                              disabled={uploading}
                              className='pr-10 cursor-pointer h-11'
                            />
                            <Upload className='absolute right-3 top-3 h-5 w-5 text-muted-foreground pointer-events-none' />
                          </div>
                          <Button
                            onClick={() => handleUpload(true)}
                            disabled={!selectedDefaultFile || uploading}
                            className='h-11 px-6 font-bold uppercase tracking-wider shadow-lg'
                          >
                            {uploading ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              'Aplicar'
                            )}
                          </Button>
                        </div>
                        <p className='text-[10px] text-muted-foreground italic px-1 text-right'>
                          Sugerencia: 1920x1080 (HD) para mejores resultados.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </EnhancedCard>
          </div>
        </div>
      </section>

      <div className='relative py-4'>
        <div className='absolute inset-0 flex items-center' aria-hidden='true'>
          <div className='w-full border-t border-border'></div>
        </div>
        <div className='relative flex justify-center text-xs uppercase tracking-widest'>
          <span className='bg-background px-4 text-muted-foreground font-bold'>
            Biblioteca de Contenido
          </span>
        </div>
      </div>

      {/* Galería Section */}
      <section className='space-y-6'>
        <div className='flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6'>
          <div className='space-y-1'>
            <h3 className='text-xl font-bold tracking-tight'>
              Galería de Rotación
            </h3>
            <p className='text-sm text-muted-foreground'>
              Gestione las imágenes que participan en el carrusel dinámico.
            </p>
          </div>

          <EnhancedCard
            variant='subtle'
            padding='sm'
            className='w-full lg:w-auto min-w-[350px] border-dashed bg-muted/20'
          >
            <div className='flex gap-2 items-end'>
              <div className='grid flex-1 gap-1.5'>
                <Label
                  htmlFor='ad-file-input'
                  className='text-[10px] font-bold uppercase px-1'
                >
                  {galleryPreview ? 'LISTO PARA AÑADIR' : 'Añadir nueva imagen'}
                </Label>
                <div className='relative'>
                  <Input
                    id='ad-file-input'
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileChange(e, false)}
                    disabled={uploading}
                    className='h-10 cursor-pointer bg-background'
                  />
                  {galleryPreview && (
                    <div className='absolute right-2 top-2 h-6 w-6 rounded border bg-background overflow-hidden shadow-sm'>
                      <Image
                        src={galleryPreview}
                        alt='preview'
                        fill
                        className='object-cover'
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className='flex gap-1'>
                {galleryPreview && (
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => clearSelection(false)}
                    className='h-10 w-10 shrink-0'
                    title='Limpiar selección'
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
                <Button
                  onClick={() => handleUpload(false)}
                  disabled={!selectedFile || uploading}
                  className='h-10 gap-2 font-bold px-4'
                >
                  {uploading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <Upload className='h-4 w-4' />
                      Subir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </EnhancedCard>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {galleryAds.length === 0 ? (
            <div className='col-span-full h-48 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/20 space-y-3'>
              <ImageIcon className='h-12 w-12 opacity-10' />
              <div className='text-center'>
                <p className='font-semibold'>La galería está vacía</p>
                <p className='text-sm opacity-60'>
                  Comienza subiendo algunas imágenes arriba.
                </p>
              </div>
            </div>
          ) : (
            galleryAds.map((item) => (
              <EnhancedCard
                key={item.filename}
                variant='bordered'
                padding='none'
                hover
                className={cn(
                  'overflow-hidden group transition-all duration-300',
                  !item.active && 'opacity-60 grayscale-[0.5] scale-[0.98]'
                )}
              >
                <div className='relative aspect-video w-full bg-slate-100 dark:bg-slate-900'>
                  <Image
                    src={getImageUrl(item.filename)}
                    alt='Publicidad'
                    fill
                    className='object-cover transition-transform duration-700 group-hover:scale-110'
                    unoptimized
                  />

                  {/* Status Overlay */}
                  {!item.active ? (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-all group-hover:bg-black/30'>
                      <div className='bg-black/80 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-white/20 shadow-2xl scale-90 group-hover:scale-100 transition-transform'>
                        Oculta
                      </div>
                    </div>
                  ) : (
                    <div className='absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity'>
                      <div className='bg-green-500/90 backdrop-blur text-white p-1 rounded-full shadow-lg'>
                        <CheckCircle2 className='h-4 w-4' />
                      </div>
                    </div>
                  )}

                  {/* Actions Bar (Overlay on hover) */}
                  <div className='absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 via-black/40 to-transparent'>
                    <div className='flex gap-2 justify-end'>
                      <Button
                        variant={item.active ? 'secondary' : 'default'}
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(item.filename);
                        }}
                        className='h-8 font-bold'
                      >
                        {item.active ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant='destructive'
                        size='icon'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.filename);
                        }}
                        className='h-8 w-8 shadow-lg'
                        title='Eliminar para siempre'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardContent className='p-4 bg-card border-t'>
                  <div className='flex items-center justify-between gap-2 uppercase tracking-tighter'>
                    <span
                      className='text-[11px] font-black truncate text-muted-foreground'
                      title={item.filename}
                    >
                      {item.filename}
                    </span>
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full shrink-0 animate-pulse',
                        item.active ? 'bg-green-500' : 'bg-red-500'
                      )}
                    />
                  </div>
                </CardContent>
              </EnhancedCard>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
