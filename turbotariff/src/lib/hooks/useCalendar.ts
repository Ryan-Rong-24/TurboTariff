import { useState } from 'react';
import { useStore } from '../store';
import { toast } from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'compliance' | 'news';
  description?: string;
}

export function useCalendar() {
  const { events, addEvent, updateEvent, deleteEvent } = useStore();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const addNewEvent = (event: Omit<CalendarEvent, 'id'>) => {
    try {
      const newEvent: CalendarEvent = {
        ...event,
        id: Date.now().toString(),
      };
      addEvent(newEvent);
      toast.success('Event added successfully');
    } catch (error) {
      toast.error('Failed to add event');
    }
  };

  const editEvent = (id: string, updates: Partial<CalendarEvent>) => {
    try {
      updateEvent(id, updates);
      toast.success('Event updated successfully');
    } catch (error) {
      toast.error('Failed to update event');
    }
  };

  const removeEvent = (id: string) => {
    try {
      deleteEvent(id);
      toast.success('Event removed successfully');
    } catch (error) {
      toast.error('Failed to remove event');
    }
  };

  const getUpcomingEvents = (days: number = 7) => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return events
      .filter((event) => event.date >= today && event.date <= futureDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const getEventsByType = (type: 'compliance' | 'news') => {
    return events.filter((event) => event.type === type);
  };

  return {
    events,
    selectedDate,
    setSelectedDate,
    getEventsForDate,
    addNewEvent,
    editEvent,
    removeEvent,
    getUpcomingEvents,
    getEventsByType,
  };
} 