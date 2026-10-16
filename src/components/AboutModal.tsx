import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Check, 
  Copy, 
  MessageSquare, 
  Sparkles, 
  ShieldCheck, 
  Heart, 
  Info,
  Code2,
  Building2,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-[#1a1c23] dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-draw font-bold text-xl">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-sans-clean tracking-tight">
                  NexVora Canvas
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Infinite Canvas Whiteboard & Vector Sketching Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Developer Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#21242d] border border-slate-200/80 dark:border-slate-800/80 shadow-xs relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 p-0.5 shadow-sm">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg">
                    PA
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      About Developer
                    </span>
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Prince AR Abdur Rahman
                  </h3>
                </div>
              </div>

              <button
                onClick={triggerConfetti}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Say Hi</span>
              </button>
            </div>

            <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              Independent App Developer passionate about building modern Android applications, productivity tools, AI-powered experiences, media players, educational apps, and next-generation digital products.
            </p>

            {/* Contact & Socials */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Developer Contact & Social Profiles
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* WhatsApp 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">WhatsApp 1</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">01707424006</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy('01707424006', 'WA1')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Copy Number"
                    >
                      {copiedText === 'WA1' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href="https://wa.me/8801707424006"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition"
                      title="Open WhatsApp Chat"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* WhatsApp 2 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">WhatsApp 2</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">01796951709</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy('01796951709', 'WA2')}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Copy Number"
                    >
                      {copiedText === 'WA2' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href="https://wa.me/8801796951709"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition"
                      title="Open WhatsApp Chat"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Facebook */}
                <a
                  href="https://www.facebook.com/share/1BNn32qoJo/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                      fb
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Facebook</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        Prince AR Abdur Rahman
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition mr-1" />
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/ur___abdur____rahman__2008"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800 hover:border-pink-400 dark:hover:border-pink-600 transition group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-950/60 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold text-xs">
                      ig
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Instagram</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition">
                        @ur___abdur____rahman__2008
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-pink-500 transition mr-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Company Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#21242d] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  About Company
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  NexVora Lab's Ofc
                </h3>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm mt-2">
              NexVora Lab's Ofc focuses on creating innovative Android applications designed to improve productivity, entertainment, learning, and digital experiences.
            </p>

            <div className="mt-3 p-3 rounded-xl bg-white dark:bg-[#1a1c23] border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mission:</span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                "Build fast, beautiful, privacy-friendly, and user-focused applications accessible to everyone."
              </p>
            </div>
          </div>

          {/* Technical Info & Credits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#21242d] border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <Code2 className="w-4 h-4 text-blue-500" />
                <span>Technical Information</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400">Version:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">1.0.0</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Architecture:</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">Infinite SVG Canvas</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400">Offline Ready:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Enabled (Auto-saved)</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#21242d] border border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Credits</span>
              </div>
              <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <li>
                  <span className="text-slate-400">Developed by:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Prince AR Abdur Rahman</span>
                </li>
                <li>
                  <span className="text-slate-400">Published by:</span>{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">NexVora Lab's Ofc</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100/70 dark:bg-[#15171d] border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 NexVora Lab's Ofc. All Rights Reserved</p>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-medium transition shadow-xs"
          >
            Close & Start Drawing
          </button>
        </div>
      </div>
    </div>
  );
};
