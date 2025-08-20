'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  getClavesEstatus,
  corregirEstatusRegistros,
} from '@/lib/api/registros-detalle.api';
import { getApiErrorMessage } from '@/lib/api/api-helpers';

interface CorreccionRegistrosModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedIds: number[];
}

export function CorreccionRegistrosModal({
  open,
  onClose,
  onSuccess,
  selectedIds,
}: CorreccionRegistrosModalProps) {
  const [nuevoEstatus, setNuevoEstatus] = useState('');
  const [motivo, setMotivo] = useState('');
  const [claves, setClaves] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const fetchClaves = async () => {
        try {
          const data = await getClavesEstatus();
          setClaves(data);
        } catch (err) {
          setError(getApiErrorMessage(err));
        }
      };
      fetchClaves();
    } else {
      // Reset state on close
      setNuevoEstatus('');
      setMotivo('');
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!nuevoEstatus || !motivo.trim()) {
      setError('Debe seleccionar un nuevo estatus y proporcionar un motivo.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await corregirEstatusRegistros({
        registroIds: selectedIds,
        nuevoEstatusClave: nuevoEstatus,
        motivo,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corregir Estatus de Registros</DialogTitle>
          <DialogDescription>
            Se aplicará el nuevo estatus a los {selectedIds.length} registros
            seleccionados.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className='space-y-2'>
            <Label htmlFor='nuevo-estatus'>Nuevo Estatus</Label>
            <Select
              value={nuevoEstatus}
              onValueChange={setNuevoEstatus}
              disabled={loading}
            >
              <SelectTrigger id='nuevo-estatus'>
                <SelectValue placeholder='Seleccione un estatus...' />
              </SelectTrigger>
              <SelectContent>
                {claves.map((clave) => (
                  <SelectItem key={clave} value={clave}>
                    {clave}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='motivo'>Motivo (minimo 10 caracteres)</Label>
            <Textarea
              id='motivo'
              placeholder='Describa la razón de la corrección...'
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !nuevoEstatus || !motivo.trim()}
          >
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
