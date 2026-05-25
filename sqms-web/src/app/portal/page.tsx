"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Clock, MapPin, Ticket as TicketIcon, Loader2, LogOut, CheckCircle2 } from "lucide-react";
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
  queue_name?: string;
};

export default function UserPortal() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [myTicket, setMyTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueues();
    checkExistingTicket();
    
    // Subscribe to real-time changes on the queues table
    const queuesChannel = supabase
      .channel('public:queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(queuesChannel);
    };
  }, []);

  useEffect(() => {
    if (!myTicket) return;

    // Subscribe to specific ticket changes
    const ticketsChannel = supabase
      .channel(`public:tickets:${myTicket.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'tickets',
        filter: `id=eq.${myTicket.id}`
      }, (payload) => {
        const updatedTicket = payload.new as Ticket;
        if (updatedTicket.status === 'completed' || updatedTicket.status === 'cancelled') {
          localStorage.removeItem('sqms_ticket_id');
          setMyTicket(null);
          alert(`Your ticket was marked as ${updatedTicket.status}!`);
        } else {
          setMyTicket((prev) => prev ? { ...prev, ...updatedTicket } : null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketsChannel);
    };
  }, [myTicket?.id]);

  async function checkExistingTicket() {
    const ticketId = localStorage.getItem('sqms_ticket_id');
    if (!ticketId) return;

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          queues (name)
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (data && data.status !== 'completed' && data.status !== 'cancelled') {
        setMyTicket({ 
          ...data, 
          queue_name: data.queues?.name 
        });
      } else {
        localStorage.removeItem('sqms_ticket_id');
      }
    } catch (err) {
      console.error("Error fetching ticket", err);
    }
  }

  async function fetchQueues() {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('is_active', true);
        
      if (error) throw error;
      setQueues(data || []);
    } catch (err: any) {
      console.error('Error fetching queues:', err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function joinQueue(queue: Queue) {
    setJoiningId(queue.id);
    try {
      const { data: maxTicket } = await supabase
        .from('tickets')
        .select('position_number')
        .eq('queue_id', queue.id)
        .order('position_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const position_number = maxTicket ? maxTicket.position_number + 1 : 1;

      const { data: newTicket, error } = await supabase
        .from('tickets')
        .insert({ queue_id: queue.id, position_number })
        .select()
        .single();

      if (error) throw error;

      if (newTicket) {
        localStorage.setItem('sqms_ticket_id', newTicket.id);
        setMyTicket({ ...newTicket, queue_name: queue.name });
      }
    } catch (err: any) {
      console.error('Error joining queue:', err.message || err);
      alert('Failed to join queue. Make sure RLS policies are applied.');
    } finally {
      setJoiningId(null);
    }
  }

  async function leaveQueue() {
    if (!myTicket) return;
    try {
      await supabase.from('tickets').update({ status: 'cancelled' }).eq('id', myTicket.id);
      localStorage.removeItem('sqms_ticket_id');
      setMyTicket(null);
    } catch (err) {
      console.error('Error leaving queue', err);
    }
  }

  return (
    <main className="min-h-screen bg-color-background flex flex-col relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

      <header className="glass border-b border-white/5 px-6 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center text-white font-semibold text-lg">
              <Users className="w-5 h-5 mr-2 text-brand-500" />
              User Portal
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col items-center z-10">
        <AnimatePresence mode="wait">
          {myTicket ? (
            <motion.div 
              key="ticket"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">Your Ticket</h1>
                <p className="text-gray-400">Present this when your number is called</p>
              </div>

              <div className="glass-card p-8 rounded-3xl relative overflow-hidden shadow-2xl shadow-brand-500/20 border border-brand-500/20">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-400 to-blue-500"></div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-brand-500/20 flex items-center justify-center mb-6 border border-brand-500/30">
                    <TicketIcon className="w-10 h-10 text-brand-400" />
                  </div>
                  
                  <p className="text-sm font-medium text-brand-400 uppercase tracking-wider mb-1">
                    {myTicket.queue_name || 'Queue'}
                  </p>
                  
                  <div className="text-7xl font-black text-white mb-6 tracking-tighter">
                    #{myTicket.position_number}
                  </div>

                  <div className="flex items-center space-x-2 mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    {myTicket.status === 'serving' ? (
                      <>
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-green-400 font-medium">Currently Serving</span>
                      </>
                    ) : (
                      <>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-yellow-400 font-medium">Waiting in Line</span>
                      </>
                    )}
                  </div>

                  <button 
                    onClick={leaveQueue}
                    className="flex items-center text-gray-400 hover:text-red-400 transition-colors text-sm font-medium"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Queue
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="queues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl flex flex-col items-center"
            >
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Select a Service</h1>
                <p className="text-gray-400 text-lg">
                  Choose a location to join the virtual queue. You'll be notified when it's your turn.
                </p>
              </div>

              {loading ? (
                <div className="flex flex-col items-center text-brand-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="font-medium animate-pulse">Loading active queues...</p>
                </div>
              ) : queues.length === 0 ? (
                <div className="glass-card p-10 rounded-3xl text-center max-w-md w-full border border-white/5">
                  <Clock className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-2xl text-white font-semibold mb-3">No active queues</h3>
                  <p className="text-gray-400">There are currently no active queues available. Please check back later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 w-full gap-5">
                  {queues.map((queue) => (
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      key={queue.id} 
                      className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between transition-all hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 cursor-pointer group"
                    >
                      <div className="flex-1 text-left mb-5 sm:mb-0 w-full">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-brand-400 transition-colors">{queue.name}</h3>
                        <div className="flex items-center text-sm text-gray-400 font-medium">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> {queue.location || 'Main Branch'}
                        </div>
                      </div>
                      <button 
                        onClick={() => joinQueue(queue)}
                        disabled={joiningId === queue.id}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-brand-600/50 disabled:cursor-not-allowed text-white font-medium transition-all shadow-lg shadow-brand-500/25 flex items-center justify-center"
                      >
                        {joiningId === queue.id ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Joining...
                          </>
                        ) : (
                          'Join Queue'
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
