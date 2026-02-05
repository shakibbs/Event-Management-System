import { useEffect, useState } from 'react';
import { DataTable } from '../components/DataTable';
import { fetchEventsApi } from '../lib/api';
import { Event } from '../lib/api';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';

export function PendingEventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    fetchEventsApi(0, 100)
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load events');
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Only show events with approvalStatus or approval_status === 'PENDING'
  const pendingEvents = events.filter(
    (event: any) => (event.approvalStatus || event.approval_status) === 'PENDING'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Pending Events</h1>
          <p className="text-text-secondary mt-1">
            Review and manage all events that are pending approval.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/events')}>Back to Events</Button>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <DataTable
        data={pendingEvents}
        isLoading={isLoading}
        onRowClick={(event) => {
          navigate(`/event-management/${event.id}`);
        }}
      />
      <div className="flex items-center justify-between text-sm text-text-secondary mt-4">
        <p>
          Showing {pendingEvents.length} pending events
        </p>
      </div>
    </div>
  );
}
