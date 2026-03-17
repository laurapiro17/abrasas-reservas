'use client';

import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  startOfToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Reservation {
  id: string;
  reservation_date: string;
  party_size: number;
  status: string;
}

interface CalendarViewProps {
  reservations: Reservation[];
  onDateSelect: (date: string) => void;
}

export default function CalendarView({ reservations, onDateSelect }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const router = useRouter();

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'week' ? 'bg-brand text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white border border-zinc-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1 text-xs font-medium border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white border border-zinc-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-xs font-bold text-zinc-500 uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarStartDate = viewMode === 'month' ? startDate : startOfWeek(new Date());
    const calendarEndDate = viewMode === 'month' ? endDate : endOfWeek(new Date());

    const rows = [];
    let days = [];
    let day = calendarStartDate;

    while (day <= calendarEndDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const dayReservations = reservations.filter(r => r.reservation_date === formattedDate && r.status !== 'cancelled');
        const totalCovers = dayReservations.reduce((sum, r) => sum + r.party_size, 0);
        
        const isSelected = false; // Add logic if needed
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toString()}
            onClick={() => onDateSelect(formattedDate)}
            className={`min-h-[100px] p-2 border border-zinc-900 transition-all cursor-pointer group hover:bg-zinc-900/50 relative ${
              !isCurrentMonth && viewMode === 'month' ? 'opacity-20' : 'opacity-100'
            } ${isTodayDate ? 'bg-brand/5' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium ${isTodayDate ? 'text-brand' : 'text-zinc-400'}`}>
                {format(day, 'd')}
              </span>
              {dayReservations.length > 0 && (
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded flex items-center gap-1 font-mono">
                  <CalendarIcon className="w-2.5 h-2.5" /> {dayReservations.length}
                </span>
              )}
            </div>
            
            {totalCovers > 0 && (
               <div className="mt-auto">
                 <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                    <Users className="w-3 h-3" />
                    <span className="font-bold text-zinc-300">{totalCovers} pax</span>
                 </div>
                 <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-brand h-full" 
                      style={{ width: `${Math.min((totalCovers / 40) * 100, 100)}%` }}
                    />
                 </div>
               </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
      if (viewMode === 'week' && rows.length >= 1) break;
    }

    return <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">{rows}</div>;
  };

  return (
    <div className="w-full">
      {renderHeader()}
      {renderDays()}
      {renderCells()}
    </div>
  );
}
