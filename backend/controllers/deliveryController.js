import { query } from '../config/db.js';

export const checkPincode = async (req, res) => {
  try {
    const rawPin = req.params.pincode || req.query.pincode;
    if (!rawPin || typeof rawPin !== 'string') {
      return res.status(400).json({ error: 'Pincode parameter is required.', serviceable: false });
    }

    const cleanPin = rawPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({ error: 'Pincodes must be exactly 6 digits.', serviceable: false });
    }

    // 1. Try exact 6-digit match
    let result = await query('SELECT * FROM delivery_zones WHERE pincode = $1', [cleanPin]);

    // 2. Fallback: 3-digit prefix match (e.g. 560xxx matches 560001)
    if (result.rowCount === 0 && cleanPin.length >= 3) {
      const prefix = cleanPin.substring(0, 3);
      result = await query(
        'SELECT * FROM delivery_zones WHERE pincode LIKE $1 ORDER BY pincode ASC LIMIT 1',
        [`${prefix}%`]
      );
    }

    // 3. Handle unserviceable pincode
    if (result.rowCount === 0) {
      return res.json({
        pincode: cleanPin,
        city: null,
        state: null,
        region: 'Unavailable',
        serviceable: false,
        is_serviceable: false,
        charge: 0,
        deliveryCharge: 0,
        delivery_charge: 0,
        freeAbove: 499,
        free_above: 499,
        etaDays: null,
        minDays: null,
        maxDays: null,
        min_days: null,
        max_days: null,
        etaLabel: null,
        estimatedDelivery: null,
        estimated_delivery: null,
        message: 'Delivery is currently unavailable for this pincode.',
        error: 'We don’t deliver to this pincode yet.',
      });
    }

    const zone = result.rows[0];
    const minDays = zone.min_days != null ? parseInt(zone.min_days, 10) : 2;
    const maxDays = zone.max_days != null ? parseInt(zone.max_days, 10) : 4;
    const etaDays = minDays;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + etaDays);
    const estimatedDelivery = targetDate.toISOString().split('T')[0];
    const etaLabel = `${minDays}-${maxDays} business days`;

    const deliveryCharge = parseFloat(zone.delivery_charge || 0);
    const city = zone.city || '';
    const state = zone.state || '';
    const region = city && state ? `${city}, ${state}` : (city || 'Standard Delivery');

    res.json({
      pincode: cleanPin,
      city,
      state,
      region,
      serviceable: Boolean(zone.is_serviceable),
      is_serviceable: Boolean(zone.is_serviceable),
      charge: deliveryCharge,
      deliveryCharge,
      delivery_charge: deliveryCharge,
      freeAbove: 499,
      free_above: 499,
      etaDays,
      minDays,
      maxDays,
      min_days: minDays,
      max_days: maxDays,
      etaLabel,
      estimatedDelivery,
      estimated_delivery: `${minDays} - ${maxDays} business days`,
      estDays: `${minDays}-${maxDays} days`,
    });
  } catch (err) {
    console.error('Check pincode error:', err);
    res.status(500).json({ error: 'Failed to verify delivery pincode.' });
  }
};

