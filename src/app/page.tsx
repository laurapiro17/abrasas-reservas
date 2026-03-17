import { Flame } from "lucide-react";
import BookingForm from "@/components/BookingForm";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 md:p-24 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 w-full h-96 bg-brand/10 blur-[120px] rounded-full -z-10 pointer-events-none" />
      
      <div className="w-full max-w-md mx-auto flex flex-col items-center mt-8 md:mt-16">
        <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mb-6 shadow-xl shadow-brand/5 relative group">
          <div className="absolute inset-0 rounded-full bg-brand/20 blur-md group-hover:bg-brand/30 transition-all"></div>
          <Flame className="w-8 h-8 text-brand relative z-10" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-center mb-2">
          ABRASAS BLANES
        </h1>
        <p className="text-zinc-400 text-center mb-10 text-sm">
          Reserva tu mesa para una experiencia inolvidable a la brasa.
        </p>

        <div className="w-full bg-surface border border-border rounded-3xl p-6 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none" />
          
          <BookingForm />
        </div>
        
        <div className="mt-12 text-center text-xs text-zinc-500">
          <p>📍 Avenida Europa 23, Blanes 17300</p>
          <p className="mt-1">© {new Date().getFullYear()} Abrasas Blanes.</p>
        </div>
      </div>
    </main>
  );
}
