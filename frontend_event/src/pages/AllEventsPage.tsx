import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, MapPin } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { fetchPublicEventsApi } from '../lib/api';
import type { Event } from '../lib/api';

interface AllEventsPageProps {
  onBack: () => void;
}

const AllEventsPage: React.FC<AllEventsPageProps> = ({ onBack }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');

  useEffect(() => {
    setIsLoading(true);
    fetchPublicEventsApi()
      .then((arr) => {
        setEvents(arr);
        setFilteredEvents(arr);
        setError(null);
      })
      .catch((err) => {
        setError(err && err.message ? err.message : 'Failed to load events');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleSearch = () => {
    let results = events;

    if (searchQuery.trim()) {
      results = results.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (locationQuery.trim()) {
      results = results.filter((event) =>
        event.location?.toLowerCase().trim().includes(locationQuery.toLowerCase().trim())
      );
    }

    if (dateQuery.trim()) {
      results = results.filter((event) => {
        if (!event.startTime) return false;
        const eventDate = new Date(event.startTime).toLocaleDateString();
        const queryDate = new Date(dateQuery).toLocaleDateString();
        return eventDate === queryDate;
      });
    }

    setFilteredEvents(results);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setLocationQuery('');
    setDateQuery('');
    setFilteredEvents(events);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Search and Filters */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-6">
            All Events
          </h1>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-3"
          >
            <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 flex items-center px-4 border-b md:border-b-0 md:border-r border-gray-200 pb-3 md:pb-0">
              <MapPin className="h-5 w-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Location"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex-1 flex items-center px-4 pb-3 md:pb-0">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <input
                type="date"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                className="bg-coral hover:bg-coral-dark text-white rounded-lg h-10 px-6 whitespace-nowrap"
              >
                Search
              </Button>
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-lg h-10 px-6 whitespace-nowrap"
              >
                Clear
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="text-red-500 text-center mb-8 p-4 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16 text-gray-500">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
                <p className="mt-4">Loading events...</p>
              </div>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">
                {searchQuery || locationQuery || dateQuery
                  ? 'No events found matching your search criteria.'
                  : 'No public upcoming events available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing <span className="font-semibold">{filteredEvents.length}</span> event
                  {filteredEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col justify-between group border border-gray-100"
                  >
                    {/* Event Image */}
                    {(event.eventImage || event.image) && (
                      <div className="relative h-48 overflow-hidden bg-gray-200">
                        <img 
                          src={event.eventImage || event.image} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col justify-between h-full">
                      <div>
                        <h3 className="font-display text-xl font-bold text-gray-900 mb-3 group-hover:text-coral transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-gray-500 border-t border-gray-100 pt-4">
                        {event.startTime && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-coral flex-shrink-0" />
                            <span className="truncate">
                              {new Date(event.startTime).toLocaleDateString()} at{' '}
                              {new Date(event.startTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-coral flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AllEventsPage;
