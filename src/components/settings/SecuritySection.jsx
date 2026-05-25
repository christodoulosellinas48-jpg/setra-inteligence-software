import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, Monitor, Clock, AlertTriangle, RefreshCw, Copy, Download, Check, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ── 2FA sub-section ──────────────────────────────────────────────
function TwoFactorAuth() {
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState('idle'); // idle | qr | verify | codes
  const [code, setCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [backupCopied, setBackupCopied] = useState(false);

  // Mock TOTP secret / QR — in production wire to a real TOTP backend function
  const mockSecret = 'JBSWY3DPEHPK3PXP';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=otpauth://totp/Setra:user@setra.app?secret=${mockSecret}%26issuer=Setra`;
  const backupCodes = ['A1B2-C3D4','E5F6-G7H8','I9J0-K1L2','M3N4-O5P6','Q7R8-S9T0','U1V2-W3X4','Y5Z6-A7B8','C9D0-E1F2'];

  const handleEnable = () => {
    if (code.length === 6) { setEnabled(true); setStep('codes'); }
  };
  const handleDisable = () => {
    if (disableCode.length === 6) { setEnabled(false); setStep('idle'); setShowDisable(false); setDisableCode(''); }
  };
  const copyBackup = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setBackupCopied(true);
    setTimeout(() => setBackupCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${enabled ? 'bg-emerald-500/10 border-emerald-500/25' : 'bg-amber-500/10 border-amber-500/25'}`}>
        <div className="flex items-center gap-3">
          {enabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldOff className="w-5 h-5 text-amber-400" />}
          <div>
            <p className={`text-sm font-semibold ${enabled ? 'text-emerald-300' : 'text-amber-300'}`}>
              2FA is {enabled ? 'ON' : 'OFF'}
            </p>
            <p className="text-xs text-slate-500">{enabled ? 'Your account is protected with an authenticator app' : 'Add an extra layer of security to your account'}</p>
          </div>
        </div>
        {!enabled && step === 'idle' && (
          <Button size="sm" onClick={() => setStep('qr')} className="bg-[#7B3BFF] hover:bg-[#6d2ff7] text-white text-xs">
            Enable 2FA
          </Button>
        )}
        {enabled && !showDisable && (
          <Button size="sm" variant="outline" onClick={() => setShowDisable(true)} className="border-white/10 text-slate-300 text-xs">
            Disable
          </Button>
        )}
      </div>

      {/* Step: QR scan */}
      {step === 'qr' && (
        <div className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl space-y-4">
          <p className="text-sm text-white font-medium">1. Scan with your authenticator app</p>
          <p className="text-xs text-slate-400">Works with Google Authenticator, Authy, 1Password, and any TOTP-compatible app.</p>
          <div className="flex justify-center">
            <img src={qrUrl} alt="2FA QR Code" className="w-44 h-44 rounded-xl bg-white p-2" />
          </div>
          <div className="p-3 bg-[#0B0B12] rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Manual entry key:</p>
            <p className="font-mono text-sm text-[#C084FC] tracking-widest">{mockSecret}</p>
          </div>
          <Button size="sm" onClick={() => setStep('verify')} className="bg-[#7B3BFF] hover:bg-[#6d2ff7]">
            Next: Enter verification code →
          </Button>
        </div>
      )}

      {/* Step: Verify */}
      {step === 'verify' && (
        <div className="p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl space-y-4">
          <p className="text-sm text-white font-medium">2. Enter the 6-digit code from your app</p>
          <Input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="bg-[#0B0B12] border-white/10 text-white font-mono text-center text-xl tracking-widest w-36"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEnable} disabled={code.length !== 6} className="bg-[#7B3BFF] hover:bg-[#6d2ff7]">
              Verify & Enable
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setStep('idle'); setCode(''); }} className="text-slate-400">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step: Backup codes */}
      {step === 'codes' && (
        <div className="p-5 bg-white/[0.03] border border-emerald-500/20 rounded-xl space-y-4">
          <p className="text-sm text-white font-medium">✅ 2FA enabled! Save your backup codes</p>
          <p className="text-xs text-slate-400">If you lose your authenticator app, use these one-time codes to sign in. Store them securely.</p>
          <div className="grid grid-cols-2 gap-2">
            {backupCodes.map(c => (
              <code key={c} className="px-3 py-1.5 rounded-lg bg-[#0B0B12] border border-white/10 text-[#C084FC] font-mono text-sm text-center">{c}</code>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={copyBackup} className="border-white/10 text-slate-300">
              {backupCopied ? <Check className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
              {backupCopied ? 'Copied!' : 'Copy codes'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setStep('idle')} className="text-slate-400">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Disable flow */}
      {enabled && showDisable && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
          <p className="text-sm text-white">Enter your current 2FA code to disable:</p>
          <Input
            value={disableCode}
            onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="bg-[#0B0B12] border-white/10 text-white font-mono text-center text-xl w-36"
            maxLength={6}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleDisable} disabled={disableCode.length !== 6} className="bg-rose-600 hover:bg-rose-700 text-white">
              Confirm disable
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowDisable(false); setDisableCode(''); }} className="text-slate-400">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {enabled && step === 'idle' && (
        <button onClick={() => setStep('codes')} className="text-xs text-[#C084FC] hover:text-white transition-colors flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Regenerate backup codes
        </button>
      )}
    </div>
  );
}

// ── Active Sessions sub-section ───────────────────────────────────
function ActiveSessions() {
  const MOCK_SESSIONS = [
    { id: 'current', device: 'MacBook Pro', browser: 'Chrome 124', location: 'Nicosia, CY', lastActive: 'Just now', isCurrent: true },
    { id: 's2', device: 'iPhone 15', browser: 'Safari Mobile', location: 'Limassol, CY', lastActive: '2 hours ago', isCurrent: false },
    { id: 's3', device: 'Windows PC', browser: 'Firefox 125', location: 'London, UK', lastActive: '3 days ago', isCurrent: false },
  ];
  const [sessions, setSessions] = useState(MOCK_SESSIONS);

  const signOut = (id) => setSessions(s => s.filter(x => x.id !== id));
  const signOutAll = () => setSessions(s => s.filter(x => x.isCurrent));

  return (
    <div className="space-y-3">
      {sessions.map(s => (
        <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border ${s.isCurrent ? 'bg-[#7B3BFF]/10 border-[#7B3BFF]/25' : 'bg-white/[0.03] border-white/[0.07]'}`}>
          <div className="flex items-center gap-3">
            <Monitor className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-white font-medium">
                {s.device}
                {s.isCurrent && <span className="ml-2 text-[10px] text-[#C084FC] border border-[#7B3BFF]/40 px-1.5 py-0.5 rounded-full">This device</span>}
              </p>
              <p className="text-xs text-slate-500">{s.browser} · {s.location} · {s.lastActive}</p>
            </div>
          </div>
          {!s.isCurrent && (
            <button onClick={() => signOut(s.id)} className="text-xs text-slate-500 hover:text-rose-400 transition-colors border border-white/10 hover:border-rose-500/30 px-2.5 py-1 rounded-lg">
              Sign out
            </button>
          )}
        </div>
      ))}
      {sessions.length > 1 && (
        <button onClick={signOutAll} className="text-xs text-rose-400 hover:text-rose-300 transition-colors border border-rose-500/20 hover:border-rose-500/40 px-3 py-1.5 rounded-lg">
          Sign out all other sessions
        </button>
      )}
    </div>
  );
}

