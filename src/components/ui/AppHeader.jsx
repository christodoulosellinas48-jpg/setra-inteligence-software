import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LogoLink from '@/components/ui/LogoLink';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { LayoutDashboard, FileText, Settings, Menu, UserRound, LogOut } from 'lucide-react';

export default function AppHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'Dashboard' },
    { label: 'Reports', icon: FileText, path: 'Reports' },
    { label: 'Settings', icon: Settings, path: 'Settings' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <LogoLink className="h-8" />
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map(item => (
            <Button 
              key={item.path}
              variant="ghost"
              onClick={() => navigate(createPageUrl(item.path))}
              className="text-slate-300 hover:text-white hover:bg-slate-800/50"
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Right Side - User Profile & Mobile Menu */}
        <div className="flex items-center gap-2">
          {/* User Profile Dropdown - Desktop */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex text-slate-300 hover:text-white hover:bg-slate-800/50">
                  <UserRound className="w-4 h-4 mr-2" />
                  {user.full_name || user.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                <DropdownMenuItem 
                  onClick={() => navigate(createPageUrl('Settings'))}
                  className="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-rose-400 focus:text-rose-300 focus:bg-rose-500/10 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-slate-300 hover:text-white">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-slate-950 border-slate-800 w-72">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                {user && (
                  <>
                    <div className="px-4 py-3 bg-slate-900/50 rounded-lg mb-4">
                      <p className="text-sm text-slate-400">Signed in as</p>
                      <p className="text-white font-medium">{user.full_name || user.email}</p>
                    </div>
                  </>
                )}
                {navItems.map(item => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    onClick={() => {
                      navigate(createPageUrl(item.path));
                      setMobileOpen(false);
                    }}
                    className="justify-start text-slate-300 hover:text-white hover:bg-slate-800/50"
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Button>
                ))}
                {user && (
                  <>
                    <div className="my-2 border-t border-slate-800" />
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="justify-start text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Logout
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}