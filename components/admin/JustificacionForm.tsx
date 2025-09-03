// components/admin/JustificacionForm.tsx

'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  CalendarIcon,
  Loader2,
  AlertCircle,
  CheckCircle2,
  User,
  Building,
  Globe,
  Send,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { DepartmentSearchableSelect } from '@/app/components/shared/department-searchable-select';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { DepartamentoDto } from '@/lib/api/schedule-api';
import {
  createJustificacionIndividual,
  createJustificacionDepartamental,
  createJustificacionMasiva,
  JustificacionIndividualData,
  JustificacionDepartamentalData,
  JustificacionMasivaData,
  listTiposJustificacion,
  TipoJustificacion,
} from '@/lib/api/justificaciones.api';
import { useToast } from '@/components/ui/use-toast';
import { getApiErrorMessage } from '@/lib/api/api-helpers';
import { apiClient } from '@/lib/apiClient';

type TipoJustificacionForm = 'individual' | 'departamental' | 'masiva';

interface JustificacionFormData {
  tipo: TipoJustificacionForm;
  empleado: EmpleadoSimpleDTO | null;
  departamento: DepartamentoDto | null;
  fechaInicio: Date | null;
  fechaFin: Date | null;
  fecha: Date | null;
  motivo: string;
  numOficio?: string;
  tipoDescripcion?: string; // código/clave (columna descripcion) del tipo seleccionado
}

interface JustificacionExitosa {
  tipo: TipoJustificacionForm;
  empleadosAfectados?: number;
  fechasAfectadas: string;
  empleadoNombre?: string;
  departamentoNombre?: string;
  totalConsolidados?: number;
  totalFaltas?: number;
}

const initialState: JustificacionFormData = {
  tipo: 'individual',
  empleado: null,
  departamento: null,
  fechaInicio: null,
  fechaFin: null,
  fecha: null,
  motivo: '',
  numOficio: '',
  tipoDescripcion: undefined,
};

