import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const CommandPaletteContext = createContext(null);

// Pages that are public — palette is disabled on these
const PUBLIC_PATHS = ['/', '/Home', '/Features', '/Pricing', '/AboutUs', '/About', '/about', '/ForAccountants', '/Accountants'];

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isPublicPage = PUBLIC_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        if (isPublicPage || !isAuthenticated) return;
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPublicPage, isAuthenticated]);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [location.pathname]);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  return useContext(CommandPaletteContext);
}