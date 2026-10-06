import { query } from '../config/db.js';

// Get User Profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT id, email, full_name, phone, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, phone } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const result = await query(
      `UPDATE users 
       SET full_name = $1, phone = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING id, email, full_name, phone, role`,
      [full_name.trim(), phone?.trim() || null, userId]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

// Get User Saved Addresses
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ error: 'Failed to fetch addresses.' });
  }
};

// Add New Address
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipient_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;

    if (!recipient_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Recipient name, phone, address, city, state, and pincode are required.' });
    }

    // If making default, reset existing defaults
    if (is_default) {
      await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    // Check if this is the first address; if so, auto-mark as default
    // PGlite returns COUNT as a string, so parse it
    const countRes = await query('SELECT COUNT(*) as cnt FROM addresses WHERE user_id = $1', [userId]);
    const existingCount = parseInt(countRes.rows[0]?.cnt ?? countRes.rows[0]?.count ?? '0', 10);
    const shouldBeDefault = Boolean(is_default) || existingCount === 0;

    const result = await query(
      `INSERT INTO addresses 
        (user_id, recipient_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, recipient_name.trim(), phone.trim(), address_line1.trim(), address_line2?.trim() || null, city.trim(), state.trim(), pincode.trim(), shouldBeDefault]
    );

    res.status(201).json({
      message: 'Address added successfully.',
      address: result.rows[0],
    });
  } catch (err) {
    console.error('Add address error:', err.message || err);
    res.status(500).json({ error: 'Failed to save address.', detail: err.message });
  }
};

// Update Address
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { recipient_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;

    if (!recipient_name || !phone || !address_line1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Recipient name, phone, address, city, state, and pincode are required.' });
    }

    if (is_default) {
      await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }

    const result = await query(
      `UPDATE addresses 
       SET recipient_name = $1, phone = $2, address_line1 = $3, address_line2 = $4, city = $5, state = $6, pincode = $7, is_default = $8
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [recipient_name.trim(), phone.trim(), address_line1.trim(), address_line2?.trim() || null, city.trim(), state.trim(), pincode.trim(), Boolean(is_default), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found or unauthorized.' });
    }

    res.json({
      message: 'Address updated successfully.',
      address: result.rows[0],
    });
  } catch (err) {
    console.error('Update address error:', err.message || err);
    res.status(500).json({ error: 'Failed to update address.', detail: err.message });
  }
};



// Delete Address
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    res.json({ message: 'Address deleted successfully.' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ error: 'Failed to delete address.' });
  }
};

// Set Address as Default
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await query('UPDATE addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    const result = await query('UPDATE addresses SET is_default = TRUE WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    res.json({ message: 'Default address updated.', address: result.rows[0] });
  } catch (err) {
    console.error('Set default address error:', err);
    res.status(500).json({ error: 'Failed to update default address.' });
  }
};
