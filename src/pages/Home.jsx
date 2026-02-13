import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['businessProfile'],
    queryFn: () => base44.entities.BusinessProfile.list('-created_date', 1)
  });

  useEffect(() => {
    if (!isLoading) {
      if (profiles && profiles.length > 0) {
        navigate(createPageUrl('Dashboard'));
      } else {
        navigate(createPageUrl('Onboarding'));
      }
    }
  }, [profiles, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading Ellinas THE SETTING...</p>
      </div>
    </div>
  );
}