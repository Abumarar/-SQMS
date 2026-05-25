"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Ticket, Users, Activity } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-animate relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-1000"></div>

      <div className="z-10 container mx-auto px-6 py-12 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full glass-card">
            <Ticket className="w-8 h-8 text-brand-500" />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Smart Queue <br /> Management
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Eliminate physical lines and enhance customer experience with real-time status tracking, virtual tickets, and zero-latency synchronization.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* User Portal Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link href="/portal" className="block h-full group">
              <div className="h-full glass-card rounded-2xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:scale-[1.02] hover:border-brand-500/50 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
                <div className="p-4 rounded-xl bg-brand-500/10 mb-6 group-hover:bg-brand-500/20 transition-colors">
                  <Users className="w-8 h-8 text-brand-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">User Portal</h2>
                <p className="text-gray-400 mb-8 flex-grow">
                  Join queues remotely, track your live position, and receive notifications when it's almost your turn.
                </p>
                <div className="mt-auto flex items-center text-brand-500 font-medium group-hover:text-brand-400 transition-colors">
                  Join a Queue <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Admin Dashboard Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/admin" className="block h-full group">
              <div className="h-full glass-card rounded-2xl p-8 flex flex-col items-start text-left transition-all duration-300 hover:scale-[1.02] hover:border-purple-500/50 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.3)]">
                <div className="p-4 rounded-xl bg-purple-500/10 mb-6 group-hover:bg-purple-500/20 transition-colors">
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Admin Dashboard</h2>
                <p className="text-gray-400 mb-8 flex-grow">
                  Manage active queues, assign counters, and view real-time analytics on wait times and throughput.
                </p>
                <div className="mt-auto flex items-center text-purple-500 font-medium group-hover:text-purple-400 transition-colors">
                  Manage Operations <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-sm text-gray-500">
        SQMS Cloud-Native Platform &copy; 2026
      </div>
    </main>
  );
}
