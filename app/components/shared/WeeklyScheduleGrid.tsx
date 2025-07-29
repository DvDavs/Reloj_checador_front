'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  Copy,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopySchedulePopover } from './CopySchedulePopover';

// --- Types ---
export type DayOfWeek = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
export interface TimeSlot { horaEntrada: string; horaSalida: string; }
export type WeeklySchedule = Record<DayOfWeek, TimeSlot[]>;

interface InteractiveWeeklyScheduleProps {
  schedule: Partial<WeeklySchedule>;
  onScheduleChange: (schedule: WeeklySchedule) => void;
  editable?: boolean;
  showDayHeaders?: boolean;
}

// --- Constants & Utils ---
const DAYS: DayOfWeek[] = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];

const timeToMinutes = (t: string) => {
  const [h,m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};

const generateTimeLabels = (granularity: '30min'|'60min', range: 'work'|'am'|'pm'|'24h') => {
  const labels: string[] = [];
  const interval = granularity === '30min' ? 30 : 60;
  let startHour = 0, endHour = 24;
  if (range === 'work') { startHour = 6; endHour = 20; }
  else if (range === 'am') { endHour = 12; }
  else if (range === 'pm') { startHour = 12; }
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (interval === 60 && m > 0) continue;
      labels.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }
  return labels;
};

const mergeTimeSlots = (slots: TimeSlot[]): TimeSlot[] => {
  if (slots.length <= 1) return slots;
  const sorted = [...slots].sort((a,b) => timeToMinutes(a.horaEntrada) - timeToMinutes(b.horaEntrada));
  const merged: TimeSlot[] = [];
  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    if (timeToMinutes(current.horaSalida) >= timeToMinutes(next.horaEntrada)) {
      current.horaSalida = minutesToTime(Math.max(
        timeToMinutes(current.horaSalida), timeToMinutes(next.horaSalida)
      ));
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);
  return merged;
};

