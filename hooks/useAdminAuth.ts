"use client";

import { useAuth } from '@/components/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAdminAuth = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const isAdmin = user?.login === 'admin'; // Упрощенная проверка для демо
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
