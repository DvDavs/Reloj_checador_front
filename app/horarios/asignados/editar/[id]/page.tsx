'use client';

import * as React from 'react';
import { useReducer, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  WizardAction,
  WizardState,
  EmpleadoSimpleDTO,
  HorarioAsignadoCreateDto,
  WizardStep,
} from '../../registrar/types';
import { PageHeader } from '@/app/components/shared/page-header';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HorarioTemplateDTO, TipoHorarioDTO } from '../../registrar/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  getScheduleTypes,
  updateHorarioAsignado,
  getHorarioTemplates,
  getHorarioAsignadoById,
  getApiErrorMessage,
} from '@/lib/api/schedule-api';
import { BreadcrumbNav } from '@/app/components/shared/breadcrumb-nav';
import Link from 'next/link';
import { LoadingState } from '@/app/components/shared/loading-state';
import { WizardStepper } from '@/app/components/shared/wizard-stepper';
import { notFound } from 'next/navigation';
// import { toWeeklySchedule, toDetalles, toHorarioTemplateForSave } from "../utils/schedule-mappers";

const wizardReducer = (
  state: WizardState,
  action: WizardAction
): WizardState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    // Employee selection is disabled in edit mode, so no action needed
    case 'SELECT_EMPLOYEE':
      return state;
    case 'SET_SCHEDULE_SELECTION_TYPE':
      return {
        ...state,
        scheduleSelectionType: action.payload,
        selectedTemplateId: null,
        newScheduleData: initialState.newScheduleData,
      };
    case 'SELECT_EXISTING_TEMPLATE':
      return { ...state, selectedTemplateId: action.payload };
    case 'UPDATE_NEW_SCHEDULE_DATA':
      return {
        ...state,
        newScheduleData: { ...state.newScheduleData, ...action.payload },
      };
    case 'SET_ASSIGNMENT_DATES':
      return {
        ...state,
        assignmentStartDate: action.payload.startDate,
        assignmentEndDate: action.payload.endDate,
      };
    case 'SELECT_SCHEDULE_TYPE':
      return { ...state, selectedScheduleTypeId: action.payload };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const initialState: WizardState = {
  step: 'selectSchedule', // Start at step 2
  selectedEmployee: null,
  scheduleSelectionType: 'existing', // Default to existing
  selectedTemplateId: null,
  newScheduleData: {
    nombre: '',
    descripcion: '',
    esHorarioJefe: false,
    detalles: [],
  },
  assignmentStartDate: null,
  assignmentEndDate: null,
  selectedScheduleTypeId: null,
  newlyCreatedTemplateId: null,
  isSubmitting: false,
  error: null,
};

