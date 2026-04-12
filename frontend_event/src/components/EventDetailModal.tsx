import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Clock, FileText } from 'lucide-react';
import { Event } from '../lib/api';
import { Button } from './ui/Button';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (eventId: number | string) => Promise<void>;
  isRegistering?: boolean;
  isAlreadyRegistered?: boolean;
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onRegister,
  isRegistering,
  isAlreadyRegistered,
}: EventDetailModalProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!event) return null;

  const eventDate = event.startTime ? new Date(event.startTime) : null;
  const eventEndDate = event.endTime ? new Date(event.endTime) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const formattedStartTime = eventDate
    ? eventDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';
  const formattedEndTime = eventEndDate
    ? eventEndDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const attendeeCount = Array.isArray(event.attendees) ? event.attendees.length : 0;
  const capacity = event.capacity || event.maxAttendees || 0;

  const handleRegisterClick = async () => {
    if (onRegister) {
      try {
        await onRegister(event.id);
      } catch (error) {
        console.error('Failed to register:', error);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <div className="sticky top-0 right-0 flex justify-end p-4 bg-white border-b">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-6 w-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8">
                {/* Event Image */}
                {(event.eventImage || event.image) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 rounded-xl overflow-hidden h-64 sm:h-80 bg-gray-100"
                  >
                    <img
                      src={event.eventImage || event.image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.approvalStatus && (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {event.approvalStatus}
                      </span>
                    )}
                    {event.visibility && (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {event.visibility}
                      </span>
                    )}
                    {event.eventStatus && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
                        {event.eventStatus}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Key Information Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-gray-50 p-5 rounded-xl"
                >
                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-0.5">Time</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formattedStartTime}
                        {formattedEndTime && ` - ${formattedEndTime}`}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                      <MapPin className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-0.5">Location</p>
                      <p className="text-sm font-semibold text-gray-900">{event.location || 'TBD'}</p>
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                      <Users className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-semibold mb-0.5">Attendees</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {attendeeCount}
                        {capacity > 0 && ` / ${capacity}`}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Description Section */}
                {event.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-6"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <h2 className="text-lg font-bold text-gray-900">Description</h2>
                    </div>
                    <div
                      className={`bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed text-sm ${
                        !showFullDescription ? 'line-clamp-4' : ''
                      }`}
                    >
                      {event.description}
                    </div>
                    {event.description && event.description.length > 300 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="mt-2 text-blue-600 hover:text-blue-700 font-semibold text-xs transition-colors"
                      >
                        {showFullDescription ? '↑ Show less' : '↓ Show more'}
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Additional Details */}
                {(event.organizer || event.createdBy) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="mb-6 bg-gray-50 p-4 rounded-xl"
                  >
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Organized by:</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{event.organizer || event.createdBy}</p>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex gap-3 pt-5 border-t border-gray-200"
                >
                  <Button
                    onClick={onClose}
                    variant="secondary"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg h-10 font-medium text-sm transition-all"
                  >
                    Close
                  </Button>
                  {onRegister && (
                    <Button
                      onClick={handleRegisterClick}
                      disabled={isRegistering || isAlreadyRegistered}
                      className={`flex-1 rounded-lg h-10 font-medium text-sm transition-all ${
                        isAlreadyRegistered
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-coral hover:bg-coral-dark text-white'
                      }`}
                    >
                      {isAlreadyRegistered
                        ? '✓ Already Registered'
                        : isRegistering
                        ? 'Registering...'
                        : 'Register for Event'}
                    </Button>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
