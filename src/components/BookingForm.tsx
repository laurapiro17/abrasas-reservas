"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Users, Clock, ArrowRight, CheckCircle2, User, Phone, Mail, MessageSquare } from "lucide-react";
import { format, addDays } from "date-fns";

const step1Schema = z.object({
  date: z.string().min(1, "Please select a date"),
  partySize: z.number().min(1).max(8, "For parties > 8, please call us"),
  time: z.string().min(1, "Please select a time"),
});

const step2Schema = step1Schema.extend({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(6, "Valid phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type BookingData = z.infer<typeof step2Schema>;

export default function BookingForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      partySize: 2,
      time: "",
    },
  });

  const form2 = useForm<BookingData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      ...form1.getValues(),
      name: "",
      phone: "",
      email: "",
      notes: "",
    },
  });

  const watchedDate = form1.watch("date");
  const watchedPartySize = form1.watch("partySize");

  useEffect(() => {
    async function fetchAvailability() {
      // If we don't have basic inputs, bail out
      if (!watchedDate || !watchedPartySize) return;

      setIsLoadingTimes(true);
      setErrorMsg("");
      form1.setValue("time", ""); // reset time selection when date/party changes
      
      try {
        const res = await fetch(`/api/availability?date=${watchedDate}&partySize=${watchedPartySize}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to fetch times");
        setAvailableTimes(data.availableTimes || []);
      } catch (err: any) {
        console.error(err);
        setAvailableTimes([]);
        setErrorMsg("Failed to load availability. Please try again.");
      } finally {
        setIsLoadingTimes(false);
      }
    }

    fetchAvailability();
  }, [watchedDate, watchedPartySize]);

  const onStep1Submit = async (data: Step1Data) => {
    setErrorMsg("");
    if (data.time) {
      form2.reset({ ...form2.getValues(), ...data });
      setStep(2);
    } else {
      setErrorMsg("Please select an available time slot");
    }
  };

  const onFinalSubmit = async (data: BookingData) => {
    setIsChecking(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || "Failed to make reservation");
      }

      setStep(3);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to complete booking. Please try again or call us.");
    } finally {
      setIsChecking(false);
    }
  };

  if (step === 3) {
    const data = form2.getValues();
    const message = `Hello, I have a reservation for ${data.name} on ${data.date} at ${data.time} for ${data.partySize} people.`;
    const whatsappLink = `https://wa.me/34123456789?text=${encodeURIComponent(message)}`;
    
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Reservation Confirmed</h2>
        <p className="text-zinc-400 mb-8 max-w-sm">
          We look forward to welcoming you on {format(new Date(data.date), "MMMM d, yyyy")} at {data.time}.
        </p>
        
        <a 
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#20bd5a] transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          Contact via WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      {/* Progress Dots */}
      <div className="flex justify-center gap-2 mb-8">
        <div className={`h-1.5 rounded-full transition-all ${step === 1 ? "w-8 bg-brand" : "w-1.5 bg-border"}`} />
        <div className={`h-1.5 rounded-full transition-all ${step === 2 ? "w-8 bg-brand" : "w-1.5 bg-border"}`} />
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm">
          {errorMsg}
        </div>
      )}

      {step === 1 && (
        <form onSubmit={form1.handleSubmit(onStep1Submit)} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="date" 
                  min={format(new Date(), "yyyy-MM-dd")}
                  max={format(addDays(new Date(), 60), "yyyy-MM-dd")}
                  {...form1.register("date")} 
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all appearance-none [&::-webkit-calendar-picker-indicator]:filter-invert"
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-300 mb-1.5 block">Party Size</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <select 
                  {...form1.register("partySize", { valueAsNumber: true })} 
                  className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all appearance-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="text-sm font-medium text-zinc-300">Available Times</label>
                {isLoadingTimes && <span className="text-xs text-brand animate-pulse">Checking...</span>}
              </div>
              
              {!isLoadingTimes && availableTimes.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl py-4 text-center text-zinc-500 text-sm">
                  No tables available for this date/party size.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {availableTimes.map(time => {
                    const isSelected = form1.watch("time") === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => form1.setValue("time", time)}
                        className={`py-2 rounded-xl text-sm font-medium transition-all ${isSelected ? 'bg-brand text-white border-brand' : 'bg-surface border-border text-zinc-300 hover:border-zinc-500'} border`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
              {form1.formState.errors.time && (
                <p className="text-red-500 text-xs mt-1">{form1.formState.errors.time.message}</p>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoadingTimes || availableTimes.length === 0}
            className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-3.5 font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-lg shadow-brand/20"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={form2.handleSubmit(onFinalSubmit)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          
          <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-border flex flex-wrap gap-x-6 gap-y-2 text-sm justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-zinc-300">
                <Calendar className="w-4 h-4 text-brand" /> {format(new Date(form1.getValues("date")), "MMM d")}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Clock className="w-4 h-4 text-brand" /> {form1.getValues("time")}
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <Users className="w-4 h-4 text-brand" /> {form1.getValues("partySize")} p.
              </div>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-brand hover:underline text-xs">
              Edit
            </button>
          </div>

          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                placeholder="Full Name"
                {...form2.register("name")} 
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
              />
            </div>
            {form2.formState.errors.name && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.name.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="tel"
                placeholder="Phone Number"
                {...form2.register("phone")} 
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
              />
            </div>
            {form2.formState.errors.phone && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.phone.message}</p>}
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email"
                placeholder="Email (Optional)"
                {...form2.register("email")} 
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-zinc-500" />
              <textarea 
                placeholder="Any special requests? (Optional)"
                rows={3}
                {...form2.register("notes")} 
                className="w-full bg-surface border border-border rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand/50 focus:border-brand transition-all resize-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isChecking}
            className="w-full bg-brand hover:bg-brand-hover text-white rounded-xl py-3.5 font-medium flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 shadow-lg shadow-brand/20"
          >
            {isChecking ? "Confirming..." : "Confirm Booking"}
          </button>
        </form>
      )}
    </div>
  );
}
