'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import {
  Trash2,
  Upload,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Plus,
  GripVertical,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { cn } from '@/lib/utils';
import { PublicidadDeleteDialog } from './PublicidadDeleteDialog';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el diálogo de eliminación
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filenameToDelete, setFilenameToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para el arrastre 2D nativo
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Estado para error local de validación
  const [localError, setLocalError] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (file: File | null) => {
    setLocalError(null); // Limpiar error previo
    if (file) {
      // Validar tamaño del archivo (4MB)
      const MAX_SIZE = 4 * 1024 * 1024; // 4MB en bytes
      if (file.size > MAX_SIZE) {
        setLocalError(
          `La imagen "${file.name}" es demasiado grande (Máximo 4MB).`
        );
        toast({
          title: 'Archivo demasiado grande',
          description: `El archivo "${file.name}" supera el límite de 4MB.`,
          variant: 'destructive',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);

      // Lógica de FileReader sugerida por el usuario para mayor robustez
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setLocalError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiClient.post('/api/publicidad', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast({
        title: (
          <div className='flex items-center gap-2'>
            <div className='bg-green-100 dark:bg-green-900/30 p-1 rounded-full'>
              <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
            </div>
            <span className='font-bold text-slate-900 dark:text-slate-100'>
              ¡Subida exitosa!
            </span>
          </div>
        ) as any,
        description: (
          <p className='ml-7 text-xs text-slate-500 font-medium'>
            La imagen se ha añadido correctamente a la galería.
          </p>
        ) as any,
      });

      clearSelection();
      fetchImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);

      let errorMessage = 'Error al subir la imagen.';

      // Manejar errores específicos de tamaño de Axios/Servidor
      if (error.code === 'ERR_NETWORK') {
        errorMessage =
          'Error de red: El archivo podría ser demasiado grande para el servidor.';
      } else if (error.response?.status === 413) {
        errorMessage = 'La imagen es demasiado pesada para el servidor.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: 'Error de subida',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (filename: string) => {
    setFilenameToDelete(filename);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!filenameToDelete) return;

    // Guardar estado previo por si falla la API
    const previousImages = [...images];

    try {
      setIsDeleting(true);
      // Optimistic Update: eliminar localmente primero
      setImages(images.filter((img) => img.filename !== filenameToDelete));

      await apiClient.delete(`/api/publicidad/${filenameToDelete}`);
      toast({
        title: 'Éxito',
        description: 'Imagen eliminada correctamente.',
      });
      setIsDeleteDialogOpen(false);
      setFilenameToDelete(null);
    } catch (error) {
      console.error('Error deleting image:', error);
      // Revertir en caso de error
      setImages(previousImages);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggle = async (filename: string) => {
    // No permitir desactivar la predeterminada (primera)
    if (images[0]?.filename === filename) {
      toast({
        title: 'Acción no permitida',
        description: 'La imagen predeterminada no se puede desactivar.',
        variant: 'destructive',
      });
      return;
    }

    // Guardar estado previo por si falla la API
    const previousImages = [...images];

    try {
      // Optimistic Update: toggle localmente
      setImages(
        images.map((img) =>
          img.filename === filename ? { ...img, active: !img.active } : img
        )
      );

      await apiClient.put(`/api/publicidad/${filename}/toggle`);
      toast({
        title: (
          <div className='flex items-center gap-2'>
            <div className='bg-green-100 dark:bg-green-900/30 p-1 rounded-full'>
              <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
            </div>
            <span className='font-bold text-slate-900 dark:text-slate-100'>
              Estado actualizado
            </span>
          </div>
        ) as any,
        description: (
          <p className='ml-7 text-xs text-slate-500 font-medium'>
            La visibilidad del anuncio se ha modificado.
          </p>
        ) as any,
      });
    } catch (error) {
      console.error('Error toggling image:', error);
      // Revertir en caso de error
      setImages(previousImages);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Asegurar que el arrastre sea detectado por todos los navegadores
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';

    // Crear una imagen de arrastre transparente o personalizada si fuera necesario
    // Por ahora el efecto de 'layout' de framer motion hará el trabajo visual
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;

    // Reordenar localmente de forma instantánea para el feedback visual (layout)
    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    setImages(newImages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    handleSaveOrder(); // Persistir al soltar
  };

  const handleReorder = (newOrder: AdItem[]) => {
    setImages(newOrder);
  };

  const handleSaveOrder = async () => {
    // Al finalizar el arrastre (o soltar), aplicamos la lógica de default y guardamos
    const updatedOrder = images.map((item, index) => ({
      ...item,
      isDefault: index === 0,
      active: index === 0 ? true : item.active,
    }));

    setImages(updatedOrder);

    try {
      await apiClient.put(
        '/api/publicidad/reorder',
        updatedOrder.map((img) => img.filename)
      );
      toast({
        title: (
          <div className='flex items-center gap-2'>
            <div className='bg-green-100 dark:bg-green-900/30 p-1 rounded-full'>
              <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
            </div>
            <span className='font-bold text-slate-900 dark:text-slate-100'>
              Orden actualizado
            </span>
          </div>
        ) as any,
        description: (
          <p className='ml-7 text-xs text-slate-500 font-medium'>
            La galería se ha reorganizado y guardado con éxito.
          </p>
        ) as any,
      });
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el orden en el servidor.',
        variant: 'destructive',
      });
      fetchImages(); // Revertir
    }
  };

  const getImageUrl = (filename: string) => {
    return `${apiClient.defaults.baseURL}/api/publicidad/files/${filename}`;
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-20 space-y-4'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
        <p className='text-muted-foreground animate-pulse font-medium'>
          Cargando configuración...
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8 animate-in fade-in duration-500'>
      {/* Zona de Carga / Límite Estilo Screenshot */}
      <div className='space-y-4'>
        {images.length < 6 ? (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              'relative border-2 border-dashed rounded-xl transition-all duration-300 group',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-slate-200 hover:border-primary/50 bg-slate-50/50',
              previewUrl ? 'p-4' : 'p-10'
            )}
          >
            <input
              type='file'
              ref={fileInputRef}
              onChange={onFileSelect}
              accept='image/jpeg,image/png,image/gif,image/webp'
              className='hidden'
              id='ad-upload'
            />

            {previewUrl ? (
              <div className='flex flex-col md:flex-row items-center gap-6'>
                <div className='relative w-32 aspect-[9/16] rounded-lg overflow-hidden shadow-md border border-white/20 bg-black flex items-center justify-center'>
                  {/* Fondo Blur */}
                  <img
                    src={previewUrl}
                    alt=''
                    className='absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-50'
                    draggable={false}
                  />
                  {/* Imagen Principal */}
                  <img
                    src={previewUrl}
                    alt='Preview'
                    className='relative z-10 max-w-full max-h-full w-auto h-auto object-contain'
                  />
                </div>
                <div className='flex-1 space-y-1 text-center md:text-left'>
                  <p className='font-bold text-slate-800 tracking-tight'>
                    Nueva imagen lista para subir
                  </p>
                  <p className='text-xs text-slate-500 uppercase tracking-widest font-black'>
                    {selectedFile?.name}
                  </p>
                </div>
              </div>
            ) : (
              <label
                htmlFor='ad-upload'
                className='flex flex-col items-center justify-center cursor-pointer gap-4'
              >
                <div className='p-4 bg-slate-200/50 rounded-xl group-hover:scale-110 transition-transform duration-300'>
                  <ImageIcon className='h-10 w-10 text-slate-500 group-hover:text-primary transition-colors' />
                </div>
                <div className='text-center space-y-1'>
                  <p className='text-lg font-medium text-slate-600'>
                    Arrastra y suelta una imagen aquí o{' '}
                    <span className='text-green-600 font-bold hover:underline'>
                      selecciona un archivo
                    </span>
                  </p>
                  <p className='text-sm text-slate-400'>
                    Tipos permitidos: JPG, PNG, GIF, WEBP. Máximo 4MB.
                  </p>
                  <AnimatePresence>
                    {localError && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className='text-sm font-bold text-red-500 mt-2'
                      >
                        {localError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </label>
            )}
          </div>
        ) : (
          <div className='p-8 border-2 border-dashed border-red-200 bg-red-50/30 rounded-xl flex flex-col items-center justify-center gap-2 text-red-500'>
            <X className='h-10 w-10 opacity-20' />
            <p className='font-bold uppercase tracking-widest text-xs'>
              Límite de imágenes alcanzado
            </p>
            <p className='text-sm text-red-400'>
              Elimina alguna imagen para poder subir una nueva.
            </p>
          </div>
        )}

        {/* Botones de Acción - Regresados a la posición inferior */}
        <div className='flex justify-between items-center gap-3'>
          <div className='flex flex-col'>
            <p
              className={cn(
                'text-[10px] font-black uppercase tracking-widest',
                images.length >= 6 ? 'text-red-500' : 'text-slate-400'
              )}
            >
              {images.length} / 6 Imágenes en galería
            </p>
          </div>
          <div className='flex gap-3'>
            <Button
              variant='outline'
              onClick={clearSelection}
              disabled={!selectedFile || uploading}
              className='rounded-md border-slate-200 px-6 font-medium text-slate-600 hover:bg-slate-50 h-10'
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || images.length >= 6}
              className='rounded-md bg-green-600 hover:bg-green-700 text-white px-6 font-bold flex items-center gap-2 h-10'
            >
              {uploading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4' />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 relative'>
        <AnimatePresence mode='popLayout'>
          {images.length === 0 ? (
            <div className='col-span-full py-16 flex flex-col items-center justify-center opacity-40 bg-slate-50/50 rounded-2xl border-2 border-dashed'>
              <ImageIcon className='h-16 w-16 mb-4 text-slate-300' />
              <p className='text-slate-500 font-medium'>
                No hay anuncios configurados
              </p>
            </div>
          ) : (
            images.map((item, index) => (
              <motion.div
                layout
                key={item.filename}
                draggable
                onDragStart={(e: any) => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e: any) => e.preventDefault()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: draggedIndex === index ? 0.3 : 1,
                  scale: 1,
                  zIndex: draggedIndex === index ? 50 : 1,
                }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                whileHover={{ scale: 1.02 }}
                transition={{
                  type: 'spring',
                  stiffness: 350,
                  damping: 25,
                  layout: { duration: 0.3 },
                }}
                className={cn(
                  'group/item relative rounded-xl overflow-hidden border cursor-grab active:cursor-grabbing select-none hover:shadow-md transition-shadow bg-zinc-950',
                  index === 0
                    ? 'border-blue-600 border-[6px] ring-8 ring-blue-600/10 shadow-[0_0_40px_rgba(37,99,235,0.4)] shadow-blue-600/20'
                    : item.active
                      ? 'border-primary/50 shadow-sm'
                      : 'border-slate-800'
                )}
              >
                {/* Imagen */}
                <div className='relative aspect-[9/16] w-full bg-black flex items-center justify-center overflow-hidden'>
                  {/* Fondo Blur */}
                  <Image
                    src={getImageUrl(item.filename)}
                    alt=''
                    fill
                    className='object-cover scale-110 blur-xl opacity-50 pointer-events-none'
                    unoptimized
                  />
                  {/* Imagen Principal */}
                  <Image
                    src={getImageUrl(item.filename)}
                    alt='Anuncio'
                    fill
                    className={cn(
                      'object-contain relative z-10 pointer-events-none transition-all duration-300',
                      !item.active && 'opacity-30 grayscale-[0.8]'
                    )}
                    unoptimized
                  />
                </div>

                {/* Notch Predeterminado - Estilo iPhone Realista Integrado */}
                {index === 0 && (
                  <div className='absolute top-0 inset-x-0 flex justify-center z-50 pointer-events-none'>
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className='bg-black w-32 h-6 rounded-b-[1.25rem] relative flex items-center justify-between px-3 shadow-2xl'
                    >
                      {/* Lado izquierdo: Cámara/Sensor */}
                      <div className='h-1.5 w-1.5 rounded-full bg-zinc-900 border border-blue-900/40' />

                      {/* Centro: Texto Predeterminado */}
                      <span className='text-[7px] font-black text-blue-500/90 uppercase tracking-[0.2em]'>
                        Predeterminado
                      </span>

                      {/* Lado derecho: Auricular/Altavoz */}
                      <div className='w-6 h-1 bg-zinc-800 rounded-full opacity-40' />
                    </motion.div>
                  </div>
                )}

                <div className='absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-auto z-30'>
                  {/* Acciones Rápidas (Solo al pasar el ratón) */}
                  <div className='flex flex-col gap-2 opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-4 group-hover/item:translate-x-0'>
                    {index !== 0 && (
                      <>
                        <Button
                          size='icon'
                          variant='secondary'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(item.filename);
                          }}
                          className={cn(
                            'h-8 w-8 rounded-full shadow-lg border-2 border-white backdrop-blur-md transition-all',
                            item.active
                              ? 'bg-white text-slate-900 hover:bg-slate-100'
                              : 'bg-slate-800 text-white hover:bg-slate-700'
                          )}
                          title={item.active ? 'Desactivar' : 'Activar'}
                        >
                          {item.active ? (
                            <Eye className='h-4 w-4' />
                          ) : (
                            <EyeOff className='h-4 w-4' />
                          )}
                        </Button>
                        <Button
                          size='icon'
                          variant='destructive'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item.filename);
                          }}
                          className='h-8 w-8 rounded-full shadow-lg border-2 border-white'
                          title='Eliminar'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Drag Handle Icon */}
                <div className='absolute bottom-3 right-3 p-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-white opacity-40 group-hover/item:opacity-100 transition-opacity z-20'>
                  <GripVertical className='h-3 w-3 text-slate-600' />
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Diálogo de Confirmación Personalizado */}
      <PublicidadDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        filename={filenameToDelete || undefined}
      />
    </div>
  );
}
