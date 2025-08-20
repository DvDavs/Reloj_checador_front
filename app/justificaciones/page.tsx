'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FileText, Users, User, Calendar } from 'lucide-react';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import { JustificacionForm } from '@/components/admin/JustificacionForm';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';
import { DataTable } from '@/app/components/shared/data-table';
import {
  listJustificaciones,
  type JustificacionItem,
} from '@/lib/api/justificaciones.api';
import { Badge } from '@/components/ui/badge';

export default function JustificacionesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<JustificacionItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listJustificaciones();
        setRows(data);
        setTotalPages(1);
      } catch (e: any) {
        setError(e?.message || 'Error al cargar justificaciones');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const sortedRows = useMemo(() => {
    if (!sortField) return rows;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const va = a[sortField!];
      const vb = b[sortField!];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDirection === 'asc' ? -1 : 1;
      if (vb == null) return sortDirection === 'asc' ? 1 : -1;
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortField, sortDirection]);

  const columns = useMemo(
    () => [
      {
        key: 'empleadoNombre',
        label: 'Empleado',
        sortable: true,
        render: (j: JustificacionItem) =>
          j.empleadoNombre || (j.esMasiva ? 'Todos' : '—'),
      },
      {
        key: 'tipoJustificacionNombre',
        label: 'Tipo',
        sortable: true,
        render: (j: JustificacionItem) =>
          j.tipoJustificacionNombre || 'Administrativa',
      },
      {
        key: 'fechaInicio',
        label: 'Inicio',
        sortable: true,
        render: (j: JustificacionItem) => j.fechaInicio || '—',
      },
      {
        key: 'fechaFin',
        label: 'Fin',
        sortable: true,
        render: (j: JustificacionItem) => j.fechaFin || '—',
      },
      {
        key: 'esMasiva',
        label: 'Alcance',
        render: (j: JustificacionItem) => (
          <Badge variant={j.esMasiva ? 'default' : 'secondary'}>
            {j.esMasiva
              ? 'Masiva'
              : j.departamentoId
                ? `Depto ${j.departamentoId}`
                : 'Individual'}
          </Badge>
        ),
      },
      {
        key: 'motivo',
        label: 'Motivo',
        render: (j: JustificacionItem) => j.motivo || '—',
        className: 'max-w-[300px] truncate',
      },
      {
        key: 'numOficio',
        label: 'Oficio',
        render: (j: JustificacionItem) => j.numOficio || '—',
      },
    ],
    [sortField, sortDirection]
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-1'>
              <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                Gestión de Justificaciones
              </h1>
              <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
            </div>
          </EnhancedCard>

          {/* Formulario de justificación */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 mb-4'>
                <FileText className='h-5 w-5 text-primary' />
                <h2 className='text-lg font-semibold text-foreground'>
                  Crear Nueva Justificación
                </h2>
              </div>
              <p className='text-muted-foreground text-sm mb-6'>
                Complete el formulario para crear una justificación de
                asistencia.
              </p>
              <JustificacionForm />
            </div>
          </EnhancedCard>

          {/* Tabla de justificaciones */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 mb-4'>
                <FileText className='h-5 w-5 text-primary' />
                <h2 className='text-lg font-semibold text-foreground'>
                  Justificaciones Registradas
                </h2>
              </div>
              {error && <div className='text-sm text-red-600'>{error}</div>}
              <DataTable
                data={sortedRows}
                columns={columns as any}
                currentPage={page}
                totalPages={totalPages}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onPageChange={setPage}
                emptyMessage={
                  loading
                    ? 'Cargando...'
                    : 'No hay justificaciones registradas.'
                }
              />
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
