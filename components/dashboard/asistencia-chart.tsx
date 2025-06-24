"use client"

import { useTheme } from "next-themes"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { date: "01/05", asistencia: 92, retardos: 5, faltas: 3 },
  { date: "02/05", asistencia: 90, retardos: 7, faltas: 3 },
  { date: "03/05", asistencia: 94, retardos: 4, faltas: 2 },
  { date: "04/05", asistencia: 91, retardos: 6, faltas: 3 },
  { date: "05/05", asistencia: 89, retardos: 8, faltas: 3 },
  { date: "06/05", asistencia: 95, retardos: 3, faltas: 2 },
  { date: "07/05", asistencia: 93, retardos: 5, faltas: 2 },
  { date: "08/05", asistencia: 94, retardos: 4, faltas: 2 },
  { date: "09/05", asistencia: 91, retardos: 6, faltas: 3 },
  { date: "10/05", asistencia: 90, retardos: 7, faltas: 3 },
  { date: "11/05", asistencia: 92, retardos: 5, faltas: 3 },
  { date: "12/05", asistencia: 93, retardos: 4, faltas: 3 },
  { date: "13/05", asistencia: 95, retardos: 3, faltas: 2 },
  { date: "14/05", asistencia: 94, retardos: 4, faltas: 2 },
]

export function AsistenciaChart() {
  const { theme } = useTheme()

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis
          dataKey="date"
          stroke={theme === "dark" ? "#64748b" : "#94a3b8"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={theme === "dark" ? "#64748b" : "#94a3b8"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
            borderColor: theme === "dark" ? "#334155" : "#e2e8f0",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            color: theme === "dark" ? "#f8fafc" : "#0f172a",
          }}
        />
        <Line
          type="monotone"
          dataKey="asistencia"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="retardos"
          stroke="#eab308"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
        <Line
          type="monotone"
          dataKey="faltas"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
