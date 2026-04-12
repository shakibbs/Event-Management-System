import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Event } from '../lib/api';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { MoreHorizontal, MapPin, Users, Calendar } from 'lucide-react';
import { formatDate, formatCurrency } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

interface DataTableProps {
  data: Event[];
  isLoading?: boolean;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  renderActions?: (event: Event) => React.ReactNode;
  onRowClick?: (event: Event) => void;
  onRegister?: (eventId: number | string) => Promise<void>;
  registeringEventId?: number | string | null;
  isAttendee?: boolean;
  registeredEventIds?: Set<number | string>;
}
export function DataTable({ data, isLoading, onEdit, onDelete, renderActions, onRowClick, onRegister, registeringEventId, isAttendee, registeredEventIds }: DataTableProps) {
  const { user } = useAuth();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState<Event | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  
  // Debug: log the data being rendered
  // console.log('DataTable data:', data);
    const handleRowClick = (event: Event, e: React.MouseEvent) => {
      // Prevent click if action button was clicked
      if ((e.target as HTMLElement).closest('button')) return;
      if (typeof onRowClick === 'function') onRowClick(event);
    };

    // Check if an event is upcoming (not in the past)
    const isUpcomingEvent = (event: Event): boolean => {
      const eventDateStr = event.startTime || event.date;
      if (!eventDateStr) return false;
      const eventDate = new Date(eventDateStr);
      const now = new Date();
      return eventDate >= now;
    };

    // Check if user is already registered for this event
    const isUserRegistered = (event: Event): boolean => {
      // Check if event ID is in registered set (from parent component)
      if (registeredEventIds && registeredEventIds.has(event.id)) {
        return true;
      }
      
      // Check if user is in attendees array
      if (user && Array.isArray(event.attendees)) {
        return event.attendees.some((attendee: any) => 
          attendee.id === user.id || 
          attendee.email === user.email ||
          attendee.name === user.name ||
          attendee.name === user.fullName
        );
      }
      
      return false;
    };

    // Handle register button click - show confirmation
    const handleRegisterClick = (event: Event, e: React.MouseEvent) => {
      e.stopPropagation();
      
      // Check if already registered
      if (isUserRegistered(event)) {
        setErrorMessage('You are already registered for this event!');
        setShowErrorMessage(true);
        setTimeout(() => {
          setShowErrorMessage(false);
          setErrorMessage(null);
        }, 3000);
        return;
      }
      
      setSelectedEventForRegistration(event);
      setConfirmDialogOpen(true);
    };

    // Handle confirmation - proceed with registration
    const handleConfirmRegistration = async () => {
      if (selectedEventForRegistration && onRegister) {
        try {
          await onRegister(selectedEventForRegistration.id);
          
          // Close dialog and show success message
          setConfirmDialogOpen(false);
          setSuccessMessage(`Successfully registered for "${selectedEventForRegistration.title || selectedEventForRegistration.name}"!`);
          setShowSuccessMessage(true);
          
          // Auto-hide success message after 3 seconds
          setTimeout(() => {
            setShowSuccessMessage(false);
            setSuccessMessage(null);
          }, 3000);
          
          setSelectedEventForRegistration(null);
        } catch (error: any) {
          // Handle error from backend
          const errorMsg = error?.message || 'Failed to register for event';
          setErrorMessage(errorMsg);
          setShowErrorMessage(true);
          setConfirmDialogOpen(false);
          
          // Auto-hide error message after 4 seconds (slightly longer for user to read)
          setTimeout(() => {
            setShowErrorMessage(false);
            setErrorMessage(null);
          }, 4000);
          
          setSelectedEventForRegistration(null);
        }
      }
    };

    // Handle cancel - close dialog
    const handleCancelRegistration = () => {
      setConfirmDialogOpen(false);
      setSelectedEventForRegistration(null);
    };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-white rounded-xl border border-surface-border">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-slate-200 rounded"></div>
        </div>
      </div>);

  }
  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-surface-border text-center p-8">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="h-6 w-6 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-primary mb-1">
          No events found
        </h3>
        <p className="text-text-secondary text-sm max-w-xs">
          Try adjusting your search or filters to find what you're looking for.
        </p>
      </div>);

  }
  return (
    <div className="w-full overflow-hidden bg-white rounded-xl border border-surface-border shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border bg-slate-50/50">
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Event Name
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Date & Time
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Location
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Attendees
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Approval Status
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Visibility
              </th>
              <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Status
              </th>
              {(isAttendee && onRegister) && (
                <th className="py-4 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {data.map((event, index) =>
            <motion.tr
              key={`${event.id}-${registeredEventIds?.has(event.id) ? 'registered' : 'unregistered'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="group hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
              onClick={e => handleRowClick(event, e)}>

                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span
                      className="font-medium text-primary text-sm underline cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        console.log('Event name clicked:', event.id);
                        if (typeof onRowClick === 'function') onRowClick(event);
                      }}
                    >
                      {event.title || event.name}
                    </span>
                    <span className="text-xs text-text-muted mt-0.5">
                      {event.organizer ? `Org: ${event.organizer}` : ''}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center text-sm text-text-secondary">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-text-muted" />
                    {(() => {
                      // Prefer startTime, fallback to date, then createdAt
                      const dateVal = event.startTime || event.date || event.createdAt || null;
                      if (!dateVal) return 'N/A';
                      try {
                        return formatDate(dateVal);
                      } catch {
                        return 'Invalid date';
                      }
                    })()}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center text-sm text-text-secondary">
                    <MapPin className="h-3.5 w-3.5 mr-2 text-text-muted" />
                    <span className="truncate max-w-[150px]">
                      {event.location}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center text-sm text-text-secondary tabular-nums">
                    <Users className="h-3.5 w-3.5 mr-2 text-text-muted" />
                    {event.attendees ?? '-'}{' '}
                    <span className="text-text-muted mx-1">/</span>{' '}
                    {event.capacity ?? event.maxAttendees ?? '-'}
                  </div>
                  <div className="w-24 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{
                        width: event.attendees && (event.capacity ?? event.maxAttendees)
                          ? `${(event.attendees / (event.capacity ?? event.maxAttendees)) * 100}%`
                          : '0%'
                      }}
                    />

                  </div>
                </td>
                <td className="py-4 px-6">
                  <Badge status={(event as any)?.approvalStatus || (event as any)?.approval_status || 'PENDING'} />
                </td>
                <td className="py-4 px-6">
                  <Badge status={(event as any)?.visibility || 'PUBLIC'} />
                </td>
                <td className="py-4 px-6">
                  <Badge status={event.eventStatus || event.status} />
                </td>
                {(isAttendee && onRegister) && (
                  <td className="py-4 px-6">
                    <Button
                      onClick={(e) => handleRegisterClick(event, e)}
                      disabled={!isUpcomingEvent(event) || registeringEventId === event.id || isUserRegistered(event)}
                      className={`rounded-lg h-9 px-4 text-sm font-medium transition-all ${
                        isUserRegistered(event)
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-coral hover:bg-coral-dark text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {registeringEventId === event.id ? 'Registering...' : isUserRegistered(event) ? '✓ Registered' : 'Register'}
                    </Button>
                  </td>
                )}
              </motion.tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialogOpen && selectedEventForRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-lg font-bold text-primary mb-2">Confirm Registration</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to register for <span className="font-semibold text-primary">{selectedEventForRegistration.title || selectedEventForRegistration.name}</span>?
            </p>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-6 bg-slate-50 p-3 rounded-lg">
              <Calendar className="h-4 w-4 text-coral" />
              <span>
                {new Date(selectedEventForRegistration.startTime || selectedEventForRegistration.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={handleCancelRegistration}
                className="px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRegistration}
                disabled={registeringEventId === selectedEventForRegistration.id}
                className="bg-coral hover:bg-coral-dark text-white px-4 py-2"
              >
                {registeringEventId === selectedEventForRegistration.id ? 'Registering...' : 'Yes, Register'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message Toast */}
      {showSuccessMessage && successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-40 bg-green-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-2 max-w-md"
        >
          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{successMessage}</span>
        </motion.div>
      )}

      {/* Error Message Toast */}
      {showErrorMessage && errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-40 bg-red-500 text-white rounded-lg shadow-lg p-4 flex items-center gap-2 max-w-md"
        >
          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{errorMessage}</span>
        </motion.div>
      )}
    </div>);

}