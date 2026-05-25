"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Plus, X, AlertCircle } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { motion, AnimatePresence } from "framer-motion";

type Queue = {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
};

export default function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newQueueName, setNewQueueName] = useState("");
  const [newQueueLocation, setNewQueueLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      fetchQueues(); // Optimistic update
    } catch (error) {
      console.error('Error updating queue:', error);
    }
  }

  async function handleCreateQueue(e: React.FormEvent) {
    e.preventDefault();
    if (!newQueueName.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const { error } = await supabase.from('queues').insert([
        { name: newQueueName, location: newQueueLocation, is_active: true }
      ]);
      
      if (error) throw error;
      
      // Success!
      setIsModalOpen(false);
      setNewQueueName("");
      setNewQueueLocation("");
    } catch (err: any) {
      console.error('Error creating queue:', err);
      // Format RLS error to be more user friendly
      if (err.code === '42501' || err.message?.includes('row-level security')) {
        setSubmitError('Permission Denied: You must run the `supabase/rls_inserts.sql` script in your Supabase SQL Editor to allow queue creation.');
      } else {
        setSubmitError(err.message || 'An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-color-background flex flex-col relative">
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-40">
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

      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Operations</h1>
            <p className="text-gray-400">Monitor and manage all active branch queues.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 flex items-center px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-[0_0_20px_-5px_rgba(168,85,247,0.4)] transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New Queue
          </button>
        </div>

        {loading ? (
          <div className="text-purple-500 animate-pulse font-medium flex items-center">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            Loading operations data...
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <th className="p-5 text-sm font-semibold text-gray-400 uppercase tracking-wider">Queue Name</th>
                    <th className="p-5 text-sm font-semibold text-gray-400 uppercase tracking-wider">Location</th>
                    <th className="p-5 text-sm font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="p-5 text-sm font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {queues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <Activity className="w-12 h-12 mb-4 opacity-20" />
                          <p>No queues found. Click "Create New Queue" to start!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {queues.map((queue) => (
                    <tr key={queue.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5 text-white font-medium">{queue.name}</td>
                      <td className="p-5 text-gray-400 text-sm">{queue.location || 'N/A'}</td>
                      <td className="p-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          queue.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {queue.is_active ? 'ACTIVE' : 'PAUSED'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <button 
                          onClick={() => toggleQueueStatus(queue.id, queue.is_active)}
                          className="text-xs text-white font-medium px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
                        >
                          {queue.is_active ? 'Pause Queue' : 'Activate Queue'}
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

      {/* Beautiful Modal overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-md p-8 rounded-2xl relative border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">Create New Queue</h2>
              
              {submitError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start text-red-400 text-sm">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                  <p>{submitError}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateQueue} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Queue Name *</label>
                  <input 
                    type="text" 
                    required
                    value={newQueueName}
                    onChange={(e) => setNewQueueName(e.target.value)}
                    placeholder="e.g. Express Checkout" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Location (Optional)</label>
                  <input 
                    type="text" 
                    value={newQueueLocation}
                    onChange={(e) => setNewQueueLocation(e.target.value)}
                    placeholder="e.g. 1st Floor, Support Desk" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]"
                >
                  {isSubmitting ? 'Creating...' : 'Create Queue'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
