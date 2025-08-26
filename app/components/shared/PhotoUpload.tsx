'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Trash2 } from 'lucide-react';

type Props = {
  onFileSelected: (file: File | null) => void;
  maxSizeMb?: number;
  allowedTypes?: string[];
  disabled?: boolean;
  initialPreviewUrl?: string | null;
};

export default function PhotoUpload({
  onFileSelected,
  maxSizeMb = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  disabled,
  initialPreviewUrl,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const validate = useCallback(
    (f: File): string | null => {
      if (!allowedTypes.includes(f.type)) {
        return 'Tipo de archivo no permitido';
      }
      const maxBytes = maxSizeMb * 1024 * 1024;
      if (f.size > maxBytes) {
        return `El archivo excede ${maxSizeMb}MB`;
      }
      return null;
    },
    [allowedTypes, maxSizeMb]
  );

  const openPicker = useCallback(() => inputRef.current?.click(), []);

  const handleFiles = useCallback(
    (fList: FileList | null) => {
      if (!fList || fList.length === 0) return;
      const f = fList[0];
      const err = validate(f);
      if (err) {
        setError(err);
        return;
      }
      setError(null);
      setFile(f);
      // Crear URL para el preview del nuevo archivo
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      onFileSelected(f);
    },
    [onFileSelected, validate]
  );

  const onChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
    (e) => handleFiles(e.target.files),
    [handleFiles]
  );

  const onDrop = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    []
  );

  const onDragLeave = useCallback<React.DragEventHandler<HTMLDivElement>>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    []
  );

  const clear = useCallback(() => {
    // Liberar memoria de la URL del objeto si existe
    if (file && previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelected(null);
  }, [onFileSelected, file, previewUrl]);

  // Actualizar preview cuando cambia initialPreviewUrl o al montar el componente
  React.useEffect(() => {
    console.log(
      'PhotoUpload useEffect - initialPreviewUrl:',
      initialPreviewUrl,
      'file:',
      file
    );
    if (initialPreviewUrl && !file) {
      setPreviewUrl(initialPreviewUrl);
    }
  }, [initialPreviewUrl]); // Removemos file de las dependencias para evitar el error

  // Cleanup de URLs de objeto cuando el componente se desmonta
  React.useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  console.log(
    'PhotoUpload render - previewUrl:',
    previewUrl,
    'initialPreviewUrl:',
    initialPreviewUrl
  );

  return (
    <div className='space-y-3'>
      <Label className='text-sm font-medium text-foreground'>
        Foto del Empleado
      </Label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <div className='flex items-center gap-4'>
          <div className='w-20 h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center'>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt='preview'
                className='w-full h-full object-cover'
              />
            ) : (
              <ImageIcon className='w-8 h-8 text-muted-foreground' />
            )}
          </div>
          <div className='flex-1'>
            <p className='text-sm text-muted-foreground'>
              Arrastra y suelta una imagen aquí o
              <button
                type='button'
                onClick={openPicker}
                className='text-primary underline ml-1'
                disabled={disabled}
              >
                selecciona un archivo
              </button>
            </p>
            <p className='text-xs text-muted-foreground'>
              Tipos permitidos: JPG, PNG, GIF, WEBP. Máximo {maxSizeMb}MB.
            </p>
            <input
              ref={inputRef}
              type='file'
              accept={allowedTypes.join(',')}
              className='hidden'
              onChange={onChange}
            />
            {error && <p className='text-xs text-destructive mt-1'>{error}</p>}
          </div>
          {previewUrl && (
            <Button
              type='button'
              variant='ghost'
              onClick={clear}
              disabled={disabled}
            >
              <Trash2 className='w-4 h-4 mr-2' /> Quitar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
