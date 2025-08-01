'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';
import WeeklyScheduleGrid, {
  DayOfWeek,
  WeeklySchedule,
} from './WeeklyScheduleGrid';
import { CopySchedulePopover } from './CopySchedulePopover';

const DAYS: DayOfWeek[] = [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
];

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onScheduleChange: (newSchedule: WeeklySchedule) => void;
  editable?: boolean;
}

export default function ScheduleEditor({
  schedule,
  onScheduleChange,
  editable = true,
}: ScheduleEditorProps) {
  const [activeTab, setActiveTab] = useState<DayOfWeek>('LUNES');

  const handleDayScheduleChange = (
    day: DayOfWeek,
    daySchedule: WeeklySchedule,
  ) => {
    onScheduleChange({
      ...schedule,
      [day]: daySchedule[day],
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={value => setActiveTab(value as DayOfWeek)}
      className="w-full"
    >
      <div className="flex items-center">
        <TabsList>
          {DAYS.map(day => (
            <TabsTrigger key={day} value={day}>
              <span className="hidden sm:inline">
                {day.charAt(0) + day.slice(1).toLowerCase()}
              </span>
              <span className="sm:hidden">{day.substring(0, 3)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {editable && (
          <CopySchedulePopover
            sourceDay={activeTab}
            schedule={schedule}
            onScheduleChange={onScheduleChange}
          >
            <Button variant="outline" size="sm" className="ml-4">
              <Copy className="mr-2 h-4 w-4" />
              Copiar desde {activeTab.substring(0, 3)}...
            </Button>
          </CopySchedulePopover>
        )}
      </div>

      {DAYS.map(day => (
        <TabsContent key={day} value={day} className="mt-4">
          <WeeklyScheduleGrid
            schedule={{ [day]: schedule[day] || [] }}
            onScheduleChange={daySchedule =>
              handleDayScheduleChange(day, daySchedule)
            }
            editable={editable}
            showDayHeaders={false} // Para no duplicar el día que ya está en la pestaña
          />
        </TabsContent>
      ))}
    </Tabs>
  );
} 