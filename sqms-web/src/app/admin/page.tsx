"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Users, MoreHorizontal } from "lucide-react";
import { supabase } from "../../utils/supabase";

type Queue = {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
};

export default function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueues();
    
    const channel = supabase
      .channel('public:queues_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchQueues() {
    try {
      const { data, error } = await supabase.from('queues').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setQueues(data || []);
    } catch (err: any) {
      console.error('Error fetching queues:', err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleQueueStatus(queueId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('queues')
        .update({ is_active: !currentStatus })
        .eq('id', queueId);
      if (error) throw error;
      fetchQueues(); // Optimistic update could be applied here
    } catch (error) {
      console.error('Error updating queue:', error);
    }
  }

  async function handleCreateQueue() {
    const name = window.prompt("Enter new queue name (e.g. 'Express Checkout'):");
    if (!name) return;
    
    const location = window.prompt("Enter queue location (e.g. 'Floor 1'):") || "";
    
    try {
      const { error } = await supabase.from('queues').insert([
        { name, location, is_active: true }
      ]);
      if (error) throw error;
      // The websocket subscription will automatically fetch the new queue!
    } catch (err: any) {
      console.error('Error creating queue:', err.message || err);
      alert('Error creating queue: ' + (err.message || err));
    }
  }

  return (
    <main className="min-h-screen bg-color-background flex flex-col">
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center text-white font-semibold text-lg">
              <Activity className="w-5 h-5 mr-2 text-purple-500" />
              Admin Dashboard
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Operations</h1>
            <p className="text-gray-400">Monitor and manage all active branch queues.</p>
          </div>
          <button 
            onClick={handleCreateQueue}
            className="mt-4 sm:mt-0 px-5 py-2 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors font-medium text-sm"
          >
            + Create New Queue
          </button>
        </div>

        {loading ? (
          <div className="text-purple-500 animate-pulse font-medium">Loading operations data...</div>
        ) : (
          <div className="bg-[#1e293b]/50 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <th className="p-4 text-sm font-medium text-gray-400">Queue Name</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Location</th>
                    <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="p-4 text-sm font-medium text-gray-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        No queues found. Run the seed.sql script to populate dummy data!
                      </td>
                    </tr>
                  )}
                  {queues.map((queue) => (
                    <tr key={queue.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-white font-medium">{queue.name}</td>
                      <td className="p-4 text-gray-400 text-sm">{queue.location || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          queue.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {queue.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => toggleQueueStatus(queue.id, queue.is_active)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-medium px-3 py-1 bg-purple-500/10 rounded-md transition-colors"
                        >
                          Toggle Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
