import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../lib/format';
import { IconCheck, IconTruck, IconArrowRight, IconBag } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';
import { LineSkeleton } from '../components/ui/Skeletons';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  useDocumentTitle('Order Dispatched — Confirmation');
  const reduce = useReducedMotion();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api.getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(err?.response?.data?.error || 'Order not found.');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <LineSkeleton className="h-8 w-64 mb-4" />
        <LineSkeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          code="ORDER / NOT_FOUND"
          title="Order records unavailable."
          message={error || "We couldn't retrieve this order details."}
          action={{ label: 'View All Orders', to: '/orders' }}
        />
      </div>
    );
  }

  const shipping = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;

  return (
    <div className="mx-auto max-w-[1000px] px-4 pb-20 pt-8 lg:px-8">
      {/* Confirmation Banner */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-volt bg-volt/10 p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-volt/20 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-volt text-paper shrink-0">
              <IconCheck size={24} />
            </div>
            <div>
              <p className="label-volt font-bold">DISPATCH AUTHORIZED</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight">
                Order #{order.order_number}
              </h1>
            </div>
          </div>
          <span className="self-start sm:self-center font-mono text-xs font-bold uppercase tracking-widest px-3 py-1 bg-volt text-paper">
            {order.order_status}
          </span>
        </div>

        <p className="mt-4 font-mono text-sm leading-relaxed text-ink2">
          Thank you for your order, <strong className="text-ink">{shipping?.fullName || 'Customer'}</strong>! Your payment was verified, and our fulfillment warehouse has received the pick &amp; pack instruction.
        </p>
      </motion.div>

      {/* Details Grid */}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        {/* Left: Shipping & Payment Summary */}
        <div className="space-y-6">
          <div className="border border-line bg-card p-6">
            <h2 className="border-b border-line pb-3 font-display text-sm font-bold uppercase text-ink">
              Shipping Destination
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
              Delivery Protocol
            </h2>
            <div className="mt-4 flex items-start gap-3 font-mono text-xs text-ink2">
              <IconTruck size={20} className="text-volt shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-ink">Standard Insured Courier</p>
                <p className="text-ink3 mt-1">Expected delivery in 2–4 business days with live GPS tracking.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Items & Payment Breakdown */}
        <div className="border border-ink bg-card p-6">
          <h2 className="border-b border-line pb-3 font-display text-sm font-bold uppercase text-ink">
            Itemized Manifest
          </h2>

          <ul className="divide-y divide-line py-2 max-h-64 overflow-y-auto">
            {order.items?.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-3 font-mono text-xs">
                <div>
                  <Link to={`/p/${item.slug}`} className="font-bold text-ink hover:text-volt line-clamp-1">
                    {item.title}
                  </Link>
                  <p className="text-ink3">{item.quantity} × {formatPrice(item.price)}</p>
                </div>
                <span className="font-bold tnum text-ink">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-ink pt-4 font-mono text-xs">
            <div className="flex justify-between">
              <dt className="text-ink3">Subtotal</dt>
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
              <dt>Total Paid</dt>
              <dd className="tnum text-volt">{formatPrice(order.final_amount)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <Link
          to="/orders"
          className="inline-flex h-12 items-center justify-center gap-2 border border-ink bg-ink px-6 font-mono text-xs uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt"
        >
          <IconBag size={16} /> View All My Orders
        </Link>
        <Link
          to="/shop"
          className="inline-flex h-12 items-center justify-center gap-2 border border-line bg-card px-6 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-ink"
        >
          Continue Shopping <IconArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
