"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Plus, X, AlertCircle, Users, CheckCircle2, Clock, Trash2, ArrowRight, Play } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { motion, AnimatePresence } from "framer-motion";

type Queue = {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
};

type Ticket = {
  id: string;
  queue_id: string;
  position_number: number;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  created_at: string;
};

export default function AdminDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Queue State
  const [selectedQueue, setSelectedQueue] = useState<Queue | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  
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

  useEffect(() => {
    if (!selectedQueue) return;

    fetchTickets(selectedQueue.id);

    const channel = supabase
      .channel(`public:tickets_admin_${selectedQueue.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets',
        filter: `queue_id=eq.${selectedQueue.id}`
      }, () => {
        fetchTickets(selectedQueue.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedQueue]);

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

  async function fetchTickets(queueId: string) {
    setTicketsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('queue_id', queueId)
        .in('status', ['waiting', 'serving'])
        .order('position_number', { ascending: true });
        
      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  }

  async function toggleQueueStatus(queueId: string, currentStatus: boolean, e: React.MouseEvent) {
    e.stopPropagation(); // prevent opening the queue view
    try {
      const { error } = await supabase
        .from('queues')
        .update({ is_active: !currentStatus })
        .eq('id', queueId);
      if (error) throw error;
      fetchQueues();
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
      
      setIsModalOpen(false);
      setNewQueueName("");
      setNewQueueLocation("");
    } catch (err: any) {
      console.error('Error creating queue:', err);
      if (err.code === '42501' || err.message?.includes('row-level security')) {
        setSubmitError('Permission Denied: You must run the `supabase/rls_inserts.sql` script in your Supabase SQL Editor.');
      } else {
        setSubmitError(err.message || 'An unknown error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function updateTicketStatus(ticketId: string, status: 'serving' | 'completed' | 'cancelled') {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);
        
      if (error) throw error;
      fetchTickets(selectedQueue!.id);
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  }

  async function callNextTicket() {
    // If we are already serving tickets, complete them first?
    // For simplicity, let's just mark the first waiting ticket as serving
    const nextWaiting = tickets.find(t => t.status === 'waiting');
    if (nextWaiting) {
      await updateTicketStatus(nextWaiting.id, 'serving');
    }
  }

  if (selectedQueue) {
    const servingTickets = tickets.filter(t => t.status === 'serving');
    const waitingTickets = tickets.filter(t => t.status === 'waiting');

    return (
      <main className="min-h-screen bg-color-background flex flex-col relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
        
        <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-40">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSelectedQueue(null)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-500" />
                  {selectedQueue.name}
                </span>
                <span className="text-xs text-gray-400">{selectedQueue.location || 'No location set'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 container mx-auto px-6 py-8 flex flex-col z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Serving & Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-purple-500/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.3)]">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <Play className="w-5 h-5 mr-2 text-green-400" />
                  Currently Serving
                </h2>
                
                {servingTickets.length === 0 ? (
                  <div className="text-center py-8 bg-black/20 rounded-xl border border-white/5">
                    <p className="text-gray-400 font-medium">No one is currently being served.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {servingTickets.map(ticket => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={ticket.id} 
                        className="bg-purple-900/20 border border-purple-500/30 p-5 rounded-xl flex flex-col"
                      >
                        <div className="text-center mb-4">
                          <span className="text-sm text-purple-300 font-medium uppercase tracking-wider">Ticket Number</span>
                          <div className="text-6xl font-black text-white mt-1">#{ticket.position_number}</div>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button 
                            onClick={() => updateTicketStatus(ticket.id, 'completed')}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Complete
                          </button>
                          <button 
                            onClick={() => updateTicketStatus(ticket.id, 'cancelled')}
                            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Cancel
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={callNextTicket}
                  disabled={waitingTickets.length === 0}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center text-lg"
                >
                  Call Next Ticket <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>

              {/* Stats Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-gray-400 font-medium mb-4">Queue Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">{waitingTickets.length}</div>
                    <div className="text-sm text-gray-500">Waiting</div>
                  </div>
                  <div className="bg-black/20 p-4 rounded-xl">
                    <div className="text-3xl font-bold text-white">{servingTickets.length}</div>
                    <div className="text-sm text-gray-500">Serving</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Waiting List */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 rounded-2xl border border-white/5 h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-400" />
                    Waiting List
                  </h2>
                  <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {waitingTickets.length} People
                  </span>
                </div>

                {ticketsLoading ? (
                  <div className="flex justify-center items-center py-20 text-purple-500 animate-pulse">
                    Loading tickets...
                  </div>
                ) : waitingTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Clock className="w-16 h-16 text-gray-600 mb-4 opacity-50" />
                    <h3 className="text-xl text-white font-medium mb-2">Queue is empty</h3>
                    <p className="text-gray-400">No one is currently waiting in this queue.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {waitingTickets.map((ticket, index) => (
                        <motion.div 
                          key={ticket.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold text-white mr-4">
                              {ticket.position_number}
                            </div>
                            <div>
                              <div className="text-white font-medium">Ticket #{ticket.position_number}</div>
                              <div className="text-xs text-gray-500">
                                Joined {new Date(ticket.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => updateTicketStatus(ticket.id, 'serving')}
                              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              Call Now
                            </button>
                            <button 
                              onClick={() => updateTicketStatus(ticket.id, 'cancelled')}
                              className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    );
  }

  // --- Main Queue List View ---
  return (
    <main className="min-h-screen bg-color-background flex flex-col relative">
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10">
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
            <p className="text-gray-400">Monitor and manage all active branch queues. Click a queue to manage tickets.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.length === 0 && (
              <div className="col-span-full glass-card p-12 rounded-2xl border border-white/5 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center">
                  <Activity className="w-16 h-16 mb-4 opacity-20 text-purple-500" />
                  <p className="text-lg text-white mb-2">No queues found</p>
                  <p className="text-sm">Click "Create New Queue" to start managing visitors!</p>
                </div>
              </div>
            )}
            
            {queues.map((queue) => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={queue.id} 
                onClick={() => setSelectedQueue(queue)}
                className="glass-card rounded-2xl p-6 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer group shadow-lg hover:shadow-purple-500/10 flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{queue.name}</h3>
                    <p className="text-sm text-gray-400">{queue.location || 'N/A'}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                    queue.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {queue.is_active ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                
                <div className="mt-auto pt-6 flex justify-between items-center border-t border-white/5">
                  <span className="text-sm text-purple-400 font-medium flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    Manage Tickets <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                  <button 
                    onClick={(e) => toggleQueueStatus(queue.id, queue.is_active, e)}
                    className="text-xs text-white font-medium px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors ml-auto"
                  >
                    {queue.is_active ? 'Pause Queue' : 'Activate Queue'}
                  </button>
                </div>
              </motion.div>
            ))}
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
