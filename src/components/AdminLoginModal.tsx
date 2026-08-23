import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { APP_LOGO_URL } from '../data/initialMovies';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CORRECT_PIN = '070600';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setSuccess(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === CORRECT_PIN) {
      setError(null);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 600);
    } else {
      setError('PIN Admin Salah! Akses ditolak.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);
      if (newPin.length === 6) {
        if (newPin === CORRECT_PIN) {
          setError(null);
          setSuccess(true);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 600);
        } else {
          setError('PIN Admin Salah! Akses ditolak.');
          setPin('');
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  return (
    <div
      id="admin-login-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm bg-[#0B0B10] border border-[#20202C] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black text-center animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          id="close-admin-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#14141C] border border-[#22222C] text-[#8E8E93] hover:text-[#F9F9F9] hover:bg-[#1C1C26] transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Logo & Lock Badge */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <img
            src={APP_LOGO_URL}
            alt="Tontonan Gratis"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover rounded-2xl border border-[#E50914]/40 shadow-xl shadow-[#E50914]/25"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[#E50914] text-white flex items-center justify-center shadow-md">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
        </div>

        <h3 className="text-lg sm:text-xl font-black text-[#F9F9F9] mb-1">
          Akses Masuk Admin
        </h3>
        <p className="text-xs text-[#A1A1AA] mb-6">
          Masukkan 6 digit PIN keamanan untuk mengelola katalog, player video, dan konfigurasi.
        </p>

        {/* Hidden Form Input for keyboard compatibility */}
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type={showPin ? 'text' : 'password'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(val);
              setError(null);
              if (val.length === 6) {
                if (val === CORRECT_PIN) {
                  setError(null);
                  setSuccess(true);
                  setTimeout(() => {
                    onSuccess();
                    onClose();
                  }, 600);
                } else {
                  setError('PIN Admin Salah! Akses ditolak.');
                  setPin('');
                }
              }
            }}
            className="sr-only"
            autoComplete="off"
          />

          {/* 6 Digit Visual Boxes */}
          <div
            className="flex items-center justify-center gap-2 sm:gap-2.5 mb-5 cursor-pointer"
            onClick={() => inputRef.current?.focus()}
          >
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const digit = pin[idx];
              const isFilled = digit !== undefined;
              const isCurrent = idx === pin.length;

              return (
                <div
                  key={idx}
                  className={`w-10 h-12 sm:w-11 sm:h-13 rounded-xl border flex items-center justify-center text-lg font-black transition-all ${
                    success
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : error
                      ? 'border-red-500 bg-red-500/10 text-red-400 animate-pulse'
                      : isFilled
                      ? 'border-[#E50914] bg-[#E50914]/10 text-[#F9F9F9]'
                      : isCurrent
                      ? 'border-[#38384A] bg-[#12121A] text-white ring-2 ring-[#E50914]/40'
                      : 'border-[#20202A] bg-[#0E0E14] text-[#71717A]'
                  }`}
                >
                  {isFilled ? (showPin ? digit : '•') : ''}
                </div>
              );
            })}
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-red-400 bg-red-950/40 border border-red-800/60 py-2 px-3 rounded-xl">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 py-2 px-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>PIN Benar! Membuka Admin Console...</span>
            </div>
          )}

          {/* Toggle Show/Hide PIN */}
          <div className="flex items-center justify-between mb-5 px-1">
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="text-xs text-[#8E8E93] hover:text-[#F9F9F9] flex items-center gap-1.5 transition"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? 'Sembunyikan Digit' : 'Lihat Digit PIN'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPin('');
                setError(null);
                inputRef.current?.focus();
              }}
              className="text-xs text-[#8E8E93] hover:text-[#E50914] transition"
            >
              Hapus Semua
            </button>
          </div>

          {/* Numeric Keypad for Mobile & Touch */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="py-3 rounded-xl bg-[#12121A] hover:bg-[#1C1C26] active:bg-[#E50914]/20 border border-[#20202A] hover:border-[#2C2C3C] text-base font-bold text-[#F9F9F9] transition"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-xl bg-[#12121A] hover:bg-[#1C1C26] active:bg-[#E50914]/20 border border-[#20202A] text-xs font-bold text-[#A1A1AA] transition"
            >
              DEL
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-3 rounded-xl bg-[#12121A] hover:bg-[#1C1C26] active:bg-[#E50914]/20 border border-[#20202A] text-base font-bold text-[#F9F9F9] transition"
            >
              0
            </button>
            <button
              type="submit"
              disabled={pin.length < 6}
              className="py-3 rounded-xl bg-[#E50914] hover:bg-[#F40612] disabled:opacity-40 disabled:hover:bg-[#E50914] text-xs font-black text-white shadow-lg shadow-[#E50914]/25 transition"
            >
              MASUK
            </button>
          </div>
        </form>

        <p className="text-[11px] text-[#71717A] mt-2">
          Hanya pengelola website yang memiliki izin untuk mengakses menu ini.
        </p>
      </div>
    </div>
  );
};
