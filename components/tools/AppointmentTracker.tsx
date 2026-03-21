import React, { useState } from 'react';
import { Hospital, Trophy, Bell } from 'lucide-react';
import { CalendarEvent } from '../../types.ts';

interface AppointmentTrackerProps {
  calendarEvents: CalendarEvent[];
  onAddEvent: (title: string, date: string, type: 'appointment' | 'reminder' | 'milestone', time?: string) => void;
  onRemoveEvent: (id: string) => void;
}

export const AppointmentTracker: React.FC<AppointmentTrackerProps> = ({ calendarEvents, onAddEvent, onRemoveEvent }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventType, setEventType] = useState<'appointment' | 'reminder' | 'milestone'>('appointment');

  const handleAddEvent = () => {
    if (eventTitle && eventDate) {
      onAddEvent(eventTitle, eventDate, eventType, eventTime);
      setEventTitle('');
      setEventDate('');
      setEventTime('');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="card-premium p-8 bg-white border-2 border-white space-y-6">
        <h3 className="text-xl font-serif text-rose-800">Calendar & Appointments</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            value={eventTitle} 
            onChange={e => setEventTitle(e.target.value)} 
            placeholder="Event title..." 
            className="w-full px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" 
          />
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="date" 
              value={eventDate} 
              onChange={e => setEventDate(e.target.value)} 
              className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" 
            />
            <input 
              type="time" 
              value={eventTime} 
              onChange={e => setEventTime(e.target.value)} 
              className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none" 
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={eventType} 
              onChange={e => setEventType(e.target.value as any)}
              className="px-5 py-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none"
            >
              <option value="appointment">Appointment</option>
              <option value="reminder">Reminder</option>
              <option value="milestone">Milestone</option>
            </select>
          </div>
          <button 
            onClick={handleAddEvent}
            className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl"
          >
            Add to Calendar
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {calendarEvents
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(event => (
            <div key={event.id} className="card-premium p-6 bg-white border-2 border-white shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${event.type === 'appointment' ? 'bg-blue-50 text-blue-500' : event.type === 'milestone' ? 'bg-amber-50 text-amber-500' : 'bg-rose-50 text-rose-500'}`}>
                  {event.type === 'appointment' ? <Hospital size={20} /> : event.type === 'milestone' ? <Trophy size={20} /> : <Bell size={20} />}
                </div>
                <div>
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {new Date(event.date).toLocaleDateString()} {event.time && `• ${event.time}`}
                  </div>
                  <div className="text-sm font-bold text-slate-900">{event.title}</div>
                </div>
              </div>
              <button onClick={() => onRemoveEvent(event.id)} className="text-[10px] text-rose-300 hover:text-rose-500 font-bold">Delete</button>
            </div>
          ))}
      </div>
    </div>
  );
};
