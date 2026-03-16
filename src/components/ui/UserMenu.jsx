import React from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User } from 'lucide-react';

export default function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const getInitials = () => {
    if (user.full_name) {
      return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || 'U';
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#7B3BFF] rounded-full">
          <Avatar className="h-9 w-9 border-2 border-[#7B3BFF]/30 shadow-lg shadow-[#7B3BFF]/20">
            <AvatarFallback className="bg-gradient-to-br from-[#7B3BFF] to-[#A855F7] text-white text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-[#151528]/95 backdrop-blur-xl border-white/10 shadow-[0_0_30px_rgba(123,59,255,0.2)]"
      >
        <DropdownMenuLabel className="text-slate-300">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-white">{user.full_name || 'User'}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={() => navigate(createPageUrl('Settings'))}
          className="text-slate-300 hover:text-white hover:bg-white/5 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}