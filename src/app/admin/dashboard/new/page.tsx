"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Users, User, Phone, Mail, MessageSquare } from "lucide-react";
import { format, addDays } from "date-fns";
import Link from "next/link";

export default function NewReservationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const payload = {
      date: form.get("date"),
      time: form.get("time"),
      partySize: Number(form.get("partySize")),
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") || "",
      notes: form.get("notes") || "",
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create reservation");
      router.push("/admin/dashboard?date=" + payload.date);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all";

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold tracking-tight">New Reservation</h1>
      </header>

      <main className="flex-1 p-6 md:p-8 max-w-2xl mx-auto w-full">
        {errorMsg && (
          <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl p-4 mb-6 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={format(new Date(), "yyyy-MM-dd")}
                  min={format(new Date(), "yyyy-MM-dd")}
                  max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="time"
                  name="time"
                  required
                  className={inputClass}
                  style={{ colorScheme: "dark" }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Party Size</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <select
                name="partySize"
                required
                className={inputClass + " appearance-none"}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "Person" : "People"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-zinc-800" />

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input type="text" name="name" required placeholder="Customer Name" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="tel" name="phone" required placeholder="Phone Number" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" name="email" placeholder="Email" className={inputClass} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Notes (Optional)</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-4 w-5 h-5 text-zinc-500" />
              <textarea
                name="notes"
                rows={3}
                placeholder="Any special requests..."
                className={inputClass + " resize-none"}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand text-white rounded-xl py-3 font-medium hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Reservation"}
          </button>
        </form>
      </main>
    </div>
  );
}
