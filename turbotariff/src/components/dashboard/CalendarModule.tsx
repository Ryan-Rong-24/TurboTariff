'use client';

import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getComplianceDates, getNews } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  date: Date;
  type: 'compliance' | 'news';
  description?: string;
}

export function CalendarModule() {
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complianceResponse, newsResponse] = await Promise.all([
          getComplianceDates(),
          getNews(),
        ]);

        if (complianceResponse.error || newsResponse.error) {
          throw new Error(complianceResponse.error || newsResponse.error);
        }

        const complianceEvents = complianceResponse.data.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          type: 'compliance' as const,
        }));

        const newsEvents = newsResponse.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          date: new Date(item.date),
          type: 'news' as const,
          description: item.summary,
        }));

        setEvents([...complianceEvents, ...newsEvents]);
      } catch (error: any) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const tileContent = ({ date }: { date: Date }) => {
    const eventsForDate = getEventsForDate(date);
    return eventsForDate.length > 0 ? (
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
      </div>
    ) : null;
  };

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setDate(value);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Calendar & News</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Calendar & News</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Calendar
            onChange={handleDateChange}
            value={date}
            tileContent={tileContent}
            className="border rounded-lg shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
          <div className="space-y-4">
            {events
              .filter((event) => event.date >= new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((event) => (
                <div
                  key={event.id}
                  className="bg-white border rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        event.type === 'compliance'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {event.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {event.date.toLocaleDateString()}
                  </p>
                  {event.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
} 