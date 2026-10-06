import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../lib/format';
import { IconBag, IconArrowRight, IconClose } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import { LineSkeleton } from '../components/ui/Skeletons';

export default function MyOrders() {
  useDocumentTitle('My Orders — Purchase Records');
  const reduce = useReducedMotion();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getUserOrders();
        setOrders(data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to fetch order history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'border-volt text-volt bg-volt/10';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'border-blue-500 text-blue-500 bg-blue-500/10';
      case 'CANCELLED':
        return 'border-red-500 text-red-500 bg-red-500/10';
      default:
        return 'border-yellow-500 text-yellow-500 bg-yellow-500/10';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-12 lg:px-8 space-y-4">
        <LineSkeleton className="h-8 w-64 mb-6" />
        <LineSkeleton className="h-28 w-full" />
        <LineSkeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 lg:px-8">
      <header className="border-b border-ink pb-6">
        <p className="label-volt font-bold">ACCOUNT / ORDER HISTORY</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
          Purchase Manifest.
        </h1>
        <p className="label mt-3">All dispatches and order records linked to your authenticated account</p>
      </header>

      {orders.length === 0 ? (
        <div className="mt-10 max-w-3xl">
          <EmptyState
            code="ORDERS / NONE"
            icon={<IconBag size={26} />}
            title="No orders placed yet."
            message="You haven't authorized any order dispatches. When you complete checkout, your order history will appear here with live tracking status."
            action={{ label: 'Explore Electronics Catalog', to: '/shop' }}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

            return (
              <motion.div
                key={order.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group border border-line bg-card transition-colors hover:border-ink"
              >
                {/* Order Row Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4 sm:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ink">#{order.order_number}</span>
                      <span className={`border font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${getStatusColor(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-ink3 mt-1">
                      Placed on {formattedDate} · {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="label">Total Amount</p>
                      <p className="font-display text-lg font-bold tnum text-ink">{formatPrice(order.final_amount)}</p>
                    </div>

                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex h-10 items-center justify-center gap-1 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt"
                    >
                      Details <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Shipping summary strip */}
                <div className="flex items-center justify-between px-4 py-3 font-mono text-[11px] text-ink3 bg-paper2/40 sm:px-6">
                  <span>Ship To: <strong className="text-ink">{shipping?.fullName}</strong> ({order.pincode})</span>
                  <span>Payment: <strong className="text-ink">{order.payment_status}</strong></span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
