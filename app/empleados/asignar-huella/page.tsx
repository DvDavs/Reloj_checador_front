'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { useWebSdkEnrollment } from '@/app/hooks/useWebSdkEnrollment';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

import {
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  AlertCircle,
  RefreshCcw,
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

import { HandSelector, fingerIndexToName } from './components/hand-selector';
import { WizardStepper } from '@/app/components/shared/wizard-stepper';
import { EmployeeSearch } from '@/app/components/shared/employee-search';
import { EmpleadoSimpleDTO } from '@/app/horarios/asignados/registrar/types';
import { PostFingerprintDialog } from './components/post-fingerprint-dialog';

// Componentes mejorados
import { EnhancedCard } from '@/app/components/shared/enhanced-card';

interface HuellaInfo {
  id: number;
  nombreDedo: string | null;
  uuid?: string;
}

const fingerNameToIndex: Record<string, number> = {
  'PULGAR DERECHO': 1,
  'ÍNDICE DERECHO': 2,
  'MEDIO DERECHO': 3,
  'ANULAR DERECHO': 4,
  'MEÑIQUE DERECHO': 5,
  'PULGAR IZQUIERDO': 6,
  'ÍNDICE IZQUIERDO': 7,
  'MEDIO IZQUIERDO': 8,
  'ANULAR IZQUIERDO': 9,
  'MEÑIQUE IZQUIERDO': 10,
};

//
// --------------------- Componente Principal ---------------------
//

function AsignarHuellaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmpleadoSimpleDTO | null>(null);

  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [existingHuellas, setExistingHuellas] = useState<HuellaInfo[]>([]);
  const [registeredThisSessionIndices, setRegisteredThisSessionIndices] =
    useState<number[]>([]);

  const [showPostDialog, setShowPostDialog] = useState(false);

  // Hook de WebSDK para enrollment
  const enrollment = useWebSdkEnrollment('intermediate');

  const fetchExistingHuellas = useCallback(async (empId: number) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get<HuellaInfo[]>(
        `/api/empleados/${empId}/huellas`
      );
      setExistingHuellas(response.data);
    } catch (err) {
      console.error('Error cargando huellas existentes:', err);
      setGeneralError('No se pudieron cargar las huellas existentes.');
      setExistingHuellas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetCaptureProcess = useCallback(() => {
    enrollment.reset();
    setIsLoading(false);
  }, [enrollment]);

  const handleFingerSelectChange = useCallback(
    (fingerIndex: number | null) => {
      resetCaptureProcess();
      setSelectedFinger(fingerIndex);

      if (fingerIndex !== null) {
        const existingIndices = existingHuellas.map(
          (h) => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1
        );

        if (
          existingIndices.includes(fingerIndex) ||
          registeredThisSessionIndices.includes(fingerIndex)
        ) {
          setGeneralError('Dedo ya registrado. Seleccione otro dedo.');
        }
      }
    },
    [existingHuellas, registeredThisSessionIndices, resetCaptureProcess]
  );

  // Iniciar captura con WebSDK y enviar enrollment cuando tenga 4 muestras
  const initiateEnrollmentProcess = useCallback(async () => {
    if (enrollment.selectedDevice && selectedFinger !== null) {
      await enrollment.startCapture();
    }
  }, [enrollment, selectedFinger]);

  // Enviar enrollment al backend cuando se hayan capturado 4 muestras
  useEffect(() => {
    if (
      enrollment.phase === 'enrollment_sending' &&
      selectedEmployee &&
      selectedFinger !== null
    ) {
      const dedoNombre = fingerIndexToName[selectedFinger].toUpperCase();
      enrollment
        .submitEnrollment(selectedEmployee.id, dedoNombre)
        .then((ok) => {
          if (ok) {
            if (!registeredThisSessionIndices.includes(selectedFinger)) {
              setRegisteredThisSessionIndices((prev) =>
                [...prev, selectedFinger].sort((a, b) => a - b)
              );
            }
            setTimeout(() => setCurrentStep(5), 1500);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment.phase]);

  // Cargar datos iniciales
  useEffect(() => {
    const empIdStr = searchParams.get('id');
    const empName = searchParams.get('nombre');
    let validId = false;
    if (empIdStr && /^\d+$/.test(empIdStr)) {
      validId = true;
    }

    if (empIdStr && empName && validId) {
      setSelectedEmployee({
        id: Number.parseInt(empIdStr, 10),
        nombreCompleto: empName,
      });
      setCurrentStep(2);
      fetchExistingHuellas(Number.parseInt(empIdStr, 10));
    } else {
      setCurrentStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchExistingHuellas(selectedEmployee.id);
    }
  }, [selectedEmployee, fetchExistingHuellas]);

  // Auto-iniciar captura cuando se llega al paso 4
  useEffect(() => {
    if (
      currentStep === 4 &&
      enrollment.selectedDevice &&
      selectedFinger !== null &&
      enrollment.phase === 'ready'
    ) {
      const alreadyReg = existingHuellas.map((h) => {
        const i = fingerNameToIndex[h.nombreDedo?.toUpperCase() || ''];
        return i || -1;
      });

      if (
        alreadyReg.includes(selectedFinger) ||
        registeredThisSessionIndices.includes(selectedFinger)
      ) {
        setGeneralError('Este dedo ya está registrado. Seleccione otro dedo.');
      } else {
        initiateEnrollmentProcess();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentStep,
    enrollment.selectedDevice,
    selectedFinger,
    enrollment.phase,
  ]);

  const goToNextStep = () => {
    setGeneralError(null);

    if (currentStep === 1) {
      if (!selectedEmployee) {
        setGeneralError('Seleccione un empleado.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!enrollment.selectedDevice) {
        setGeneralError('No se detectó ningún lector de huella.');
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (selectedFinger === null) {
        setGeneralError('Seleccione un dedo.');
        return;
      }
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (
        enrollment.phase !== 'enrollment_success' &&
        enrollment.phase !== 'enrollment_failed'
      ) {
        setGeneralError('Complete las 4 capturas antes de continuar.');
        return;
      }
      setCurrentStep(5);
      return;
    }
  };

  const goToPreviousStep = () => {
    setGeneralError(null);
    if (currentStep <= 1) return;

    if (currentStep === 3) {
      setSelectedFinger(null);
      resetCaptureProcess();
    }

    if (currentStep === 4) {
      enrollment.stopCapture();
      resetCaptureProcess();
      setSelectedFinger(null);
      setCurrentStep(2);
      return;
    }

    if (currentStep === 5) {
      setCurrentStep(2);
      resetCaptureProcess();
      setSelectedFinger(null);
      return;
    }

    setCurrentStep(currentStep - 1);
  };

  const handleFinish = () => {
    setShowPostDialog(true);
  };

  const handleRegisterAnotherFinger = () => {
    setCurrentStep(3);
    resetCaptureProcess();
    setSelectedFinger(null);
  };

  const handleGoToEmployees = () => {
    router.push('/empleados');
  };

  const handleCreateSchedule = () => {
    if (selectedEmployee) {
      const url = `/horarios/asignados/registrar?id=${selectedEmployee.id}&nombre=${encodeURIComponent(
        selectedEmployee.nombreCompleto
      )}`;
      router.push(url);
    } else {
      router.push('/horarios/asignados/registrar');
    }
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <EnhancedCard
          variant='elevated'
          padding='none'
          className='max-w-4xl mx-auto'
        >
          <div className='p-6 md:p-8'>
            <div className='flex items-center gap-2 mb-6'>
              <Users className='h-6 w-6 text-primary' />
              <div>
                <h2 className='text-xl font-semibold text-foreground'>
                  Paso 1: Selección de Empleado
                </h2>
                <p className='text-muted-foreground text-sm'>
                  Seleccione o busque el empleado al que desea asignar la
                  huella.
                </p>
              </div>
            </div>

            <div className='space-y-6'>
              <div className='space-y-3'>
                <Label className='text-sm font-medium text-foreground'>
                  Buscar empleado
                </Label>
                <EmployeeSearch
                  value={selectedEmployee}
                  onChange={(emp) => setSelectedEmployee(emp)}
                  showAllOnOpen={true}
                />
              </div>

              {selectedEmployee && (
                <EnhancedCard
                  variant='bordered'
                  padding='md'
                  className='bg-primary/5 border-primary/20'
                >
                  <div className='flex items-center gap-4'>
                    <div className='h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20'>
                      <Users className='h-8 w-8 text-primary' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-xl font-bold text-foreground'>
                        {selectedEmployee.nombreCompleto}
                      </h3>
                      <p className='text-muted-foreground'>
                        Numero de tarjeta:{' '}
                        {selectedEmployee.numTarjetaTrabajador}
                      </p>
                      <div className='mt-2'>
                        <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'>
                          ✓ Empleado seleccionado
                        </span>
                      </div>
                    </div>
                  </div>
                </EnhancedCard>
              )}
            </div>
          </div>

          <div className='border-t border-border bg-muted/30 px-6 md:px-8 py-4'>
            <div className='flex justify-between items-center'>
              <Link href='/empleados'>
                <Button
                  variant='outline'
                  className='border-2 border-border hover:border-primary hover:bg-primary/5'
                >
                  Cancelar
                </Button>
              </Link>
              <Button
                onClick={goToNextStep}
                disabled={!selectedEmployee}
                className='bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200'
              >
                Continuar
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </div>
          </div>
        </EnhancedCard>
      );
    }

    if (currentStep === 2) {
      return (
        <Card className='max-w-3xl mx-auto'>
          <CardHeader>
            <CardTitle>Paso 2: Detección de Lector (WebSDK)</CardTitle>
            <CardDescription>
              El lector se detecta automáticamente desde tu equipo local.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div className='flex items-center gap-4 mb-6'>
                <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                  <Users className='h-8 w-8 text-primary' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-foreground'>
                    {selectedEmployee?.nombreCompleto}
                  </h2>
                  <p className='text-muted-foreground'>
                    Numero de tarjeta: {selectedEmployee?.numTarjetaTrabajador}
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label className='text-sm font-medium text-muted-foreground'>
                  Lector de Huellas (Local)
                </Label>

                {enrollment.phase === 'initializing' ||
                enrollment.phase === 'not_initialized' ? (
                  <div className='p-4 border rounded-lg flex items-center gap-3'>
                    <Loader2 className='h-5 w-5 animate-spin text-primary' />
                    <span className='text-muted-foreground'>
                      Detectando lectores...
                    </span>
                  </div>
                ) : enrollment.phase === 'error' ? (
                  <div className='p-4 border border-destructive/30 rounded-lg flex items-center gap-3'>
                    <AlertCircle className='h-5 w-5 text-destructive' />
                    <span className='text-destructive'>
                      {enrollment.errorMessage}
                    </span>
                  </div>
                ) : enrollment.devices.length === 0 ? (
                  <div className='p-4 border border-yellow-300/50 rounded-lg flex items-center gap-3'>
                    <AlertCircle className='h-5 w-5 text-yellow-500' />
                    <span className='text-muted-foreground'>
                      No se detectó ningún lector. Conecte un lector y recargue
                      la página.
                    </span>
                  </div>
                ) : (
                  <>
                    {enrollment.devices.length > 1 ? (
                      <Select
                        value={enrollment.selectedDevice ?? ''}
                        onValueChange={(val) => enrollment.selectDevice(val)}
                      >
                        <SelectTrigger className='flex-1'>
                          <SelectValue placeholder='Seleccionar lector...' />
                        </SelectTrigger>
                        <SelectContent>
                          {enrollment.devices.map((deviceId) => (
                            <SelectItem key={deviceId} value={deviceId}>
                              {deviceId.substring(0, 40)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : null}
                    {enrollment.selectedDevice && (
                      <div className='p-2 bg-primary/10 border border-primary/20 rounded-lg text-primary flex items-center gap-2'>
                        <CheckCircle className='h-5 w-5' />
                        Lector detectado:{' '}
                        {enrollment.selectedDevice.substring(0, 40)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline' onClick={goToPreviousStep}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver
            </Button>
            <Button
              onClick={goToNextStep}
              disabled={!enrollment.selectedDevice}
            >
              Continuar
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (currentStep === 3) {
      return (
        <Card className='max-w-4xl mx-auto'>
          <CardHeader className='pb-2'>
            <CardTitle>Paso 3: Selección de Dedo</CardTitle>
            <CardDescription className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-green-600 border border-green-500 mr-1'></span>
                Ya registrado
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-accent border border-accent mr-1'></span>
                Registrado en esta sesión
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-primary border border-primary mr-1'></span>
                Seleccionado
              </span>
              <span className='inline-flex items-center'>
                <span className='inline-block w-3 h-3 rounded-full bg-muted-foreground border border-muted-foreground mr-1'></span>
                Disponible
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-2'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3 mb-2 bg-muted/50 p-2 rounded-md'>
                <div className='h-12 w-12 bg-muted rounded-full flex items-center justify-center'>
                  <Users className='h-6 w-6 text-primary' />
                </div>
                <div>
                  <h2 className='text-lg font-bold text-foreground'>
                    {selectedEmployee?.nombreCompleto}
                  </h2>
                  <p className='text-xs text-muted-foreground'>
                    Lector:{' '}
                    {enrollment.selectedDevice?.substring(0, 30) ?? 'WebSDK'}
                  </p>
                </div>
              </div>

              <HandSelector
                selectedFinger={selectedFinger}
                setSelectedFinger={handleFingerSelectChange}
                existingFingerIndices={existingHuellas
                  .map(
                    (h) => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? '']
                  )
                  .filter((i) => i > 0)}
                registeredThisSessionIndices={registeredThisSessionIndices}
              />

              {enrollment.errorMessage && (
                <div className='p-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2'>
                  <AlertCircle className='h-4 w-4' /> {enrollment.errorMessage}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className='flex justify-between pt-3'>
            <Button variant='outline' onClick={goToPreviousStep}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Volver
            </Button>
            <Button onClick={goToNextStep} disabled={selectedFinger === null}>
              Continuar
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </CardFooter>
        </Card>
      );
    }

    if (currentStep === 4) {
      const isSuccess =
        enrollment.phase === 'enrollment_success' ||
        enrollment.phase === 'capture_success';
      const isFailed =
        enrollment.phase === 'enrollment_failed' ||
        enrollment.phase === 'capture_failed';
      const isWorking =
        enrollment.phase === 'capturing' ||
        enrollment.phase === 'enrollment_sending';

      return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <Card>
            <CardHeader>
              <CardTitle>Paso 4: Captura de Huella (WebSDK)</CardTitle>
              <CardDescription>
                Completa {enrollment.samplesNeeded} capturas para registrar la
                huella de{' '}
                {selectedFinger ? fingerIndexToName[selectedFinger] : '???'}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                  <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                    <Users className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <h2 className='text-xl font-bold text-foreground'>
                      {selectedEmployee?.nombreCompleto}
                    </h2>
                    <p className='text-muted-foreground'>
                      Dedo:{' '}
                      {selectedFinger ? fingerIndexToName[selectedFinger] : ''}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-medium mb-3'>Progreso</h3>
                  <div className='flex justify-between items-center gap-2'>
                    {Array.from({ length: enrollment.samplesNeeded }).map(
                      (_, index) => {
                        const stepDone = enrollment.capturedSamples > index;
                        const stepActive =
                          enrollment.phase === 'capturing' &&
                          enrollment.capturedSamples === index;
                        return (
                          <motion.div
                            key={index}
                            className={`h-3 flex-1 rounded-full ${
                              stepDone
                                ? 'bg-green-500'
                                : stepActive
                                  ? 'bg-primary animate-pulse'
                                  : 'bg-muted'
                            }`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                          />
                        );
                      }
                    )}
                  </div>
                </div>

                <div className='min-h-[4rem] p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg text-center flex items-center justify-center'>
                  {enrollment.errorMessage ? (
                    <div className='flex items-center gap-2'>
                      <AlertCircle className='h-5 w-5 text-destructive' />
                      <p className='text-destructive font-medium'>
                        {enrollment.errorMessage}
                      </p>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      {isWorking && (
                        <Loader2 className='h-5 w-5 animate-spin text-primary' />
                      )}
                      {enrollment.phase === 'capturing' &&
                        enrollment.capturedSamples <
                          enrollment.samplesNeeded && (
                          <Fingerprint className='h-5 w-5 text-primary animate-pulse' />
                        )}
                      {enrollment.phase === 'enrollment_success' && (
                        <CheckCircle className='h-5 w-5 text-green-600' />
                      )}
                      <p className='text-base font-medium text-foreground'>
                        {enrollment.feedbackMessage || 'Preparando...'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className='flex justify-between'>
              <Button
                variant='outline'
                onClick={goToPreviousStep}
                disabled={
                  enrollment.phase === 'enrollment_sending' ||
                  enrollment.phase === 'enrollment_success'
                }
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Volver
              </Button>

              {enrollment.phase === 'enrollment_failed' ? (
                <Button
                  onClick={() => {
                    enrollment.reset();
                    initiateEnrollmentProcess();
                  }}
                  variant='secondary'
                >
                  <RefreshCcw className='mr-2 h-4 w-4' />
                  Reintentar
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  disabled={enrollment.phase !== 'enrollment_success'}
                >
                  Continuar
                  <ArrowRight className='ml-2 h-4 w-4' />
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escáner de Huella</CardTitle>
              <CardDescription>
                Lector:{' '}
                {enrollment.selectedDevice?.substring(0, 30) ?? 'WebSDK'}
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col items-center justify-center py-8'>
              <div className='relative mb-6 flex h-64 w-64 items-center justify-center'>
                <svg
                  className='absolute h-56 w-56'
                  viewBox='0 0 100 100'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <g
                    className='fingerprint-base'
                    stroke={
                      enrollment.phase === 'capture_success' ||
                      enrollment.phase === 'enrollment_success'
                        ? 'hsl(142 76% 36% / 0.3)'
                        : enrollment.phase === 'capture_failed' ||
                            enrollment.phase === 'enrollment_failed' ||
                            enrollment.phase === 'error'
                          ? 'hsl(var(--destructive) / 0.3)'
                          : 'hsl(var(--primary) / 0.3)'
                    }
                    fill='none'
                    strokeWidth='2'
                  >
                    <path d='M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z' />
                    <path d='M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z' />
                    <path d='M50,25 C35,25 25,35 25,50 C25,65 35,75 50,75 C65,75 75,65 75,50 C75,35 65,25 50,25 Z' />
                    <path d='M50,30 C37,30 30,40 30,50 C30,60 37,70 50,70 C63,70 70,60 70,50 C70,40 63,30 50,30 Z' />
                    <path d='M50,35 C40,35 35,42 35,50 C35,58 40,65 50,65 C60,65 65,58 65,50 C65,42 60,35 50,35 Z' />
                    <path d='M50,40 C42,40 40,45 40,50 C40,55 42,60 50,60 C58,60 60,55 60,50 C60,45 58,40 50,40 Z' />
                    <path d='M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z' />
                  </g>
                </svg>

                {(enrollment.phase === 'ready' ||
                  enrollment.phase === 'capturing') && (
                  <>
                    <motion.div
                      className='absolute h-56 w-56 rounded-full bg-primary/10'
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 0.5, 0.7],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div
                      className='absolute'
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{
                        duration: 1,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: 'easeInOut',
                      }}
                    >
                      <Fingerprint className='h-36 w-36 text-primary/80' />
                    </motion.div>
                  </>
                )}

                {(enrollment.phase === 'capture_success' ||
                  enrollment.phase === 'enrollment_success') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <CheckCircle className='h-32 w-32 text-green-500' />
                  </motion.div>
                )}

                {(enrollment.phase === 'capture_failed' ||
                  enrollment.phase === 'enrollment_failed' ||
                  enrollment.phase === 'error') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      duration: 0.2,
                    }}
                  >
                    <XCircle className='h-32 w-32 text-red-500' />
                  </motion.div>
                )}

                {enrollment.phase === 'enrollment_sending' && (
                  <Loader2 className='h-24 w-24 animate-spin text-primary' />
                )}
              </div>

              <div className='text-center mb-6'>
                <p className='text-xl font-medium text-foreground'>
                  {enrollment.phase === 'capturing' &&
                    'Coloque el dedo en el lector'}
                  {enrollment.phase === 'capture_success' &&
                    'Huella capturada correctamente'}
                  {enrollment.phase === 'capture_failed' &&
                    'Error al capturar la huella'}
                  {enrollment.phase === 'enrollment_sending' &&
                    'Guardando huella en el servidor...'}
                  {enrollment.phase === 'enrollment_success' &&
                    '¡Huella guardada con éxito!'}
                  {enrollment.phase === 'enrollment_failed' &&
                    'Error al guardar la huella'}
                  {enrollment.phase === 'error' && 'Error en el proceso'}
                </p>
                <p className='text-sm text-muted-foreground mt-2'>
                  Capturas: {enrollment.capturedSamples}/
                  {enrollment.samplesNeeded}
                </p>
              </div>

              {enrollment.phase === 'enrollment_success' ? (
                <div className='flex flex-col gap-3 items-center'>
                  <Button
                    className='bg-green-600 hover:bg-green-700 text-white w-48'
                    onClick={goToNextStep}
                  >
                    <CheckCircle className='mr-2 h-5 w-5' />
                    ¡Continuar!
                  </Button>
                  <p className='text-sm text-green-600 text-center'>
                    Huella registrada exitosamente
                  </p>
                </div>
              ) : enrollment.phase === 'enrollment_failed' ? (
                <div className='flex flex-col gap-3 items-center'>
                  <Button
                    variant='secondary'
                    className='w-48'
                    onClick={() => {
                      enrollment.reset();
                      initiateEnrollmentProcess();
                    }}
                  >
                    <RefreshCcw className='mr-2 h-5 w-5' />
                    Reintentar
                  </Button>
                  <p className='text-sm text-muted-foreground text-center'>
                    Error al guardar, intente nuevamente
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      );
    }

    if (currentStep === 5) {
      return (
        <Card className='max-w-3xl mx-auto'>
          <CardHeader className='text-center'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className='mx-auto mb-2'
            >
              <CheckCircle className='h-12 w-12 text-green-600' />
            </motion.div>
            <CardTitle>¡Éxito!</CardTitle>
            <CardDescription>Huella registrada correctamente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col items-center justify-center py-4'>
              <h2 className='text-xl font-bold mb-2 text-foreground'>
                Empleado: {selectedEmployee?.nombreCompleto}
              </h2>
              <p className='text-muted-foreground mb-6'>
                Se registró el dedo:{' '}
                {selectedFinger ? fingerIndexToName[selectedFinger] : '???'}
              </p>

              <div className='bg-muted/50 rounded-lg p-6 w-full max-w-md mb-6'>
                <div className='flex items-center gap-4 mb-4'>
                  <div className='h-16 w-16 bg-muted rounded-full flex items-center justify-center'>
                    <Fingerprint className='h-8 w-8 text-primary' />
                  </div>
                  <div>
                    <h3 className='text-xl font-bold text-foreground'>
                      {selectedEmployee?.nombreCompleto}
                    </h3>
                    <p className='text-muted-foreground'>
                      Numero de tarjeta:{' '}
                      {selectedEmployee?.numTarjetaTrabajador}
                    </p>
                  </div>
                </div>

                <div className='space-y-2 text-sm text-muted-foreground'>
                  <p>
                    <span className='font-medium text-foreground'>
                      Lector utilizado:
                    </span>{' '}
                    {enrollment.selectedDevice?.substring(0, 30) ?? 'WebSDK'}
                  </p>
                  <p>
                    <span className='font-medium text-foreground'>
                      Dedos registrados en esta sesión:
                    </span>{' '}
                    {registeredThisSessionIndices.length}
                  </p>
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {registeredThisSessionIndices.map((finger) => (
                      <span
                        key={finger}
                        className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs'
                      >
                        {fingerIndexToName[finger]}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className='flex justify-center gap-3'>
            <Button variant='outline' onClick={handleRegisterAnotherFinger}>
              Registrar Otro Dedo
            </Button>
            <Button variant='outline' onClick={handleFinish}>
              Finalizar
            </Button>
            <Link href='/'>
              <Button variant='ghost'>Inicio</Button>
            </Link>
          </CardFooter>
        </Card>
      );
    }

    return <p className='text-center'>Paso desconocido.</p>;
  };

  //
  // --------------------- Render Principal ---------------------
  //

  const STEPS = [
    { label: 'Empleado' },
    { label: 'Lector' },
    { label: 'Dedo' },
    { label: 'Captura' },
    { label: 'Finalizado' },
  ];

  return (
    <div className='min-h-screen bg-background'>
      <div className='p-6 md:p-8'>
        <div className='max-w-6xl mx-auto space-y-6'>
          {/* Header mejorado */}
          <EnhancedCard variant='elevated' padding='lg'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='space-y-1'>
                <h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
                  Asignar Huella Digital
                </h1>
                <div className='h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full'></div>
              </div>
            </div>
          </EnhancedCard>

          {/* Stepper (diseño V2) */}
          <WizardStepper
            steps={STEPS}
            currentStep={currentStep}
            className='mb-8'
          />

          {/* Mensaje de error general */}
          {generalError && currentStep !== 4 && (
            <EnhancedCard
              variant='elevated'
              padding='md'
              className='border-red-200/60 dark:border-red-800'
            >
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-lg dark:bg-red-900/30'>
                  <AlertCircle className='h-5 w-5 text-red-600 dark:text-red-400' />
                </div>
                <div className='flex-1'>
                  <p className='text-red-800 dark:text-red-300 font-medium'>
                    Error
                  </p>
                  <p className='text-red-700 dark:text-red-400 text-sm'>
                    {generalError}
                  </p>
                </div>
                <button
                  className='text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors'
                  onClick={() => setGeneralError(null)}
                  title='Cerrar'
                >
                  <XCircle className='h-5 w-5' />
                </button>
              </div>
            </EnhancedCard>
          )}

          {/* Mensaje cuando no hay lectores disponibles (WebSDK) */}
          {currentStep === 2 &&
            enrollment.phase === 'no_devices' &&
            !generalError && (
              <EnhancedCard
                variant='elevated'
                padding='md'
                className='border-yellow-200/60 dark:border-yellow-800'
              >
                <div className='flex items-center gap-3'>
                  <div className='p-2 bg-yellow-100 rounded-lg dark:bg-yellow-900/30'>
                    <AlertCircle className='h-5 w-5 text-yellow-600 dark:text-yellow-400' />
                  </div>
                  <div>
                    <p className='text-yellow-800 dark:text-yellow-300 font-medium'>
                      Sin lectores disponibles
                    </p>
                    <p className='text-yellow-700 dark:text-yellow-400 text-sm'>
                      Conecte un lector de huellas y recargue la página.
                      Asegúrese de que el agente DigitalPersona esté en
                      ejecución.
                    </p>
                  </div>
                </div>
              </EnhancedCard>
            )}

          {/* Transición de paso */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <PostFingerprintDialog
        isOpen={showPostDialog}
        onClose={() => setShowPostDialog(false)}
        onCreateSchedule={handleCreateSchedule}
        onGoToEmployees={handleGoToEmployees}
        employeeName={selectedEmployee?.nombreCompleto || 'Empleado'}
      />
    </div>
  );
}

//
// Export principal con Suspense
//
export default function AsignarHuellaPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-background flex items-center justify-center'>
          <EnhancedCard variant='elevated' padding='xl'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='relative'>
                <div className='absolute inset-0 rounded-full bg-primary/30 animate-ping'></div>
                <Loader2 className='relative h-10 w-10 animate-spin text-primary' />
              </div>
              <div className='text-center space-y-1'>
                <p className='text-lg font-medium text-foreground'>
                  Cargando sistema de huellas...
                </p>
                <p className='text-sm text-muted-foreground'>
                  Preparando el entorno de captura
                </p>
              </div>
            </div>
          </EnhancedCard>
        </div>
      }
    >
      <AsignarHuellaContent />
    </Suspense>
  );
}
