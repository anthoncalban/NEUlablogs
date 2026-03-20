import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  DoorOpen, 
  Activity, 
  Search, 
  Download, 
  TrendingUp
} from 'lucide-react';
import { Log } from '../types';
import { format, startOfDay, endOfDay, isWithinInterval, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const AdminDashboard: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Log[];
      setLogs(logsData);
    });
    return () => unsubscribe();
  }, []);

  const rooms = Array.from({ length: 10 }, (_, i) => (101 + i).toString());

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.professorName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRoom = roomFilter === 'all' || log.roomNumber === roomFilter;
      
      let matchesDate = true;
      const logDate = parseISO(log.timestamp);
      const now = new Date();

      if (dateRange === 'daily') {
        matchesDate = isWithinInterval(logDate, { start: startOfDay(now), end: endOfDay(now) });
      } else if (dateRange === 'weekly') {
        matchesDate = isWithinInterval(logDate, { start: startOfWeek(now), end: endOfWeek(now) });
      } else if (dateRange === 'monthly') {
        matchesDate = isWithinInterval(logDate, { start: startOfMonth(now), end: endOfMonth(now) });
      }

      return matchesSearch && matchesRoom && matchesDate;
    });
  }, [logs, searchTerm, roomFilter, dateRange]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayLogs = logs.filter(log => isWithinInterval(parseISO(log.timestamp), { start: startOfDay(today), end: endOfDay(today) }));
    
    const roomCounts = logs.reduce((acc, log) => {
      acc[log.roomNumber] = (acc[log.roomNumber] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveRoom = Object.entries(roomCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A';
    const uniqueProfessors = new Set(logs.map(log => log.professorId)).size;

    return {
      totalToday: todayLogs.length,
      mostActiveRoom,
      uniqueProfessors
    };
  }, [logs]);

  const chartData = useMemo(() => {
    const data = rooms.map(room => ({
      name: room,
      count: logs.filter(log => log.roomNumber === room).length
    }));
    return data;
  }, [logs]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Professor Name,Room Number,Timestamp,Type\n"
      + filteredLogs.map(log => `${log.professorName},${log.roomNumber},${log.timestamp},${log.type}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NEU_Lab_Logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-sm font-medium">Total Uses Today</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats.totalToday}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-sm font-medium">Most Active Room</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats.mostActiveRoom}</h3>
            </div>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-stone-500 text-sm font-medium">Unique Professors</p>
              <h3 className="text-2xl font-bold text-stone-900">{stats.uniqueProfessors}</h3>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Activity Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-emerald-600 w-5 h-5" />
              <h2 className="text-lg font-bold text-stone-900">Room Activity Overview</h2>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#059669' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-6 border-b border-stone-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-stone-900">Detailed Logs</h2>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search professor..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full md:w-64"
                  />
                </div>
                
                <select 
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All Rooms</option>
                  {rooms.map(room => <option key={room} value={room}>Room {room}</option>)}
                </select>
                
                <select 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="all">All Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Professor</th>
                  <th className="px-6 py-4 font-semibold">Room</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Time & Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 font-bold text-xs">
                            {log.professorName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-stone-900">{log.professorName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-bold">Room {log.roomNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.type === 'login' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm text-stone-900">{format(parseISO(log.timestamp), 'hh:mm a')}</span>
                          <span className="text-xs text-stone-400">{format(parseISO(log.timestamp), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-stone-400 text-sm italic">
                      No logs found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
