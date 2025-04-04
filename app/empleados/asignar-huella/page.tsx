"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Fingerprint, CheckCircle, XCircle, Users, Home, UserPlus, Loader2, AlertCircle, Info, Save } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import axios from 'axios';
import { getBrowserSessionId } from '@/lib/sessionId';
import React from "react";

// --- Tipos ---
type ScannerStatus = "online" | "offline" | "error" | "reserved";
interface FingerprintScanner { id: string; name: string; status: ScannerStatus; }
// Tipo simplificado para empleado en esta página
interface EmployeeSimple { id: string ; nombre: string; }
// Tipo para la respuesta de /enroll/capture
interface EnrollmentResponse { complete: boolean; remaining?: number; template?: string; }
// Tipo para la respuesta de GET /api/empleados/{id}/huellas
interface HuellaInfo { id: number; nombreDedo: string | null; /* otros campos si los necesitas */ }
type ScanState = "idle" | "scanning" | "success" | "failed" | "saving" | "error"; // Añadido 'saving'

// --- Constantes ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const TOTAL_CAPTURE_ATTEMPTS = 4;
// Mapeo inverso para obtener índice a partir del nombre (ajusta si tu backend guarda otro formato)
const fingerNameToIndex: Record<string, number> = {
    "PULGAR DERECHO": 1, "ÍNDICE DERECHO": 2, "MEDIO DERECHO": 3, "ANULAR DERECHO": 4, "MEÑIQUE DERECHO": 5,
    "PULGAR IZQUIERDO": 6, "ÍNDICE IZQUIERDO": 7, "MEDIO IZQUIERDO": 8, "ANULAR IZQUIERDO": 9, "MEÑIQUE IZQUIERDO": 10,
    
  
};
// Nombres para mostrar (index 0 vacío)
const fingerIndexToName = [ "", "Pulgar Derecho", "Índice Derecho", "Medio Derecho", "Anular Derecho", "Meñique Derecho", "Pulgar Izquierdo", "Índice Izquierdo", "Medio Izquierdo", "Anular Izquierdo", "Meñique Izquierdo", ];

