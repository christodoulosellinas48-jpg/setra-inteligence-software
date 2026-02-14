import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// Onboarding is now handled via CreateBusiness page
// This redirect ensures backward compatibility
export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('Dashboard'));
  }, [navigate]);

  return null;
}