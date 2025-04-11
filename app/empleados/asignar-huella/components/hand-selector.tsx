"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Image from "next/image"

interface HandSelectorProps {
  selectedFinger: number | null
  setSelectedFinger: (finger: number | null) => void
  existingFingerIndices: number[]
  registeredThisSessionIndices: number[]
}

// Mapping de nombres de dedos para mostrar
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
]

export const HandSelector = ({
  selectedFinger,
  setSelectedFinger,
  existingFingerIndices,
  registeredThisSessionIndices,
}: HandSelectorProps) => {
  const [hoveredFinger, setHoveredFinger] = useState<number | null>(null)

  const getFingerStatus = (index: number): "selected" | "existing" | "session" | "available" | "hovered" => {
    if (hoveredFinger === index) return "hovered"
    if (selectedFinger === index) return "selected"
    if (registeredThisSessionIndices.includes(index)) return "session"
    if (existingFingerIndices.includes(index)) return "existing"
    return "available"
  }

  const getColor = (status: ReturnType<typeof getFingerStatus>) => {
    switch (status) {
      case "hovered":
        return "#9333ea" // Morado brillante
      case "selected":
        return "#7c3aed" // Morado
      case "session":
        return "#3b82f6" // Azul
      case "existing":
        return "#22c55e" // Verde
      default:
        return "#3f3f46" // Zinc-700
    }
  }

  const getOpacity = (status: ReturnType<typeof getFingerStatus>) => {
    switch (status) {
      case "hovered":
      case "selected":
        return 1
      case "session":
      case "existing":
        return 0.8
      default:
        return 0.6
    }
  }

  const handleFingerClick = (index: number) => {
    const status = getFingerStatus(index)
    if (status === "existing" || status === "session") return

    if (selectedFinger === index) {
      setSelectedFinger(null)
    } else {
      setSelectedFinger(index)
    }
  }
  
  // Define finger regions for the right hand
  const rightHandFingerRegions = [
    { id: 1, x: 28, y: 172, width: 35, height: 35 }, // Thumb
    { id: 2, x: 82, y: 64, width: 30, height: 112 }, // Index
    { id: 3, x: 125, y: 40, width: 27, height: 130 }, // Middle
    { id: 4, x: 164, y: 63, width: 29, height: 110 }, // Ring
    { id: 5, x: 204, y: 99, width: 25.5, height: 90 }, // Pinky
  ]

  // Define finger regions for the left hand
  const leftHandFingerRegions = [
    { id: 6, x: 240, y: 170, width: 35, height: 30 }, // Thumb
    { id: 7, x: 187.5, y: 64, width: 29.5, height: 112 }, // Index
    { id: 8, x: 148, y: 40, width: 27.5, height: 130 }, // Middle
    { id: 9, x: 106, y: 63, width: 30, height: 110 }, // Ring    
    { id: 10, x: 70, y: 100, width: 27, height: 90 }, // Pinky
  ]

  return (
    <div className="flex flex-col items-center justify-center w-full">
        
      <div className="flex flex-col md:flex-row justify-center items-center gap-8 w-full mx-auto">
        {/* Left Hand */}
        
      
        <div className="text-center">
          <div className="relative w-[300px] h-[360px]">
            {/* Base hand SVG */}
            <svg width="300" height="360" viewBox="0 0 300 360" className="absolute top-0 left-0">
              <path
                d="M 160,39 L 159,40 L 156,40 L 155,41 L 154,41 L 152,43 L 151,43 L 150,44 L 150,45 L 148,47 L 148,48 L 147,49 L 147,173 L 146,174 L 146,178 L 145,179 L 145,180 L 142,183 L 139,180 L 139,178 L 138,177 L 138,173 L 137,172 L 137,71 L 136,70 L 136,69 L 132,65 L 131,65 L 130,64 L 128,64 L 127,63 L 116,63 L 115,64 L 114,64 L 113,65 L 112,65 L 107,70 L 107,72 L 106,73 L 106,186 L 105,187 L 105,190 L 102,193 L 100,193 L 98,191 L 98,188 L 97,187 L 97,109 L 96,108 L 96,106 L 95,105 L 95,104 L 91,100 L 90,100 L 89,99 L 88,99 L 87,98 L 81,98 L 80,99 L 78,99 L 77,100 L 76,100 L 73,103 L 73,104 L 72,105 L 72,106 L 71,107 L 71,111 L 70,112 L 70,231 L 71,232 L 71,243 L 72,244 L 72,250 L 73,251 L 73,256 L 74,257 L 74,260 L 75,261 L 75,264 L 76,265 L 76,268 L 77,269 L 77,271 L 78,272 L 78,273 L 79,274 L 79,275 L 80,276 L 80,278 L 81,279 L 81,280 L 82,281 L 82,282 L 83,283 L 83,285 L 84,286 L 84,287 L 85,288 L 85,289 L 86,290 L 86,292 L 87,293 L 87,294 L 88,295 L 88,297 L 89,298 L 89,299 L 90,300 L 90,302 L 91,303 L 91,306 L 92,307 L 92,311 L 93,312 L 93,357 L 94,358 L 94,359 L 95,360 L 199,360 L 201,358 L 201,320 L 202,319 L 202,315 L 203,314 L 203,311 L 204,310 L 204,308 L 205,307 L 205,305 L 206,304 L 206,302 L 207,301 L 207,300 L 208,299 L 208,298 L 209,297 L 209,295 L 210,294 L 210,293 L 211,292 L 211,291 L 213,289 L 213,288 L 214,287 L 214,286 L 215,285 L 215,284 L 218,281 L 218,280 L 222,276 L 222,275 L 227,270 L 227,269 L 233,263 L 233,262 L 236,259 L 236,258 L 239,255 L 239,254 L 240,253 L 240,252 L 242,250 L 242,249 L 243,248 L 243,247 L 245,245 L 245,244 L 246,243 L 246,242 L 247,241 L 247,240 L 249,238 L 249,237 L 250,236 L 250,235 L 251,234 L 251,233 L 252,232 L 252,231 L 253,230 L 253,229 L 254,228 L 254,227 L 255,226 L 255,225 L 256,224 L 256,223 L 257,222 L 257,221 L 258,220 L 258,219 L 259,218 L 259,217 L 260,216 L 260,215 L 261,214 L 261,213 L 262,212 L 262,211 L 263,210 L 263,209 L 264,208 L 264,207 L 265,206 L 265,205 L 266,204 L 266,203 L 267,202 L 267,201 L 268,200 L 268,199 L 269,198 L 269,197 L 270,196 L 270,195 L 271,194 L 271,193 L 272,192 L 272,191 L 273,190 L 273,189 L 274,188 L 274,186 L 275,185 L 275,182 L 276,181 L 276,174 L 275,173 L 275,171 L 273,169 L 273,168 L 272,168 L 270,166 L 268,166 L 267,165 L 261,165 L 260,166 L 257,166 L 256,167 L 255,167 L 254,168 L 253,168 L 250,171 L 249,171 L 241,179 L 241,180 L 238,183 L 238,184 L 236,186 L 236,187 L 235,188 L 235,189 L 233,191 L 233,192 L 232,193 L 232,194 L 231,195 L 231,196 L 230,197 L 230,198 L 228,200 L 228,201 L 227,202 L 227,203 L 226,204 L 226,205 L 225,206 L 225,207 L 223,209 L 219,209 L 217,207 L 217,108 L 218,107 L 218,75 L 217,74 L 217,72 L 216,71 L 216,70 L 213,67 L 212,67 L 210,65 L 208,65 L 207,64 L 197,64 L 196,65 L 194,65 L 193,66 L 192,66 L 188,70 L 188,71 L 187,72 L 187,173 L 186,174 L 186,179 L 185,180 L 185,181 L 183,183 L 181,183 L 179,181 L 179,180 L 178,179 L 178,178 L 177,177 L 177,173 L 176,172 L 176,49 L 175,48 L 175,47 L 174,46 L 174,45 L 171,42 L 170,42 L 169,41 L 168,41 L 167,40 L 164,40 L 163,39 Z"
                fill="#27272a"
                stroke="#52525b"
                strokeWidth="1.5"
              />
              
              {/* Label */}
              <text x="150" y="350" textAnchor="middle" fill="#a1a1aa" fontSize="20">
                Izquierda
              </text>
            </svg>
            
            {/* Interactive finger regions */}
            {leftHandFingerRegions.map((finger) => (
              <motion.div
                key={finger.id}
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  left: finger.x,
                  top: finger.y,
                  width: finger.width,
                  height: finger.height,
                  backgroundColor: getColor(getFingerStatus(finger.id)),
                  cursor: getFingerStatus(finger.id) === "existing" || getFingerStatus(finger.id) === "session" 
                    ? "not-allowed" 
                    : "pointer",
                }}
                onClick={() => handleFingerClick(finger.id)}
                onMouseEnter={() =>
                  getFingerStatus(finger.id) !== "existing" &&
                  getFingerStatus(finger.id) !== "session" &&
                  setHoveredFinger(finger.id)
                }
                onMouseLeave={() => setHoveredFinger(null)}
                initial={{ opacity: 0.6 }}
                animate={{ 
                  opacity: getOpacity(getFingerStatus(finger.id)),
                  scale: getFingerStatus(finger.id) === "selected" || getFingerStatus(finger.id) === "hovered" ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-medium">{finger.id}</span>
              </motion.div>
            ))}
          </div>
        </div>
{/* Show selected finger */}
{selectedFinger !== null && (
        <div className="mt-6 p-3 bg-purple-900/30 border border-purple-500/30 rounded-lg text-center">
          <p className="text-lg font-medium text-purple-300">Dedo seleccionado: {fingerIndexToName[selectedFinger]}</p>
        </div>
      )}
        {/* Right Hand */}
        <div className="text-center">
          <div className="relative w-[300px] h-[360px]">
            {/* Base hand SVG */}
            <svg width="300" height="360" viewBox="0 0 300 360" className="absolute top-0 left-0">
              <path
                d="M 160,39 L 159,40 L 156,40 L 155,41 L 154,41 L 152,43 L 151,43 L 150,44 L 150,45 L 148,47 L 148,48 L 147,49 L 147,173 L 146,174 L 146,178 L 145,179 L 145,180 L 142,183 L 139,180 L 139,178 L 138,177 L 138,173 L 137,172 L 137,71 L 136,70 L 136,69 L 132,65 L 131,65 L 130,64 L 128,64 L 127,63 L 116,63 L 115,64 L 114,64 L 113,65 L 112,65 L 107,70 L 107,72 L 106,73 L 106,186 L 105,187 L 105,190 L 102,193 L 100,193 L 98,191 L 98,188 L 97,187 L 97,109 L 96,108 L 96,106 L 95,105 L 95,104 L 91,100 L 90,100 L 89,99 L 88,99 L 87,98 L 81,98 L 80,99 L 78,99 L 77,100 L 76,100 L 73,103 L 73,104 L 72,105 L 72,106 L 71,107 L 71,111 L 70,112 L 70,231 L 71,232 L 71,243 L 72,244 L 72,250 L 73,251 L 73,256 L 74,257 L 74,260 L 75,261 L 75,264 L 76,265 L 76,268 L 77,269 L 77,271 L 78,272 L 78,273 L 79,274 L 79,275 L 80,276 L 80,278 L 81,279 L 81,280 L 82,281 L 82,282 L 83,283 L 83,285 L 84,286 L 84,287 L 85,288 L 85,289 L 86,290 L 86,292 L 87,293 L 87,294 L 88,295 L 88,297 L 89,298 L 89,299 L 90,300 L 90,302 L 91,303 L 91,306 L 92,307 L 92,311 L 93,312 L 93,357 L 94,358 L 94,359 L 95,360 L 199,360 L 201,358 L 201,320 L 202,319 L 202,315 L 203,314 L 203,311 L 204,310 L 204,308 L 205,307 L 205,305 L 206,304 L 206,302 L 207,301 L 207,300 L 208,299 L 208,298 L 209,297 L 209,295 L 210,294 L 210,293 L 211,292 L 211,291 L 213,289 L 213,288 L 214,287 L 214,286 L 215,285 L 215,284 L 218,281 L 218,280 L 222,276 L 222,275 L 227,270 L 227,269 L 233,263 L 233,262 L 236,259 L 236,258 L 239,255 L 239,254 L 240,253 L 240,252 L 242,250 L 242,249 L 243,248 L 243,247 L 245,245 L 245,244 L 246,243 L 246,242 L 247,241 L 247,240 L 249,238 L 249,237 L 250,236 L 250,235 L 251,234 L 251,233 L 252,232 L 252,231 L 253,230 L 253,229 L 254,228 L 254,227 L 255,226 L 255,225 L 256,224 L 256,223 L 257,222 L 257,221 L 258,220 L 258,219 L 259,218 L 259,217 L 260,216 L 260,215 L 261,214 L 261,213 L 262,212 L 262,211 L 263,210 L 263,209 L 264,208 L 264,207 L 265,206 L 265,205 L 266,204 L 266,203 L 267,202 L 267,201 L 268,200 L 268,199 L 269,198 L 269,197 L 270,196 L 270,195 L 271,194 L 271,193 L 272,192 L 272,191 L 273,190 L 273,189 L 274,188 L 274,186 L 275,185 L 275,182 L 276,181 L 276,174 L 275,173 L 275,171 L 273,169 L 273,168 L 272,168 L 270,166 L 268,166 L 267,165 L 261,165 L 260,166 L 257,166 L 256,167 L 255,167 L 254,168 L 253,168 L 250,171 L 249,171 L 241,179 L 241,180 L 238,183 L 238,184 L 236,186 L 236,187 L 235,188 L 235,189 L 233,191 L 233,192 L 232,193 L 232,194 L 231,195 L 231,196 L 230,197 L 230,198 L 228,200 L 228,201 L 227,202 L 227,203 L 226,204 L 226,205 L 225,206 L 225,207 L 223,209 L 219,209 L 217,207 L 217,108 L 218,107 L 218,75 L 217,74 L 217,72 L 216,71 L 216,70 L 213,67 L 212,67 L 210,65 L 208,65 L 207,64 L 197,64 L 196,65 L 194,65 L 193,66 L 192,66 L 188,70 L 188,71 L 187,72 L 187,173 L 186,174 L 186,179 L 185,180 L 185,181 L 183,183 L 181,183 L 179,181 L 179,180 L 178,179 L 178,178 L 177,177 L 177,173 L 176,172 L 176,49 L 175,48 L 175,47 L 174,46 L 174,45 L 171,42 L 170,42 L 169,41 L 168,41 L 167,40 L 164,40 L 163,39 Z"
                fill="#27272a"
                stroke="#52525b"
                strokeWidth="1.5"
                transform="scale(-1, 1) translate(-300, 0)"
              />
              
              {/* Label */}
              <text x="150" y="350" textAnchor="middle" fill="#a1a1aa" fontSize="20">
              Derecha
              </text>
            </svg>
            
            {/* Interactive finger regions */}
            {rightHandFingerRegions.map((finger) => (
              <motion.div
                key={finger.id}
                className="absolute rounded-full flex items-center justify-center cursor-pointer"
                style={{
                  left: finger.x,
                  top: finger.y,
                  width: finger.width,
                  height: finger.height,
                  backgroundColor: getColor(getFingerStatus(finger.id)),
                  cursor: getFingerStatus(finger.id) === "existing" || getFingerStatus(finger.id) === "session" 
                    ? "not-allowed" 
                    : "pointer",
                }}
                onClick={() => handleFingerClick(finger.id)}
                onMouseEnter={() =>
                  getFingerStatus(finger.id) !== "existing" &&
                  getFingerStatus(finger.id) !== "session" &&
                  setHoveredFinger(finger.id)
                }
                onMouseLeave={() => setHoveredFinger(null)}
                initial={{ opacity: 0.6 }}
                animate={{ 
                  opacity: getOpacity(getFingerStatus(finger.id)),
                  scale: getFingerStatus(finger.id) === "selected" || getFingerStatus(finger.id) === "hovered" ? 1.1 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-white font-medium">{finger.id}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>


    </div>
  )
}