export function JustificacionForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<JustificacionExitosa | null>(
    null
  );
  const [formData, setFormData] = useState<JustificacionFormData>(initialState);
  const [isConfirmOpen, setConfirmOpen] = useState(false);

  // Empleados por departamento (para flujo departamental)
  const [deptEmployees, setDeptEmployees] = useState<EmpleadoSimpleDTO[]>([]);
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);

  // Tipos de justificación
  const [tipos, setTipos] = useState<TipoJustificacion[]>([]);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const data = await listTiposJustificacion();
        setTipos(data);
      } catch (err) {
        // ignore pero no bloquear el uso
        setTipos([]);
      }
    };
    fetchTipos();
  }, []);

  useEffect(() => {
    const fetchDeptEmployees = async () => {
      if (formData.tipo !== 'departamental' || !formData.departamento) {
        setDeptEmployees([]);
        setSelectedDeptIds([]);
        return;
      }
      try {
        const claveInt = parseInt(formData.departamento.clave, 10);
        if (Number.isNaN(claveInt)) return;
        const resp = await apiClient.get(
          `/api/empleados/departamento/${claveInt}`
        );
        const empleados: any[] = resp.data || [];
        // Map to simple
        const mapped: EmpleadoSimpleDTO[] = empleados.map((e: any) => ({
          id: e.id,
          nombreCompleto:
            e.nombreCompleto ||
            [
              e.primerNombre,
              e.segundoNombre,
              e.primerApellido,
              e.segundoApellido,
            ]
              .filter(Boolean)
              .join(' '),
          rfc: e.rfc,
          curp: e.curp,
        }));
        setDeptEmployees(mapped);
        setSelectedDeptIds(mapped.map((m) => m.id)); // seleccionar todos por defecto
      } catch (err) {
        // ignore
        setDeptEmployees([]);
        setSelectedDeptIds([]);
      }
    };
    fetchDeptEmployees();
  }, [formData.tipo, formData.departamento]);

  const handleTipoChange = (tipo: TipoJustificacionForm) => {
    setFormData({ ...initialState, tipo });
    setError(null);
    setSuccessInfo(null);
  };

  const handleTipoJustificacionChange = (desc: string) => {
    const selected = tipos.find((t) => t.descripcion === desc);
    setFormData((prev) => ({
      ...prev,
      tipoDescripcion: desc,
      motivo: selected ? selected.descripcion : prev.motivo, // prellenar con la descripción
    }));
  };

  const handleDateChange = (
    field: 'fechaInicio' | 'fechaFin' | 'fecha',
    date: Date | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: date || null }));
    setError(null);
  };

  const handleToggleEmployee = (id: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedDeptIds(deptEmployees.map((e) => e.id));
  };

  const handleClearSelection = () => {
    setSelectedDeptIds([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.tipoDescripcion) {
      newErrors.tipoDescripcion = 'Debe seleccionar el tipo de justificación.';
    }
    // El motivo es opcional para justificaciones de todo el día
    if (
      formData.tipo === 'masiva' &&
      (!formData.motivo.trim() || formData.motivo.trim().length < 1)
    ) {
      // Para justificaciones masivas (todo el día), el motivo es opcional
    } else if (!formData.motivo.trim() || formData.motivo.trim().length < 1) {
      newErrors.motivo = 'El motivo es requerido.';
    }
    switch (formData.tipo) {
      case 'individual':
        if (!formData.empleado)
          newErrors.empleado = 'Debe seleccionar un empleado.';
        if (!formData.fechaInicio)
          newErrors.fechaInicio = 'La fecha de inicio es requerida.';
        if (
          formData.fechaInicio &&
          formData.fechaFin &&
          formData.fechaFin < formData.fechaInicio
        ) {
          newErrors.fechaFin =
            'La fecha de fin debe ser posterior a la de inicio.';
        }
        break;
      case 'departamental':
        if (!formData.departamento)
          newErrors.departamento = 'Debe seleccionar un departamento.';
        if (!formData.fechaInicio)
          newErrors.fechaInicio = 'La fecha de inicio es requerida.';
        if (
          formData.fechaInicio &&
          formData.fechaFin &&
          formData.fechaFin < formData.fechaInicio
        ) {
          newErrors.fechaFin =
            'La fecha de fin debe ser posterior a la de inicio.';
        }
        if (deptEmployees.length > 0 && selectedDeptIds.length === 0) {
          newErrors.empleado = 'Seleccione al menos un empleado de la lista.';
        }
        break;
      case 'masiva':
        if (!formData.fechaInicio)
          newErrors.fechaInicio = 'La fecha de inicio es requerida.';
        if (
          formData.fechaInicio &&
          formData.fechaFin &&
          formData.fechaFin < formData.fechaInicio
        ) {
          newErrors.fechaFin =
            'La fecha de fin debe ser posterior a la de inicio.';
        }
        break;
    }
    setError(Object.values(newErrors).join(' '));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    if (validateForm()) {
      setConfirmOpen(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setError(null);
    setConfirmOpen(false);

    try {
      let response: any;
      let successPayload: Partial<JustificacionExitosa> = {
        tipo: formData.tipo,
      };

      // Helper: consolidar asistencias y obtener totales (soporta rango)
      const consolidarYObtenerTotales = async (
        start: Date,
        end?: Date
      ): Promise<{ totalConsolidados: number; totalFaltas: number }> => {
        let totalConsolidados = 0;
        let totalFaltas = 0;
        const dEnd = end ?? start;
        let cursor = new Date(start);
        cursor.setHours(0, 0, 0, 0);
        const last = new Date(dEnd);
        last.setHours(0, 0, 0, 0);
        while (cursor <= last) {
          const fechaStr = format(cursor, 'yyyy-MM-dd');
          try {
            const res = await apiClient.post(
              `/api/estatus-asistencia/consolidar/${fechaStr}`
            );
            totalConsolidados += res.data?.totalConsolidados ?? 0;
            totalFaltas += res.data?.totalFaltas ?? 0;
          } catch (e) {
            // continuar
          }
          cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
        }
        return { totalConsolidados, totalFaltas };
      };

      switch (formData.tipo) {
        case 'individual': {
          const individualData: JustificacionIndividualData = {
            empleadoId: formData.empleado!.id,
            fechaInicio: format(formData.fechaInicio!, 'yyyy-MM-dd'),
            fechaFin: format(
              formData.fechaFin || formData.fechaInicio!,
              'yyyy-MM-dd'
            ),
            motivo: formData.motivo.trim(),
            numOficio: formData.numOficio?.trim() || undefined,
            // nuevo campo
            tipoDescripcion: formData.tipoDescripcion!,
          } as any;
          response = await createJustificacionIndividual(individualData as any);
          successPayload.empleadoNombre = formData.empleado?.nombreCompleto;
          successPayload.fechasAfectadas = `${format(formData.fechaInicio!, 'dd/MM/yyyy')} - ${format(formData.fechaFin || formData.fechaInicio!, 'dd/MM/yyyy')}`;
          // Nota: La re-consolidación por empleado ya la realiza el backend automáticamente
          break;
        }

        case 'departamental': {
          // Loop por empleados seleccionados y fechas
          const selectedIds =
            selectedDeptIds.length > 0
              ? selectedDeptIds
              : deptEmployees.map((e) => e.id);
          const start = formData.fechaInicio!;
          const end = formData.fechaFin || formData.fechaInicio!;
          let empleadosAfectados = 0;

          for (const empId of selectedIds) {
            let cursor = new Date(start);
            const last = new Date(end);
            while (cursor <= last) {
              const fechaStr = format(cursor, 'yyyy-MM-dd');
              const payload: JustificacionIndividualData = {
                empleadoId: empId,
                fechaInicio: fechaStr,
                fechaFin: fechaStr,
                motivo: formData.motivo.trim(),
                numOficio: formData.numOficio?.trim() || undefined,
                // nuevo campo
                tipoDescripcion: formData.tipoDescripcion!,
              } as any;
              try {
                await createJustificacionIndividual(payload as any);
                empleadosAfectados += 1;
              } catch (_) {
                // continuar
              }
              cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
            }
          }

          successPayload.departamentoNombre = formData.departamento?.nombre;
          successPayload.fechasAfectadas = `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
          successPayload.empleadosAfectados = empleadosAfectados;
          break;
        }

        case 'masiva': {
          // Soporta rango: ejecutar masivo por día
          const start = formData.fechaInicio || formData.fecha!;
          const end = formData.fechaFin || start;
          let empleadosAfectados = 0;
          let cursor = new Date(start);
          const last = new Date(end);
          while (cursor <= last) {
            const payload: JustificacionMasivaData = {
              fecha: format(cursor, 'yyyy-MM-dd'),
              motivo: formData.motivo.trim(),
              // nuevo campo
              tipoDescripcion: formData.tipoDescripcion!,
            } as any;
            try {
              const res = await createJustificacionMasiva(payload as any);
              empleadosAfectados += res.empleadosAfectados || 0;
            } catch (_) {
              // continuar
            }
            cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
          }

          successPayload.fechasAfectadas = `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
          successPayload.empleadosAfectados = empleadosAfectados;
          // Consolidar
          const { totalConsolidados, totalFaltas } =
            await consolidarYObtenerTotales(start, end);
          successPayload.totalConsolidados = totalConsolidados;
          successPayload.totalFaltas = totalFaltas;
          break;
        }
      }

      setSuccessInfo(successPayload as JustificacionExitosa);
      toast({
        title: 'Justificación Creada',
        description: 'La operación se completó exitosamente.',
      });
      setFormData(initialState);
      setDeptEmployees([]);
      setSelectedDeptIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
      toast({
        title: 'Error',
        description: getApiErrorMessage(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfirmationDescription = () => {
    switch (formData.tipo) {
      case 'individual':
        if (formData.empleado && formData.fechaInicio) {
          const startDate = format(formData.fechaInicio, 'PPP', { locale: es });
          const endDate = format(
            formData.fechaFin || formData.fechaInicio,
            'PPP',
            { locale: es }
          );
          return `Se creará una justificación para el empleado ${formData.empleado.nombreCompleto} desde el ${startDate} hasta el ${endDate}.`;
        }
        return 'Por favor, complete los detalles de la justificación individual.';

      case 'departamental':
        if (formData.departamento && formData.fechaInicio) {
          const startDate = format(formData.fechaInicio, 'PPP', { locale: es });
          const endDate = format(
            formData.fechaFin || formData.fechaInicio,
            'PPP',
            { locale: es }
          );
          return `Se creará una justificación para los empleados seleccionados del departamento ${formData.departamento.nombre} del ${startDate} al ${endDate}.`;
        }
        return 'Por favor, complete los detalles de la justificación departamental.';

      case 'masiva':
        if (formData.fechaInicio || formData.fecha) {
          const start = formData.fechaInicio || formData.fecha!;
          const end = formData.fechaFin || start;
          return `Se creará una justificación masiva para TODOS los empleados del sistema del ${format(start, 'PPP', { locale: es })} al ${format(end, 'PPP', { locale: es })}.`;
        }
        return 'Por favor, complete los detalles de la justificación masiva.';

      default:
        return '¿Está seguro de realizar esta acción?';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Crear Justificación del día</CardTitle>
          <CardDescription>
            Seleccione el tipo de justificación y complete los campos
            requeridos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successInfo && (
            <Alert className='mb-4 border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400'>
              <CheckCircle2 className='h-4 w-4' />
              <AlertTitle>¡Completado!</AlertTitle>
              <AlertDescription>
                Justificación de tipo <strong>{successInfo.tipo}</strong> creada
                para las fechas <strong>{successInfo.fechasAfectadas}</strong>.
                {successInfo.empleadoNombre &&
                  ` Empleado: ${successInfo.empleadoNombre}.`}
                {successInfo.departamentoNombre &&
                  ` Departamento: ${successInfo.departamentoNombre}.`}
                {typeof successInfo.empleadosAfectados !== 'undefined' &&
                  ` Empleados afectados: ${successInfo.empleadosAfectados}.`}
                {typeof successInfo.totalConsolidados !== 'undefined' &&
                  ` Registros consolidados: ${successInfo.totalConsolidados}.`}
                {typeof successInfo.totalFaltas !== 'undefined' &&
                  ` Faltas consolidadas: ${successInfo.totalFaltas}.`}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label>Tipo de Justificación</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) =>
                  handleTipoChange(v as TipoJustificacionForm)
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione el tipo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='individual'>
                    <div className='flex items-center gap-2'>
                      <User /> Individual
                    </div>
                  </SelectItem>
                  <SelectItem value='departamental'>
                    <div className='flex items-center gap-2'>
                      <Building /> Departamental
                    </div>
                  </SelectItem>
                  <SelectItem value='masiva'>
                    <div className='flex items-center gap-2'>
                      <Globe /> Masiva
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown: Tipo de Justificación (catálogo) */}
            <div className='space-y-2'>
              <Label>Concepto de Justificación</Label>
              <Select
                value={formData.tipoDescripcion || ''}
                onValueChange={handleTipoJustificacionChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione el concepto (se usará como motivo)' />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={t.descripcion}>
                      {t.descripcion} — {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === 'individual' && (
              <div className='space-y-2'>
                <Label>Empleado</Label>
                <EmployeeSearch
                  value={formData.empleado}
                  onChange={(emp) =>
                    setFormData((f) => ({ ...f, empleado: emp }))
                  }
                  disabled={loading}
                />
              </div>
            )}

            {formData.tipo === 'departamental' && (
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Departamento</Label>
                  <DepartmentSearchableSelect
                    value={formData.departamento}
                    onChange={(dep) =>
                      setFormData((f) => ({ ...f, departamento: dep }))
                    }
                    disabled={loading}
                  />
                </div>

                {deptEmployees.length > 0 && (
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Label>Empleados del Departamento</Label>
                      <div className='flex gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleSelectAll}
                          disabled={loading}
                        >
                          Seleccionar todos
                        </Button>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={handleClearSelection}
                          disabled={loading}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>
                    <div className='max-h-56 overflow-auto rounded border p-2'>
                      {deptEmployees.map((emp) => (
                        <label
                          key={emp.id}
                          className='flex items-center gap-2 py-1'
                        >
                          <input
                            type='checkbox'
                            className='h-4 w-4'
                            checked={selectedDeptIds.includes(emp.id)}
                            onChange={() => handleToggleEmployee(emp.id)}
                          />
                          <span className='text-sm'>{emp.nombreCompleto}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fecha(s) - rango para todos los tipos */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Fecha de Inicio</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-start text-left font-normal'
                      disabled={loading}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formData.fechaInicio ? (
                        format(formData.fechaInicio, 'PPP', { locale: es })
                      ) : (
                        <span>Seleccione fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={formData.fechaInicio ?? undefined}
                      onSelect={(d) => handleDateChange('fechaInicio', d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='space-y-2'>
                <Label>Fecha de Fin (Opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='w-full justify-start text-left font-normal'
                      disabled={loading}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formData.fechaFin ? (
                        format(formData.fechaFin, 'PPP', { locale: es })
                      ) : (
                        <span>Igual a fecha de inicio</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={formData.fechaFin ?? undefined}
                      onSelect={(d) => handleDateChange('fechaFin', d)}
                      disabled={{ before: formData.fechaInicio ?? new Date(0) }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Motivo</Label>
              <Textarea
                placeholder='El motivo se prellenará con el concepto seleccionado, puede ajustarlo si lo requiere'
                value={formData.motivo}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, motivo: e.target.value }))
                }
                disabled={loading}
                rows={3}
              />
            </div>

            <div className='space-y-2'>
              <Label>Número de Oficio (opcional)</Label>
              <Input
                placeholder='Ej. OF/1234/2025'
                value={formData.numOficio}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, numOficio: e.target.value }))
                }
                disabled={loading}
              />
            </div>

            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Send className='mr-2 h-4 w-4' />
              )}
              {loading ? 'Procesando...' : 'Aplicar Justificación'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar acción?</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