// --- Componente HandSelector (Actualizado para marcar dedos existentes) ---
 const HandSelector = ({ selectedFinger, setSelectedFinger, existingFingerIndices, registeredThisSessionIndices }: {
   selectedFinger: number | null;
   setSelectedFinger: (finger: number | null) => void;
   existingFingerIndices: number[]; // Dedos ya en la BD
   registeredThisSessionIndices: number[]; // Dedos registrados en esta carga de página
 }) => {

   const getFingerStatus = (index: number): 'selected' | 'existing' | 'session' | 'available' => {
     if (selectedFinger === index) return 'selected';
     if (registeredThisSessionIndices.includes(index)) return 'session'; // Prioridad a registro en sesión
     if (existingFingerIndices.includes(index)) return 'existing';
     return 'available';
   };

   const getFingerStyle = (status: ReturnType<typeof getFingerStatus>) => {
     switch (status) {
       case 'selected': return "fill-purple-500 stroke-purple-300";
       case 'session': return "fill-blue-600 stroke-blue-400"; // Dedo registrado en esta sesión
       case 'existing': return "fill-green-800 stroke-green-600"; // Dedo ya existente en BD
       default: return "fill-zinc-700 stroke-zinc-500 group-hover:fill-purple-800"; // Disponible
     }
   };

     const getFingerOpacity = (status: ReturnType<typeof getFingerStatus>) => {
        return (status === 'existing' || status === 'session') ? 0.7 : 1;
     };

   const renderFinger = (fingerIndex: number) => {
     const status = getFingerStatus(fingerIndex);
     const isSelectable = status === 'available' || status === 'selected';

     let x = 0, y = 0, height = 0;
     // Ajusta coordenadas según el dedo (simplificado)
     const isRightHand = fingerIndex <= 5;
     const i = isRightHand ? fingerIndex - 1 : fingerIndex - 6;
     x = isRightHand ? 30 + i * 20 : 120 - i * 20;
     y = (i === 0 || i === 4) ? 65 : (i === 1 || i === 3 ? 50 : 45); // Ajustar Y
     height = (i === 0 || i === 4) ? 35 : (i === 1 || i === 3 ? 45 : 50); // Ajustar alturas

     return (
       <g key={fingerIndex}
          onClick={() => isSelectable && setSelectedFinger(status === 'selected' ? null : fingerIndex)}
          className={isSelectable ? "cursor-pointer group" : "cursor-not-allowed"}
          opacity={getFingerOpacity(status)}
          >
         <rect x={x - 8} y={y - height} width="16" height={height} rx="8"
               className={`transition-all ${getFingerStyle(status)}`} />
         {/* Icono si no es seleccionable */}
         {(status === 'existing' || status === 'session') && (
             <CheckCircle className={status === 'session' ? "text-blue-300" : "text-green-400"} size={14} x={x-7} y={y-height+2} />
         )}
         <text x={x} y={y - height / 2} textAnchor="middle" fill="white" fontSize="10" dy=".3em" className="pointer-events-none">{fingerIndex}</text>
       </g>
     );
   };


   return (
     <div className="flex flex-col md:flex-row gap-8 justify-center p-4 bg-zinc-800/30 rounded-lg">
       <h3 ></h3>
       {/* Mano Izquierda (6-10) */}
       <div className="relative text-center">
         <h3 className="mb-2 font-medium text-zinc-300">Mano Izquierda</h3>
         <svg width="150" height="200" viewBox="0 0 150 200" className="mx-auto">
           <path d="M105 80 C105 60 90 50 75 50 C60 50 45 60 45 80 L45 150 C45 170 60 180 75 180 C90 180 105 170 105 150 Z" fill="#27272a" stroke="#52525b" strokeWidth="1"/>
           {[6, 7, 8, 9, 10].map(renderFinger)}
         </svg>
       </div>
       {/* Mano Derecha (1-5) */}
       <div className="relative text-center">
         <h3 className="mb-2 font-medium text-zinc-300">Mano Derecha</h3>
         <svg width="150" height="200" viewBox="0 0 150 200" className="mx-auto">
           <path d="M45 80 C45 60 60 50 75 50 C90 50 105 60 105 80 L105 150 C105 170 90 180 75 180 C60 180 45 170 45 150 Z" fill="#27272a" stroke="#52525b" strokeWidth="1"/>
           {[1, 2, 3, 4, 5].map(renderFinger)}
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

  const [currentStep, setCurrentStep] = useState(1); // Empezará en 2 si hay params
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSimple | null>(null);
  const [availableReaders, setAvailableReaders] = useState<FingerprintScanner[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>("");
  const [selectedFinger, setSelectedFinger] = useState<number | null>(null);
  const [existingHuellas, setExistingHuellas] = useState<HuellaInfo[]>([]); // Huellas ya en BD
  const [registeredThisSessionIndices, setRegisteredThisSessionIndices] = useState<number[]>([]); // Registrados en esta carga

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [captureAttempts, setCaptureAttempts] = useState<number>(0);
  const [captureSuccessFlags, setCaptureSuccessFlags] = useState<boolean[]>(Array(TOTAL_CAPTURE_ATTEMPTS).fill(false));
  const [enrollmentSessionId, setEnrollmentSessionId] = useState<string | null>(null);
  const [enrollmentProgressMsg, setEnrollmentProgressMsg] = useState<string>("");
  const [finalTemplateBase64, setFinalTemplateBase64] = useState<string | null>(null); // Guardar template final

  const [browserSessionId, setBrowserSessionId] = useState('');

  // --- Effects ---

  // 1. Inicializar Empleado, Session ID y Cargar Huellas Existentes
  useEffect(() => {
    const currentBrowserSessionId = getBrowserSessionId();
    setBrowserSessionId(currentBrowserSessionId);
    console.log("Browser Session ID:", currentBrowserSessionId); // Log para verificar

    const empIdStr = searchParams.get("id");
    const empName = searchParams.get("nombre");
    console.log("Params received:", { empIdStr, empName }); // Log para ver params

    // *** AJUSTE EN LA VALIDACIÓN ***
    let isValidId = false;
    let parsedEmpId: number | null = null;
    if (empIdStr && !isNaN(parseInt(empIdStr))) {
        parsedEmpId = parseInt(empIdStr);
        isValidId = true;
    }

    if (isValidId && parsedEmpId !== null && empName && empName.trim() !== "") {
      // Validación exitosa
      console.log(`Setting selected employee: ID=${empIdStr}, Nombre=${empName}`);
     setSelectedEmployee({ id: empIdStr!, nombre: empName! });
         setCurrentStep(2); // Saltar a Selección de Lector
         fetchExistingHuellas(parsedEmpId); // Usar el ID parseado
    } else {
         // Validación fallida
         console.error("Parameter validation failed:", {
             empIdStr,
             empName,
             isIdValidNumber: isValidId,
             isNamePresent: !!empName,
             isNameNotEmpty: empName ? empName.trim() !== "" : false,
         });
         // Mostrar error solo si *intentaron* pasar parámetros
         if (empIdStr || empName) {
             setError("ID de empleado inválido o falta el nombre en los parámetros URL.");
         }
         setCurrentStep(1); // Ir al paso 1 (o mostrar error y no hacer nada)
    }
  }, [searchParams]); // Depender solo de searchParams, fetchExistingHuellas es useCallback

  // 2. Cargar Lectores cuando se llega al Paso 2
  useEffect(() => {
    if (currentStep === 2 && browserSessionId) {
      fetchAvailableReaders();
    }
  }, [currentStep, browserSessionId]); // Quitar fetchAvailableReaders de dependencias si causa bucle

  // 3. Iniciar Enrolamiento al llegar al Paso 4 o cambiar de dedo
  useEffect(() => {
    if (currentStep === 4 && selectedScanner && selectedFinger !== null && !enrollmentSessionId) {
        // Solo iniciar si no hay sesión activa Y el dedo no está ya registrado
        const existingIndices = existingHuellas.map(h => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1);
         if (!existingIndices.includes(selectedFinger) && !registeredThisSessionIndices.includes(selectedFinger)) {
           handleStartEnrollment();
         } else {
             setEnrollmentProgressMsg("Este dedo ya tiene una huella registrada.");
             setError("Este dedo ya tiene una huella registrada.");
         }
    }
  }, [currentStep, selectedScanner, selectedFinger, enrollmentSessionId, existingHuellas, registeredThisSessionIndices]); // Añadir dependencias

  // 4. Limpieza: Liberar lector si se desmonta el componente
  useEffect(() => {
    const sessionId = browserSessionId || getBrowserSessionId();
    const readerToRelease = selectedScanner;

    return () => {
      if (readerToRelease && sessionId) {
        console.log(`Cleanup: Intentando liberar lector ${readerToRelease}`);
        // Usar navigator.sendBeacon si es posible para mayor fiabilipdad al salir
        if (navigator.sendBeacon) {
          navigator.sendBeacon(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(readerToRelease)}?sessionId=${sessionId}`);

        } else {
          // Fallback a fetch/axios (menos fiable al cerrar pestaña)
          axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(readerToRelease)}?sessionId=${sessionId}`)

          .catch(err => console.warn("Error liberando lector en cleanup (axios):", err));
        }
      }
    };
  }, [selectedScanner, browserSessionId]);

  // --- Funciones de Lógica ---

  // *** NUEVO: Cargar huellas existentes ***
  const fetchExistingHuellas = useCallback(async (empId: number) => {
      setIsLoading(true); // Podrías tener un loader específico
      try {
          const response = await axios.get<HuellaInfo[]>(`${API_BASE_URL}/api/empleados/${empId}/huellas`);

          setExistingHuellas(response.data);
          // Mapear nombres a índices para el HandSelector
          const indices = response.data
              .map(h => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1)
              .filter(index => index !== -1);
          // Combinar con los registrados en esta sesión
           // setRegisteredFingers(indices); // Reemplazado por existingFingerIndices
           console.log("Huellas existentes cargadas para empleado:", empId, response.data);
      } catch (err) {
          console.error("Error cargando huellas existentes:", err);
          setError("No se pudieron cargar las huellas existentes para este empleado.");
          setExistingHuellas([]);
      } finally {
           setIsLoading(false);
      }
  }, [API_BASE_URL]);


  // Cargar lectores (sin cambios)
  const fetchAvailableReaders = useCallback(async () => { /* ... código sin cambios ... */
    setIsLoading(true);
    setError(null);
    setAvailableReaders([]);
    try {
      const response = await axios.get<string[]>(`${API_BASE_URL}/api/v1/multi-fingerprint/readers`);
      const readers = response.data.map(name => ({ id: name, name: name, status: 'online' as ScannerStatus }));
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

  // Seleccionar y reservar lector (sin cambios)
  const handleSelectReader = useCallback(async (readerName: string) => { /* ... código sin cambios ... */
    setError(null);
    setIsLoading(true);
    const sessionId = browserSessionId || getBrowserSessionId();
    if (selectedScanner && selectedScanner !== readerName) {
        
    try {
      await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedScanner)}?sessionId=${sessionId}`);
    }

        catch (err) { console.warn("No se pudo liberar lector previo:", err); }
    }
    try {
        await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/reserve/${encodeURIComponent(readerName)}?sessionId=${sessionId}`);

        setSelectedScanner(readerName);
    } catch (err: any) {
        console.error("Error reservando lector:", err);
        setError(err.response?.data || `No se pudo reservar el lector "${readerName}".`);
        setSelectedScanner("");
    } finally {
        setIsLoading(false);
    }
  }, [API_BASE_URL, browserSessionId, selectedScanner]);

  // Seleccionar dedo (Actualizado para checkear ambas listas de registros)
  const handleFingerSelect = useCallback((fingerIndex: number | null) => {
     const existingIndices = existingHuellas.map(h => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1);
    if (fingerIndex !== null && (existingIndices.includes(fingerIndex) || registeredThisSessionIndices.includes(fingerIndex)) ) {
      setError("Este dedo ya tiene una huella registrada.");
      setSelectedFinger(null);
      return;
    }
    setError(null);
    setSelectedFinger(fingerIndex);
    // Resetear estado de captura para el nuevo dedo/deselección
    resetCaptureState(); // Llama a la función de reseteo
  }, [existingHuellas, registeredThisSessionIndices]);


  // Iniciar sesión de enrolamiento (sin cambios)
  const handleStartEnrollment = useCallback(async () => {
    if (!selectedScanner || selectedFinger === null) {
        setError("Seleccione un lector y un dedo primero.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setScanState("idle");
    setEnrollmentProgressMsg("Iniciando enrolamiento...");

    const sessionId = browserSessionId || getBrowserSessionId(); // Asegúrate de tener esta variable o función definida

    try {
        const response = await axios.post<{ sessionId: string }>(
            `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/start/${encodeURIComponent(selectedScanner)}?sessionId=${sessionId}`
        );
        setEnrollmentSessionId(response.data.sessionId);
        setEnrollmentProgressMsg(`Listo para captura 1 de ${TOTAL_CAPTURE_ATTEMPTS}. Coloque el dedo ${fingerIndexToName[selectedFinger]} en el lector.`);
    } catch (err: any) {
        console.error("Error al iniciar enrolamiento:", err);
        setError(err.response?.data || "Error al iniciar la sesión de enrolamiento.");
        setEnrollmentSessionId(null);
        setEnrollmentProgressMsg("Error al iniciar.");
    } finally {
        setIsLoading(false);
    }
}, [API_BASE_URL, selectedScanner, selectedFinger, browserSessionId]);


  // --- Capturar y GUARDAR Huella --- (MODIFICADO)
  const handleCapture = useCallback(async () => {
    if (!selectedScanner || !enrollmentSessionId || !selectedEmployee || selectedFinger === null || captureAttempts >= TOTAL_CAPTURE_ATTEMPTS) {
      setError("No se puede capturar. Verifique lector, dedo, empleado o intentos.");
      return;
    }
     // Validar ID numérico
     const employeeId = parseInt(selectedEmployee.id);
     if (isNaN(employeeId)) {
        setError("ID de empleado inválido para guardar huella.");
        return;
     }

    setIsLoading(true);
    setError(null);
    setScanState("scanning");
    setEnrollmentProgressMsg(`Capturando intento ${captureAttempts + 1}... Coloque el dedo.`);

    try {
      // 1. Llamar a /enroll/capture
      const response = await axios.post<EnrollmentResponse>(
        `${API_BASE_URL}/api/v1/multi-fingerprint/enroll/capture/${encodeURIComponent(selectedScanner)}/${encodeURIComponent(enrollmentSessionId)}`
      );
      
      const data = response.data;
      setScanState("success");
      setEnrollmentProgressMsg(`Intento ${captureAttempts + 1} capturado con éxito.`);

      const newSuccessFlags = [...captureSuccessFlags];
      newSuccessFlags[captureAttempts] = true;
      setCaptureSuccessFlags(newSuccessFlags);
      const nextAttempt = captureAttempts + 1;
      setCaptureAttempts(nextAttempt);

      // 2. Si se completó el enrolamiento, GUARDAR la huella
      if (data.complete && data.template) {
        setScanState("saving"); // Nuevo estado
        setEnrollmentProgressMsg(`Enrolamiento completo. Guardando huella...`);
        setFinalTemplateBase64(data.template); // Guardar template por si falla el guardado

        const dedoNombre = fingerIndexToName[selectedFinger].toUpperCase(); // Nombre del dedo

        try {
             // *** NUEVO: Llamar a POST /api/empleados/{id}/huellas ***
             const saveResponse = await axios.post(
              `${API_BASE_URL}/api/empleados/${employeeId}/huellas`,
              {
                nombreDedo: dedoNombre,
                templateBase64: data.template
              }
            );
            

             if (saveResponse.status === 201) { // 201 Created
                 setEnrollmentProgressMsg(`¡Huella del dedo ${dedoNombre} registrada y guardada!`);
                 // Marcar dedo como registrado en esta sesión
                 if (!registeredThisSessionIndices.includes(selectedFinger)) {
                     setRegisteredThisSessionIndices(prev => [...prev, selectedFinger!].sort((a, b) => a - b));
                 }
                  setScanState("success"); // Volver a éxito visualmente
                  // Limpiar template guardado temporalmente
                  setFinalTemplateBase64(null);
                  // El botón "Continuar" al paso 5 ahora estará habilitado
             } else {
                  throw new Error("Respuesta inesperada del servidor al guardar.");
             }

        } catch (saveError: any) {
             console.error("Error al guardar la huella:", saveError);
             setError(`Captura completada, pero error al guardar: ${saveError.response?.data?.message || saveError.message}. Intente Continuar/Registrar Otro Dedo para reintentar el guardado si es necesario.`);
             setScanState("error"); // Indicar error después de captura exitosa
              // Mantenemos captureAttempts en TOTAL para habilitar el botón Continuar/Registrar Otro Dedo
              setCaptureAttempts(TOTAL_CAPTURE_ATTEMPTS);
        }


      } else if (!data.complete) {
        setEnrollmentProgressMsg(`Captura ${nextAttempt}/${TOTAL_CAPTURE_ATTEMPTS} exitosa. Faltan ${data.remaining}. Retire y coloque el dedo de nuevo.`);
 
        setScanState("idle"); // Volver a idle para siguiente captura
      }

    } catch (err: any) { // Error en /enroll/capture
      console.error("Error en captura de enrolamiento:", err);
      let specificError = "Error durante la captura.";
      // ... (mapeo de errores como antes) ...
       const apiErrorMsg = err.response?.data;
       if (typeof apiErrorMsg === 'string') {
           if (apiErrorMsg.includes("TIMEOUT") || apiErrorMsg.includes("TIMED_OUT")) specificError = "Tiempo de espera agotado.";
           else if (apiErrorMsg.includes("FAKE")) specificError = "Se detectó un dedo falso.";
           // ... otros errores específicos del SDK ...
           else specificError = apiErrorMsg;
       }
      setError(specificError);
      setScanState("failed");
      setEnrollmentProgressMsg("Error en la captura. Inténtelo de nuevo.");
        // Volver a idle después de mostrar feedback
         setTimeout(() => setScanState("idle"), 2500);
    } finally {
      // Solo quitar isLoading si no estamos guardando
       if (scanState !== 'saving') {
           setIsLoading(false);
       }
        // No volver a idle automáticamente si estamos en estado de error o saving
       if (scanState !== 'error' && scanState !== 'saving' && scanState !== 'success') {
           setTimeout(() => setScanState("idle"), 1500); // Más corto para éxito de captura intermedia
       }
    }
  }, [
    API_BASE_URL, selectedScanner, enrollmentSessionId, selectedEmployee,
    selectedFinger, captureAttempts, captureSuccessFlags, registeredThisSessionIndices, scanState // Añadir scanState
  ]);

  // --- Reintentar Guardar Huella (si falló después de captura exitosa) ---
   const handleRetrySave = useCallback(async () => {
     if (!finalTemplateBase64 || !selectedEmployee || selectedFinger === null || scanState !== 'error') {
         setError("No hay template para reintentar guardar o no hubo error previo.");
         return;
     }
      const employeeId = parseInt(selectedEmployee.id);
      if (isNaN(employeeId)) {
         setError("ID de empleado inválido.");
         return;
      }

     setIsLoading(true);
     setError(null);
     setScanState("saving");
     setEnrollmentProgressMsg("Reintentando guardar huella...");

     const dedoNombre = fingerIndexToName[selectedFinger].toUpperCase();

     try {
      const saveResponse = await axios.post(
        `${API_BASE_URL}/api/empleados/${employeeId}/huellas`,
        {
          nombreDedo: dedoNombre,
          templateBase64: finalTemplateBase64
        }
      );
      
          if (saveResponse.status === 201) {
              setEnrollmentProgressMsg(`¡Huella del dedo ${dedoNombre} guardada exitosamente!`);
              if (!registeredThisSessionIndices.includes(selectedFinger)) {
                  setRegisteredThisSessionIndices(prev => [...prev, selectedFinger!].sort((a, b) => a - b));
              }
              setScanState("success");
              setFinalTemplateBase64(null); // Limpiar template
              // Ir al paso 5 automáticamente?
              setTimeout(() => setCurrentStep(5), 1500);
          } else { throw new Error("Respuesta inesperada del servidor."); }
     } catch (saveError: any) {
          console.error("Error al reintentar guardar la huella:", saveError);
          setError(`Error al reintentar guardar: ${saveError.response?.data?.message || saveError.message}. Puede intentar de nuevo o registrar otro dedo.`);
          setScanState("error"); // Permanecer en estado de error
     } finally {
         setIsLoading(false);
     }

   }, [API_BASE_URL, finalTemplateBase64, selectedEmployee, selectedFinger, scanState]);


  // Navegación (Actualizada para manejar reintento de guardado)
  const goToNextStep = () => {
     // Si estamos en paso 4 y hubo error al guardar pero la captura fue completa
     if (currentStep === 4 && scanState === 'error' && finalTemplateBase64) {
          handleRetrySave(); // Intentar guardar de nuevo en lugar de avanzar directamente
          return;
     }
     // Validaciones estándar
     if (currentStep === 1 && !selectedEmployee) { setError("Seleccione un empleado."); return; }
     if (currentStep === 2 && !selectedScanner) { setError("Seleccione un lector."); return; }
     if (currentStep === 3 && selectedFinger === null) { setError("Seleccione un dedo."); return; }
     // Permitir avanzar si la captura está completa (aunque haya fallado el guardado)
      if (currentStep === 4 && captureAttempts < TOTAL_CAPTURE_ATTEMPTS) { setError(`Complete las ${TOTAL_CAPTURE_ATTEMPTS} capturas exitosas.`); return; }


     setError(null);
     if (currentStep < 5) {
       setCurrentStep(prev => prev + 1);
     }
     if (currentStep === 4) {
       // Resetear estado de captura al salir del paso 4
        resetCaptureState();
        setFinalTemplateBase64(null); // Limpiar template guardado
     }
  };

  // Volver (sin cambios importantes)
  const goToPreviousStep = () => { /* ... código sin cambios ... */
    setError(null);
    if (currentStep > (employeeIdParam ? 2 : 1)) {
        const stepBefore = currentStep;
        setCurrentStep(prev => prev - 1);
        if (stepBefore === 4) {
             setEnrollmentProgressMsg("");
             setScanState("idle");
             // No reseteamos captureAttempts/flags aquí, se hace al (re)seleccionar dedo en paso 3
        }
        if(stepBefore === 3) { setSelectedFinger(null); }
        if (stepBefore === 5) { // Si vuelve de la confirmación, ir a seleccionar OTRO dedo
             setCurrentStep(3);
             resetCaptureState();
             setFinalTemplateBase64(null);
        }
    }
  };

  // Resetear estado captura (sin cambios)
  const resetCaptureState = () => { /* ... código sin cambios ... */
     setCaptureAttempts(0);
     setCaptureSuccessFlags(Array(TOTAL_CAPTURE_ATTEMPTS).fill(false));
     setEnrollmentSessionId(null);
     setScanState("idle");
     setEnrollmentProgressMsg("");
     setError(null);
     // No reseteamos finalTemplateBase64 aquí
  };

  // Finalizar (sin cambios)
  const handleFinish = useCallback(async () => { /* ... código sin cambios ... */
    setIsLoading(true);
    if (selectedScanner && browserSessionId) {
        try {
             if (navigator.sendBeacon) {
              navigator.sendBeacon(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedScanner)}?sessionId=${browserSessionId}`);

             } else {
              await axios.post(`${API_BASE_URL}/api/v1/multi-fingerprint/release/${encodeURIComponent(selectedScanner)}?sessionId=${browserSessionId}`);

             }
             console.log(`Lector ${selectedScanner} liberado al finalizar.`);
        } catch (err) { console.error("Error liberando lector al finalizar:", err); }
    }
    router.push("/empleados");
  }, [API_BASE_URL, selectedScanner, browserSessionId, router]);

  // Registrar otro dedo (sin cambios)
  const handleRegisterAnotherFinger = () => { /* ... código sin cambios ... */
     setCurrentStep(3);
     setSelectedFinger(null);
     resetCaptureState();
     setFinalTemplateBase64(null);
  };

  // --- Renderizado ---

  // Obtener índices de dedos existentes para pasar a HandSelector
  const existingFingerIndices = existingHuellas
      .map(h => fingerNameToIndex[h.nombreDedo?.toUpperCase() ?? ''] ?? -1)
      .filter(index => index !== -1);

  // Renderizado condicional por paso (Paso 3 actualizado para pasar ambos arrays de índices)
  const renderStepContent = () => {
    switch (currentStep) {
        // ... (Casos 1 y 2 sin cambios significativos) ...
         case 1: // Selección de Empleado (Solo si no viene de params)
            return( 
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
                              <p className="text-xs text-zinc-400">{selectedEmployee.id === "nuevo" ? "Nuevo Empleado" : selectedEmployee.id}</p>
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

        case 3: // Selección de Dedo (Actualizado)
            return (
                <Card className="max-w-4xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle>Paso 3: Selección de Dedo</CardTitle>
                        <CardDescription>
                            Seleccione el dedo que desea registrar.
                            <br />
                            <span className="inline-block w-3 h-3 rounded-full bg-green-800 border border-green-600 mr-1 align-middle"></span> <span className="text-zinc-400 text-xs mr-3">Ya registrado en BD.</span>
                            <span className="inline-block w-3 h-3 rounded-full bg-blue-600 border border-blue-400 mr-1 align-middle"></span> <span className="text-zinc-400 text-xs">Registrado en esta sesión.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Info empleado y lector */}
                        {selectedEmployee && (
                        <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg flex items-center gap-3 text-sm">
                            <Users className="h-5 w-5 text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-white">{selectedEmployee.nombre}</span>
                            <span className="text-zinc-500">|</span>
                             <Fingerprint className="h-5 w-5 text-purple-400 flex-shrink-0" />
                             <span className="font-medium text-white">{selectedScanner || "Lector no seleccionado"}</span>
                        </div>
                     )}

                        {/* Selector de manos (Actualizado) */}
                        <HandSelector
                            selectedFinger={selectedFinger}
                            setSelectedFinger={handleFingerSelect}
                            existingFingerIndices={existingFingerIndices}
                            registeredThisSessionIndices={registeredThisSessionIndices} // Pasar dedos registrados en sesión
                        />
                        {/* Info dedo seleccionado */}
                        <div className="text-center min-h-[2rem]">
                            {selectedFinger !== null && (
                                <p className="text-lg font-medium text-purple-300">
                                    Dedo seleccionado: {fingerIndexToName[selectedFinger]}
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

         case 4: // Captura de Huella (Actualizado con botón Reintentar Guardado)
             return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Panel Izquierdo */}
                    <Card className="bg-zinc-900 border-zinc-800">
                         {/* ... CardHeader y Progreso sin cambios ... */}
                         <CardHeader>
                            <CardTitle>Paso 4: Captura de Huella</CardTitle>
                            <CardDescription>
                               Registre <strong className="text-white">{TOTAL_CAPTURE_ATTEMPTS}</strong> capturas exitosas del dedo seleccionado.
                               {/* ... Info Empleado/Dedo ... */}
                            </CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-6">
                             {/* ... Indicadores de Progreso ... */}
                              <h3 className="text-lg font-medium text-zinc-300 mb-3">Progreso de Captura ({captureAttempts}/{TOTAL_CAPTURE_ATTEMPTS})</h3>
                              {/* ... (map de indicadores visuales) ... */}
                               {/* Mensaje de Progreso/Error */}
                              <div className="min-h-[3rem] p-3 bg-zinc-800/50 border border-zinc-700 rounded-md flex items-center justify-center text-center">
                                    {error && currentStep === 4 ? (
                                        <p className="text-red-400 text-sm flex items-center gap-1"><AlertCircle size={16} /> {error}</p>
                                    ) : (
                                        <p className="text-sm text-zinc-300 flex items-center gap-2">
                                             {scanState === 'saving' && <Loader2 size={16} className="animate-spin"/>}
                                             {enrollmentProgressMsg || "Esperando inicio..."}
                                        </p>
                                    )}
                               </div>
                         </CardContent>
                         <CardFooter className="flex justify-between items-center"> {/* Alinear items */}
                            <Button variant="outline" onClick={goToPreviousStep} disabled={isLoading}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                            </Button>
                             {/* Botón de Reintento o Continuar */}
                             {scanState === 'error' && finalTemplateBase64 ? (
                                 <Button onClick={handleRetrySave} disabled={isLoading} className="bg-yellow-600 hover:bg-yellow-700">
                                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                     Reintentar Guardar
                                 </Button>
                             ) : (
                                 <Button
                                     onClick={goToNextStep}
                                     disabled={captureAttempts < TOTAL_CAPTURE_ATTEMPTS || isLoading || !captureSuccessFlags.every(Boolean) || scanState === 'saving'}
                                     className="bg-blue-600 hover:bg-blue-700"
                                 >
                                     {isLoading && scanState !== 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                     {scanState === 'saving' ? 'Guardando...' : 'Continuar'}
                                     {scanState !== 'saving' && <ArrowRight className="ml-2 h-4 w-4" />}
                                 </Button>
                             )}
                         </CardFooter>
                    </Card>

                    {/* Panel Derecho */}
                    <Card className="bg-zinc-900 border-zinc-800">
                         {/* ... CardHeader sin cambios ... */}
                         <CardHeader>
                            <CardTitle>Escáner de Huella</CardTitle>
                            <CardDescription>Lector: {selectedScanner}</CardDescription>
                         </CardHeader>
                         <CardContent className="flex flex-col items-center justify-center py-8 min-h-[350px]">
                             {/* ... Animación SVG y Botón Capturar sin cambios ... */}
                              <div className="relative mb-6 flex h-56 w-56 items-center justify-center">
                                 {/* ... (SVG paths) ... */}
                                  <motion.div key={scanState} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
                                        {scanState === 'idle' && <Fingerprint className="h-32 w-32 text-purple-500/70 animate-pulse" />}
                                        {scanState === 'scanning' && <Loader2 className="h-32 w-32 text-purple-400 animate-spin" />}
                                        {scanState === 'success' && <CheckCircle className="h-32 w-32 text-green-500" />}
                                        {(scanState === 'failed' || scanState === 'error') && <XCircle className="h-32 w-32 text-red-500" />}
                                        {scanState === 'saving' && <Loader2 className="h-32 w-32 text-blue-400 animate-spin" />}
                                  </motion.div>
                              </div>
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


         case 5: // Confirmación Final (Actualizado para mostrar dedos de sesión)
            return (
                <Card className="max-w-3xl mx-auto bg-zinc-900 border-zinc-800">
                    <CardHeader className="text-center">
                         {/* ... Icono CheckCircle ... */}
                        <CardTitle className="text-2xl">¡Enrolamiento Finalizado!</CardTitle>
                        <CardDescription>Se han procesado las huellas para el empleado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Resumen */}
                        <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg space-y-3">
                             {/* ... Info Empleado/Lector ... */}
                             {selectedEmployee && (
                             <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                <span className="font-medium text-white">{selectedEmployee.nombre}</span>
                             </div>
                         )}
                              <div className="flex items-center gap-3">
                                 <Fingerprint className="h-5 w-5 text-purple-400 flex-shrink-0" />
                                 <span className="font-medium text-white">Lector Usado: {selectedScanner || "N/A"}</span>
                              </div>
                             <div>
                                <p className="text-sm font-medium text-zinc-300 mb-1">Dedos registrados/actualizados en esta sesión:</p>
                                 {registeredThisSessionIndices.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {registeredThisSessionIndices.map(finger => (
                                            <span key={finger} className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
                                                {fingerIndexToName[finger]}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-zinc-500 italic">Ninguno registrado en esta sesión.</p>
                                )}
                             </div>
                             {/* Opcional: Mostrar también los dedos que ya existían */}
                             {existingFingerIndices.length > 0 && (
                                 <div className="pt-2 border-t border-zinc-700/50 mt-3">
                                     <p className="text-xs text-zinc-500 mb-1">Dedos previamente registrados:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                          {existingFingerIndices.map(finger => (
                                             <span key={`exist-${finger}`} className="px-2 py-0.5 bg-green-800/50 text-green-400 rounded-md text-xs border border-green-700/50">
                                                 {fingerIndexToName[finger]}
                                             </span>
                                          ))}
                                      </div>
                                 </div>
                             )}
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
                                 {/* Quitar Link a registrar nuevo empleado por ahora */}
                                 {/* <Link href="/empleados/registrar">...</Link> */}
                                 <Link href="/"><Button variant="outline" disabled={isLoading}><Home className="mr-2 h-4 w-4" /> Ir al Inicio</Button></Link>
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
       {/* ... Encabezado y Stepper sin cambios ... */}
        <div className="flex items-center gap-2 mb-8">
            {(currentStep > (employeeIdParam ? 2 : 1)) && (currentStep > (employeeIdParam ? 2 : 1)) && (
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={goToPreviousStep} aria-label="Volver al paso anterior">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
           )}
                       <h1 className="text-3xl font-bold">Asignar Huella Digital</h1>
        </div>
        <div className="mb-8 max-w-4xl mx-auto">
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

// Exportar con Suspense
export default function AsignarHuellaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /> Cargando...</div>}>
      <AsignarHuellaContent />
    </Suspense>
  );
}