// ── Login History sub-section ─────────────────────────────────────
function LoginHistory() {
  const MOCK_HISTORY = [
    { ts: '2026-05-25 14:32', ip: '88.232.71.4',   ua: 'Chrome 124 / macOS', ok: true },
    { ts: '2026-05-25 09:11', ip: '88.232.71.4',   ua: 'Chrome 124 / macOS', ok: true },
    { ts: '2026-05-24 22:05', ip: '2.84.17.201',   ua: 'Safari / iOS 17',    ok: true },
    { ts: '2026-05-24 18:43', ip: '195.10.4.22',   ua: 'Firefox 125 / Win',  ok: false },
    { ts: '2026-05-23 11:20', ip: '88.232.71.4',   ua: 'Chrome 124 / macOS', ok: true },
    { ts: '2026-05-22 08:55', ip: '88.232.71.4',   ua: 'Chrome 124 / macOS', ok: true },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.07] bg-white/[0.02]">
            <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Time</th>
            <th className="text-left px-4 py-2.5 text-slate-400 font-medium">IP address</th>
            <th className="text-left px-4 py-2.5 text-slate-400 font-medium hidden sm:table-cell">Browser / OS</th>
            <th className="text-center px-4 py-2.5 text-slate-400 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_HISTORY.map((row, i) => (
            <tr key={i} className={`border-b border-white/[0.04] ${!row.ok ? 'bg-amber-500/5' : i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
              <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{row.ts}</td>
              <td className="px-4 py-2.5 font-mono text-slate-400">{row.ip}</td>
              <td className="px-4 py-2.5 text-slate-500 hidden sm:table-cell">{row.ua}</td>
              <td className="px-4 py-2.5 text-center">
                {row.ok
                  ? <span className="text-emerald-400 text-[10px] font-medium border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Success</span>
                  : <span className="text-amber-400 text-[10px] font-medium border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 rounded-full">Failed</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main SecuritySection export ───────────────────────────────────
export default function SecuritySection() {
  return (
    <div className="space-y-8">
      {/* 2FA */}
      <div>
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" /> Two-Factor Authentication
        </p>
        <TwoFactorAuth />
      </div>

      {/* Active Sessions */}
      <div>
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-purple-400" /> Active Sessions
        </p>
        <ActiveSessions />
      </div>

      {/* Login History */}
      <div>
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" /> Login History
        </p>
        <LoginHistory />
      </div>
    </div>
  );
}