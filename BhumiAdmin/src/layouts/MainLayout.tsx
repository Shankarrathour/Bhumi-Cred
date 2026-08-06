import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion } from 'framer-motion';

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-[#FAFBFC] overflow-hidden relative">
      {/* ── Sidebar Component (Inline for Desktop, Drawer for Mobile) ── */}
      <Sidebar />

      {/* ── Main Content Container ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <motion.div
            key="page"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="min-h-full p-6"
          >
            <div className="max-w-[1600px] mx-auto">
              <Outlet />
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};
