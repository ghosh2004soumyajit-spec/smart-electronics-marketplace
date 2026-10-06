import { useState } from 'react';
import api from '../../services/api';
import { formatPrice } from '../../lib/format';
import { IconPin, IconTruck, IconCheck } from '../ui/Icons';

/**
 * PincodeCheck — GET /api/delivery/check?pincode=…
 * Honest three-line answer: serviceable or not, the exact charge, and the
 * estimated delivery date. Errors are helpful, never blaming.
 */
export default function PincodeCheck({ compact = false }) {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const check = async (e) => {
    e?.preventDefault();
    const value = pin.trim();
    if (!/^\d{6}$/.test(value)) {
      setError('Pincodes are exactly 6 digits — e.g. 560001.');
      setResult(null);
      return;
    }
    setError('');
    setLoading(true);
    const res = await api.checkPincode(value);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className={compact ? '' : 'border border-line bg-paper2/50 p-4'}>
      <p className="label mb-2.5">
        <IconPin size={13} className="mr-1.5 inline text-volt align-[-2px]" />
        Delivery to your pincode
      </p>

      <form onSubmit={check} className="flex gap-2">
        <label htmlFor="pincode" className="sr-only">
          Enter delivery pincode
        </label>
        <input
          id="pincode"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="6-digit pincode"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          aria-invalid={!!error}
          aria-describedby={error ? 'pincode-error' : undefined}
          className="w-full max-w-[190px] border border-line2 bg-paper px-3 py-2 font-mono text-[13px] tracking-[0.1em] tnum placeholder:tracking-normal placeholder:text-ink3/60 focus:border-ink focus:outline-none"
        />
        <button type="submit" disabled={loading} className="btn-ghost !px-4 !py-2 disabled:opacity-50">
          {loading ? 'Checking…' : 'Check'}
        </button>
      </form>

      {error && (
        <p id="pincode-error" role="alert" className="mt-2 font-mono text-[11px] text-volt">
          {error}
        </p>
      )}

      {result && !result.serviceable && !error && (
        <p role="status" className="mt-3 font-mono text-[11.5px] leading-relaxed text-ink2">
          {result.error || result.message || 'We don’t deliver to this pincode yet.'}
        </p>
      )}

      {result?.serviceable && (() => {
        const charge = result.charge ?? result.deliveryCharge ?? 0;
        const freeAbove = result.freeAbove ?? 499;
        const region = result.region || (result.city ? `${result.city}${result.state ? ', ' + result.state : ''}` : 'Standard Delivery');
        const etaDays = result.etaDays ?? result.minDays ?? 3;
        const etaLabel = result.etaLabel || result.estimatedDelivery || `${etaDays} days`;

        return (
          <dl role="status" className="mt-3 space-y-1.5 border-t border-line pt-3 font-mono text-[11.5px]">
            <div className="flex items-baseline">
              <dt className="uppercase tracking-wide text-ink3">Serviceable</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-bold text-ink">
                <IconCheck size={12} className="mr-1 inline text-volt align-[-1px]" />
                Yes — {region}
              </dd>
            </div>
            <div className="flex items-baseline">
              <dt className="uppercase tracking-wide text-ink3">Delivery charge</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-bold tnum text-ink">
                {charge === 0 ? `Free (orders over ${formatPrice(freeAbove)})` : formatPrice(charge)}
              </dd>
            </div>
            <div className="flex items-baseline">
              <dt className="uppercase tracking-wide text-ink3">Arrives in</dt>
              <span className="leader" aria-hidden="true" />
              <dd className="font-bold text-ink tnum">
                {etaDays} days · by {etaLabel}
              </dd>
            </div>
          </dl>
        );
      })()}

      {!result && !error && (
        <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wide text-ink3">
          <IconTruck size={13} /> 19,240 pincodes · 2–5 days
        </p>
      )}
    </div>
  );
}
