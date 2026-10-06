import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useShop } from '../context/ShopContext';
import { formatPrice } from '../lib/format';
import { IconCheck, IconTruck, IconClose, IconArrowRight, IconShield } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import { LineSkeleton } from '../components/ui/Skeletons';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useShop();
  useDocumentTitle(`Order Datasheet #${id}`);
  const reduce = useReducedMotion();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getOrderById(id);
        setOrder(data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Order detail not available.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      await api.cancelOrder(order.id);
      toast('Order cancelled successfully.', 'info');
      const updated = await api.getOrderById(id);
      setOrder(updated);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to cancel order.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1000px] px-4 py-12 lg:px-8 space-y-4">
        <LineSkeleton className="h-8 w-64 mb-6" />
        <LineSkeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          code="ORDER / INVALID"
          title="Unable to load order."
          message={error || 'This order does not exist or you do not have permission to access it.'}
          action={{ label: 'Back to My Orders', to: '/orders' }}
        />
      </div>
    );
  }

  const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
  const isCancellable = ['PENDING', 'PROCESSING'].includes(order.order_status);

  // Status timeline steps
  const steps = [
    { key: 'PENDING', label: 'Placed' },
    { key: 'PROCESSING', label: 'Processing' },
    { key: 'SHIPPED', label: 'Shipped' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getStepIndex = (st) => {
    if (st === 'CANCELLED') return -1;
    const idx = steps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };
  const currentStepIdx = getStepIndex(order.order_status);

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-8 lg:px-8">
      {/* Navigation Breadcrumb */}
      <nav aria-label="Breadcrumb" className="label pt-2">
        <Link to="/orders" className="transition-colors hover:text-ink">My Orders</Link>
        <span className="px-2 text-line2" aria-hidden="true">/</span>
        <span className="text-ink">#{order.order_number}</span>
      </nav>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-ink pb-6">
        <div>
          <p className="label-volt font-bold">DISPATCH DATASHEET</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight">
            Order #{order.order_number}
          </h1>
          <p className="font-mono text-xs text-ink3 mt-1">
            Created on {new Date(order.created_at).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`border font-mono text-xs font-bold uppercase tracking-widest px-3 py-1.5 ${
            order.order_status === 'DELIVERED' ? 'border-volt text-volt bg-volt/10' :
            order.order_status === 'CANCELLED' ? 'border-red-500 text-red-500 bg-red-500/10' :
            'border-yellow-500 text-yellow-500 bg-yellow-500/10'
          }`}>
            STATUS: {order.order_status}
          </span>

          {isCancellable && (
            <button
              type="button"
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="inline-flex h-9 items-center gap-1 border border-red-500 px-3 font-mono text-[11px] uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500 hover:text-paper disabled:opacity-50"
            >
              <IconClose size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {/* Order Progress Stepper (If not cancelled) */}
      {order.order_status !== 'CANCELLED' && (
        <div className="mt-8 border border-line bg-card p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-tight mb-6">Live Fulfillment Stepper</h2>
          <div className="relative flex items-center justify-between">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-line -translate-y-1/2 z-0" />
            <div
              className="absolute left-0 top-1/2 h-0.5 bg-volt -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
              const isDone = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`grid h-8 w-8 place-items-center rounded-full font-mono text-xs font-bold border transition-colors ${
                      isDone
                        ? 'border-volt bg-volt text-paper'
                        : 'border-line bg-paper text-ink3'
                    } ${isCurrent ? 'ring-4 ring-volt/20' : ''}`}
                  >
                    {isDone ? <IconCheck size={14} /> : idx + 1}
                  </div>
                  <span className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${isDone ? 'font-bold text-ink' : 'text-ink3'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Itemized Manifest */}
        <div className="border border-ink bg-card p-6">
          <h2 className="border-b border-line pb-3 font-display text-sm font-bold uppercase text-ink">
            Purchased Products ({order.items?.length || 0})
          </h2>

          <ul className="divide-y divide-line py-2">
            {order.items?.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3.5 font-mono text-xs">
                <div className="pr-4">
                  <Link to={`/p/${item.slug}`} className="font-bold text-ink hover:text-volt line-clamp-2">
                    {item.title}
                  </Link>
                  <p className="text-ink3 mt-0.5">{item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span className="font-bold tnum text-ink shrink-0">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-ink pt-4 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-ink3">Items Subtotal</dt>
              <dd className="font-bold tnum">{formatPrice(order.total_amount)}</dd>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-volt">
                <dt className="font-bold">Discount ({order.offer_code})</dt>
                <dd className="font-bold tnum">−{formatPrice(order.discount_amount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink3">Delivery Fee</dt>
              <dd className="font-bold tnum">
                {parseFloat(order.delivery_charge) === 0 ? 'FREE' : formatPrice(order.delivery_charge)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-ink pt-3 font-display text-base font-bold text-ink">
              <dt>Total Amount</dt>
              <dd className="tnum text-volt">{formatPrice(order.final_amount)}</dd>
            </div>
          </dl>
        </div>

        {/* Shipping & Payment Destination */}
        <div className="space-y-6">
          <div className="border border-line bg-card p-6">
            <h2 className="border-b border-line pb-3 font-display text-sm font-bold uppercase text-ink">
              Delivery Address
            </h2>
            <div className="mt-4 font-mono text-xs leading-relaxed text-ink2 space-y-1">
              <p className="font-bold text-ink text-sm">{shipping?.fullName}</p>
              <p>{shipping?.addressLine1}</p>
              {shipping?.addressLine2 && <p>{shipping?.addressLine2}</p>}
              <p>{shipping?.city}, {shipping?.state} - {order.pincode}</p>
              <p className="pt-2 text-ink3">Phone: {shipping?.phone}</p>
            </div>
          </div>

          <div className="border border-line bg-card p-6">
            <h2 className="border-b border-line pb-3 font-display text-sm font-bold uppercase text-ink">
              Payment &amp; Logistics
            </h2>
            <div className="mt-4 space-y-2 font-mono text-xs text-ink2">
              <div className="flex justify-between">
                <span className="text-ink3">Payment Status:</span>
                <span className="font-bold text-ink">{order.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink3">Delivery Zone Pincode:</span>
                <span className="font-bold text-ink">{order.pincode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
