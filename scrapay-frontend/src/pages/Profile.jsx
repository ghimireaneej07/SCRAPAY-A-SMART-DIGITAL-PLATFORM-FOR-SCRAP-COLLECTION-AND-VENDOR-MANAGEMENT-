import { useEffect, useState } from 'react';
import { authService } from '../services/authService.js';
import { useAuth } from '../hooks/useAuth.js';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    email: '',
    phone: '',
    full_name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    business_name: '',
    license_number: '',
    service_radius_km: '',
  });
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await authService.getProfile();
        setForm({
          email: profile.email || '',
          phone: profile.phone || '',
          full_name: profile.full_name || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          pincode: profile.pincode || '',
          business_name: profile.business_name || '',
          license_number: profile.license_number || '',
          service_radius_km: profile.service_radius_km || '',
        });
        setAvatarPreview(profile.avatar_url || '');
      } catch (err) {
        setError(err.message || 'Unable to load profile.');
      }
    };
    load();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const requestBody = new FormData();
      Object.entries(form).forEach(([key, value]) => requestBody.append(key, value ?? ''));
      if (avatarFile) requestBody.append('avatar', avatarFile);
      const payload = await authService.updateProfile(requestBody);
      setAvatarPreview(payload.avatar_url || '');
      updateUser({
        email: payload.email,
        phone: payload.phone,
        full_name: payload.full_name,
        avatar_url: payload.avatar_url,
        business_name: payload.business_name || '',
      });
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl rounded-xl bg-[#A1623C] p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-orange-100">My Profile</h1>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-300">{message}</p>}

        <form onSubmit={handleSave} className="mt-6 grid gap-4 md:grid-cols-2">
          <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" className="rounded bg-yellow-100 px-3 py-2 text-black" />
          <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email" className="rounded bg-yellow-100 px-3 py-2 text-black" />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" className="rounded bg-yellow-100 px-3 py-2 text-black" />
          <label className="rounded bg-yellow-100 px-3 py-2 text-black">
            <span className="mb-1 block text-xs text-gray-700">Profile Picture</span>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setAvatarFile(file);
                if (file) setAvatarPreview(URL.createObjectURL(file));
              }}
              className="w-full text-sm"
            />
          </label>
          {avatarPreview && (
            <img src={avatarPreview} alt="Profile preview" className="h-24 w-24 rounded-full border border-orange-200/60 object-cover" />
          )}
          <input name="address" value={form.address} onChange={handleChange} placeholder="Address" className="rounded bg-yellow-100 px-3 py-2 text-black md:col-span-2" />
          <input name="city" value={form.city} onChange={handleChange} placeholder="City" className="rounded bg-yellow-100 px-3 py-2 text-black" />
          <input name="state" value={form.state} onChange={handleChange} placeholder="State" className="rounded bg-yellow-100 px-3 py-2 text-black" />
          <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="Pincode" className="rounded bg-yellow-100 px-3 py-2 text-black" />

          {user?.role === 'vendor' && (
            <>
              <input name="business_name" value={form.business_name} onChange={handleChange} placeholder="Business name" className="rounded bg-yellow-100 px-3 py-2 text-black" />
              <input name="license_number" value={form.license_number} onChange={handleChange} placeholder="License number" className="rounded bg-yellow-100 px-3 py-2 text-black" />
              <input name="service_radius_km" value={form.service_radius_km} onChange={handleChange} placeholder="Service radius km" className="rounded bg-yellow-100 px-3 py-2 text-black" />
            </>
          )}

          <button type="submit" disabled={saving} className="rounded bg-orange-500 px-4 py-2 font-semibold hover:bg-orange-600 disabled:opacity-60 md:col-span-2">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default Profile;
