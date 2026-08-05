import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LifeBuoy, X, Send, Search, Clock, CheckCircle } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button, IconButton, Chip } from '@mui/material';
import toast from 'react-hot-toast';
import { useSupportTickets, useReplyTicket, useUpdateTicketStatus, Ticket } from '../api/useSupport';

export const SupportCenter = () => {
  const { data: tickets = [], isLoading } = useSupportTickets();
  const replyMutation = useReplyTicket();
  const statusMutation = useUpdateTicketStatus();
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    replyMutation.mutate(
      { ticketId: selectedTicket.id, message: replyText },
      {
        onSuccess: (updatedTicket) => {
          toast.success('Reply sent successfully');
          setReplyText('');
          setSelectedTicket(updatedTicket);
        },
        onError: () => toast.error('Failed to send reply')
      }
    );
  };

  const handleResolve = () => {
    if (!selectedTicket) return;
    statusMutation.mutate(
      { ticketId: selectedTicket.id, status: 'RESOLVED' },
      {
        onSuccess: (updatedTicket) => {
          toast.success('Ticket marked as resolved');
          setSelectedTicket(updatedTicket);
        },
        onError: () => toast.error('Failed to update ticket')
      }
    );
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Support Center"
        description="Manage vendor and user support queries, track issue resolutions, and provide assistance."
        icon={LifeBuoy}
        badge={{ label: `${tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length} Active`, variant: 'primary' }}
      />

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex justify-between items-center bg-[#FAFBFC]">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><LifeBuoy size={18}/> Support Tickets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Sender</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading Tickets...</td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No Tickets Found</td></tr>
              ) : tickets.map((ticket, i) => (
                <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-mono text-sm text-slate-500">{ticket.id.slice(0, 8)}</td>
                  <td className="font-semibold text-slate-800">{ticket.vendor_name}</td>
                  <td className="text-slate-800 font-medium">{ticket.subject}</td>
                  <td>
                    <Chip label={ticket.priority} size="small" variant="outlined" 
                      color={ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'error' : ticket.priority === 'MEDIUM' ? 'warning' : 'default'} 
                    />
                  </td>
                  <td className="text-slate-500 text-sm">{new Date(ticket.created_at).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge label={ticket.status} variant={ticket.status === 'RESOLVED' ? 'success' : ticket.status === 'OPEN' ? 'danger' : 'warning'} size="sm" />
                  </td>
                  <td className="text-right">
                    <Button variant="outlined" size="small" onClick={() => setSelectedTicket(ticket)}>View & Reply</Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Panel for Ticket Details */}
      <AnimatePresence>
        {selectedTicket && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setSelectedTicket(null)} className="fixed inset-0 bg-black z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="fixed top-0 right-0 h-[100dvh] w-[600px] max-w-full bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200">
              
              {/* Header */}
              <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{selectedTicket.subject}</h3>
                  <p className="text-sm text-slate-500">From {selectedTicket.vendor_name} • {selectedTicket.id.slice(0, 8)}</p>
                </div>
                <IconButton onClick={() => setSelectedTicket(null)}><X size={20} /></IconButton>
              </div>
              
              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                <div className="p-6 space-y-6 flex flex-col min-h-full justify-end">
                  
                  {/* Original Query (if not in messages) */}
                  {(!selectedTicket.messages.length || selectedTicket.messages[0].message !== selectedTicket.description) && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                      <h4 className="text-[13px] font-semibold text-slate-800 mb-1">Original Query:</h4>
                      <p className="text-slate-600 whitespace-pre-wrap text-[13px] leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  )}

                  {/* Messages */}
                  {selectedTicket.messages.map((msg, idx) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={idx} className={`flex flex-col w-full ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-[11px] text-slate-400 mb-1.5 font-medium px-1">
                          {msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div 
                          className={`p-3.5 max-w-[85%] text-[13.5px] leading-relaxed shadow-sm ${
                            isAdmin 
                              ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Input Area */}
              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                <div className="p-4 border-t border-slate-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                  <div className="flex items-end gap-3">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..." 
                      className="flex-1 bg-slate-100 border-none rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none min-h-[50px] max-h-[120px]"
                      rows={replyText.split('\n').length > 1 ? Math.min(replyText.split('\n').length, 4) : 1}
                    />
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button 
                        variant="contained" 
                        color="primary" 
                        className="!rounded-lg !min-w-[48px] !h-[48px]"
                        onClick={handleSendReply}
                        disabled={!replyText.trim() || replyMutation.isPending}
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-[12px] text-slate-500">Press enter to add a new line.</span>
                    <Button 
                      variant="outlined" 
                      color="success" 
                      size="small"
                      startIcon={<CheckCircle size={16} />} 
                      onClick={handleResolve}
                      disabled={statusMutation.isPending}
                      className="!rounded-lg !text-[13px] !py-1.5"
                    >
                      Mark as Resolved
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
