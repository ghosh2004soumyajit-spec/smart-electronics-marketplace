import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { formatPrice } from '../lib/format';
import { IconCheck, IconTruck, IconLock, IconArrowRight, IconShield, IconPin, IconPlus } from '../components/ui/Icons';
import EmptyState from '../components/ui/EmptyState';

export default function Checkout() {
  useDocumentTitle('Checkout — Order Datasheet');
  const navigate = useNavigate();
  const { cartItems, cartTotals, clearCart, toast } = useShop();
  const { user } = useAuth();
  const reduce = useReducedMotion();

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    paymentMethod: 'UPI',
  });

  // Saved addresses from the user's account
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState(null); // { serviceable, charge, city }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Load saved addresses on mount
  useEffect(() => {
    if (!user) return;
    api.getAddresses().then((addrs) => {
      if (!Array.isArray(addrs) || addrs.length === 0) {
        setShowManualForm(true);
        return;
      }
      setSavedAddresses(addrs);
      // Auto-select default address
      const def = addrs.find((a) => a.is_default) ?? addrs[0];
      selectSavedAddress(def, addrs);
    }).catch(() => setShowManualForm(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  /** Fill the form fields from a saved address object */
  const selectSavedAddress = useCallback((addr, list) => {
    if (!addr) return;
    setSelectedAddrId(addr.id);
    setShowManualForm(false);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.recipient_name || prev.fullName,
      phone: addr.phone || prev.phone,
      addressLine1: addr.address_line1 || '',
      addressLine2: addr.address_line2 || '',
      city: addr.city || prev.city,
      state: addr.state || prev.state,
      pincode: addr.pincode || prev.pincode,
    }));
    setPincodeStatus(null);
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  // Check pincode serviceability
  const handleCheckPincode = async () => {
    if (!formData.pincode || formData.pincode.length !== 6) {
      setPincodeStatus({ serviceable: false, error: 'Enter a valid 6-digit pincode.' });
      return;
    }
    setIsCheckingPincode(true);
    setPincodeStatus(null);
    try {
      const res = await api.checkPincode(formData.pincode);
      if (res.serviceable) {
        setPincodeStatus({
          serviceable: true,
          charge: parseFloat(res.delivery_charge || 0),
          city: res.city,
          state: res.state,
          estDays: res.estimated_days || '2-4 business days',
        });
        setFormData((p) => ({
          ...p,
          city: res.city || p.city,
          state: res.state || p.state,
        }));
      } else {
        setPincodeStatus({ serviceable: false, error: res.message || 'Pincode not serviceable.' });
      }
    } catch {
      setPincodeStatus({ serviceable: false, error: 'Failed to verify pincode.' });
    } finally {
      setIsCheckingPincode(false);
    }
  };

  // Apply Coupon — validate against backend offers
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    const code = couponCode.trim().toUpperCase();
    try {
      const offers = await api.listOffers();
      const match = (offers || []).find(
        (o) => o.code?.toUpperCase() === code && o.is_active !== false
      );
      if (!match) {
        setCouponError('Invalid or expired coupon code.');
        return;
      }
      const percent = parseFloat(match.discount_percent || 0);
      const maxDisc = match.max_discount ? parseFloat(match.max_discount) : null;
      const minOrder = parseFloat(match.min_order_amount || 0);
      if (cartTotals.subtotal < minOrder) {
        setCouponError(`Minimum order of ${formatPrice(minOrder)} required for this coupon.`);
        return;
      }
      setAppliedCoupon({ code: match.code, percent, maxDiscount: maxDisc });
      toast(`Coupon ${match.code} applied! ${percent}% discount added.`, 'success');
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    }
  };

  // Delivery charge
  const deliveryCharge = pincodeStatus?.serviceable ? pincodeStatus.charge : 0;

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.percent) {
      const raw = (cartTotals.subtotal * appliedCoupon.percent) / 100;
      couponDiscount = appliedCoupon.maxDiscount ? Math.min(raw, appliedCoupon.maxDiscount) : raw;
    } else if (appliedCoupon.flat) {
      couponDiscount = Math.min(cartTotals.subtotal, appliedCoupon.flat);
    }
  }

  const finalTotal = Math.max(0, cartTotals.subtotal - couponDiscount + deliveryCharge);

  // Submit Order to backend API
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.fullName.trim()) return setFormError('Full name is required.');
    if (!formData.phone.trim() || formData.phone.length < 10) return setFormError('Valid 10-digit phone number is required.');
    if (!formData.addressLine1.trim()) return setFormError('Address line 1 is required.');
    if (!formData.pincode || formData.pincode.length !== 6) return setFormError('Valid 6-digit pincode is required.');

    setIsSubmitting(true);
    try {
      const orderPayload = {
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
        },
        pincode: formData.pincode,
        offerCode: appliedCoupon?.code || null,
        paymentMethod: formData.paymentMethod,
      };

      const res = await api.createOrder(orderPayload);
      toast('Order placed successfully!', 'success');
      navigate(`/order/success/${res.order.id || res.order.order_number}`);
    } catch (err) {
      const msg = err?.response?.data?.error || 'Failed to place order. Please try again.';
      setFormError(msg);
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          code="CHECKOUT / NO_ITEMS"
          title="Your cart is empty."
          message="You don't have any products in your cart to checkout. Explore our catalog to find smart electronics."
          action={{ label: 'Return to Shop', to: '/shop' }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 lg:px-8">
      {/* Header */}
      <header className="border-b border-ink pb-6">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-widest text-ink3">
          <Link to="/cart" className="transition-colors hover:text-ink">Cart</Link>
          <span>/</span>
          <span className="font-bold text-volt">Checkout</span>
        </div>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-bold uppercase leading-none tracking-tight">
          Dispatch Datasheet.
        </h1>
        <p className="label mt-2">Verify shipping destination and payment protocol before dispatch authorization</p>
      </header>

      {formError && (
        <div role="alert" className="mt-6 border border-volt bg-volt/10 p-4 font-mono text-[12.5px] font-bold text-volt">
          ⚠️ {formError}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-14">
        {/* Left Column: Form */}
        <form onSubmit={handleSubmitOrder} className="space-y-8">
          {/* Section 1: Shipping Destination */}
          <section className="border border-line bg-card p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">01. Shipping Destination</h2>
              <span className="label font-mono">STEP 1/2</span>
            </div>
          {/* ── Saved address quick-select ─────────────────────────── */}
            {savedAddresses.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="label font-bold uppercase tracking-widest">Select a saved address</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {savedAddresses.map((addr) => {
                    const active = selectedAddrId === addr.id;
                    return (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => selectSavedAddress(addr)}
                        className={`relative w-full border p-3.5 text-left transition-all duration-200 ${
                          active
                            ? 'border-volt bg-volt/8 shadow-[0_0_0_1px] shadow-volt'
                            : 'border-line bg-paper hover:border-ink'
                        }`}
                      >
                        {/* Default badge */}
                        {addr.is_default && (
                          <span className="absolute right-2 top-2 bg-volt px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-paper">
                            DEFAULT
                          </span>
                        )}
                        {/* Selection indicator */}
                        <span className={`absolute left-3 top-3.5 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-colors ${active ? 'border-volt bg-volt' : 'border-line'}`}>
                          {active && <span className="block h-1.5 w-1.5 rounded-full bg-paper" />}
                        </span>
                        <div className="pl-7">
                          <p className="font-mono text-[12px] font-bold text-ink">{addr.recipient_name}</p>
                          <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-ink2">
                            {addr.address_line1}
                            {addr.address_line2 ? `, ${addr.address_line2}` : ''}
                          </p>
                          <p className="font-mono text-[11px] text-ink2">
                            {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          <p className="mt-0.5 font-mono text-[10.5px] text-ink3">{addr.phone}</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Add new address shortcut */}
                  <Link
                    to="/profile"
                    className="flex items-center justify-center gap-2 border border-dashed border-line bg-paper p-3.5 font-mono text-[11px] uppercase tracking-wider text-ink3 transition-colors hover:border-ink hover:text-ink sm:col-span-2"
                  >
                    <IconPlus size={13} /> Add new address in profile
                  </Link>
                </div>

                {/* Divider with manual option */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="h-px flex-1 bg-line" />
                  <button
                    type="button"
                    onClick={() => { setShowManualForm((s) => !s); setSelectedAddrId(null); }}
                    className="font-mono text-[10.5px] uppercase tracking-widest text-ink3 transition-colors hover:text-ink"
                  >
                    {showManualForm ? '↑ Hide manual entry' : '+ Enter address manually'}
                  </button>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </div>
            )}

            {/* ── Manual entry form ────────────────────────────────── */}
            {(showManualForm || savedAddresses.length === 0) && (
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    required
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Address Line 1 *</label>
                  <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleChange}
                    placeholder="Flat/House No., Building Name, Street"
                    required
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2}
                    onChange={handleChange}
                    placeholder="Landmark, Area"
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">Pincode *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      required
                      className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt tnum"
                    />
                    <button
                      type="button"
                      onClick={handleCheckPincode}
                      disabled={isCheckingPincode}
                      className="shrink-0 border border-ink bg-ink px-4 font-mono text-[11px] uppercase tracking-wider text-paper hover:bg-volt hover:text-paper disabled:opacity-50"
                    >
                      {isCheckingPincode ? 'Checking...' : 'Check'}
                    </button>
                  </div>
                  {pincodeStatus && (
                    <p className={`mt-1.5 font-mono text-[11px] ${pincodeStatus.serviceable ? 'text-volt font-bold' : 'text-red-500'}`}>
                      {pincodeStatus.serviceable
                        ? `✓ Serviceable in ${pincodeStatus.city || ''} (${pincodeStatus.estDays}) — Delivery: ${formatPrice(pincodeStatus.charge)}`
                        : `✕ ${pincodeStatus.error}`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="label mb-1 block">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>

                <div>
                  <label className="label mb-1 block">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
                  />
                </div>
              </div>
            )}

            {/* Selected address summary (when not in manual mode) */}
            {!showManualForm && selectedAddrId && savedAddresses.length > 0 && (
              <div className="mt-4 flex items-center gap-3 border border-volt/40 bg-volt/5 p-3.5 font-mono text-[11.5px]">
                <IconCheck size={15} className="shrink-0 text-volt" />
                <span className="text-ink">
                  Delivering to <strong>{formData.fullName}</strong> — {formData.addressLine1}, {formData.city} {formData.pincode}
                </span>
              </div>
            )}
          </section>


          {/* Section 2: Payment Protocol */}
          <section className="border border-line bg-card p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">02. Payment Protocol</h2>
              <span className="label font-mono">STEP 2/2</span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { id: 'UPI', label: 'UPI / QR Code Instant Payment', desc: 'Google Pay, PhonePe, Paytm or any UPI App' },
                { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay & American Express' },
                { id: 'NETBANKING', label: 'Net Banking', desc: 'All major Indian banks supported' },
                { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon physical delivery' },
              ].map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                    formData.paymentMethod === m.id ? 'border-volt bg-volt/5' : 'border-line bg-paper hover:border-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={formData.paymentMethod === m.id}
                    onChange={handleChange}
                    className="mt-1 accent-volt"
                  />
                  <div>
                    <p className="font-display text-sm font-bold">{m.label}</p>
                    <p className="font-mono text-[11px] text-ink3 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-14 w-full items-center justify-center gap-2 bg-volt font-mono text-xs uppercase tracking-[0.15em] font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Authorizing Dispatch...'
            ) : (
              <>
                <IconLock size={16} /> Authorize Payment &amp; Place Order ({formatPrice(finalTotal)})
              </>
            )}
          </button>
        </form>

        {/* Right Column: Order Summary */}
        <div className="space-y-6">
          <div className="border border-ink bg-card p-6">
            <h2 className="border-b border-line pb-4 font-display text-base font-bold uppercase">
              Datasheet Summary ({cartItems.length} items)
            </h2>

            {/* Itemized Mini List */}
            <ul className="divide-y divide-line py-2 max-h-72 overflow-y-auto">
              {cartItems.map((i) => {
                const title = i.product?.title || i.product?.name || 'Item';
                const price = i.product?.price?.sale ?? i.product?.discount_price ?? 0;
                const qty = i.quantity ?? i.qty ?? 1;
                return (
                  <li key={i.product_id || i.id} className="flex items-center justify-between py-2.5 font-mono text-[12px]">
                    <div className="pr-3">
                      <p className="font-bold text-ink line-clamp-1">{title}</p>
                      <p className="text-ink3">{qty} × {formatPrice(price)}</p>
                    </div>
                    <span className="font-bold tnum text-ink">{formatPrice(price * qty)}</span>
                  </li>
                );
              })}
            </ul>

            {/* Coupon Code Input */}
            <div className="mt-4 border-t border-line pt-4">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Offer Code (e.g. VOLT10)"
                  className="w-full border border-line bg-paper px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink outline-none focus:border-volt"
                />
                <button
                  type="submit"
                  className="shrink-0 border border-ink bg-ink px-3 font-mono text-[10px] uppercase tracking-wider text-paper hover:bg-volt"
                >
                  Apply
                </button>
              </form>
              {couponError && <p className="mt-1 font-mono text-[10px] text-red-500">{couponError}</p>}
              {appliedCoupon && (
                <p className="mt-1.5 font-mono text-[11px] font-bold text-volt">
                  ✓ {appliedCoupon.code} Applied ({formatPrice(couponDiscount)} discount)
                </p>
              )}
            </div>

            {/* Math Breakdown */}
            <dl className="mt-4 space-y-2 border-t border-ink pt-4 font-mono text-[12px]">
              <div className="flex justify-between">
                <dt className="text-ink3">Subtotal</dt>
                <dd className="font-bold tnum">{formatPrice(cartTotals.subtotal)}</dd>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-volt">
                  <dt className="font-bold">Coupon Discount</dt>
                  <dd className="font-bold tnum">−{formatPrice(couponDiscount)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt className="text-ink3">Delivery Fee</dt>
                <dd className="font-bold tnum">{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</dd>
              </div>

              <div className="flex justify-between border-t border-ink pt-3 font-display text-lg font-bold text-ink">
                <dt>Final Payable</dt>
                <dd className="tnum text-volt">{formatPrice(finalTotal)}</dd>
              </div>
            </dl>
          </div>

          {/* Guarantee Badges */}
          <div className="space-y-3 border border-line bg-paper2/50 p-4 font-mono text-[11px] text-ink2">
            <div className="flex items-center gap-2">
              <IconShield size={16} className="text-volt shrink-0" />
              <span>100% Genuine Certified Electronics</span>
            </div>
            <div className="flex items-center gap-2">
              <IconTruck size={16} className="text-volt shrink-0" />
              <span>Insured Transit &amp; Standard Installation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