// --- Component ---
export default function InteractiveWeeklySchedule({
  schedule,
  onScheduleChange,
  editable = true,
  showDayHeaders = true,
}: InteractiveWeeklyScheduleProps) {
  const [granularity, setGranularity] = useState<'30min' | '60min'>('30min');
  const [timeRange, setTimeRange] = useState<'work'|'am'|'pm'|'24h'>('work');
  const [isMobile, setIsMobile] = useState(false);
  const [currentDay, setCurrentDay] = useState<DayOfWeek>('LUNES');
  const [action, setAction] = useState<'none'|'painting'|'resizing'>('none');
  const [selection, setSelection] = useState<{ day: DayOfWeek; start: number; end: number } | null>(null);
  const [resizeInfo, setResizeInfo] =
    useState<{ slot: TimeSlot; day: DayOfWeek; edge: 'start' | 'end'; orig: number } | null>(
      null,
    );
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  const [didDrag, setDidDrag] = useState(false);

  const daysToRender = useMemo(() => {
    if (!showDayHeaders) {
      return Object.keys(schedule) as DayOfWeek[];
    }
    return DAYS;
  }, [schedule, showDayHeaders]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const times = useMemo(() => generateTimeLabels(granularity, timeRange), [granularity, timeRange]);
  const interval = useMemo(() => granularity === '30min' ? 30 : 60, [granularity]);

  const cellMap = useMemo(() => {
    const map = new Map<string, { slot: TimeSlot; isFirst: boolean; isLast: boolean }>();
    const days = showDayHeaders ? DAYS : Object.keys(schedule) as DayOfWeek[];
    days.forEach(day => {
      (schedule[day] || []).forEach(slot => {
        const startMin = timeToMinutes(slot.horaEntrada);
        const endMin = timeToMinutes(slot.horaSalida);
        for (let t = startMin; t < endMin; t += 30) {
          map.set(`${day}-${minutesToTime(t)}`, { slot, isFirst: t === startMin, isLast: (t + 30) >= endMin });
        }
      });
    });
    return map;
  }, [schedule, showDayHeaders]);

  const handleClearAll = () => {
    const emptySchedule: WeeklySchedule = {
      LUNES: [],
      MARTES: [],
      MIERCOLES: [],
      JUEVES: [],
      VIERNES: [],
      SABADO: [],
      DOMINGO: [],
    };
    onScheduleChange(emptySchedule);
  };

  const finishAction = useCallback(() => {
    if (action === 'painting' && selection && didDrag) {
      const { day, start, end } = selection;
      const a = Math.min(start, end);
      const b = Math.max(start, end) + interval;
      const newSlot: TimeSlot = { horaEntrada: minutesToTime(a), horaSalida: minutesToTime(b) };
      const currentSlots = schedule[day] || [];
      const merged = mergeTimeSlots([...currentSlots, newSlot]);
      const fullSchedule = { ...schedule, [day]: merged };
      onScheduleChange(fullSchedule as WeeklySchedule);
    }
    if (action === 'resizing' && resizeInfo && selection) {
        const { day, slot, edge, orig } = resizeInfo;
        let s = timeToMinutes(slot.horaEntrada);
        let e = timeToMinutes(slot.horaSalida);
        const ext = edge === 'start' ? selection.start : selection.end;
        if (ext !== undefined) {
            if (edge === 'start') { s = Math.min(ext, orig); }
            else { e = Math.max(ext, orig); }
            if (e - s >= interval) {
                const existingSlots = schedule[day] || [];
                const arr = mergeTimeSlots([...existingSlots, { horaEntrada: minutesToTime(s), horaSalida: minutesToTime(e) }]);
                const filtered = existingSlots.filter(z => z !== slot);
                const finalMerged = mergeTimeSlots([...filtered, ...arr]);
                onScheduleChange({ ...schedule, [day]: finalMerged } as WeeklySchedule);
            }
        }
    }
    setAction('none');
    setSelection(null);
    setResizeInfo(null);
    setDidDrag(false);
  }, [
    action,
    selection,
    resizeInfo,
    schedule,
    interval,
    onScheduleChange,
    didDrag,
  ]);

  useEffect(() => {
    window.addEventListener('mouseup', finishAction);
    return () => window.removeEventListener('mouseup', finishAction);
  }, [finishAction]);

  const handleCellMouseDown = (day: DayOfWeek, time: string, e: React.MouseEvent) => {
    if (!editable) return;
    setDidDrag(false); // Reset drag state on new mousedown

    const key = `${day}-${time}`;
    const info = cellMap.get(key);
    if (info) {
      const offsetY = e.nativeEvent.offsetY;
      const height = (e.currentTarget as HTMLDivElement).offsetHeight;
      if (offsetY < height * 0.3) {
        setAction('resizing');
        setResizeInfo({ slot: info.slot, day, edge: 'start', orig: timeToMinutes(info.slot.horaEntrada) });
        setSelection({ day, start: timeToMinutes(info.slot.horaSalida), end: timeToMinutes(info.slot.horaSalida) });
      } else if (offsetY > height * 0.7) {
        setAction('resizing');
        setResizeInfo({ slot: info.slot, day, edge: 'end', orig: timeToMinutes(info.slot.horaSalida) });
        setSelection({ day, start: timeToMinutes(info.slot.horaEntrada), end: timeToMinutes(info.slot.horaEntrada) });
      }
      return;
    }
    setAction('painting');
    const t = timeToMinutes(time);
    setSelection({ day, start: t, end: t });
  };

  const handleCellMouseEnter = (day: DayOfWeek, time: string) => {
    const info = cellMap.get(`${day}-${time}`);
    setHoveredSlot(info ? info.slot : null);

    if (action === 'painting' || action === 'resizing') {
      setDidDrag(true);
    }

    if (action === 'painting' && selection?.day === day) {
      setSelection({ ...selection, end: timeToMinutes(time) });
    }
    if (action === 'resizing' && resizeInfo) {
        if (resizeInfo.edge === 'start') {
            setSelection(prev => prev ? { ...prev, start: timeToMinutes(time) } : prev);
        } else {
            setSelection(prev => prev ? { ...prev, end: timeToMinutes(time) } : prev);
        }
    }
  };

  const handleCellClick = (day: DayOfWeek, time: string) => {
    if (!editable || didDrag) return;

    const key = `${day}-${time}`;
    const info = cellMap.get(key);
    if (info) {
      const arr = (schedule[day] || []).filter(z => z !== info.slot);
      onScheduleChange({ ...schedule, [day]: arr } as WeeklySchedule);
    } else {
      const s = timeToMinutes(time);
      const e = s + interval;
      const newSlot: TimeSlot = { horaEntrada: minutesToTime(s), horaSalida: minutesToTime(e) };
      const merged = mergeTimeSlots([...(schedule[day] || []), newSlot]);
      onScheduleChange({ ...schedule, [day]: merged } as WeeklySchedule);
    }
  };

  const renderGrid = (days: DayOfWeek[]) => (
    <div className="grid grid-cols-[auto_repeat(var(--days),minmax(0,1fr))] bg-border" style={{ '--days': days.length } as React.CSSProperties} onMouseLeave={() => setHoveredSlot(null)}>
      <div className="bg-card sticky top-0 left-0 z-10" />
      {days.map(day => (
        <div
          key={day}
          className={cn(
            'bg-card p-2 text-center font-medium sticky top-0 z-10 flex items-center justify-center gap-2 transition-all duration-150',
          )}
        >
          <span className="hidden md:inline">{day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}</span>
          <span className="md:hidden">{day.substring(0, 3)}</span>
          {editable && showDayHeaders && (
            <CopySchedulePopover
              sourceDay={day}
              schedule={schedule}
              onScheduleChange={onScheduleChange}
              days={days}
            >
              <button className="p-1 rounded-full hover:bg-muted">
                <Copy className="h-4 w-4" />
              </button>
            </CopySchedulePopover>
          )}
        </div>
      ))}
      {times.map(time => (
        <React.Fragment key={time}>
          <div className="bg-card p-1 text-xs text-muted-foreground text-right sticky left-0 z-5 select-none whitespace-nowrap">
            {`${time} - ${minutesToTime(timeToMinutes(time) + interval)}`}
          </div>
          {days.map(day => {
            const key = `${day}-${time}`;
            const info = cellMap.get(key);
            const isOccupied = !!info;
            const isHoveredForDelete = editable && hoveredSlot === info?.slot;
            const inSelection = (action === 'painting' || action === 'resizing') && selection?.day === day &&
              timeToMinutes(time) >= Math.min(selection.start, selection.end) &&
              timeToMinutes(time) < Math.max(selection.start, selection.end) + (action === 'resizing' ? interval : 0);
            
            return (
              <motion.div
                key={key}
                layout
                className={cn(
                  'h-8 relative group transition-colors duration-75 border-b border-r border-border/20',
                  'bg-background',
                  editable && !isOccupied && 'hover:bg-muted/50',
                  isOccupied && 'bg-primary text-primary-foreground',
                  inSelection && !isOccupied && 'bg-primary/50',
                  isHoveredForDelete && 'bg-destructive',
                  info?.isFirst && 'rounded-t-md',
                  info?.isLast && 'rounded-b-md'
                )}
                style={{
                  cursor: isOccupied && editable ? 'row-resize' : 'default'
                }}
                onMouseDown={e => handleCellMouseDown(day, time, e)}
                onMouseEnter={() => handleCellMouseEnter(day, time)}
                onClick={() => handleCellClick(day, time)}
              >
                {isOccupied && info.isFirst && (
                    <div className="absolute inset-x-0 top-0 p-1 text-xs font-semibold z-10 pointer-events-none overflow-hidden whitespace-nowrap text-ellipsis">
                      {isHoveredForDelete ? (
                          <div className="flex items-center justify-center text-destructive-foreground font-medium gap-2">
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                          </div>
                      ) : (
                          <span>{info.slot.horaEntrada} - {info.slot.horaSalida}</span>
                      )}
                    </div>
                )}
              </motion.div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="select-none rounded-lg border bg-card p-4 text-card-foreground">
      <div className="mb-4 flex flex-col items-center justify-between gap-4 md:flex-row">
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={v => setTimeRange(v as any)}
          disabled={!editable}
        >
          <ToggleGroupItem value="work">Laborales</ToggleGroupItem>
          <ToggleGroupItem value="am">AM</ToggleGroupItem>
          <ToggleGroupItem value="pm">PM</ToggleGroupItem>
          <ToggleGroupItem value="24h">24 Horas</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex items-center gap-4">
          {editable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="flex-shrink-0"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <Switch
              id="granularity-switch"
              checked={granularity === '30min'}
              onCheckedChange={c => setGranularity(c ? '30min' : '60min')}
              disabled={!editable}
            />
            <Label htmlFor="granularity-switch">Medias Horas</Label>
          </div>
        </div>

        {isMobile && showDayHeaders && (
          <Select
            value={currentDay}
            onValueChange={v => setCurrentDay(v as DayOfWeek)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Día" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
      {isMobile ? renderGrid([currentDay]) : renderGrid(daysToRender)}
    </div>
  );
}
