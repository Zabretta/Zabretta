"use client";

import { useAuth } from '@/components/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAdminAuth = () => {
  const { user, isAuthenticated, isAdmin } = useAuth(); // ← БЕРЕМ isAdmin ИЗ useAuth!
  const router = useRouter();

  const isAuthorized = isAuthenticated && isAdmin;

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      alert('Доступ запрещен. Только для администраторов.');
      router.push('/');
    }
  }, [isAuthenticated, isAdmin, router]);

  return {
    isAdmin,
    isAuthorized,
    user
  };
};