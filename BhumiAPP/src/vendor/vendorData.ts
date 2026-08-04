export type VendorProduct = {
  id: string; name: string; category: string; price: number; stock: number; status: string;
  rating: number; sold: number; unit: string; image: string;
};

export type VendorOrder = {
  id: string; orderNumber: string; customer: string; product: string; quantity: string;
  amount: number; address: string; date: string; payment: string; status: string;
};

export const vendorProfileFallback = {
  name: 'Amit Patel', email: 'amit@bhumiorganic.in', phone: '98765 43210',
  business_name: 'Bhumi Organic Store', gst_number: '23AAFCB1045P1ZV',
  address: 'Vijay Nagar, Indore, Madhya Pradesh', wallet_balance: 18450,
  vendor_id: 'BC-VN-1045', member_since: 'Jan 2026', business_type: 'Organic inputs & produce',
  profile_photo_url: null as string | null,
};

export const mockProducts: VendorProduct[] = [
  ['1', 'Organic Wheat', 'Grains', 45, 240, 'Active', 4.7, 125, 'kg'],
  ['2', 'Premium Basmati Rice', 'Grains', 68, 180, 'Active', 4.8, 93, 'kg'],
  ['3', 'Neem Cake Fertilizer', 'Fertilizers', 32, 85, 'Pending', 4.6, 48, 'kg'],
  ['4', 'Cold Pressed Mustard Oil', 'Oils', 195, 42, 'Active', 4.9, 76, 'litre'],
  ['5', 'Bio Compost', 'Fertilizers', 18, 0, 'Out of Stock', 4.5, 61, 'kg'],
  ['6', 'Desi Chana', 'Pulses', 72, 125, 'Active', 4.7, 88, 'kg'],
  ['7', 'Organic Turmeric', 'Spices', 160, 36, 'Pending', 4.6, 31, 'kg'],
  ['8', 'Cow Dung Manure', 'Fertilizers', 12, 320, 'Active', 4.4, 147, 'kg'],
].map(([id, name, category, price, stock, status, rating, sold, unit]) => ({
  id: String(id), name: String(name), category: String(category), price: Number(price), stock: Number(stock),
  status: String(status), rating: Number(rating), sold: Number(sold), unit: String(unit),
  image: `https://images.unsplash.com/photo-${Number(id) % 2 ? '1500595046743-cd271d694d30' : '1582515073490-39981397c445'}?auto=format&fit=crop&w=240&q=70`,
}));

export const mockOrders: VendorOrder[] = [
  ['10245', 'Rahul Sharma', 'Organic Rice', '20 kg', 1350, 'Vijay Nagar, Indore', 'Today, 10:30 AM', 'Paid', 'Packed'],
  ['10244', 'Priya Verma', 'Neem Cake Fertilizer', '10 kg', 320, 'Palasia, Indore', 'Today, 09:15 AM', 'Paid', 'Pending'],
  ['10243', 'Suresh Yadav', 'Organic Wheat', '25 kg', 1125, 'Rau, Indore', 'Yesterday', 'Paid', 'Processing'],
  ['10242', 'Neha Singh', 'Mustard Oil', '3 litre', 585, 'Bhawarkua, Indore', 'Yesterday', 'COD', 'Confirmed'],
  ['10241', 'Manoj Patel', 'Desi Chana', '15 kg', 1080, 'Mhow, Indore', '14 Jul 2026', 'Paid', 'Delivered'],
  ['10240', 'Anjali Gupta', 'Bio Compost', '40 kg', 720, 'Khandwa Road, Indore', '14 Jul 2026', 'Paid', 'Delivered'],
  ['10239', 'Vikas Jain', 'Organic Turmeric', '2 kg', 320, 'Scheme 54, Indore', '13 Jul 2026', 'Paid', 'Packed'],
  ['10238', 'Kiran Mehta', 'Cow Dung Manure', '50 kg', 600, 'Dewas Naka, Indore', '12 Jul 2026', 'COD', 'Pending'],
  ['10237', 'Rohit Dubey', 'Basmati Rice', '10 kg', 680, 'Sudama Nagar, Indore', '11 Jul 2026', 'Paid', 'Delivered'],
  ['10236', 'Pooja Shah', 'Organic Wheat', '10 kg', 450, 'Rajnagar, Indore', '10 Jul 2026', 'Paid', 'Delivered'],
].map(([id, customer, product, quantity, amount, address, date, payment, status]) => ({
  id: String(id), orderNumber: `#${id}`, customer: String(customer), product: String(product), quantity: String(quantity),
  amount: Number(amount), address: String(address), date: String(date), payment: String(payment), status: String(status),
}));

export const normalizeProducts = (response: any): VendorProduct[] => {
  const items = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(items) || !items.length) return mockProducts;
  return items.map((item: any) => ({
    id: String(item.id), name: item.name, category: item.category?.name || item.category || 'Farm supplies',
    price: Number(item.price || 0), stock: Number(item.stock_quantity ?? item.stock ?? 0),
    status: item.status || (item.is_active ? 'Active' : 'Inactive'), rating: Number(item.rating || 0),
    sold: Number(item.total_sold || 0), unit: item.unit || 'unit', image: item.primary_image || mockProducts[0].image,
  }));
};

export const normalizeOrders = (response: any): VendorOrder[] => {
  const items = Array.isArray(response) ? response : response?.items;
  if (!Array.isArray(items) || !items.length) return mockOrders;
  return items.map((item: any) => ({
    id: String(item.order_id || item.id), orderNumber: item.order_number || `#${String(item.order_id || item.id).slice(-5)}`,
    customer: item.customer_name || 'BhumiCred customer', product: item.vendor_items?.[0]?.product_name || `${item.vendor_total_items || item.items?.length || 1} item(s)`,
    quantity: `${item.vendor_items?.[0]?.quantity || item.vendor_total_items || 1} unit`, amount: Number(item.vendor_subtotal || item.total_amount || item.final_total || 0),
    address: item.delivery_address?.address_line1 || item.delivery_address?.address || 'Delivery address shared after confirmation',
    date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today',
    payment: item.payment_status || 'Paid', status: item.status || 'Pending',
  }));
};

export const formatMoney = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;
