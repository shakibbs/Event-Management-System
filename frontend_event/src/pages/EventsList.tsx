import React, { useState, useEffect } from 'react';
import { DataTable } from '../components/DataTable';
import { FilterBar } from '../components/FilterBar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Event } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Plus } from 'lucide-react';
import { fetchEventsApi, fetchOwnEventsApi, apiRequest } from '../lib/api';

// Local type definitions
interface FilterState {
  search: string;
  status: string;
  dateRange: string;
  ownOnly?: boolean;
  approvalStatus?: string;
  visibility?: string;
}

import { useLocation } from 'react-router-dom';

export function EventsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    dateRange: 'all',
    approvalStatus: 'all',
    visibility: 'all'
  });
  // Modal state for create/edit
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState<Partial<Event>>({ title: '', location: '', startTime: '', endTime: '', description: '', visibility: 'PUBLIC' });

  // Open modal if redirected from dashboard with ?create=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === '1') {
      setShowModal(true);
      setEditMode(false);
      setSelectedEvent(null);
      setEventForm({ title: '', location: '', startTime: '', endTime: '', description: '', visibility: 'PUBLIC' });
      // Remove the query param from URL after opening
      navigate('/events', { replace: true });
    }
  }, [location.search, navigate]);
  // CRUD Handlers
  const handleCreate = () => {
    setShowModal(true);
    setEditMode(false);
    setSelectedEvent(null);
    setEventForm({ title: '', location: '', startTime: '', endTime: '', description: '', visibility: 'PUBLIC' });
  };

  const handleDelete = async (event: Event) => {
    if (window.confirm(`Are you sure you want to delete event "${event.title || (event as any).name}"?`)) {
      try {
        const api = await import('../lib/api');
        await api.deleteEventApi(event.id);
        setEvents(prev => prev.filter(e => e.id !== event.id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete event');
      }
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Format startTime and endTime as 'yyyy-MM-dd HH:mm:ss' for backend
      const formatDateTime = (dt: string | undefined) => {
        if (!dt) return '';
        const d = new Date(dt);
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      };
      const payload = {
        ...eventForm,
        startTime: formatDateTime(eventForm.startTime),
        endTime: formatDateTime(eventForm.endTime)
      };
      if (editMode && selectedEvent) {
        await apiRequest(`/events/${selectedEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      setEditMode(false);
      setSelectedEvent(null);
      setEventForm({ title: '', location: '', startTime: '', endTime: '', description: '', visibility: 'PUBLIC' });
      // Refresh events
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
    } catch (err: any) {
      alert(err.message || 'Failed to save event');
    }
  };
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Restrict attendee: only show public or invited events
  const isAttendee = (typeof user?.role === 'string' ? user?.role : (user?.role as any)?.name) === 'Attendee';
  const filteredEvents = events.filter((event) => {
    // Use title for search, fallback to name, and location
    const matchesSearch =
      (event.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        event.location?.toLowerCase().includes(filters.search.toLowerCase()));

    // Status filter
    const eventStatus = (event.eventStatus || event.status || '').toLowerCase();
    const filterStatus = (filters.status || '').toLowerCase();
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      if (filterStatus === 'ongoing') {
        matchesStatus = eventStatus === 'ongoing' || eventStatus === 'active';
      } else {
        matchesStatus = eventStatus === filterStatus;
      }
    }

    // Date filter
    let matchesDate = true;
    const eventDateStr = (event as any).startTime || (event as any).date;
    const eventDate = eventDateStr ? new Date(eventDateStr) : null;
    const now = new Date();
    if (filters.dateRange === 'upcoming' && eventDate) {
      matchesDate = eventDate >= now;
    } else if (filters.dateRange === 'past' && eventDate) {
      matchesDate = eventDate < now;
    }

    // Own events filter (match createdBy to user.id, user.email, or user.name)
    let matchesOwnership = true;
    if (filters.ownOnly && user) {
      const createdBy = event.createdBy;
      matchesOwnership = (
        createdBy === user.email ||
        createdBy === user.name ||
        createdBy === user.fullName
      );
    }

    // Approval status and visibility filters
    const matchesApproval = filters.approvalStatus === 'all' || ((event as any).approvalStatus || (event as any).approval_status) === filters.approvalStatus;
    const matchesVisibility = filters.visibility === 'all' || ((event as any).visibility || 'PUBLIC') === filters.visibility;

    // Attendee restriction: only public or invited events
    if (isAttendee) {
      const isPublic = ((event as any).visibility || 'PUBLIC') === 'PUBLIC';
      const isInvited = Array.isArray(event.attendees) && event.attendees.some((a: any) => a.email === user?.email);
      return matchesSearch && matchesStatus && matchesDate && matchesApproval && matchesVisibility && (isPublic || isInvited);
    }
    return matchesSearch && matchesStatus && matchesDate && matchesOwnership && matchesApproval && matchesVisibility;
  });

  // PDF Export Handler
  const handleExportPdf = async () => {
    try {
      const token = localStorage.getItem('eventflow_token');
      const response = await fetch('/api/events/download/pdf', {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'events_list.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to export PDF');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Events</h1>
          <p className="text-text-secondary mt-1">
            Manage and track all your organization's events.
          </p>
        </div>
        <div className="flex gap-2">
          {/* Hide pending events, export, and new event for attendees */}
          {!isAttendee && (
            <>
              <Button 
                variant={filters.ownOnly ? 'primary' : 'outline'}
                onClick={() => setFilters(prev => ({ ...prev, ownOnly: !prev.ownOnly }))}
              >
                {filters.ownOnly ? 'My Events' : 'All Events'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/pending-events')}>View Pending Events</Button>
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleCreate}>New Event</Button>
            </>
          )}
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={(key: string | number | symbol, value: any) => {
          setFilters((prev: FilterState) => ({
            ...prev,
            [key as string]: value
          }));
        }}
        onExport={handleExportPdf}
      />

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <DataTable
        data={filteredEvents}
        isLoading={isLoading}
        onDelete={handleDelete}
        onRowClick={(() => {
          const roleName = typeof user?.role === 'string' ? user?.role : (user?.role && typeof user?.role === 'object' ? (user?.role as any).name : '');
          if (roleName === 'SuperAdmin' || roleName === 'Admin') {
            return (event) => {
              console.log('EventsList onRowClick:', event.id);
              navigate(`/event-management/${event.id}`);
            };
          }
          return undefined;
        })()}
      />

      {/* Modal for add/edit event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
            <button onClick={() => {
              setShowModal(false);
              setEditMode(false);
              setSelectedEvent(null);
            }} className="absolute top-3 right-3 text-slate-400 hover:text-slate-700">&times;</button>
            <h3 className="text-lg font-bold mb-4">{editMode ? 'Edit Event' : 'Add New Event'}</h3>
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <input
                className="w-full border rounded px-3 py-2"
                value={eventForm.title}
                onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="Event Title"
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                value={eventForm.location}
                onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                placeholder="Location"
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                type="datetime-local"
                value={eventForm.startTime}
                onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                placeholder="Start Time"
                required
              />
              <input
                className="w-full border rounded px-3 py-2"
                type="datetime-local"
                value={eventForm.endTime}
                onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                placeholder="End Time"
                required
              />
              <textarea
                className="w-full border rounded px-3 py-2"
                value={eventForm.description}
                onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Description"
                rows={3}
              />
              <label className="block text-sm font-semibold text-primary mb-1 mt-2">Visibility</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={eventForm.visibility}
                onChange={e => setEventForm({ ...eventForm, visibility: e.target.value })}
                required
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <div className="flex justify-end gap-2">
                <Button type="button" onClick={() => {
                  setShowModal(false);
                  setEditMode(false);
                  setSelectedEvent(null);
                }} className="bg-slate-200 text-slate-700">Cancel</Button>
                <Button type="submit" className="bg-primary text-white">{editMode ? 'Save Changes' : 'Add Event'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-text-secondary mt-4">
        <p>
          Showing {filteredEvents.length} of {events.length} events
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}