"use client";

import * as React from "react";
import { useReducer } from "react";
import { WizardAction, WizardState } from "./types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeSearch } from "@/app/components/shared/employee-search";
import { HorarioTemplateDTO, TipoHorarioDTO } from "./types";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScheduleGridEditor } from "@/app/components/shared/schedule-grid-editor";
import { getHorarioTemplates } from "@/lib/api";
import { CalendarIcon, Loader2, User, Calendar as CalendarIcon2, CheckCircle, CalendarDays, ClipboardCheck, PartyPopper } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getScheduleTypes, checkOverlap, createHorarioTemplate, createHorarioAsignado } from "@/lib/api/schedule-api";
import { BreadcrumbNav } from "@/app/components/shared/breadcrumb-nav";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { VisualOptionCard } from "@/app/components/shared/visual-option-card";
import { NewScheduleTemplateForm } from "./components/NewScheduleTemplateForm";
import { FilePlus2, List, Briefcase, Star, Clock4 } from "lucide-react";
import { CompletionStep } from "./components/CompletionStep";
import { WizardStepper } from "@/app/components/shared/wizard-stepper";

const wizardReducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    
    case 'SELECT_EMPLOYEE':
      return { ...state, selectedEmployee: action.payload };

    case 'SET_SCHEDULE_SELECTION_TYPE':
        return { 
            ...state, 
            scheduleSelectionType: action.payload,
            selectedTemplateId: null, // Reset other option
            newScheduleData: initialState.newScheduleData, // Reset other option
        };
    
    case 'SET_NEWLY_CREATED_TEMPLATE_ID':
      return { ...state, newlyCreatedTemplateId: action.payload };

    case 'SELECT_EXISTING_TEMPLATE':
        return { ...state, selectedTemplateId: action.payload };

    case 'UPDATE_NEW_SCHEDULE_DATA':
        return { 
            ...state, 
            newScheduleData: { ...state.newScheduleData, ...action.payload }
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
      return { ...state, isSubmitting: false, step: 'completed' };
    
    case 'SUBMIT_ERROR':
        return { ...state, isSubmitting: false, error: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
};

const initialState: WizardState = {
    step: 'selectEmployee',
    selectedEmployee: null,
    scheduleSelectionType: null,
    selectedTemplateId: null,
    newScheduleData: {
        nombre: "",
        descripcion: "",
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

function Step2_SelectSchedule({ state, dispatch, setTemplates }: { 
    state: WizardState, 
    dispatch: React.Dispatch<WizardAction>,
    setTemplates: React.Dispatch<React.SetStateAction<HorarioTemplateDTO[]>> 
}) {
    const [templates, setLocalTemplates] = React.useState<HorarioTemplateDTO[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getHorarioTemplates();
                setLocalTemplates(data);
                setTemplates(data); // Lift state up
            } catch (err: any) {
                setError(err.message || "No se pudieron cargar las plantillas.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectionTypeChange = React.useCallback((value: string) => {
        dispatch({ type: 'SET_SCHEDULE_SELECTION_TYPE', payload: value as 'existing' | 'new' })
    }, [dispatch]);

    const handleTemplateSelectChange = React.useCallback((value: string) => {
        dispatch({ type: 'SELECT_EXISTING_TEMPLATE', payload: parseInt(value) })
    }, [dispatch]);

    const handleNewScheduleDataChange = React.useCallback((data: Partial<Omit<HorarioTemplateDTO, 'id'>>) => {
        dispatch({ type: 'UPDATE_NEW_SCHEDULE_DATA', payload: data });
    }, [dispatch]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Elige una Opción de Horario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <VisualOptionCard
                        icon={<List className="h-8 w-8" />}
                        title="Plantilla Existente"
                        description="Usa un horario predefinido."
                        isSelected={state.scheduleSelectionType === 'existing'}
                        onClick={() => handleSelectionTypeChange('existing')}
                    />
                    <VisualOptionCard
                        icon={<FilePlus2 className="h-8 w-8" />}
                        title="Nueva Plantilla"
                        description="Crea un horario personalizado."
                        isSelected={state.scheduleSelectionType === 'new'}
                        onClick={() => handleSelectionTypeChange('new')}
                    />
                </div>

                <AnimatePresence>
                    {state.scheduleSelectionType === 'existing' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="pl-2 pt-4 overflow-hidden"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin"/> Cargando plantillas...
                                </div>
                            ) : error ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : (
                                <Select
                                    value={state.selectedTemplateId?.toString()}
                                    onValueChange={handleTemplateSelectChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccione una plantilla..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(template => (
                                            <SelectItem key={template.id} value={template.id.toString()}>
                                                {template.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </motion.div>
                    )}

                    {state.scheduleSelectionType === 'new' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="pl-2 pt-4 overflow-hidden"
                        >
                            <NewScheduleTemplateForm 
                                scheduleData={state.newScheduleData}
                                onDataChange={handleNewScheduleDataChange}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}

function Step3_SetDates({ state, dispatch, setScheduleTypes }: { 
    state: WizardState, 
    dispatch: React.Dispatch<WizardAction>,
    setScheduleTypes: React.Dispatch<React.SetStateAction<TipoHorarioDTO[]>>
}) {
    const [scheduleTypes, setLocalScheduleTypes] = React.useState<TipoHorarioDTO[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchTypes = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getScheduleTypes();
                setLocalScheduleTypes(data);
                setScheduleTypes(data); // Lift state up
            } catch (err: any) {
                setError(err.message || "No se pudieron cargar los tipos de horario.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTypes();
    }, [setScheduleTypes]);

    const handleDateChange = (field: 'startDate' | 'endDate', date: Date | undefined) => {
        const { assignmentStartDate, assignmentEndDate } = state;
        const newStartDate = field === 'startDate' ? date : assignmentStartDate;
        const newEndDate = field === 'endDate' ? date : assignmentEndDate;
        dispatch({ type: 'SET_ASSIGNMENT_DATES', payload: { startDate: newStartDate ?? null, endDate: newEndDate ?? null }});
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Define las Fechas y el Tipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha de Inicio</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {state.assignmentStartDate ? format(state.assignmentStartDate, "PPP") : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={state.assignmentStartDate ?? undefined}
                                    onSelect={(date) => handleDateChange('startDate', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label>Fecha de Fin (Opcional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {state.assignmentEndDate ? format(state.assignmentEndDate, "PPP") : <span>Seleccione fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={state.assignmentEndDate ?? undefined}
                                    onSelect={(date) => handleDateChange('endDate', date)}
                                    disabled={{ before: state.assignmentStartDate ?? new Date(0) }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                {state.assignmentStartDate && state.assignmentEndDate && state.assignmentEndDate < state.assignmentStartDate && (
                    <p className="text-sm text-destructive">La fecha de fin debe ser posterior a la fecha de inicio.</p>
                )}

                <div className="space-y-2">
                    <Label>Tipo de Horario</Label>
                     {isLoading ? (
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin"/> Cargando tipos...
                         </div>
                    ) : error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {scheduleTypes.map(type => {
                                // A simple way to assign icons based on name
                                const getIcon = (name: string) => {
                                    if (name.toLowerCase().includes('jefe')) return <Briefcase className="h-8 w-8" />;
                                    if (name.toLowerCase().includes('especial')) return <Star className="h-8 w-8" />;
                                    return <Clock4 className="h-8 w-8" />;
                                }
                                
                                return (
                                    <VisualOptionCard
                                        key={type.id}
                                        icon={getIcon(type.nombre)}
                                        title={type.nombre}
                                        description={type.descripcion || ""}
                                        isSelected={state.selectedScheduleTypeId === type.id}
                                        onClick={() => dispatch({ type: 'SELECT_SCHEDULE_TYPE', payload: type.id })}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function Step4_Summary({ state, templates, scheduleTypes }: { state: WizardState; templates: HorarioTemplateDTO[], scheduleTypes: TipoHorarioDTO[] }) {
    const getTemplateName = (id: number | null) => {
        return templates.find(t => t.id === id)?.nombre || "N/A";
    };
    const getScheduleTypeName = (id: number | null) => {
        return scheduleTypes.find(t => t.id === id)?.nombre || "N/A";
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <h3 className="text-2xl font-bold text-center mb-4">Confirmar Asignación</h3>
             
             <Card>
                <CardHeader className="flex flex-row items-center space-x-4">
                    <User className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Empleado</CardTitle>
                        <p className="text-muted-foreground">Empleado que recibirá el horario.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xl font-semibold">{state.selectedEmployee?.nombreCompleto}</p>
                    <div className="text-sm text-muted-foreground">
                        {state.selectedEmployee?.rfc && <span>RFC: {state.selectedEmployee.rfc}</span>}
                    </div>
                </CardContent>
             </Card>

             <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center space-x-4">
                        <ClipboardCheck className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Horario Seleccionado</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {state.scheduleSelectionType === 'existing' ? (
                            <div>
                                <p className="font-semibold">{getTemplateName(state.selectedTemplateId)}</p>
                                <p className="text-sm text-muted-foreground">Plantilla existente</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-semibold">{state.newScheduleData.nombre}</p>
                                <p className="text-sm text-muted-foreground">Nueva plantilla con {state.newScheduleData.detalles.length} turnos</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex flex-row items-center space-x-4">
                        <CalendarDays className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Periodo de Asignación</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <p className="font-semibold">{state.assignmentStartDate ? format(state.assignmentStartDate, "PPP", { locale: es }) : 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Fecha de Inicio</p>
                        </div>
                         <div>
                            <p className="font-semibold">{state.assignmentEndDate ? format(state.assignmentEndDate, "PPP", { locale: es }) : 'Indefinida'}</p>
                            <p className="text-sm text-muted-foreground">Fecha de Fin</p>
                        </div>
                    </CardContent>
                </Card>
             </div>
        </div>
    );
}


export default function ScheduleAssignmentWizardPage() {
    const [state, dispatch] = useReducer(wizardReducer, initialState);
    const { toast } = useToast();
    // States to hold data for summary
    const [templates, setTemplates] = React.useState<HorarioTemplateDTO[]>([]);
    const [scheduleTypes, setScheduleTypes] = React.useState<TipoHorarioDTO[]>([]);

    // Pass setters down to children components to lift state up
    // This is a simple approach. For larger apps, consider Zustand or Context.
    const stableSetTemplates = React.useCallback(setTemplates, []);
    const stableSetScheduleTypes = React.useCallback(setScheduleTypes, []);
    
    const WIZARD_STEPS = [
        { label: "Empleado", id: 'selectEmployee' },
        { label: "Horario", id: 'selectSchedule' },
        { label: "Fechas", id: 'setDates' },
        { label: "Resumen", id: 'summary' },
        { label: "Finalizado", id: 'completed' }
    ];

    const currentStepNumber = React.useMemo(() => {
        const stepIndex = WIZARD_STEPS.findIndex(s => s.id === state.step);
        return stepIndex + 1;
    }, [state.step]);


    const handleSave = async () => {
        dispatch({ type: 'SUBMIT_START' });

        try {
            const startDateStr = format(state.assignmentStartDate!, "yyyy-MM-dd");
            const endDateStr = state.assignmentEndDate ? format(state.assignmentEndDate, "yyyy-MM-dd") : null;

            let horarioId = state.selectedTemplateId;

            // ** LÓGICA MODIFICADA **
            if (state.scheduleSelectionType === 'new') {
                // Si ya creamos la plantilla en un intento fallido anterior, usamos su ID
                if (state.newlyCreatedTemplateId) {
                    horarioId = state.newlyCreatedTemplateId;
                } else {
                    // Si no, la creamos ahora y guardamos su ID en el estado
                    if (!state.newScheduleData.nombre) {
                        throw new Error("El nombre de la nueva plantilla de horario es obligatorio.");
                    }
                    const newTemplate = await createHorarioTemplate(state.newScheduleData);
                    horarioId = newTemplate.id;
                    // Guardamos el ID para no volver a crearlo si algo falla después
                    dispatch({ type: 'SET_NEWLY_CREATED_TEMPLATE_ID', payload: horarioId });
                }
            }
            // ** FIN DE LA LÓGICA MODIFICADA **

            if (!horarioId) {
                throw new Error("No se ha seleccionado ni creado un horario.");
            }

            // El resto de la lógica (checkOverlap, createHorarioAsignado) permanece igual...
            const overlapResult = await checkOverlap({
                empleadoId: state.selectedEmployee!.id,
                fechaInicio: startDateStr,
                fechaFin: endDateStr,
                horarioId: horarioId,
            });

            if (overlapResult.hasOverlap) {
                throw new Error(overlapResult.message || "El empleado ya tiene un horario asignado que se solapa con las fechas y el horario seleccionados.");
            }

            await createHorarioAsignado({
                empleadoId: state.selectedEmployee!.id,
                horarioId: horarioId!,
                tipoHorarioId: state.selectedScheduleTypeId!,
                fechaInicio: startDateStr,
                fechaFin: endDateStr,
            });
            
            dispatch({ type: 'SUBMIT_SUCCESS' });

            toast({
                title: "Asignación Exitosa",
                description: `El horario ha sido asignado correctamente a ${state.selectedEmployee?.nombreCompleto}.`,
            });
            
            // Aquí puedes redirigir al usuario
            // router.push("/horarios/asignados");

        } catch (error: any) {
            console.error("Error al guardar la asignación:", error);
            dispatch({ type: 'SUBMIT_ERROR', payload: error.message || "Ocurrió un error desconocido." });
            toast({
                title: "Error en la Asignación",
                description: error.message || "No se pudo completar la operación. Por favor, intente de nuevo.",
                variant: "destructive",
            });
        }
    }

    const handleNext = () => {
        switch (state.step) {
            case 'selectEmployee':
                if (state.selectedEmployee) dispatch({ type: 'SET_STEP', payload: 'selectSchedule' });
                break;
            case 'selectSchedule':
                const isExistingValid = state.scheduleSelectionType === 'existing' && state.selectedTemplateId !== null;
                const isNewValid = state.scheduleSelectionType === 'new' && state.newScheduleData.nombre.trim() !== '' && state.newScheduleData.detalles.length > 0;
                if (isExistingValid || isNewValid) {
                    dispatch({ type: 'SET_STEP', payload: 'setDates' });
                }
                break;
            case 'setDates':
                const areDatesValid = !state.assignmentStartDate || !state.assignmentEndDate || state.assignmentEndDate >= state.assignmentStartDate;
                if (state.assignmentStartDate && state.selectedScheduleTypeId && areDatesValid) {
                    dispatch({ type: 'SET_STEP', payload: 'summary' });
                }
                break;
            case 'summary':
                handleSave();
                break;
        }
    }

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
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
             <BreadcrumbNav 
                items={[
                    { label: "Horarios Asignados", href: "/horarios/asignados" },
                    { label: "Registrar Nueva Asignación" }
                ]}
                backHref="/horarios/asignados"
             />

             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Asistente de Asignación de Horarios</h1>
                <Link href="/horarios/asignados">
                    <Button variant="outline">Cancelar</Button>
                </Link>
             </div>

           <div className="my-6">
                <WizardStepper steps={WIZARD_STEPS} currentStep={currentStepNumber} />
           </div>

            {state.error && (
                <Alert variant="destructive" className="mb-4 max-w-4xl mx-auto">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}

           <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">
                            {WIZARD_STEPS.find(s => s.id === state.step)?.label}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="min-h-[350px] p-6">
                        {state.step === 'selectEmployee' && (
                            <EmployeeSearch
                                value={state.selectedEmployee}
                                onChange={(emp) => dispatch({ type: 'SELECT_EMPLOYEE', payload: emp })}
                            />
                        )}
                        {state.step === 'selectSchedule' && (
                           <Step2_SelectSchedule state={state} dispatch={dispatch} setTemplates={stableSetTemplates} />
                        )}
                        {state.step === 'setDates' && (
                            <Step3_SetDates state={state} dispatch={dispatch} setScheduleTypes={stableSetScheduleTypes} />
                        )}
                        {state.step === 'summary' && (
                            <Step4_Summary state={state} templates={templates} scheduleTypes={scheduleTypes} />
                        )}
                        {state.step === 'completed' && (
                            <CompletionStep />
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {state.step !== 'completed' && (
                            <>
                                <Button variant="outline" onClick={handleBack} disabled={state.step === 'selectEmployee'}>
                                    Atrás
                                </Button>
                                <Button onClick={handleNext} disabled={
                                    (state.step === 'selectEmployee' && !state.selectedEmployee) ||
                                    (state.step === 'selectSchedule' && !(
                                        (state.scheduleSelectionType === 'existing' && state.selectedTemplateId !== null) ||
                                        (state.scheduleSelectionType === 'new' && state.newScheduleData.nombre.trim() !== '' && state.newScheduleData.detalles.length > 0)
                                    )) ||
                                    (state.step === 'setDates' && !(
                                        state.assignmentStartDate &&
                                        state.selectedScheduleTypeId &&
                                        (!state.assignmentEndDate || state.assignmentEndDate >= state.assignmentStartDate)
                                    ))
                                }>
                                    {state.step === 'summary' ? (
                                        state.isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            'Guardar Asignación'
                                        )
                                    ) : 'Siguiente'}
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>
           </div>
        </div>
    )
} 