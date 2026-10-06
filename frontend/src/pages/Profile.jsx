import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import api from '../services/api';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { IconCheck, IconTrash, IconEdit, IconPlus, IconPin, IconShield } from '../components/ui/Icons';
import { LineSkeleton } from '../components/ui/Skeletons';

export default function Profile() {
  useDocumentTitle('Account Profile & Saved Addresses');
  const { user, setUser } = useAuth();
  const { toast } = useShop();
  const reduce = useReducedMotion();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);

  // New Address Form State
  const [newAddr, setNewAddr] = useState({
    recipient_name: user?.full_name || '',
    phone: user?.phone || '',
    address_line1: '',
    address_line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    is_default: false,
  });
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Load Profile & Addresses
  useEffect(() => {
    (async () => {
      try {
        setLoadingAddresses(true);
        const [prof, addrs] = await Promise.all([
          api.getProfile().catch(() => null),
          api.getAddresses().catch(() => []),
        ]);
        if (prof) {
          setProfileData({
            full_name: prof.full_name || '',
            phone: prof.phone || '',
            email: prof.email || '',
          });
        }
        setAddresses(addrs);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, []);

  // Update Profile Submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await api.updateProfile({
        full_name: profileData.full_name,
        phone: profileData.phone,
      });
      toast('Profile details updated successfully.', 'success');
      if (res.user && setUser) setUser(res.user);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Add/Edit Address Submit
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setIsAddingAddress(true);
      
      if (editingAddressId) {
        await api.updateAddress(editingAddressId, newAddr);
        toast('Shipping address updated.', 'success');
      } else {
        await api.addAddress(newAddr);
        toast('New shipping address saved.', 'success');
      }
      
      setShowAddressForm(false);
      setEditingAddressId(null);
      setNewAddr({
        recipient_name: user?.full_name || '',
        phone: user?.phone || '',
        address_line1: '',
        address_line2: '',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        is_default: false,
      });
      // Refresh list
      const updatedList = await api.getAddresses();
      setAddresses(updatedList);
    } catch (err) {
      toast(err?.response?.data?.error || 'Failed to save address.', 'error');
    } finally {
      setIsAddingAddress(false);
    }
  };

  const handleEditAddress = (addr) => {
    setNewAddr({
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: addr.is_default,
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  // Set Default Address
  const handleSetDefault = async (id) => {
    try {
      await api.setDefaultAddress(id);
      toast('Default delivery address updated.', 'info');
      const updatedList = await api.getAddresses();
      setAddresses(updatedList);
    } catch (err) {
      toast('Failed to set default address.', 'error');
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await api.deleteAddress(id);
      toast('Address removed.', 'info');
      setAddresses((cur) => cur.filter((a) => a.id !== id));
    } catch (err) {
      toast('Failed to delete address.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-20 pt-8 lg:px-8">
      {/* Header */}
      <header className="border-b border-ink pb-6">
        <p className="label-volt font-bold">ACCOUNT / PROFILE &amp; ADDRESSES</p>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.4rem)] font-bold uppercase leading-none tracking-tight">
          User Settings.
        </h1>
        <p className="label mt-3">Manage account profile, contact credentials, and default shipping destinations</p>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
        {/* Left Column: Personal Profile Form */}
        <section className="border border-line bg-card p-6 self-start">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">Personal Credentials</h2>
            <span className="border font-mono text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 border-volt text-volt bg-volt/10">
              {user?.role || 'CUSTOMER'}
            </span>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
            <div>
              <label className="label mb-1 block">Email Address (Read-Only)</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full border border-line bg-paper2 px-3.5 py-2.5 font-mono text-sm text-ink3 outline-none cursor-not-allowed"
              />
            </div>

            <div>
              <label className="label mb-1 block">Full Name *</label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={(e) => setProfileData((p) => ({ ...p, full_name: e.target.value }))}
                required
                className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
              />
            </div>

            <div>
              <label className="label mb-1 block">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="10-digit mobile number"
                className="w-full border border-line bg-paper px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-volt"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 border border-ink bg-ink font-mono text-xs font-bold uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt disabled:opacity-50"
            >
              {isUpdatingProfile ? 'Updating Credentials...' : 'Save Profile Changes'}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5 border-t border-line pt-4 font-mono text-[11px] text-ink3">
            <IconShield size={16} className="text-volt shrink-0 mt-0.5" />
            <span>Account authentication protected via JWT tokens and bcrypt password hashing.</span>
          </div>
        </section>

        {/* Right Column: Address Book */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-ink pb-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Saved Delivery Destinations ({addresses.length})
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddressForm((s) => !s);
                if (showAddressForm) {
                  setEditingAddressId(null);
                  setNewAddr({
                    recipient_name: user?.full_name || '',
                    phone: user?.phone || '',
                    address_line1: '',
                    address_line2: '',
                    city: 'Bengaluru',
                    state: 'Karnataka',
                    pincode: '560001',
                    is_default: false,
                  });
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 border border-ink bg-ink px-3 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-volt hover:border-volt"
            >
              <IconPlus size={14} /> {showAddressForm && !editingAddressId ? 'Cancel' : 'Add New Address'}
            </button>
          </div>

          {/* New Address Collapsible Form */}
          {showAddressForm && (
            <motion.form
              initial={reduce ? false : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              onSubmit={handleSaveAddress}
              className="border border-volt bg-volt/5 p-5 space-y-4"
            >
              <h3 className="font-display text-sm font-bold uppercase text-ink">
                {editingAddressId ? 'Edit Address' : 'New Address Registration'}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="label mb-1 block">Recipient Name *</label>
                  <input
                    type="text"
                    value={newAddr.recipient_name}
                    onChange={(e) => setNewAddr((p) => ({ ...p, recipient_name: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Phone Number *</label>
                  <input
                    type="tel"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr((p) => ({ ...p, phone: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Address Line 1 *</label>
                  <input
                    type="text"
                    value={newAddr.address_line1}
                    onChange={(e) => setNewAddr((p) => ({ ...p, address_line1: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label mb-1 block">Address Line 2</label>
                  <input
                    type="text"
                    value={newAddr.address_line2}
                    onChange={(e) => setNewAddr((p) => ({ ...p, address_line2: e.target.value }))}
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">City *</label>
                  <input
                    type="text"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">State *</label>
                  <input
                    type="text"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr((p) => ({ ...p, state: e.target.value }))}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Pincode *</label>
                  <input
                    type="text"
                    value={newAddr.pincode}
                    onChange={(e) => setNewAddr((p) => ({ ...p, pincode: e.target.value }))}
                    maxLength={6}
                    required
                    className="w-full border border-line bg-paper px-3 py-2 font-mono text-xs outline-none focus:border-volt tnum"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-ink">
                    <input
                      type="checkbox"
                      checked={newAddr.is_default}
                      onChange={(e) => setNewAddr((p) => ({ ...p, is_default: e.target.checked }))}
                      className="accent-volt"
                    />
                    Set as default address
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAddingAddress}
                className="h-10 w-full bg-volt font-mono text-xs uppercase tracking-wider font-bold text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isAddingAddress ? 'Saving Address...' : 'Save Shipping Address'}
              </button>
            </motion.form>
          )}

          {/* Address List */}
          {loadingAddresses ? (
            <div className="space-y-3">
              <LineSkeleton className="h-24 w-full" />
              <LineSkeleton className="h-24 w-full" />
            </div>
          ) : addresses.length === 0 ? (
            <div className="border border-line bg-card p-6 text-center font-mono text-xs text-ink3">
              No saved addresses found. Click "Add New Address" to save a delivery destination.
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`border p-4 transition-colors ${
                    addr.is_default ? 'border-volt bg-volt/5' : 'border-line bg-card hover:border-ink'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm font-mono">{addr.recipient_name}</span>
                        {addr.is_default && (
                          <span className="bg-volt px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wider text-paper">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-ink2 mt-1">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="font-mono text-xs text-ink2">{addr.address_line2}</p>}
                      <p className="font-mono text-xs text-ink2">{addr.city}, {addr.state} - {addr.pincode}</p>
                      <p className="font-mono text-[11px] text-ink3 mt-1.5">Phone: {addr.phone}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!addr.is_default && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="border border-line bg-paper px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink hover:border-ink"
                        >
                          Make Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditAddress(addr)}
                        aria-label="Edit address"
                        className="grid h-7 w-7 place-items-center text-ink3 transition-colors hover:text-volt"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        className="grid h-7 w-7 place-items-center text-ink3 transition-colors hover:text-red-500"
                      >
                        <IconTrash size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
