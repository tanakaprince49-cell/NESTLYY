import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { SleepLog, calculateDurationMinutes, SleepMode } from '../src/utils/sleepUtils';

interface SleepChartsProps {
  sessions: SleepLog[];
  mode: SleepMode;
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export const SleepCharts: React.FC<SleepChartsProps> = ({ sessions, mode }) => {
  // 1. Daily Sleep Chart (Last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const dailyData = last7Days.map((date) => {
    const dayStr = format(date, 'yyyy-MM-dd');
    const daySessions = sessions.filter(
      (s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === dayStr
    );
    const totalMinutes = daySessions.reduce(
      (acc, s) => acc + calculateDurationMinutes(s.startTime, s.endTime),
      0
    );
    return {
      name: format(date, 'EEE'),
      hours: parseFloat((totalMinutes / 60).toFixed(1)),
    };
  });

  // 2. Sleep Distribution (Night vs Naps)
  const nightMinutes = sessions.reduce(
    (acc, s) => (s.type === 'night' ? acc + calculateDurationMinutes(s.startTime, s.endTime) : acc),
    0
  );
  const napMinutes = sessions.reduce(
    (acc, s) => (s.type === 'nap' ? acc + calculateDurationMinutes(s.startTime, s.endTime) : acc),
    0
  );

  const distributionData = [
    { name: 'Night Sleep', value: nightMinutes },
    { name: 'Naps', value: napMinutes },
  ].filter((d) => d.value > 0);

  // 3. Timeline View (Today's sessions)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions
    .filter((s) => format(parseISO(s.startTime), 'yyyy-MM-dd') === todayStr)
    .map((s) => ({
      name: s.type === 'night' ? 'Night' : 'Nap',
      start: new Date(s.startTime).getHours() + new Date(s.startTime).getMinutes() / 60,
      end: new Date(s.endTime).getHours() + new Date(s.endTime).getMinutes() / 60,
      duration: calculateDurationMinutes(s.startTime, s.endTime) / 60,
    }));

  return (
    <div className="space-y-8">
      {/* Daily Sleep Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
          Daily Sleep (Hours)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
          Weekly Trend
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sleep Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
            Sleep Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline View (Simplified) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">
            Today's Timeline
          </h3>
          <div className="space-y-4 mt-4">
            {todaySessions.length === 0 ? (
              <p className="text-slate-400 text-sm italic">No sleep logged for today.</p>
            ) : (
              todaySessions.map((s, i) => (
                <div key={i} className="relative h-8 bg-slate-50 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-indigo-500 opacity-80"
                    style={{
                      left: `${(s.start / 24) * 100}%`,
                      width: `${(s.duration / 24) * 100}%`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-4 text-[10px] font-medium text-slate-600">
                    {s.name} ({s.duration.toFixed(1)}h)
                  </div>
                </div>
              ))
            )}
            <div className="flex justify-between text-[10px] text-slate-400 pt-2">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
