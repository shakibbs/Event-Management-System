import React, { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading } = useAuth();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    apiRequest('/users')
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading || isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error}</div>;


  // DEBUG: Always show export button to verify rendering
  const hasExportPermission = true;

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('eventflow_token');
      const response = await fetch('http://localhost:8083/api/users/download/pdf', {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_list.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">User Management</h1>
            <p className="text-text-secondary">Manage all users in the system</p>
          </div>
          {hasExportPermission && (
            <Button
              onClick={handleExport}
              className="w-full md:w-auto"
              variant="primary"
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          )}
        </div>
        {/* User List Table (simple) */}
        <div className="bg-surface rounded-xl shadow-md p-6 border border-surface-tertiary mb-8">
          <ul>
            {users.map((user: any) => (
              <li key={user.id}>{user.name} ({user.email})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
