"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface AdminContextType {
  selectedUsers: Set<string>;
  toggleUserSelection: (userId: string) => void;
  clearSelection: () => void;
  selectAllUsers: (userIds: string[]) => void;
  hasSelections: boolean;
  selectedCount: number;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const toggleUserSelection = useCallback((userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers(new Set());
  }, []);

  const selectAllUsers = useCallback((userIds: string[]) => {
    setSelectedUsers(new Set(userIds));
  }, []);

  const hasSelections = selectedUsers.size > 0;
  const selectedCount = selectedUsers.size;

  const contextValue: AdminContextType = {
    selectedUsers,
    toggleUserSelection,
    clearSelection,
    selectAllUsers,
    hasSelections,
    selectedCount,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
