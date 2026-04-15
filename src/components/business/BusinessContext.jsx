import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { getMemberPermissions } from './permissions';

const BusinessContext = createContext(null);

export function BusinessProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userMember, setUserMember] = useState(null); // full member record for permission lookup
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndBusinesses();
  }, []);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      setBusinesses([]);
      setCurrentBusiness(null);
    };
  }, []);

  const loadUserAndBusinesses = async () => {
    try {
      setLoading(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Get businesses where user is owner
      const ownedBusinesses = await base44.entities.Business.filter({ owner_email: currentUser.email });
      
      // Get businesses where user is a member
      const memberships = await base44.entities.BusinessMember.filter({ 
        user_email: currentUser.email,
        invitation_status: 'accepted'
      });
      
      const memberBusinessIds = memberships.map(m => m.business_id);
      let memberBusinesses = [];
      
      if (memberBusinessIds.length > 0) {
        const allBusinesses = await base44.entities.Business.list();
        memberBusinesses = allBusinesses.filter(b => 
          memberBusinessIds.includes(b.id) && b.owner_email !== currentUser.email
        );
      }

      const allUserBusinesses = [...ownedBusinesses, ...memberBusinesses];
      setBusinesses(allUserBusinesses);

      // Load saved business selection or default to first
      const savedBusinessId = localStorage.getItem('currentBusinessId');
      const savedBusiness = allUserBusinesses.find(b => b.id === savedBusinessId);
      
      if (savedBusiness) {
        setCurrentBusiness(savedBusiness);
        await loadUserRole(currentUser.email, savedBusiness);
      } else if (allUserBusinesses.length > 0) {
        setCurrentBusiness(allUserBusinesses[0]);
        await loadUserRole(currentUser.email, allUserBusinesses[0]);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRole = async (email, business) => {
    if (business.owner_email === email) {
      setUserRole('owner');
      setUserMember(null);
      return;
    }
    
    const memberships = await base44.entities.BusinessMember.filter({
      business_id: business.id,
      user_email: email,
      invitation_status: 'accepted'
    });
    
    if (memberships.length > 0) {
      setUserRole(memberships[0].role);
      setUserMember(memberships[0]);
    } else {
      setUserRole(null);
      setUserMember(null);
    }
  };

  const switchBusiness = async (business) => {
    setCurrentBusiness(business);
    localStorage.setItem('currentBusinessId', business.id);
    await loadUserRole(user.email, business);
  };

  const refreshBusinesses = async () => {
    await loadUserAndBusinesses();
  };

  const canEdit = () => ['owner', 'manager'].includes(userRole);
  const canManageTeam = () => userRole === 'owner';
  const isOwner = () => userRole === 'owner';

  // Granular permission check
  const hasPermission = (permission) => {
    if (userRole === 'owner') return true;
    const perms = getMemberPermissions(userMember);
    return perms.includes(permission);
  };

  return (
    <BusinessContext.Provider value={{
      user,
      businesses,
      currentBusiness,
      userRole,
      userMember,
      loading,
      switchBusiness,
      refreshBusinesses,
      canEdit,
      canManageTeam,
      isOwner,
      hasPermission
    }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}