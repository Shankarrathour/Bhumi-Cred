import React, { useState } from 'react';
import { useEcosystemStore } from '../store';
import { Order } from '../types';
import toast from 'react-hot-toast';
import { 
  Truck, 
  Search, 
  Check, 
  X, 
  Clock, 
  Package, 
  ArrowUpRight,
  ShieldAlert,
  Download
} from 'lucide-react';
import { cn } from '../utils/cn';

export const OrdersPage: React.FC = () => {
  const { orders } = useEcosystemStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'>('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Computed metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const shippedOrders = orders.filter(o => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;

  const displayList = orders.filter(order => {
    if (statusFilter !== 'All' && order.status !== statusFilter) return false;

    if (!search.trim()) return true;

    const query = search.trim().toLowerCase();
    const matchesSearch = 
      order.id.toLowerCase().includes(query) ||
      order.buyerName.toLowerCase().includes(query) ||
      (order.farmerName && order.farmerName.toLowerCase().includes(query)) ||
      order.products.some(p => p.title.toLowerCase().includes(query));

    return matchesSearch;
  });

  const handleUpdateStatus = (orderId: string, status: 'Shipped' | 'Delivered' | 'Cancelled') => {
    useEcosystemStore.setState((state) => ({
      orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o)
    }));

    // Record system log
    useEcosystemStore.getState().addActivityLog(
      'Logistics Dispatch Center',
      'super_admin',
      `Updated Order ${orderId} logistics status to: ${status.toUpperCase()}`
    );

    toast.success(`Order ${orderId} status set to ${status}.`);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status } : null);
    }
  };

  const handleExportCSV = () => {
    toast.success('B2B Logistics manifest exported successfully!');
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider leading-none">Logistics & B2B Orders</h1>
          <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
            Track bio-fertilizer supply, manage eco-pumps shipping cycles, audit transaction codes, and resolve delivery disputes.
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="cyber-button-primary self-start lg:self-center"
        >
          <Download className="w-4 h-4 text-primary-foreground" />
          <span>Export Manifest (CSV)</span>
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { title: 'Total Ledger Orders', value: `${totalOrders} Orders`, icon: Package, color: 'text-primary' },
          { title: 'Awaiting Dispatch', value: `${pendingOrders} Pending`, icon: Clock, color: 'text-accent' },
          { title: 'Active Transit', value: `${shippedOrders} Dispatched`, icon: Truck, color: 'text-blue-500' },
          { title: 'Delivered Fulfilled', value: `${deliveredOrders} Fulfilled`, icon: ArrowUpRight, color: 'text-emerald-500' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border p-3.5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[7.5px] text-muted-foreground block tracking-widest uppercase">{stat.title}</span>
                <span className={cn("text-xs font-black font-mono", stat.color)}>{stat.value}</span>
              </div>
              <Icon className="w-5 h-5 text-primary shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Grid Controls (Search + Filters) */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-card border border-border p-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
          <input 
            type="text"
            placeholder="SEARCH ORDERS BY BUYER NAME OR ORDER REFERENCE CODE..."
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-none text-[9px] uppercase font-bold tracking-wider outline-none focus:border-primary/50 text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 shrink-0 w-full md:w-auto overflow-x-auto scrollbar-none">
          {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={cn(
                "px-2.5 py-1 text-[8.5px] font-black uppercase tracking-widest border transition-all rounded-none",
                statusFilter === status 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left column - Ledger list */}
        <div className="lg:col-span-2 space-y-3">
          {displayList.length === 0 ? (
            <div className="text-center py-16 border border-border border-dashed p-6">
              <ShieldAlert className="w-8 h-8 mx-auto text-muted-foreground opacity-45 mb-2.5 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">No matching orders</h3>
            </div>
          ) : (
            displayList.map(order => (
              <div 
                key={order.id}
                className={cn(
                  "bg-card border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-primary/40 shadow-sm",
                  selectedOrder?.id === order.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[7px] border font-black px-1.5 py-0.2 uppercase tracking-widest",
                      order.status === 'Delivered' ? "bg-primary/5 border-primary/20 text-primary" :
                      order.status === 'Pending' ? "bg-accent/5 border-accent/20 text-accent" :
                      order.status === 'Shipped' ? "bg-blue-500/5 border-blue-500/20 text-blue-500" :
                      "bg-destructive/5 border-destructive/20 text-destructive"
                    )}>
                      {order.status}
                    </span>
                    <span className="text-[7.5px] text-muted-foreground font-mono">{order.id} • {order.orderDate}</span>
                  </div>
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-wider">{order.buyerName}</h3>
                  <div className="text-[8.5px] text-slate-400">
                    ITEMS: {order.products.map(p => `${p.title} (x${p.quantity})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-primary font-mono shrink-0">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1.5 border border-primary text-primary hover:bg-primary/5 text-[8.5px] font-black uppercase rounded-none transition-all"
                  >
                    TRACK PACKAGE
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column - Tracking details */}
        <div className="lg:col-span-1 bg-card border border-border p-4 h-[420px] flex flex-col justify-between shadow-sm">
          {selectedOrder ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden justify-between">
              
              {/* Header */}
              <div className="border-b border-border pb-2.5 shrink-0 flex items-start justify-between">
                <div>
                  <span className="text-[7px] bg-primary/10 border border-primary/20 text-primary font-black px-1.5 py-0.2">
                    LOGISTICS CONSOLE
                  </span>
                  <h3 className="text-[10px] font-black text-foreground mt-2 uppercase max-w-[200px] truncate">{selectedOrder.buyerName}</h3>
                </div>
                <div className="text-[8.5px] text-primary font-black">{selectedOrder.id}</div>
              </div>

              {/* Scrollable specs */}
              <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1 scrollbar-thin uppercase font-bold text-[8px] tracking-wider">
                <div className="bg-muted/20 border border-border p-3 space-y-2">
                  <span className="text-[7.5px] text-muted-foreground block border-b border-border/40 pb-1">DELIVERY MANIFEST</span>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">SHIPPING ADDRESS</span>
                    <span className="text-foreground text-[8.5px] leading-normal">{selectedOrder.shippingAddress}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">DATE OF PURCHASE</span>
                    <span className="text-foreground font-mono">{selectedOrder.orderDate}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[7.5px] text-muted-foreground block border-b border-border/40 pb-1">INVOICE ITEMS</span>
                  {selectedOrder.products.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-muted/40 p-2 border border-border">
                      <span className="text-[8px] text-foreground truncate max-w-[150px]">{p.title} (x{p.quantity})</span>
                      <span className="text-primary font-mono text-[8px]">₹{(p.price * p.quantity).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center border-t border-border/40 pt-2 font-black">
                    <span>GRAND TOTAL</span>
                    <span className="text-primary font-mono text-[9px]">₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedOrder.status === 'Pending' && (
                <div className="flex gap-2 border-t border-border pt-3 shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Shipped')}
                    className="flex-1 py-2 bg-primary text-primary-foreground border border-primary/20 text-[8px] font-black text-center transition-all hover:bg-primary/95 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 inline mr-1 shrink-0" />
                    APPROVE DISPATCH
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                    className="py-2 px-3 border border-destructive text-destructive bg-destructive/5 text-[8px] font-black text-center transition-all hover:bg-destructive/10 active:scale-95"
                  >
                    <X className="w-3.5 h-3.5 inline shrink-0" />
                  </button>
                </div>
              )}

              {selectedOrder.status === 'Shipped' && (
                <div className="flex gap-2 border-t border-border pt-3 shrink-0">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                    className="w-full py-2 bg-primary text-primary-foreground border border-primary/20 text-[8px] font-black text-center transition-all hover:bg-primary/95 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 inline mr-1 shrink-0" />
                    CONFIRM SUCCESSFUL DELIVERY
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Truck className="w-8 h-8 text-primary/30 opacity-60 mb-2.5 text-primary animate-bounce" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Order Record</h3>
              <p className="text-[8.5px] text-muted-foreground uppercase font-bold mt-1 max-w-xs leading-normal">
                Click "Track Package" on any ledger entry to verify buyer addresses, review product bills, and issue transit approvals.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
