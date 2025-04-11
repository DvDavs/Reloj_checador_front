"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface HandSelectorProps {
    selectedFinger: number | null;
    setSelectedFinger: (finger: number | null) => void;
    existingFingerIndices: number[];
    registeredThisSessionIndices: number[];
}

// Mapping of finger names for display
export const fingerIndexToName = [
    "",
    "Pulgar Derecho",
    "Índice Derecho",
    "Medio Derecho",
    "Anular Derecho",
    "Meñique Derecho",
    "Pulgar Izquierdo",
    "Índice Izquierdo",
    "Medio Izquierdo",
    "Anular Izquierdo",
    "Meñique Izquierdo",
];

export const HandSelector = ({
    selectedFinger,
    setSelectedFinger,
    existingFingerIndices,
    registeredThisSessionIndices,
}: HandSelectorProps) => {
    // Hover state for visual feedback
    const [hoveredFinger, setHoveredFinger] = useState<number | null>(null);

    // Determine the visual state for each finger
    const getFingerStatus = (
        index: number
    ): "selected" | "existing" | "session" | "available" | "hovered" => {
        if (hoveredFinger === index) return "hovered";
        if (selectedFinger === index) return "selected";
        if (registeredThisSessionIndices.includes(index)) return "session";
        if (existingFingerIndices.includes(index)) return "existing";
        return "available";
    };

    // Get color based on finger status
    const getColor = (status: ReturnType<typeof getFingerStatus>) => {
        switch (status) {
            case "hovered":
                return "#9333ea"; // Brighter purple
            case "selected":
                return "#7c3aed"; // Purple
            case "session":
                return "#3b82f6"; // Blue
            case "existing":
                return "#22c55e"; // Green
            default:
                return "#3f3f46"; // Zinc-700
        }
    };

    // Get opacity based on finger status
    const getOpacity = (status: ReturnType<typeof getFingerStatus>) => {
        switch (status) {
            case "hovered":
            case "selected":
                return 1;
            case "session":
            case "existing":
                return 0.8;
            default:
                return 0.6;
        }
    };

    // Handle finger click
    const handleFingerClick = (index: number) => {
        const status = getFingerStatus(index);
        if (status === "existing" || status === "session") return;

        if (selectedFinger === index) {
            setSelectedFinger(null);
        } else {
            setSelectedFinger(index);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 w-full">
                {/* Left Hand */}
                <div className="text-center">
                    <h3 className="mb-4 font-medium text-lg">Mano Izquierda</h3>
                    <div className="relative">
                        <svg
                            width="240"
                            height="280"
                            viewBox="0 0 240 280"
                            className="mx-auto"
                        >
                            {/* Palm - Left Hand - IMPROVED: Larger, more natural shape */}
                            <path
                                d="M20,140 
                                  C20,200 45,240 100,270 
                                  C155,240 180,200 180,140 
                                  C180,100 170,80 170,80 
                                  L45,80 
                                  C30,80 20,100 20,140 Z"
                                fill="#27272a"
                                stroke="#52525b"
                                strokeWidth="1.5"
                            />

                            {/* IMPROVED: Left Hand Fingers - Better aligned with palm */}
                            {/* Meñique (10) - IMPROVED: Lowered position */}
                            <motion.path
                                d="M45,80 L45,40 Q45,25 35,20 Q25,15 15,20 Q5,25 5,40 L5,80"
                                fill={getColor(getFingerStatus(10))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(10)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(10)}
                                onMouseEnter={() => setHoveredFinger(10)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="25"
                                y="50"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                10
                            </text>

                            {/* Anular (9) */}
                            <motion.path
                                d="M75,80 L75,25 Q75,10 65,5 Q55,0 45,5 Q35,10 35,25 L35,80"
                                fill={getColor(getFingerStatus(9))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(9)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(9)}
                                onMouseEnter={() => setHoveredFinger(9)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="55"
                                y="40"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                9
                            </text>

                            {/* Medio (8) */}
                            <motion.path
                                d="M105,80 L105,20 Q105,5 95,0 Q85,-5 75,0 Q65,5 65,20 L65,80"
                                fill={getColor(getFingerStatus(8))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(8)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(8)}
                                onMouseEnter={() => setHoveredFinger(8)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="85"
                                y="35"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                8
                            </text>

                            {/* Índice (7) */}
                            <motion.path
                                d="M135,80 L135,25 Q135,10 125,5 Q115,0 105,5 Q95,10 95,25 L95,80"
                                fill={getColor(getFingerStatus(7))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(7)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(7)}
                                onMouseEnter={() => setHoveredFinger(7)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="115"
                                y="40"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                7
                            </text>

                            {/* Pulgar (6) - IMPROVED: Better thumb position */}
                            <motion.path
                                d="M170,120 Q195,105 205,85 Q215,65 205,50 Q195,35 180,45 Q165,55 170,80"
                                fill={getColor(getFingerStatus(6))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(6)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(6)}
                                onMouseEnter={() => setHoveredFinger(6)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="187"
                                y="75"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                6
                            </text>

                            {/* Label */}
                            <text
                                x="100"
                                y="270"
                                textAnchor="middle"
                                fill="#a1a1aa"
                                fontSize="16"
                            >
                                Izquierda
                            </text>
                        </svg>
                    </div>
                </div>

                {/* Right Hand */}
                <div className="text-center">
                    <h3 className="mb-4 font-medium text-lg">Mano Derecha</h3>
                    <div className="relative">
                        <svg
                            width="240"
                            height="280"
                            viewBox="0 0 240 280"
                            className="mx-auto"
                        >
                            {/* Palm - Right Hand - IMPROVED: Larger, more natural shape */}
                            <path
                                d="M60,140 
                                  C60,200 85,240 140,270 
                                  C195,240 220,200 220,140 
                                  C220,100 210,80 210,80 
                                  L85,80 
                                  C70,80 60,100 60,140 Z"
                                fill="#27272a"
                                stroke="#52525b"
                                strokeWidth="1.5"
                            />

                            {/* IMPROVED: Right Hand Fingers - Better aligned with palm */}
                            {/* Pulgar (1) - IMPROVED: Better thumb position */}
                            <motion.path
                                d="M70,120 Q45,105 35,85 Q25,65 35,50 Q45,35 60,45 Q75,55 70,80"
                                fill={getColor(getFingerStatus(1))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(1)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(1)}
                                onMouseEnter={() => setHoveredFinger(1)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="53"
                                y="75"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                1
                            </text>

                            {/* Índice (2) */}
                            <motion.path
                                d="M105,80 L105,25 Q105,10 115,5 Q125,0 135,5 Q145,10 145,25 L145,80"
                                fill={getColor(getFingerStatus(2))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(2)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(2)}
                                onMouseEnter={() => setHoveredFinger(2)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="125"
                                y="40"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                2
                            </text>

                            {/* Medio (3) */}
                            <motion.path
                                d="M135,80 L135,20 Q135,5 145,0 Q155,-5 165,0 Q175,5 175,20 L175,80"
                                fill={getColor(getFingerStatus(3))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(3)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(3)}
                                onMouseEnter={() => setHoveredFinger(3)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="155"
                                y="35"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                3
                            </text>

                            {/* Anular (4) */}
                            <motion.path
                                d="M165,80 L165,25 Q165,10 175,5 Q185,0 195,5 Q205,10 205,25 L205,80"
                                fill={getColor(getFingerStatus(4))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(4)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(4)}
                                onMouseEnter={() => setHoveredFinger(4)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="185"
                                y="40"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                4
                            </text>

                            {/* Meñique (5) - IMPROVED: Lowered position */}
                            <motion.path
                                d="M195,80 L195,40 Q195,25 205,20 Q215,15 225,20 Q235,25 235,40 L235,80"
                                fill={getColor(getFingerStatus(5))}
                                stroke="#52525b"
                                strokeWidth="1.5"
                                initial={{ opacity: 0.6 }}
                                animate={{
                                    opacity: getOpacity(getFingerStatus(5)),
                                }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleFingerClick(5)}
                                onMouseEnter={() => setHoveredFinger(5)}
                                onMouseLeave={() => setHoveredFinger(null)}
                                style={{ cursor: "pointer" }}
                            />
                            <text
                                x="215"
                                y="50"
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                pointerEvents="none"
                            >
                                5
                            </text>

                            {/* Label */}
                            <text
                                x="140"
                                y="270"
                                textAnchor="middle"
                                fill="#a1a1aa"
                                fontSize="16"
                            >
                                Derecha
                            </text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#7c3aed]"></div>
                    <span className="text-sm text-zinc-300">Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#3b82f6]"></div>
                    <span className="text-sm text-zinc-300">
                        Registrado en esta sesión
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#22c55e]"></div>
                    <span className="text-sm text-zinc-300">Ya registrado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#3f3f46]"></div>
                    <span className="text-sm text-zinc-300">Disponible</span>
                </div>
            </div>

            {/* Selected finger display */}
            {selectedFinger !== null && (
                <div className="mt-6 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-center">
                    <p className="text-lg font-medium text-purple-300">
                        Dedo seleccionado: {fingerIndexToName[selectedFinger]}
                    </p>
                </div>
            )}
        </div>
    );
};