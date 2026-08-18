import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { Truck, Search, CheckCircle, RefreshCw } from 'lucide-react';

export const OrdersLogistics: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/marketplace-orders');
      const apiOrders = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      setOrders(apiOrders);
    } catch (err) {
      toast.error('Failed to fetch orders from backend');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/marketplace-orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const query = search.trim().toLowerCase();
    return (
      o.id?.toLowerCase().includes(query) ||
      o.order_number?.toLowerCase().includes(query) ||
      o.vendor_id?.toLowerCase().includes(query) ||
      o.vendor_public_id?.toLowerCase().includes(query) ||
      o.farmer_name?.toLowerCase().includes(query) ||
      o.status?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-950">Orders &amp; Logistics</h1>
          <p className="text-sm text-emerald-700/70">Monitor real-time marketplace orders and shipments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-emerald-200 rounded-xl hover:bg-emerald-50 text-emerald-700 transition-all cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
            <input
              type="text"
              placeholder="Search order ID, number, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-[#111c16] rounded-2xl border border-emerald-900/50 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0b140f] border-b border-emerald-900/50">
            <tr>
              <th className="p-4 font-semibold text-emerald-100">Order Info</th>
              <th className="p-4 font-semibold text-emerald-100">Farmer &amp; Vendor ID</th>
              <th className="p-4 font-semibold text-emerald-100">Items &amp; Total</th>
              <th className="p-4 font-semibold text-emerald-100">Status</th>
              <th className="p-4 font-semibold text-emerald-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/30">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-emerald-400/60">
                  Loading live orders from MongoDB backend...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-emerald-400/60">
                  {search ? `No matching orders found for "${search}"` : "No orders found in database."}
                </td>
              </tr>
            ) : (
              filtered.map(order => {
                const rawStatus = (order.order_status || order.status || 'Pending').toUpperCase();
                const displayDate = order.order_date || (order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '');
                
                return (
                  <tr key={order.id || order.order_id} className="hover:bg-emerald-900/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-900/30 rounded-lg text-emerald-400">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-emerald-50 truncate max-w-[220px]" title={order.order_id || `#${order.id}`}>
                            {order.order_id || `#${order.id?.slice(-8)}`}
                          </p>
                          <p className="text-xs text-emerald-400/70">{displayDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-emerald-100 text-xs">{order.buyer_name || 'Farmer'}</p>
                      <p className="text-emerald-400/70 font-mono text-[11px] truncate max-w-[150px]" title={order.vendor_name}>
                        {order.vendor_name || 'Direct Merchant'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-emerald-50">₹{order.total_amount}</p>
                      <p className="text-xs text-emerald-400/70 truncate max-w-[180px]" title={order.product_name}>{order.product_name}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        rawStatus === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        rawStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        (rawStatus === 'PENDING' || rawStatus === 'CONFIRMED') ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.order_status || order.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {(rawStatus === 'PENDING' || rawStatus === 'CONFIRMED') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id || order.order_id, 'SHIPPED')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" /> Approve &amp; Ship
                        </button>
                      )}
                      {rawStatus === 'SHIPPED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id || order.order_id, 'DELIVERED')}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      )}
                      {rawStatus === 'DELIVERED' && (
                        <span className="text-xs text-emerald-400 font-mono font-medium px-2.5 py-1 bg-emerald-950/80 rounded-lg border border-emerald-800/40">
                          ✅ Fulfilled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