function Step2_SelectSchedule({
  state,
  dispatch,
  setTemplates,
  isEditMode,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  setTemplates: React.Dispatch<React.SetStateAction<HorarioTemplateDTO[]>>;
  isEditMode: boolean;
}) {
  const [templates, setLocalTemplates] = React.useState<HorarioTemplateDTO[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getHorarioTemplates();
        setLocalTemplates(data);
        setTemplates(data); // Lift state up
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar las plantillas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, [setTemplates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elige una Opción</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <RadioGroup
          value={state.scheduleSelectionType ?? ''}
          onValueChange={(value) =>
            dispatch({
              type: 'SET_SCHEDULE_SELECTION_TYPE',
              payload: value as 'existing' | 'new',
            })
          }
          disabled={isEditMode} // Disable changing between new/existing
        >
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='existing' id='existing' />
            <Label htmlFor='existing'>Seleccionar plantilla existente</Label>
          </div>
          <div className='flex items-center space-x-2'>
            <RadioGroupItem value='new' id='new' />
            <Label htmlFor='new'>Crear nueva plantilla</Label>
          </div>
        </RadioGroup>

        {state.scheduleSelectionType === 'existing' && (
          <div className='pl-6 pt-4 border-l'>
            {isLoading ? (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' /> Cargando
                plantillas...
              </div>
            ) : error ? (
              <p className='text-sm text-destructive'>{error}</p>
            ) : (
              <Select
                value={state.selectedTemplateId?.toString()}
                onValueChange={(value) =>
                  dispatch({
                    type: 'SELECT_EXISTING_TEMPLATE',
                    payload: parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione una plantilla...' />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem
                      key={template.id}
                      value={template.id.toString()}
                    >
                      {template.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {state.scheduleSelectionType === 'new' && (
          <div className='pl-6 pt-4 space-y-8'>
            <Card>
              <CardHeader>
                <CardTitle>Datos de la Plantilla</CardTitle>
                <CardDescription>
                  Ajusta el nombre, la descripción y el tipo de horario.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='templateName'>Nombre</Label>
                  <Input
                    id='templateName'
                    value={state.newScheduleData.nombre}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_NEW_SCHEDULE_DATA',
                        payload: { nombre: e.target.value },
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='templateDesc'>Descripción</Label>
                  <Input
                    id='templateDesc'
                    value={state.newScheduleData.descripcion}
                    onChange={(e) =>
                      dispatch({
                        type: 'UPDATE_NEW_SCHEDULE_DATA',
                        payload: { descripcion: e.target.value },
                      })
                    }
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='isJefe'
                    checked={state.newScheduleData.esHorarioJefe}
                    onCheckedChange={(checked) =>
                      dispatch({
                        type: 'UPDATE_NEW_SCHEDULE_DATA',
                        payload: { esHorarioJefe: !!checked },
                      })
                    }
                  />
                  <Label htmlFor='isJefe'>Es un horario para Jefes</Label>
                </div>
              </CardContent>
            </Card>

            {/* SECCIÓN DE TURNOS ELIMINADA TEMPORALMENTE PARA CORREGIR BUILD */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Step3_SetDates({
  state,
  dispatch,
  setScheduleTypes,
}: {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  setScheduleTypes: React.Dispatch<React.SetStateAction<TipoHorarioDTO[]>>;
}) {
  const [scheduleTypes, setLocalScheduleTypes] = React.useState<
    TipoHorarioDTO[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getScheduleTypes();
        setLocalScheduleTypes(data);
        setScheduleTypes(data); // Lift state up
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los tipos de horario.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTypes();
  }, [setScheduleTypes]);

  const handleDateChange = (
    field: 'startDate' | 'endDate',
    date: Date | undefined
  ) => {
    const { assignmentStartDate, assignmentEndDate } = state;
    const newStartDate = field === 'startDate' ? date : assignmentStartDate;
    const newEndDate = field === 'endDate' ? date : assignmentEndDate;
    dispatch({
      type: 'SET_ASSIGNMENT_DATES',
      payload: { startDate: newStartDate ?? null, endDate: newEndDate ?? null },
    });
  };

  return (
    <Card className='max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>Define las Fechas y el Tipo</CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Fecha de Inicio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='w-full justify-start text-left font-normal'
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {state.assignmentStartDate ? (
                    format(state.assignmentStartDate, 'PPP')
                  ) : (
                    <span>Seleccione fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={state.assignmentStartDate ?? undefined}
                  onSelect={(date) => handleDateChange('startDate', date)}
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
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {state.assignmentEndDate ? (
                    format(state.assignmentEndDate, 'PPP')
                  ) : (
                    <span>Seleccione fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0'>
                <Calendar
                  mode='single'
                  selected={state.assignmentEndDate ?? undefined}
                  onSelect={(date) => handleDateChange('endDate', date)}
                  disabled={{
                    before: state.assignmentStartDate ?? new Date(0),
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {state.assignmentStartDate &&
          state.assignmentEndDate &&
          state.assignmentEndDate < state.assignmentStartDate && (
            <p className='text-sm text-destructive'>
              La fecha de fin debe ser posterior a la fecha de inicio.
            </p>
          )}

        <div className='space-y-2'>
          <Label>Tipo de Horario</Label>
          {isLoading ? (
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' /> Cargando tipos...
            </div>
          ) : error ? (
            <p className='text-sm text-destructive'>{error}</p>
          ) : (
            <Select
              value={state.selectedScheduleTypeId?.toString()}
              onValueChange={(value) =>
                dispatch({
                  type: 'SELECT_SCHEDULE_TYPE',
                  payload: parseInt(value),
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Seleccione un tipo...' />
              </SelectTrigger>
              <SelectContent>
                {scheduleTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Step4_Summary({
  state,
  templates,
  scheduleTypes,
}: {
  state: WizardState;
  templates: HorarioTemplateDTO[];
  scheduleTypes: TipoHorarioDTO[];
}) {
  const getTemplateName = (id: number | null) => {
    return templates.find((t) => t.id === id)?.nombre || 'N/A';
  };
  const getScheduleTypeName = (id: number | null) => {
    return scheduleTypes.find((t) => t.id === id)?.nombre || 'N/A';
  };

  return (
    <div className='max-w-2xl mx-auto'>
      <h3 className='text-xl font-bold text-center mb-6'>
        Resumen de la Asignación
      </h3>
      <div className='border rounded-lg p-6 space-y-5 bg-zinc-900/30'>
        {/* Horario */}
        <div className='flex justify-between items-start'>
          <span className='text-muted-foreground'>Horario:</span>
          <div className='text-right font-semibold'>
            {state.scheduleSelectionType === 'existing' ? (
              <span>{getTemplateName(state.selectedTemplateId)}</span>
            ) : (
              <div>
                <span>{state.newScheduleData.nombre} (Nueva Plantilla)</span>
                <p className='text-xs text-muted-foreground'>
                  {state.newScheduleData.detalles.length} turnos definidos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className='flex justify-between items-center'>
          <span className='text-muted-foreground'>Fecha de Inicio:</span>
          <span className='font-semibold'>
            {state.assignmentStartDate
              ? format(state.assignmentStartDate, 'PPP', { locale: es })
              : 'N/A'}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-muted-foreground'>Fecha de Fin:</span>
          <span className='font-semibold'>
            {state.assignmentEndDate
              ? format(state.assignmentEndDate, 'PPP', { locale: es })
              : 'Indefinida'}
          </span>
        </div>

        {/* Tipo de Horario */}
        <div className='flex justify-between items-center'>
          <span className='text-muted-foreground'>Tipo de Horario:</span>
          <span className='font-semibold'>
            {getScheduleTypeName(state.selectedScheduleTypeId)}
          </span>
        </div>
        <div className='flex justify-between items-center pt-4 border-t border-zinc-700'>
          <span className='text-muted-foreground font-semibold'>Empleado:</span>
          <span className='font-bold text-lg'>
            {state.selectedEmployee?.nombreCompleto}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ScheduleAssignmentEditPage() {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = params.id ? parseInt(params.id as string) : null;

  const [templates, setTemplates] = React.useState<HorarioTemplateDTO[]>([]);
  const [scheduleTypes, setScheduleTypes] = React.useState<TipoHorarioDTO[]>(
    []
  );
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  useEffect(() => {
    if (!id) {
      router.push('/horarios/asignados');
      return;
    }

    const loadAssignmentData = async () => {
      setIsLoadingData(true);
      try {
        const data = await getHorarioAsignadoById(id);
        const employee: EmpleadoSimpleDTO = {
          id: data.empleadoId,
          nombreCompleto: data.empleadoNombre,
        };

        const payload: Partial<WizardState> = {
          selectedEmployee: employee,
          selectedTemplateId: data.horarioId,
          selectedScheduleTypeId: data.tipoHorarioId,
          assignmentStartDate: parseISO(data.fechaInicio),
          assignmentEndDate: data.fechaFin ? parseISO(data.fechaFin) : null,
          scheduleSelectionType: 'existing', // In edit mode, we always start with an existing one
          step: 'selectSchedule',
        };
        dispatch({ type: 'SET_STATE', payload });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: `No se pudo cargar la asignación: ${error.message}`,
          variant: 'destructive',
        });
        dispatch({ type: 'SUBMIT_ERROR', payload: 'Error al cargar datos.' });
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAssignmentData();
  }, [id, router, toast]);

  const WIZARD_STEPS = [
    { label: 'Empleado', id: 'selectEmployee' },
    { label: 'Horario', id: 'selectSchedule' },
    { label: 'Fechas', id: 'setDates' },
    { label: 'Resumen', id: 'summary' },
  ];

  const currentStepNumber = React.useMemo(() => {
    // Find the index of the current step based on its ID
    const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === state.step);
    // Add 1 to make it a 1-based index for the stepper component
    return stepIndex + 1;
  }, [state.step]);

  const handleSave = async () => {
    dispatch({ type: 'SUBMIT_START' });

    if (!id) return;

    try {
      const startDateStr = format(state.assignmentStartDate!, 'yyyy-MM-dd');
      const endDateStr = state.assignmentEndDate
        ? format(state.assignmentEndDate, 'yyyy-MM-dd')
        : null;
      let horarioId = state.selectedTemplateId;

      // In edit mode, creating a new template is disabled.
      // If this logic were to be enabled, it would go here.
      if (state.scheduleSelectionType === 'new') {
        throw new Error(
          'No se puede crear una nueva plantilla en modo de edición.'
        );
      }

      if (!horarioId) {
        throw new Error('No se ha seleccionado un horario.');
      }

      // Update the assignment
      await updateHorarioAsignado(id, {
        empleadoId: state.selectedEmployee!.id,
        horarioId: horarioId!,
        tipoHorarioId: state.selectedScheduleTypeId!,
        fechaInicio: startDateStr,
        fechaFin: endDateStr,
      });

      dispatch({ type: 'SUBMIT_SUCCESS' });
      toast({
        title: 'Actualización Exitosa',
        description: 'El horario ha sido actualizado.',
      });
      router.push('/horarios/asignados');
    } catch (error: any) {
      console.error('Error al actualizar la asignación:', error);
      const errorMessage = getApiErrorMessage(error);
      dispatch({ type: 'SUBMIT_ERROR', payload: errorMessage });
      toast({
        title: 'Error en la Actualización',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleNext = () => {
    switch (state.step) {
      case 'selectSchedule':
        const isExistingValid =
          state.scheduleSelectionType === 'existing' &&
          state.selectedTemplateId !== null;
        const isNewValid =
          state.scheduleSelectionType === 'new' &&
          state.newScheduleData.nombre.trim() !== '' &&
          state.newScheduleData.detalles.length > 0;
        if (isExistingValid || isNewValid) {
          dispatch({ type: 'SET_STEP', payload: 'setDates' });
        }
        break;
      case 'setDates':
        const areDatesValid =
          !state.assignmentStartDate ||
          !state.assignmentEndDate ||
          state.assignmentEndDate >= state.assignmentStartDate;
        if (
          state.assignmentStartDate &&
          state.selectedScheduleTypeId &&
          areDatesValid
        ) {
          dispatch({ type: 'SET_STEP', payload: 'summary' });
        }
        break;
      case 'summary':
        handleSave();
        break;
    }
  };

  const handleBack = () => {
    switch (state.step) {
      case 'selectSchedule':
        dispatch({ type: 'SET_STEP', payload: 'selectEmployee' });
        break;
      case 'setDates':
        dispatch({ type: 'SET_STEP', payload: 'selectSchedule' });
        break;
      case 'summary':
        dispatch({ type: 'SET_STEP', payload: 'setDates' });
        break;
    }
  };

  if (isLoadingData) {
    return <LoadingState message='Cargando datos de la asignación...' />;
  }

  return (
    <div className='p-4 sm:p-6 lg:p-8 space-y-6'>
      <BreadcrumbNav
        items={[
          { label: 'Horarios Asignados', href: '/horarios/asignados' },
          { label: 'Editar Asignación' },
        ]}
        backHref='/horarios/asignados'
      />
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold'>Editar Asignación de Horario</h1>
        <Link href='/horarios/asignados'>
          <Button variant='outline'>Cancelar</Button>
        </Link>
      </div>

      <div className='my-6'>
        <WizardStepper steps={WIZARD_STEPS} currentStep={currentStepNumber} />
      </div>

      {state.error && (
        <Alert variant='destructive' className='mb-4 max-w-4xl mx-auto'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className='max-w-4xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl'>
              {WIZARD_STEPS.find((s) => s.id === state.step)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className='min-h-[350px] p-6'>
            {state.step === 'selectSchedule' && (
              <Step2_SelectSchedule
                state={state}
                dispatch={dispatch}
                setTemplates={setTemplates}
                isEditMode={true}
              />
            )}
            {state.step === 'setDates' && (
              <Step3_SetDates
                state={state}
                dispatch={dispatch}
                setScheduleTypes={setScheduleTypes}
              />
            )}
            {state.step === 'summary' && (
              <Step4_Summary
                state={state}
                templates={templates}
                scheduleTypes={scheduleTypes}
              />
            )}
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button
              variant='outline'
              onClick={handleBack}
              disabled={state.step === 'selectEmployee'}
            >
              Atrás
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                (state.step === 'selectSchedule' &&
                  !(
                    (state.scheduleSelectionType === 'existing' &&
                      state.selectedTemplateId !== null) ||
                    (state.scheduleSelectionType === 'new' &&
                      state.newScheduleData.nombre.trim() !== '' &&
                      state.newScheduleData.detalles.length > 0)
                  )) ||
                (state.step === 'setDates' &&
                  !(
                    state.assignmentStartDate &&
                    state.selectedScheduleTypeId &&
                    (!state.assignmentEndDate ||
                      state.assignmentEndDate >= state.assignmentStartDate)
                  ))
              }
            >
              {state.step === 'summary' ? (
                state.isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Guardando...
                  </>
                ) : (
                  'Guardar Asignación'
                )
              ) : (
                'Siguiente'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
