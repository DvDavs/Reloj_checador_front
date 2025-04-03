"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Fingerprint, CheckCircle, XCircle, Users, Home, UserPlus, Loader2, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import axios from 'axios';
import { getBrowserSessionId } from '@/lib/sessionId'; // Importa el helper
import React from "react";

// --- Tipos ---
type ScannerStatus = "online" | "offline" | "error" | "reserved";
interface FingerprintScanner { id: string; name: string; status: ScannerStatus; }
interface Employee { id: string; numeroTarjeta: string; nombre: string; area: string; }
interface EnrollmentResponse { complete: boolean; remaining?: number; template?: string; } // Respuesta de /enroll/capture
type ScanState = "idle" | "scanning" | "success" | "failed" | "error";

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOTAL_CAPTURE_ATTEMPTS = 4;
const fingerNames = [ "", "Pulgar Derecho", "Índice Derecho", "Medio Derecho", "Anular Derecho", "Meñique Derecho", "Pulgar Izquierdo", "Índice Izquierdo", "Medio Izquierdo", "Anular Izquierdo", "Meñique Izquierdo", ]; // index 0 vacío

// --- Componente HandSelector (sin cambios, asumiendo que existe como lo definiste antes) ---
const HandSelector = ({ selectedFinger, setSelectedFinger, registeredFingers }: { selectedFinger: number | null; setSelectedFinger: (finger: number | null) => void; registeredFingers: number[] }) => {
    // ... (Tu código SVG para el selector de manos aquí) ...
    // Asegúrate que al hacer clic llame a setSelectedFinger(fingerIndex) o setSelectedFinger(null) si ya estaba seleccionado
    // Y que marque visualmente los `registeredFingers`
     return (
         <div className="flex flex-col md:flex-row gap-8 justify-center p-4 bg-zinc-800/30 rounded-lg">
             {/* Mano Derecha (1-5) */}
            <div className="relative text-center">
                 <h3 className="mb-2 font-medium text-zinc-300">Mano Derecha</h3>
                 <svg width="150" height="200" viewBox="0 0 150 200" className="mx-auto">
                    {/* Palma */}
                    <path d="M45 80 C45 60 60 50 75 50 C90 50 105 60 105 80 L105 150 C105 170 90 180 75 180 C60 180 45 170 45 150 Z" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
                    {/* Dedos (simplificado) */}
                    {[1, 2, 3, 4, 5].map((fingerIndex, i) => {
                        const isSelected = selectedFinger === fingerIndex;
                        const isRegistered = registeredFingers.includes(fingerIndex);
                        const x = 30 + i * 20;
                        const y = (i === 0) ? 60 : (i === 4 ? 70 : 40) - Math.abs(i - 2) * 10; // Posiciones aproximadas
                        const height = (i === 0 || i === 4) ? 30 : 45 - Math.abs(i - 2) * 5;
                        return (
                            <g key={fingerIndex} onClick={() => setSelectedFinger(isSelected ? null : fingerIndex)} className="cursor-pointer group" opacity={isRegistered ? 0.5 : 1}>
                                <rect x={x - 8} y={y - height} width="16" height={height} rx="8" fill={isSelected ? "#a855f7" : "#3a3a3a"} stroke="#444" strokeWidth="1" className={`transition-colors ${!isRegistered && 'group-hover:fill-purple-700'}`} />
                                {isRegistered && <CheckCircle className="text-green-500" size={14} x={x-7} y={y-height+2} />}
                                <text x={x} y={y - height / 2} textAnchor="middle" fill="white" fontSize="10" dy=".3em">{fingerIndex}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
              {/* Mano Izquierda (6-10) */}
            <div className="relative text-center">
                <h3 className="mb-2 font-medium text-zinc-300">Mano Izquierda</h3>
                <svg width="150" height="200" viewBox="0 0 150 200" className="mx-auto">
                    <path d="M105 80 C105 60 90 50 75 50 C60 50 45 60 45 80 L45 150 C45 170 60 180 75 180 C90 180 105 170 105 150 Z" fill="#2a2a2a" stroke="#444" strokeWidth="1"/>
                    {[6, 7, 8, 9, 10].map((fingerIndex, i) => {
                         const isSelected = selectedFinger === fingerIndex;
                         const isRegistered = registeredFingers.includes(fingerIndex);
                         const x = 120 - i * 20; // Invertido
                         const y = (i === 0) ? 60 : (i === 4 ? 70 : 40) - Math.abs(i - 2) * 10;
                         const height = (i === 0 || i === 4) ? 30 : 45 - Math.abs(i - 2) * 5;
                        return (
                            <g key={fingerIndex} onClick={() => setSelectedFinger(isSelected ? null : fingerIndex)} className="cursor-pointer group" opacity={isRegistered ? 0.5 : 1}>
                                <rect x={x - 8} y={y - height} width="16" height={height} rx="8" fill={isSelected ? "#a855f7" : "#3a3a3a"} stroke="#444" strokeWidth="1" className={`transition-colors ${!isRegistered && 'group-hover:fill-purple-700'}`} />
                                 {isRegistered && <CheckCircle className="text-green-500" size={14} x={x-7} y={y-height+2} />}
                                <text x={x} y={y - height / 2} textAnchor="middle" fill="white" fontSize="10" dy=".3em">{fingerIndex}</text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
     );
};


// --- Componente Principal ---
function AsignarHuellaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeIdParam = searchParams.get("id");
  const employeeNameParam = searchParams.get("nombre");

  // Estados del Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null); // Omitir paso 1 si viene con ID/Nombre
  const [availableReaders, setAvailableReaders] = useState<FingerprintScanner[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>(""); // Guardar nombre del lector
  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [registeredFingers, setRegisteredFingers] = useState<number[]>([]); // Dedos ya registrados en *esta sesión*

  // Estado de Captura y Enrolamiento
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [captureAttempts, setCaptureAttempts] = useState<number>(0); // Intentos para el dedo actual
  const [captureSuccessFlags, setCaptureSuccessFlags] = useState<boolean[]>(Array(TOTAL_CAPTURE_ATTEMPTS).fill(false)); // Éxito de cada intento
  const [enrollmentSessionId, setEnrollmentSessionId] = useState<string | null>(null);
  const [enrollmentProgressMsg, setEnrollmentProgressMsg] = useState<string>("");

  // Sesión del Navegador
  const [browserSessionId, setBrowserSessionId] = useState('');

  // --- Effects ---

  // 1. Inicializar Empleado y Session ID
  useEffect(() => {
    setBrowserSessionId(getBrowserSessionId()); // Obtener session ID del navegador
    if (employeeIdParam && employeeNameParam) {
      // Si vienen parámetros, asumimos que el empleado está seleccionado
      setSelectedEmployee({
        id: employeeIdParam, // Puede ser "nuevo" o un ID numérico
        nombre: employeeNameParam,
        numeroTarjeta: employeeIdParam === "nuevo" ? "Nuevo" : `EMP-${employeeIdParam}`, // Placeholder
        area: 'Desconocida', // Placeholder
      });
      setCurrentStep(2); // Saltar directamente al paso 2 (Selección de Lector)
    } else {
      setCurrentStep(1); // Empezar desde el paso 1 si no hay parámetros
      // Aquí podrías cargar la lista de empleados si el paso 1 fuera necesario
    }
  }, [employeeIdParam, employeeNameParam]);

  // 2. Cargar Lectores cuando se llega al Paso 2
  useEffect(() => {
    if (currentStep === 2 && browserSessionId) {
      fetchAvailableReaders();
    }
  }, [currentStep, browserSessionId]);

  // 3. Iniciar Enrolamiento al llegar al Paso 4 o cambiar de dedo
   useEffect(() => {
    if (currentStep === 4 && selectedScanner && selectedFinger !== null && !enrollmentSessionId) {
      // Solo iniciar si no hay ya una sesión de enroll activa para este dedo/lector
      handleStartEnrollment();
    }
   }, [currentStep, selectedScanner, selectedFinger, enrollmentSessionId]); // Dependencias clave

  // 4. Limpieza: Liberar lector si se desmonta el componente
  useEffect(() => {
    const sessionId = browserSessionId || getBrowserSessionId(); // Asegurar tenerlo
    const readerToRelease = selectedScanner; // Capturar valor actual

    return () => {
      if (readerToRelease && sessionId) {
        const release = async () => {
          try {
            await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(readerToRelease)}?sessionId=${sessionId}`);
            console.log(`Lector ${readerToRelease} liberado en cleanup.`);
          } catch (err) {
            console.error("Error liberando lector en cleanup:", err);
          }
        };
        // Intentar liberar al desmontar
        release();
      }
    };
  }, [selectedScanner, browserSessionId]); // Depende de estos estados

  // --- Funciones de Lógica ---

  // Cargar lectores disponibles
  const fetchAvailableReaders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAvailableReaders([]);
    try {
      // Opcional: auto-select
      // await axios.get(`${API_BASE_URL}/api/v1/multi-fingerprint/auto-select`);

      const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/multi-fingerprint/readers`);
      const readers = response.data.map(name => ({
          id: name, name: name, status: 'online' as ScannerStatus
      }));
      setAvailableReaders(readers);
      if (readers.length === 0) setError("No se encontraron lectores disponibles.");

    } catch (err: any) {
      console.error("Error fetching readers:", err);
      setError(err.response?.data || "Error al cargar lectores.");
      setAvailableReaders([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]);

  // Seleccionar y reservar lector
  const handleSelectReader = useCallback(async (readerName: string) => {
    setError(null);
    setIsLoading(true);
    const sessionId = browserSessionId || getBrowserSessionId();

    // Liberar lector previo si había uno diferente seleccionado
    if (selectedScanner && selectedScanner !== readerName) {
        try {
           await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedScanner)}?sessionId=${sessionId}`);
           console.log(`Lector previo ${selectedScanner} liberado.`);
        } catch (err) { console.warn("No se pudo liberar lector previo:", err); }
    }

    // Intentar reservar el nuevo lector
    try {
        await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(readerName)}?sessionId=${sessionId}`);
        setSelectedScanner(readerName); // Guardar el nombre
        console.log(`Lector ${readerName} reservado para ${sessionId}`);
    } catch (err: any) {
        console.error("Error reservando lector:", err);
        setError(err.response?.data || `No se pudo reservar el lector "${readerName}". Puede que esté en uso.`);
        setSelectedScanner(""); // Limpiar selección si falla
    } finally {
        setIsLoading(false);
    }
  }, [API_BASE_URL, browserSessionId, selectedScanner]);

  // Seleccionar dedo
  const handleFingerSelect = useCallback((fingerIndex: number | null) => {
    if (fingerIndex !== null && registeredFingers.includes(fingerIndex)) {
      setError("Este dedo ya fue registrado en esta sesión.");
      setSelectedFinger(null); // Deseleccionar si ya está registrado
      return;
    }
    setError(null);
    setSelectedFinger(fingerIndex);
    // Resetear estado de captura para el nuevo dedo/deselección
    setCaptureAttempts(0);
    setCaptureSuccessFlags(Array(TOTAL_CAPTURE_ATTEMPTS).fill(false));
    setEnrollmentSessionId(null); // Forzar a iniciar nueva sesión de enroll para este dedo
    setScanState("idle");
    setEnrollmentProgressMsg("");
  }, [registeredFingers]);

 // Iniciar sesión de enrolamiento en el backend
 const handleStartEnrollment = useCallback(async () => {
    if (!selectedScanner || selectedFinger === null) {
      setError("Seleccione un lector y un dedo primero.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setScanState("idle");
    setEnrollmentProgressMsg("Iniciando enrolamiento...");
    try {
      console.log(`Iniciando enroll para lector ${selectedScanner}`);
      const response = await axios.post<string>(`${API_BASE_URL}/api/v1/multi-fingerprint/enroll/start/${encodeURIComponent(selectedScanner)}`);
      setEnrollmentSessionId(response.data);
      setEnrollmentProgressMsg(`Listo para captura 1 de ${TOTAL_CAPTURE_ATTEMPTS}. Coloque el dedo ${fingerNames[selectedFinger]} en el lector.`);
      console.log("Enrollment iniciado, sessionId:", response.data);
    } catch (err: any) {
      console.error("Error al iniciar enrolamiento:", err);
      setError(err.response?.data || "Error al iniciar la sesión de enrolamiento.");
      setEnrollmentSessionId(null);
      setEnrollmentProgressMsg("Error al iniciar.");
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, selectedScanner, selectedFinger]);

 // Capturar una huella para la sesión de enrolamiento actual
 const handleCapture = useCallback(async () => {
    // Validaciones
    if (!selectedScanner || !enrollmentSessionId || !selectedEmployee || selectedFinger === null || captureAttempts >= TOTAL_CAPTURE_ATTEMPTS) {
        setError("No se puede capturar. Verifique lector, dedo, empleado o intentos.");
        return;
    }
    // Validar que el empleado tenga un ID numérico (no "nuevo")
     if (isNaN(parseInt(selectedEmployee.id))) {
         setError("No se puede asignar huella a un empleado aún no guardado (ID no numérico).");
         // Aquí podrías redirigir a la lista o mostrar un error más claro.
         return;
     }

    setIsLoading(true);
    setError(null);
    setScanState("scanning");
    setEnrollmentProgressMsg(`Capturando intento ${captureAttempts + 1}... Coloque el dedo.`);

    try {
      const response = await axios.post<EnrollmentResponse>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/capture/${encodeURIComponent(selectedScanner)}/${encodeURIComponent(enrollmentSessionId)}?userId=${selectedEmployee.id}`
      );
      const data = response.data;
      setScanState("success"); // Feedback visual éxito
      setEnrollmentProgressMsg(`Intento ${captureAttempts + 1} capturado con éxito.`);

      const newSuccessFlags = [...captureSuccessFlags];
      newSuccessFlags[captureAttempts] = true;
      setCaptureSuccessFlags(newSuccessFlags);
      const nextAttempt = captureAttempts + 1;
      setCaptureAttempts(nextAttempt);

      if (data.complete) {
        setEnrollmentProgressMsg(`¡Huella del dedo ${fingerNames[selectedFinger]} registrada! (${TOTAL_CAPTURE_ATTEMPTS}/${TOTAL_CAPTURE_ATTEMPTS})`);
        // Marcar dedo como registrado en esta sesión
        if (!registeredFingers.includes(selectedFinger)) {
          setRegisteredFingers(prev => [...prev, selectedFinger!].sort((a, b) => a - b));
        }
        // El botón "Continuar" al paso 5 ahora estará habilitado
      } else {
        setEnrollmentProgressMsg(`Captura ${nextAttempt}/${TOTAL_CAPTURE_ATTEMPTS} exitosa. Faltan ${data.remaining}. Retire y coloque el dedo de nuevo.`);
      }

    } catch (err: any) {
      console.error("Error en captura de enrolamiento:", err);
      // Mapear errores comunes del backend/SDK si es posible
      let specificError = "Error durante la captura.";
      const apiErrorMsg = err.response?.data;
      if (typeof apiErrorMsg === 'string') {
          if (apiErrorMsg.includes("TIMEOUT") || apiErrorMsg.includes("TIMED_OUT")) specificError = "Tiempo de espera agotado. Coloque el dedo más rápido.";
          else if (apiErrorMsg.includes("FAKE")) specificError = "Se detectó un dedo falso.";
          else if (apiErrorMsg.includes("TOO_WET")) specificError = "Dedo demasiado húmedo.";
          else if (apiErrorMsg.includes("TOO_DRY")) specificError = "Dedo demasiado seco.";
          else if (apiErrorMsg.includes("INVALID_PARAMETER") || apiErrorMsg.includes("INVALID_SESSION")) specificError = "Error de sesión. Intente seleccionar el dedo de nuevo.";
          else specificError = apiErrorMsg; // Mostrar error del backend directamente
      }
      setError(specificError);
      setScanState("failed"); // Feedback visual fallo
      setEnrollmentProgressMsg("Error en la captura. Inténtelo de nuevo.");
      // No incrementar captureAttempts en caso de error, para permitir reintento de la misma captura
    } finally {
      setIsLoading(false);
      // Volver a idle después de mostrar feedback
      setTimeout(() => setScanState("idle"), 2000);
    }
  }, [
      API_BASE_URL, selectedScanner, enrollmentSessionId, selectedEmployee,
      selectedFinger, captureAttempts, captureSuccessFlags, registeredFingers
  ]);


  // Navegación entre pasos
  const goToNextStep = () => {
    // Validaciones antes de avanzar
    if (currentStep === 1 && !selectedEmployee) { setError("Seleccione un empleado."); return; }
    if (currentStep === 2 && !selectedScanner) { setError("Seleccione un lector."); return; }
    if (currentStep === 3 && selectedFinger === null) { setError("Seleccione un dedo."); return; }
    if (currentStep === 4 && captureAttempts < TOTAL_CAPTURE_ATTEMPTS) { setError(`Complete las ${TOTAL_CAPTURE_ATTEMPTS} capturas exitosas.`); return; }

    setError(null); // Limpiar errores al avanzar
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
     // Si avanzamos desde el paso 4 al 5, resetear estado de captura para posible nuevo dedo
     if (currentStep === 4) {
        resetCaptureState();
     }
  };

  const goToPreviousStep = () => {
    setError(null);
    if (currentStep > (employeeIdParam ? 2 : 1)) { // No ir antes del paso 2 si vino con params
       const stepBefore = currentStep;
       setCurrentStep(prev => prev - 1);

        // Si retrocedemos del paso 4 (Captura) al 3 (Dedo)
       if (stepBefore === 4) {
          // Cancelar sesión de enrolamiento si estaba activa? O mantenerla por si vuelve al mismo dedo?
          // Por ahora, la resetearemos al seleccionar un nuevo dedo en el paso 3.
           setEnrollmentProgressMsg("");
           setScanState("idle");
           // No reseteamos captureAttempts/SuccessFlags aquí, se hace al seleccionar dedo en paso 3.
       }
        // Si retrocedemos del paso 3 (Dedo) al 2 (Lector)
       if(stepBefore === 3) {
            setSelectedFinger(null); // Deseleccionar dedo
       }
       // Si retrocedemos del paso 5 (Confirmación) al 4 (Captura)
       // Podríamos querer volver al paso 3 (Dedo) directamente?
       if (stepBefore === 5) {
            setCurrentStep(3); // Ir a seleccionar otro dedo
            resetCaptureState(); // Asegurar reset completo
       }
    }
  };

   // Resetea el estado relacionado a la captura de un dedo
   const resetCaptureState = () => {
       setCaptureAttempts(0);
       setCaptureSuccessFlags(Array(TOTAL_CAPTURE_ATTEMPTS).fill(false));
       setEnrollmentSessionId(null);
       setScanState("idle");
       setEnrollmentProgressMsg("");
       setError(null);
   };


  // Finalizar y volver a empleados (liberando lector)
  const handleFinish = useCallback(async () => {
    setIsLoading(true); // Mostrar feedback
    // Liberar lector si estaba seleccionado
    if (selectedScanner && browserSessionId) {
      try {
        await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedScanner)}?sessionId=${browserSessionId}`);
        console.log(`Lector ${selectedScanner} liberado al finalizar.`);
      } catch (err) { console.error("Error liberando lector al finalizar:", err); }
    }
    router.push("/empleados"); // Redirigir
  }, [API_BASE_URL, selectedScanner, browserSessionId, router]);

  // Registrar otro dedo (vuelve al paso 3)
  const handleRegisterAnotherFinger = () => {
    setCurrentStep(3);
    setSelectedFinger(null); // Deseleccionar dedo actual
    resetCaptureState(); // Resetear para el nuevo dedo
  };


 // --- Renderizado Condicional por Paso ---
 const renderStepContent = () => {
    switch (currentStep) {
        case 1: // Selección de Empleado (Solo si no viene de params)
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                 <CardHeader>
                    <CardTitle>Paso 1: Selección de Empleado</CardTitle>
                    <CardDescription>Seleccione el empleado al que asignará la huella.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      {/* Aquí iría tu ComboBox o selector de empleados si este paso es necesario */}
                      <p className="text-zinc-500">(Selector de empleado pendiente si este paso es necesario)</p>
                      {selectedEmployee && <p>Seleccionado: {selectedEmployee.nombre}</p>}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={goToNextStep} disabled={!selectedEmployee || isLoading} className="bg-blue-600 hover:bg-blue-700">
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 </CardFooter>
                </Card>
            );

        case 2: // Selección de Lector
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Paso 2: Selección de Lector</CardTitle>
                    <CardDescription>Seleccione el lector de huellas a utilizar.</CardDescription>
                  </CardHeader>
                   <CardContent className="space-y-6">
                      {/* Mostrar info del empleado */}
                     {selectedEmployee && (
                        <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center gap-3">
                            <Users className="h-6 w-6 text-blue-400 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-white">{selectedEmployee.nombre}</p>
                                <p className="text-xs text-zinc-400">{selectedEmployee.id === "nuevo" ? "Nuevo Empleado" : selectedEmployee.numeroTarjeta}</p>
                            </div>
                        </div>
                     )}
                      {/* Selector de Lector */}
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400 block mb-1">Lector Disponible</label>
                         {isLoading && !availableReaders.length && <p className="text-zinc-400 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Buscando lectores...</p>}
                        <Select value={selectedScanner} onValueChange={handleSelectReader} disabled={isLoading}>
                          <SelectTrigger className={`${selectedScanner ? 'border-green-500' : ''}`}>
                            <SelectValue placeholder="Seleccionar lector..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableReaders.length === 0 && !isLoading && <p className="p-2 text-sm text-zinc-500">No hay lectores online.</p>}
                            {availableReaders.map((scanner) => (
                              <SelectItem key={scanner.id} value={scanner.name} disabled={scanner.status !== 'online'}>
                                {scanner.name} {scanner.status !== 'online' && `(${scanner.status})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                      {/* Mensaje de error específico del lector */}
                     {error && currentStep === 2 && (
                         <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={16} /> {error}</p>
                     )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading || employeeIdParam !== null}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <Button onClick={goToNextStep} disabled={!selectedScanner || isLoading} className="bg-blue-600 hover:bg-blue-700">
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
            );

        case 3: // Selección de Dedo
             return (
                 <Card className="max-w-4xl mx-auto bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle>Paso 3: Selección de Dedo</CardTitle>
                    <CardDescription>Seleccione el dedo que desea registrar. Los dedos en verde ya fueron registrados en esta sesión.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                       {/* Mostrar info empleado y lector */}
                     {selectedEmployee && (
                        <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center gap-3 text-sm">
                            <Users className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-white">{selectedEmployee.nombre}</span>
                            <span className="text-zinc-500">|</span>
                             <Fingerprint className="h-5 w-5 text-purple-400 flex-shrink-0" />
                             <span className="font-medium text-white">{selectedScanner || "Lector no seleccionado"}</span>
                        </div>
                     )}
                      {/* Selector de manos */}
                     <HandSelector
                          selectedFinger={selectedFinger}
                          setSelectedFinger={handleFingerSelect}
                          registeredFingers={registeredFingers}
                      />
                       {/* Info dedo seleccionado */}
                      <div className="text-center min-h-[2rem]"> {/* Altura mínima para evitar saltos */}
                         {selectedFinger !== null && (
                             <p className="text-lg font-medium text-purple-300">
                                Dedo seleccionado: {fingerNames[selectedFinger]}
                             </p>
                         )}
                         {error && currentStep === 3 && (
                             <p className="text-red-400 text-sm flex items-center justify-center gap-1"><AlertCircle size={16} /> {error}</p>
                         )}
                     </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <Button onClick={goToNextStep} disabled={selectedFinger === null || isLoading} className="bg-blue-600 hover:bg-blue-700">
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                 </Card>
            );

        case 4: // Captura de Huella
            return (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Panel Izquierdo: Info y Progreso */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Paso 4: Captura de Huella</CardTitle>
                            <CardDescription>
                                Registre <strong className="text-white">{TOTAL_CAPTURE_ATTEMPTS}</strong> capturas exitosas del dedo seleccionado.
                                <br/>Empleado: <strong className="text-white">{selectedEmployee?.nombre}</strong>
                                <br/>Dedo: <strong className="text-white">{selectedFinger !== null ? fingerNames[selectedFinger] : "N/A"}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <h3 className="text-lg font-medium text-zinc-300 mb-3">Progreso de Captura ({captureAttempts}/{TOTAL_CAPTURE_ATTEMPTS})</h3>
                            <div className="space-y-2">
                                {Array.from({ length: TOTAL_CAPTURE_ATTEMPTS }).map((_, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        index < captureAttempts
                                        ? captureSuccessFlags[index] ? "bg-green-600 text-white" : "bg-red-600 text-white"
                                        : "bg-zinc-700 text-zinc-400"
                                    }`}
                                    >
                                    {index < captureAttempts ? (
                                        captureSuccessFlags[index] ? <CheckCircle size={16} /> : <XCircle size={16} />
                                    ) : ( index + 1 )}
                                    </div>
                                    <div className="w-full bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                                          <motion.div
                                              className={`h-2.5 rounded-full ${index < captureAttempts && captureSuccessFlags[index] ? 'bg-green-500' : 'bg-transparent'}`}
                                              initial={{ width: "0%" }}
                                              animate={{ width: index < captureAttempts && captureSuccessFlags[index] ? "100%" : "0%" }}
                                              transition={{ duration: 0.5 }}
                                          />
                                      </div>
                                      <span className={`text-xs w-16 text-right ${index < captureAttempts ? (captureSuccessFlags[index] ? 'text-green-400' : 'text-red-400') : 'text-zinc-500'}`}>
                                          {index < captureAttempts ? (captureSuccessFlags[index] ? 'Éxito' : 'Falló') : 'Pendiente'}
                                      </span>
                                </div>
                                ))}
                            </div>
                             {/* Mensaje de Progreso/Error */}
                            <div className="min-h-[3rem] p-3 bg-zinc-800/50 border border-zinc-700 rounded-md flex items-center justify-center text-center">
                                {error && currentStep === 4 ? (
                                     <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={16} /> {error}</p>
                                ) : (
                                    <p className="text-sm text-zinc-300">{enrollmentProgressMsg || "Esperando inicio..."}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                             <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                             </Button>
                            <Button
                                onClick={goToNextStep}
                                disabled={captureAttempts < TOTAL_CAPTURE_ATTEMPTS || isLoading || !captureSuccessFlags.every(Boolean)} // Habilitar solo si todas las capturas fueron exitosas
                                className="bg-blue-600 hover:bg-blue-700"
                             >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continuar <ArrowRight className="ml-2 h-4 w-4" />
                             </Button>
                        </CardFooter>
                    </Card>

                    {/* Panel Derecho: Escáner Visual */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle>Escáner de Huella</CardTitle>
                             <CardDescription>Lector: {selectedScanner}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8 min-h-[350px]">
                             {/* Animación SVG */}
                            <div className="relative mb-6 flex h-56 w-56 items-center justify-center">
                                {/* Base */}
                                 <svg className="absolute h-52 w-52" viewBox="0 0 100 100">
                                     <g stroke={ scanState === 'success' ? "rgba(34, 197, 94, 0.3)" : scanState === 'failed' ? "rgba(239, 68, 68, 0.3)" : "rgba(168, 85, 247, 0.3)" } fill="none" strokeWidth="1.5">
                                        {/* Paths de huella */}
                                        <path d="M50,15 C25,15 15,30 15,50 C15,70 25,85 50,85 C75,85 85,70 85,50 C85,30 75,15 50,15 Z" />
                                         <path d="M50,20 C30,20 20,35 20,50 C20,65 30,80 50,80 C70,80 80,65 80,50 C80,35 70,20 50,20 Z" />
                                         {/* ... más paths ... */}
                                         <path d="M50,45 C45,45 45,47 45,50 C45,53 45,55 50,55 C55,55 55,53 55,50 C55,47 55,45 50,45 Z" />
                                     </g>
                                 </svg>
                                 {/* Icono de estado */}
                                 <motion.div key={scanState} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                                    {scanState === 'idle' && <Fingerprint className="h-32 w-32 text-purple-500/70 animate-pulse" />}
                                    {scanState === 'scanning' && <Loader2 className="h-32 w-32 text-purple-400 animate-spin" />}
                                    {scanState === 'success' && <CheckCircle className="h-32 w-32 text-green-500" />}
                                    {scanState === 'failed' && <XCircle className="h-32 w-32 text-red-500" />}
                                    {scanState === 'error' && <AlertCircle className="h-32 w-32 text-yellow-500" />}
                                 </motion.div>
                            </div>
                             {/* Botón de Captura */}
                             <Button
                                className="bg-purple-600 hover:bg-purple-700 w-52 mt-4"
                                onClick={handleCapture}
                                disabled={scanState !== "idle" || isLoading || captureAttempts >= TOTAL_CAPTURE_ATTEMPTS || !enrollmentSessionId}
                            >
                                {isLoading && scanState === 'scanning' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-5 w-5" />}
                                {isLoading && scanState === 'scanning' ? 'Capturando...' : `Capturar (${captureAttempts + 1}/${TOTAL_CAPTURE_ATTEMPTS})`}
                             </Button>
                        </CardContent>
                    </Card>
                 </div>
            );

        case 5: // Confirmación Final
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                  <CardHeader className="text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                         <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    </motion.div>
                    <CardTitle className="text-2xl">¡Enrolamiento Exitoso!</CardTitle>
                    <CardDescription>Se han registrado correctamente las huellas seleccionadas para el empleado.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                       {/* Resumen */}
                      <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg space-y-3">
                         {selectedEmployee && (
                             <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <span className="font-medium text-white">{selectedEmployee.nombre}</span>
                             </div>
                         )}
                          <div className="flex items-center gap-3">
                             <Fingerprint className="h-5 w-5 text-purple-400 flex-shrink-0" />
                             <span className="font-medium text-white">Lector: {selectedScanner}</span>
                         </div>
                          <div>
                             <p className="text-sm font-medium text-zinc-300 mb-1">Dedos registrados en esta sesión:</p>
                              {registeredFingers.length > 0 ? (
                                 <div className="flex flex-wrap gap-2">
                                     {registeredFingers.map(finger => (
                                         <span key={finger} className="px-2.5 py-1 bg-green-500/20 text-green-300 rounded-full text-xs border border-green-500/30">
                                             {fingerNames[finger]}
                                         </span>
                                     ))}
                                 </div>
                             ) : (
                                 <p className="text-sm text-zinc-500 italic">Ninguno registrado aún.</p>
                             )}
                         </div>
                      </div>
                      {/* Próximos pasos */}
                      <div className="text-center space-y-2">
                          <p className="text-zinc-400">¿Qué desea hacer ahora?</p>
                           <div className="flex flex-wrap justify-center gap-3">
                               <Button variant="outline" onClick={handleRegisterAnotherFinger} disabled={isLoading}>
                                  <Fingerprint className="mr-2 h-4 w-4" /> Registrar Otro Dedo
                               </Button>
                                <Button variant="outline" onClick={handleFinish} disabled={isLoading}>
                                   {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                   Finalizar y Ver Empleados
                               </Button>
                                <Link href="/empleados/registrar">
                                    <Button variant="outline" disabled={isLoading}>
                                        <UserPlus className="mr-2 h-4 w-4" /> Nuevo Empleado
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="outline" disabled={isLoading}>
                                        <Home className="mr-2 h-4 w-4" /> Ir al Inicio
                                    </Button>
                                </Link>
                           </div>
                      </div>
                  </CardContent>
                </Card>
            );
        default:
            return <p>Paso desconocido.</p>;
     }
 };


 return (
    <div className="p-8">
       <div className="flex items-center gap-2 mb-8">
            {/* Botón volver siempre visible, excepto en paso 1 si vino con params */}
           {(currentStep > (employeeIdParam ? 2 : 1)) && (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={goToPreviousStep} aria-label="Volver al paso anterior">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
           )}
           <h1 className="text-3xl font-bold">Asignar Huella Digital</h1>
       </div>

        {/* Indicador de Pasos */}
        <div className="mb-8 max-w-4xl mx-auto">
             {/* ... (Tu Stepper visual aquí) ... */}
              <div className="flex items-center justify-between">
                 {['Empleado', 'Lector', 'Dedo', 'Captura', 'Finalizado'].map((label, index) => (
                    <React.Fragment key={index}>
                         <div className="flex flex-col items-center text-center">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${ currentStep > index + 1 ? "bg-blue-600 border-blue-600" : currentStep === index + 1 ? "border-blue-500 bg-blue-900/50" : "border-zinc-600 bg-zinc-800" } transition-colors`}>
                                {currentStep > index + 1 ? <CheckCircle size={16} className="text-white"/> : <span className={`${currentStep === index + 1 ? 'text-blue-300 font-bold' : 'text-zinc-400'}`}>{index + 1}</span>}
                             </div>
                             <span className={`text-xs mt-1 ${currentStep >= index + 1 ? 'text-zinc-200' : 'text-zinc-500'}`}>{label}</span>
                         </div>
                        {index < 4 && <div className={`flex-1 h-0.5 mx-1 ${currentStep > index + 1 ? 'bg-blue-600' : 'bg-zinc-700'}`}></div>}
                     </React.Fragment>
                 ))}
              </div>
        </div>

        {/* Contenido del Paso Actual */}
         <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                {renderStepContent()}
            </motion.div>
        </AnimatePresence>

         {/* Mensaje de Error Global Flotante */}
        <AnimatePresence>
         {error && ![2,3,4].includes(currentStep) && ( // Mostrar solo si no es un error específico de esos pasos
             <motion.div
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: 10 }}
                 className="fixed bottom-4 right-4 p-3 bg-red-800 border border-red-600 text-white rounded-lg shadow-lg z-50 flex items-center gap-2 text-sm max-w-sm"
            >
                 <AlertCircle size={18} />
                 <span>{error}</span>
                 <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-white">&times;</button>
             </motion.div>
         )}
         </AnimatePresence>

    </div>
 );
}

// Exportar con Suspense porque usa useSearchParams
export default function AsignarHuellaPage() {
     return (
         <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> Cargando...</div>}>
             <AsignarHuellaContent />
         </Suspense>
     );
}
