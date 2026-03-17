'use client';

import { Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

export default function AdminDateSelector({ initialDate }: { initialDate: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', newDate);
    router.push(`/admin/dashboard?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-zinc-400 font-medium">Select Date</label>
      <div className="relative flex items-center">
        <Calendar className="absolute left-3 w-5 h-5 text-zinc-500" />
        <input 
          type="date" 
          defaultValue={initialDate}
          onChange={handleDateChange}
          className="bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-brand"
          style={{ colorScheme: "dark" }}
        />
      </div>
    </div>
  );
}
