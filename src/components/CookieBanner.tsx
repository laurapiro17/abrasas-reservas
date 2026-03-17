'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('cookieConsent');
    if (!hasAccepted) {
      setTimeout(() => setShow(true), 1500); // Wait a bit for better UX
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="bg-zinc-950/80 backdrop-blur-xl border border-zinc-800 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand/10 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative z-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-brand/10 border border-brand/20 rounded-2xl text-brand">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1 leading-tight">Política de Cookies</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Utilizamos cookies para mejorar tu experiencia de reserva y garantizar la seguridad del sitio. Al continuar, asumes que estás de acuerdo. 🔥🥩
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAccept}
              className="flex-1 px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand/10 hover:shadow-brand/20 active:scale-95"
            >
              Aceptar Cookies
            </button>
            <button
              onClick={() => setShow(false)}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-sm font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
