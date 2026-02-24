"use client";

import { useAuth } from '@/components/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const useAdminAuth = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // 🔥 ПРИВОДИМ К ВЕРХНЕМУ РЕГИСТРУ ДЛЯ СРАВНЕНИЯ
  const userRole = user?.role?.toUpperCase();
  
  // Проверяем, является ли пользователь админом ИЛИ модератором
  const isAdmin = userRole === 'ADMIN';
  const isModerator = userRole === 'MODERATOR';
  const isAuthorized = isAuthenticated && (isAdmin || isModerator);

  useEffect(() => {
    if (isAuthenticated && !isAuthorized) {
      alert('Доступ запрещен. Только для администраторов и модераторов.');
      router.push('/');
    }
  }, [isAuthenticated, isAuthorized, router]);

  return {
    isAdmin,
    isModerator,
    isAuthorized,
    user
  };
};