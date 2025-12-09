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
import { CalendarIcon, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';
import { VisualOptionCard } from '@/app/components/shared/visual-option-card';
import { NewScheduleTemplateForm } from '../../registrar/components/NewScheduleTemplateForm';
import {
  FilePlus2,
  List,
  Briefcase,
  Star,
  Clock4,
  User,
  Users,
  CalendarDays,
  ClipboardCheck,
} from 'lucide-react';
import { CompletionStep } from '../../registrar/components/CompletionStep';
import SchedulePreview from '@/app/components/shared/SchedulePreview';
import { ErrorWithLinks } from '@/app/components/shared/error-with-links';

const wizardReducer = (
  state: WizardState,
  action: WizardAction
): WizardState => {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    case 'SET_STEP':
      return { ...state, step: action.payload };
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
  step: 'selectSchedule',
  selectedEmployee: null,
  scheduleSelectionType: 'existing',
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

  React.useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getHorarioTemplates();
        setLocalTemplates(data);
        setTemplates(data);
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar las plantillas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectionTypeChange = React.useCallback(
    (value: string) => {
      dispatch({
        type: 'SET_SCHEDULE_SELECTION_TYPE',
        payload: value as 'existing' | 'new',
      });
    },
    [dispatch]
  );

  const handleTemplateSelectChange = React.useCallback(
    (value: string) => {
      dispatch({ type: 'SELECT_EXISTING_TEMPLATE', payload: parseInt(value) });
    },
    [dispatch]
  );

  const handleNewScheduleDataChange = React.useCallback(
    (data: Partial<Omit<HorarioTemplateDTO, 'id'>>) => {
      dispatch({ type: 'UPDATE_NEW_SCHEDULE_DATA', payload: data });
    },
    [dispatch]
  );

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <VisualOptionCard
          icon={<List className='h-8 w-8' />}
          title='Plantilla Existente'
          description='Usar un horario predefinido.'
          isSelected={state.scheduleSelectionType === 'existing'}
          onClick={() => handleSelectionTypeChange('existing')}
          disabled={isEditMode && state.scheduleSelectionType !== 'existing'}
        />
        <VisualOptionCard
          icon={<FilePlus2 className='h-8 w-8' />}
          title='Nueva Plantilla'
          description='Crear un horario personalizado.'
          isSelected={state.scheduleSelectionType === 'new'}
          onClick={() => handleSelectionTypeChange('new')}
          disabled={isEditMode}
        />
      </div>

      <AnimatePresence>
        {state.scheduleSelectionType === 'existing' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='pl-2 pt-4 overflow-hidden'
          >
            {isLoading ? (
              <div className='flex items-center gap-2 text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' /> Cargando
                plantillas...
              </div>
            ) : error ? (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className='space-y-4'>
                <Select
                  value={state.selectedTemplateId?.toString()}
                  onValueChange={handleTemplateSelectChange}
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

                {/* Schedule Preview */}
                {state.selectedTemplateId && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {(() => {
                      const selectedTemplate = templates.find(
                        (t) => t.id === state.selectedTemplateId
                      );
                      return selectedTemplate ? (
                        <SchedulePreview
                          template={selectedTemplate}
                          className='border-2 border-primary/20'
                        />
                      ) : null;
                    })()}
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {state.scheduleSelectionType === 'new' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className='pl-2 pt-4 overflow-hidden'
          >
            <NewScheduleTemplateForm
              scheduleData={state.newScheduleData}
              onDataChange={handleNewScheduleDataChange}
              selectedEmployee={state.selectedEmployee}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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

  React.useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getScheduleTypes();
        setLocalScheduleTypes(data);
        setScheduleTypes(data);
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
    <div className='space-y-6'>
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
                disabled={{ before: state.assignmentStartDate ?? new Date(0) }}
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
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 pt-2'>
            {scheduleTypes.map((type) => {
              const getIcon = (name: string) => {
                if (name.toLowerCase().includes('jefe'))
                  return <Briefcase className='h-8 w-8' />;
                if (name.toLowerCase().includes('especial'))
                  return <Star className='h-8 w-8' />;
                return <Clock4 className='h-8 w-8' />;
              };

              return (
                <VisualOptionCard
                  key={type.id}
                  icon={getIcon(type.nombre)}
                  title={type.nombre}
                  description={type.descripcion || ''}
                  isSelected={state.selectedScheduleTypeId === type.id}
                  onClick={() =>
                    dispatch({ type: 'SELECT_SCHEDULE_TYPE', payload: type.id })
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
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
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex flex-row items-center space-x-4'>
          <User className='w-8 h-8 text-primary' />
          <div>
            <CardTitle>Empleado</CardTitle>
            <p className='text-muted-foreground'>
              Empleado que recibirá el horario.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-xl font-semibold'>
            {state.selectedEmployee?.nombreCompleto}
          </p>
          <div className='text-sm text-muted-foreground'>
            {state.selectedEmployee?.rfc && (
              <span>RFC: {state.selectedEmployee.rfc}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className='grid md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center space-x-4'>
            <ClipboardCheck className='w-8 h-8 text-primary' />
            <div>
              <CardTitle>Horario Seleccionado</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            {state.scheduleSelectionType === 'existing' ? (
              <div>
                <p className='font-semibold'>
                  {getTemplateName(state.selectedTemplateId)}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Plantilla existente
                </p>
              </div>
            ) : (
              <div>
                <p className='font-semibold'>{state.newScheduleData.nombre}</p>
                <p className='text-sm text-muted-foreground'>
                  Nueva plantilla con {state.newScheduleData.detalles.length}{' '}
                  turnos
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center space-x-4'>
            <CalendarDays className='w-8 h-8 text-primary' />
            <div>
              <CardTitle>Período de Asignación</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-2'>
            <div>
              <p className='font-semibold'>
                {state.assignmentStartDate
                  ? format(state.assignmentStartDate, 'PPP', { locale: es })
                  : 'N/A'}
              </p>
              <p className='text-sm text-muted-foreground'>Fecha de Inicio</p>
            </div>
            <div>
              <p className='font-semibold'>
                {state.assignmentEndDate
                  ? format(state.assignmentEndDate, 'PPP', { locale: es })
                  : 'Indefinida'}
              </p>
              <p className='text-sm text-muted-foreground'>Fecha de Fin</p>
            </div>
          </CardContent>
        </Card>
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
          scheduleSelectionType: 'existing',
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

  const WIZARD_STEPS = React.useMemo(
    () => [
      {
        label: 'Empleado (Bloqueado)',
        id: 'selectEmployee',
        description: 'El empleado no puede ser cambiado en modo edición.',
      },
      {
        label: 'Horario',
        id: 'selectSchedule',
        description: 'Modifica la plantilla de horario asignada.',
      },
      {
        label: 'Fechas',
        id: 'setDates',
        description: 'Ajusta las fechas y el tipo de horario.',
      },
      {
        label: 'Resumen',
        id: 'summary',
        description: 'Revisa los cambios antes de guardar.',
      },
    ],
    []
  );

  const currentStepConfig = React.useMemo(() => {
    const stepIndex = WIZARD_STEPS.findIndex((s) => s.id === state.step);
    return {
      ...WIZARD_STEPS[stepIndex],
      number: stepIndex + 1,
      title: `Paso ${stepIndex + 1}: ${WIZARD_STEPS[stepIndex].label}`,
    };
  }, [state.step, WIZARD_STEPS]);

  const handleSave = async () => {
    dispatch({ type: 'SUBMIT_START' });

    if (!id) return;

    try {
      const startDateStr = format(state.assignmentStartDate!, 'yyyy-MM-dd');
      const endDateStr = state.assignmentEndDate
        ? format(state.assignmentEndDate, 'yyyy-MM-dd')
        : null;
      let horarioId = state.selectedTemplateId;

      if (state.scheduleSelectionType === 'new') {
        throw new Error(
          'No se puede crear una nueva plantilla en modo de edición.'
        );
      }

      if (!horarioId) {
        throw new Error('No se ha seleccionado un horario.');
      }

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

  const renderStepContent = () => {
    switch (state.step) {
      case 'selectSchedule':
        return (
          <Step2_SelectSchedule
            state={state}
            dispatch={dispatch}
            setTemplates={setTemplates}
            isEditMode={true}
          />
        );
      case 'setDates':
        return (
          <Step3_SetDates
            state={state}
            dispatch={dispatch}
            setScheduleTypes={setScheduleTypes}
          />
        );
      case 'summary':
        return (
          <Step4_Summary
            state={state}
            templates={templates}
            scheduleTypes={scheduleTypes}
          />
        );
      default:
        return null;
    }
  };

  return (
    <main className='p-6 md:p-8'>
      <BreadcrumbNav
        items={[
          { label: 'Horarios Asignados', href: '/horarios/asignados' },
          { label: 'Editar Asignación' },
        ]}
        backHref='/horarios/asignados'
      />

      <h1 className='text-3xl font-bold tracking-tight mt-4'>
        Editar Asignación de Horario
      </h1>

      <div className='my-8'>
        <WizardStepper
          steps={WIZARD_STEPS}
          currentStep={currentStepConfig.number}
        />
      </div>

      {state.error && (
        <>
          {state.error.includes(
            'se solapa con las siguientes asignaciones activas'
          ) ? (
            <ErrorWithLinks
              message={state.error}
              className='mb-4 max-w-4xl mx-auto'
            />
          ) : (
            <Alert variant='destructive' className='mb-4 max-w-4xl mx-auto'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      <div className='max-w-4xl mx-auto'>
        <Card className='bg-zinc-900 border-zinc-800'>
          <CardHeader>
            <CardTitle>{currentStepConfig.title}</CardTitle>
            <p className='text-muted-foreground pt-1'>
              {currentStepConfig.description}
            </p>
          </CardHeader>
          <CardContent className='min-h-[350px] p-6'>
            {renderStepContent()}
          </CardContent>
          <CardFooter className='flex justify-between items-center bg-zinc-900/50 p-4 rounded-b-lg border-t border-zinc-800'>
            <div className='flex-grow'>
              {state.selectedEmployee && (
                <div className='flex items-center gap-3'>
                  <div className='flex-shrink-0 h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center'>
                    <User className='h-5 w-5 text-blue-400' />
                  </div>
                  <div>
                    <p className='font-semibold text-sm text-white'>
                      {state.selectedEmployee.nombreCompleto}
                    </p>
                    <p className='text-xs text-zinc-400'>
                      ID: {state.selectedEmployee.id}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className='flex gap-4'>
              <Button
                variant='outline'
                onClick={handleBack}
                className='flex items-center gap-2'
                disabled={state.step === 'selectSchedule'}
              >
                <ArrowLeft className='h-4 w-4' />
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
                className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
              >
                {state.step === 'summary' ? (
                  state.isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )
                ) : (
                  'Siguiente'
                )}
                {state.step !== 'summary' && <ArrowRight className='h-4 w-4' />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
