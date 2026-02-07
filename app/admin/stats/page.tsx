"use client";

import { useAdminData } from '@/components/admin/AdminDataContext';
import AdminStatsPanel from '@/components/admin/AdminStatsPanel';

export default function AdminStatsPage() {
  // Используем данные из общего контекста вместо локального состояния
  const { stats, history, loading, handleAction } = useAdminData();

  if (loading || !stats) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">📊</div>
        <p>Загрузка статистики...</p>
      </div>
    );
  }

  return <AdminStatsPanel stats={stats} history={history} onAction={handleAction} />;
}
