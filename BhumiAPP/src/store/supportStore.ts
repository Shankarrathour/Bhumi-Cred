import { create } from 'zustand';
import {
  createTicketAPI,
  fetchTicketsAPI,
  fetchTicketAPI,
  replyToTicketAPI,
  CreateTicketPayload,
  SupportTicketResponse,
} from '../api/supportApi';

interface SupportState {
  tickets: SupportTicketResponse[];
  selectedTicket: SupportTicketResponse | null;
  isLoading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchTicket: (ticketId: string) => Promise<void>;
  createTicket: (payload: CreateTicketPayload) => Promise<SupportTicketResponse | null>;
  replyToTicket: (ticketId: string, message: string) => Promise<boolean>;
  clearSelectedTicket: () => void;
}

export const useSupportStore = create<SupportState>()((set, get) => ({
  tickets: [],
  selectedTicket: null,
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await fetchTicketsAPI();
      set({ tickets, isLoading: false });
    } catch (err) {
      console.warn('[supportStore] fetchTickets failed:', err);
      set({ isLoading: false, error: 'Unable to load support tickets.' });
    }
  },

  fetchTicket: async (ticketId: string) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = await fetchTicketAPI(ticketId);
      set({ selectedTicket: ticket, isLoading: false });
    } catch (err) {
      console.warn('[supportStore] fetchTicket failed:', err);
      set({ isLoading: false, error: 'Unable to load this ticket.' });
    }
  },

  createTicket: async (payload: CreateTicketPayload) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = await createTicketAPI(payload);
      set({ tickets: [ticket, ...get().tickets], isLoading: false });
      return ticket;
    } catch (err) {
      console.warn('[supportStore] createTicket failed:', err);
      set({ isLoading: false, error: 'Unable to create ticket. Please try again.' });
      return null;
    }
  },

  replyToTicket: async (ticketId: string, message: string) => {
    try {
      const ticket = await replyToTicketAPI(ticketId, message);
      set({
        selectedTicket: ticket,
        tickets: get().tickets.map((t) => (t.id === ticketId ? ticket : t)),
      });
      return true;
    } catch (err) {
      console.warn('[supportStore] replyToTicket failed:', err);
      set({ error: 'Unable to send your reply. Please try again.' });
      return false;
    }
  },

  clearSelectedTicket: () => set({ selectedTicket: null }),
}));
