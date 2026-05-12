import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ITEMS = [
  { key: 'business', label: 'Business created', path: '/Settings' },
  { key: 'pos', label: 'POS connected', path: '/Integrations' },
  { key: 'accounting', label: 'Accounting connected', path: '/Integrations' },
  { key: 'invoice', label: 'First invoice uploaded', path: '/VATAndBookkeeping' },
  { key: 'team', label: 'Team member invited', path: '/Settings' },
];

export default function SetupChecklist({ completed = {} }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const doneCount = ITEMS.filter(i => completed[i.key]).length;
  const allDone = doneCount === ITEMS.length;

  if (allDone) return null;

  return (
    <div className="bg-[#151528] border border-[#2A2A3A] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1E1E35] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {ITEMS.map((item, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${completed[item.key] ? 'bg-[#7B3BFF]' : 'bg-[#2A2A3A]'}`}
              />
            ))}
          </div>
          <span className="text-sm text-slate-300 font-medium">
            Setup checklist <span className="text-slate-500">({doneCount}/{ITEMS.length})</span>
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>

      {open && (
        <div className="border-t border-[#2A2A3A] divide-y divide-[#2A2A3A]/50">
          {ITEMS.map(item => (
            <div key={item.key} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                {completed[item.key]
                  ? <CheckCircle2 className="w-4 h-4 text-[#7B3BFF] flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                }
                <span className={`text-sm ${completed[item.key] ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </div>
              {!completed[item.key] && (
                <button
                  onClick={() => navigate(item.path)}
                  className="text-xs text-[#A855F7] hover:underline"
                >
                  Set up →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}