'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';

export default function PublicidadManager() {
  interface AdItem {
    filename: string;
    active: boolean;
    isDefault: boolean;
  }

  const [images, setImages] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDefaultFile, setSelectedDefaultFile] = useState<File | null>(
    null
  );

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

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    isDefault: boolean
  ) => {
    if (e.target.files && e.target.files[0]) {
      if (isDefault) {
        setSelectedDefaultFile(e.target.files[0]);
      } else {
        setSelectedFile(e.target.files[0]);
      }
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

      if (isDefault) {
        setSelectedDefaultFile(null);
        const fileInput = document.getElementById(
          'default-ad-file'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setSelectedFile(null);
        const fileInput = document.getElementById(
          'ad-file-input'
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }

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
      <div className='flex justify-center py-10'>
        <Loader2 className='h-8 w-8 animate-spin text-gray-500' />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Default Ad Section */}
      <section>
        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
          Imagen Predeterminada
          <span className='text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200'>
            Siempre visible
          </span>
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {defaultAd ? (
            <Card className='overflow-hidden border-2 border-green-500/20 shadow-md'>
              <div className='relative aspect-video w-full bg-gray-100'>
                <Image
                  src={getImageUrl(defaultAd.filename)}
                  alt='Publicidad Predeterminada'
                  fill
                  className='object-cover'
                  unoptimized
                />
                <div className='absolute top-2 right-2'>
                  <span className='bg-green-600 text-white px-2 py-1 rounded text-xs font-bold shadow-sm'>
                    PREDETERMINADA
                  </span>
                </div>
              </div>
              <CardContent className='p-4 bg-green-50/30'>
                <div className='flex flex-col gap-3'>
                  <div className='flex justify-between items-center'>
                    <span
                      className='text-sm font-medium truncate'
                      title={defaultAd.filename}
                    >
                      {defaultAd.filename}
                    </span>
                  </div>
                  <div className='flex items-end gap-2'>
                    <div className='grid w-full items-center gap-1.5'>
                      <Label htmlFor='default-ad-file' className='text-xs'>
                        Reemplazar imagen
                      </Label>
                      <Input
                        id='default-ad-file'
                        type='file'
                        accept='image/*'
                        onChange={(e) => handleFileChange(e, true)}
                        disabled={uploading}
                        className='h-8 text-xs'
                      />
                    </div>
                    <Button
                      size='sm'
                      onClick={() => handleUpload(true)}
                      disabled={!selectedDefaultFile || uploading}
                    >
                      {uploading ? (
                        <Loader2 className='h-3 w-3 animate-spin' />
                      ) : (
                        <Upload className='h-3 w-3' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className='border-2 border-dashed border-gray-300 bg-gray-50'>
              <CardContent className='h-full flex flex-col items-center justify-center p-6 text-center space-y-4'>
                <div className='p-3 bg-gray-100 rounded-full'>
                  <ImageIcon className='h-8 w-8 text-gray-400' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-900'>
                    Sin imagen predeterminada
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Sube una imagen para establecerla como default.
                  </p>
                </div>
                <div className='flex items-end gap-2 w-full max-w-xs'>
                  <Input
                    id='default-ad-file'
                    type='file'
                    accept='image/*'
                    onChange={(e) => handleFileChange(e, true)}
                    disabled={uploading}
                    className='text-xs'
                  />
                  <Button
                    size='sm'
                    onClick={() => handleUpload(true)}
                    disabled={!selectedDefaultFile || uploading}
                  >
                    Subir
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <div className='col-span-1 md:col-span-1 lg:col-span-2 flex items-center justify-center p-6 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-sm'>
            <p>
              La <strong>Imagen Predeterminada</strong> siempre se mostrará en
              el carrusel y no puede ser desactivada ni eliminada directamente,
              solo reemplazada. Esto asegura que el carrusel nunca esté vacío.
            </p>
          </div>
        </div>
      </section>

      <hr className='border-gray-200' />

      {/* Gallery Section */}
      <section>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4'>
          <div>
            <h3 className='text-lg font-semibold'>Galería de Anuncios</h3>
            <p className='text-sm text-gray-500'>
              Imágenes adicionales que rotarán en el carrusel.
            </p>
          </div>

          <div className='flex items-end gap-2 w-full md:w-auto'>
            <div className='grid w-full max-w-xs items-center gap-1.5'>
              <Label htmlFor='ad-file-input' className='sr-only'>
                Imagen
              </Label>
              <Input
                id='ad-file-input'
                type='file'
                accept='image/*'
                onChange={(e) => handleFileChange(e, false)}
                disabled={uploading}
              />
            </div>
            <Button
              onClick={() => handleUpload(false)}
              disabled={!selectedFile || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Subir
                </>
              ) : (
                <>
                  <Upload className='mr-2 h-4 w-4' />
                  Subir
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {galleryAds.length === 0 ? (
            <div className='col-span-full text-center py-10 text-gray-500 border-2 border-dashed rounded-lg bg-gray-50/50'>
              <ImageIcon className='mx-auto h-10 w-10 mb-2 opacity-50' />
              <p>No hay imágenes adicionales.</p>
            </div>
          ) : (
            galleryAds.map((item) => (
              <Card
                key={item.filename}
                className={`overflow-hidden ${!item.active ? 'opacity-60 grayscale' : ''}`}
              >
                <div className='relative aspect-video w-full bg-gray-100'>
                  <Image
                    src={getImageUrl(item.filename)}
                    alt='Publicidad'
                    fill
                    className='object-cover'
                    unoptimized
                  />
                  {!item.active && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                      <span className='bg-black/70 text-white px-2 py-1 rounded text-sm font-medium'>
                        Inactiva
                      </span>
                    </div>
                  )}
                </div>
                <CardContent className='p-4 flex justify-between items-center bg-white'>
                  <span
                    className='text-sm truncate max-w-[120px] font-medium'
                    title={item.filename}
                  >
                    {item.filename}
                  </span>
                  <div className='flex gap-2'>
                    <Button
                      variant={item.active ? 'secondary' : 'default'}
                      size='sm'
                      onClick={() => handleToggle(item.filename)}
                      title={item.active ? 'Desactivar' : 'Activar'}
                    >
                      {item.active ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDelete(item.filename)}
                      title='Eliminar'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
