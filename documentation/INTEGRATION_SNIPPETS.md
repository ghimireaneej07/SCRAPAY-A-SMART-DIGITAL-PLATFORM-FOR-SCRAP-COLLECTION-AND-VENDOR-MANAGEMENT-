# Quick Integration Snippets

This file contains copy-paste ready code snippets to complete the remaining integrations.

---

## 1. AdminPanel.jsx - Vendor Verification Section

**Location:** `scrapay-frontend/src/pages/AdminPanel.jsx`

### Add Import (top of file)
```jsx
import VendorVerificationPanel from '../components/VendorVerificationPanel';
```

### Replace Vendor Section (around line 350-450)

Find the section that starts with `{activeSection === 'vendors' && (...`

Replace the vendor management UI with:

```jsx
{activeSection === 'vendors' && (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-white">Vendor Verification Management</h2>
      <button
        onClick={loadVendors}
        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
      >
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>

    <VendorVerificationPanel
      vendors={vendors}
      onApprove={async (vendor) => {
        try {
          const updated = await adminService.setVendorVerification(vendor.id, true);
          setVendors((prev) => prev.map((v) => (v.id === vendor.id ? updated : v)));
        } catch (err) {
          setError(err.message || 'Unable to approve vendor.');
        }
      }}
      onReject={async (vendor, reason) => {
        try {
          const updated = await adminService.setVendorVerification(vendor.id, false, reason);
          setVendors((prev) => prev.map((v) => (v.id === vendor.id ? updated : v)));
        } catch (err) {
          setError(err.message || 'Unable to reject vendor.');
        }
      }}
      filter="all"
    />
  </div>
)}
```

---

## 2. Profile.jsx - Verification Badge

**Location:** `scrapay-frontend/src/pages/Profile.jsx`

### Add Import (top of file)
```jsx
import VerificationBadge from '../components/VerificationBadge';
```

### Add Badge Display (in the profile info section)

Find where vendor profile information is displayed (business name, etc.)

Add this below the business name or in a prominent location:

```jsx
{profile.role === 'vendor' && (
  <div className="mt-3">
    <VerificationBadge 
      status={profile.verification_status || 'pending'} 
      size="md" 
    />
    {profile.verification_status === 'approved' && profile.verified_at && (
      <p className="mt-1 text-xs text-gray-500">
        Verified on {new Date(profile.verified_at).toLocaleDateString()}
      </p>
    )}
  </div>
)}
```

---

## 3. SelectVendor.jsx - Vendor Cards with Badges

**Location:** `scrapay-frontend/src/pages/SelectVendor.jsx`

### Add Import (top of file)
```jsx
import VerificationBadge from '../components/VerificationBadge';
```

### Update Vendor Card/List Item

Find the vendor display section (probably a map over vendors array)

Update the vendor name display to include the badge:

```jsx
{/* Vendor Name with Badge */}
<div className="flex items-center gap-2">
  <h3 className="text-lg font-semibold text-gray-900">
    {vendor.business_name}
  </h3>
  {vendor.is_verified && (
    <VerificationBadge status="approved" size="sm" showIcon={true} />
  )}
</div>
```

Or if you want full status display:

```jsx
<div className="flex items-center justify-between">
  <h3 className="text-lg font-semibold text-gray-900">
    {vendor.business_name}
  </h3>
  <VerificationBadge 
    status={vendor.verification_status || 'pending'} 
    size="sm" 
  />
</div>
```

---

## 4. OrderPage.jsx or Order Details - Vendor Verification

**Location:** `scrapay-frontend/src/pages/OrderPage.jsx` or wherever orders are displayed

### Add Import
```jsx
import VerificationBadge from '../components/VerificationBadge';
```

### Show Vendor with Badge

In the order details where vendor information is shown:

```jsx
<div className="flex items-center gap-2">
  <span className="font-medium">Vendor:</span>
  <span>{order.vendor_name}</span>
  {order.vendor_is_verified && (
    <VerificationBadge status="approved" size="sm" />
  )}
</div>
```

---

## 5. Optional: Add Verification Stats to Admin Overview

**Location:** `scrapay-frontend/src/pages/AdminPanel.jsx` (overview section)

### Add to Analytics Display

```jsx
{/* Vendor Verification Stats */}
<div className={shellCardClass}>
  <h3 className="mb-4 text-lg font-bold text-orange-200">
    Vendor Verification Status
  </h3>
  <MiniBars
    data={[
      { 
        label: 'Pending Verification', 
        value: vendors.filter(v => v.verification_status === 'pending').length 
      },
      { 
        label: 'Verified Vendors', 
        value: vendors.filter(v => v.verification_status === 'approved').length 
      },
      { 
        label: 'Rejected', 
        value: vendors.filter(v => v.verification_status === 'rejected').length 
      },
    ]}
  />
</div>
```

---

## 6. Optional: Improved toggleVerification in AdminPanel

If you want to keep the old toggle approach but with rejection reason support:

```jsx
const toggleVerification = async (vendor) => {
  try {
    if (vendor.is_verified) {
      // Currently verified, rejecting
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason || !reason.trim()) {
        alert('Rejection reason is required');
        return;
      }
      const updated = await adminService.setVendorVerification(
        vendor.id, 
        false, 
        reason
      );
      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? updated : item)));
    } else {
      // Currently not verified, approving
      const updated = await adminService.setVendorVerification(vendor.id, true);
      setVendors((prev) => prev.map((item) => (item.id === vendor.id ? updated : item)));
    }
  } catch (err) {
    setError(err.message || 'Unable to update vendor verification.');
  }
};
```

---

## 7. VendorDashboard.jsx - Additional Enhancements

**Location:** `scrapay-frontend/src/pages/VendorDashboard.jsx`

### Restrict Order List for Unverified

Add check before displaying orders:

```jsx
{profile && !profile.is_verified && (
  <div className="mb-6 rounded-lg bg-yellow-50 border-2 border-yellow-300 p-4 text-yellow-800">
    <p className="font-semibold">⚠️ Account Not Verified</p>
    <p className="mt-1 text-sm">
      You will start receiving pickup requests once your account is verified by the admin.
    </p>
  </div>
)}
```

---

## 8. Testing Code Snippets

### Backend Test (Python Console)

```python
# Django shell
python manage.py shell

from accounts.models import User
from accounts.services import set_vendor_verification

# Get a test vendor
vendor = User.objects.filter(role='vendor').first()

# Approve
set_vendor_verification(vendor=vendor, is_verified=True)

# Reject with reason
set_vendor_verification(
    vendor=vendor, 
    is_verified=False, 
    rejection_reason="Business license expired"
)

# Check vendor profile
print(vendor.vendor_profile.verification_status)
print(vendor.vendor_profile.rejection_reason)
```

### Frontend Test (Browser Console)

```javascript
// Check if design system loads
import('/src/designSystem.js').then(ds => console.log(ds.colors));

// Test admin service
import('/src/services/adminService.js').then(service => {
  service.adminService.getVendors().then(vendors => {
    console.log('Vendors:', vendors);
    console.log('Pending:', vendors.filter(v => v.verification_status === 'pending'));
  });
});
```

---

## 9. Styling Helpers

### If you need inline style overrides

```jsx
// Use design system colors
import { colors } from '../designSystem';

// Example button with design system
const buttonStyle = {
  backgroundColor: colors.success.main,
  color: colors.white,
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

// Example card with design system
const cardStyle = {
  backgroundColor: colors.white,
  borderRadius: '1rem',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  padding: '1.5rem',
  border: `1px solid ${colors.neutral[200]}`,
};
```

---

## 10. Error Handling Pattern

```jsx
// Standard error handling for verification actions
const handleVerificationAction = async (action) => {
  try {
    setLoading(true);
    setError('');
    await action();
    // Success feedback
    alert('Action completed successfully!');
  } catch (err) {
    setError(err.message || 'An error occurred');
    console.error('Verification error:', err);
  } finally {
    setLoading(false);
  }
};
```

---

## Quick Reference: Component Props

### VerificationBadge
```jsx
<VerificationBadge
  status="pending"        // 'pending' | 'approved' | 'rejected'
  size="md"              // 'sm' | 'md' | 'lg'
  showIcon={true}        // boolean
/>
```

### VerificationStatusCard
```jsx
<VerificationStatusCard
  status="pending"                    // 'pending' | 'approved' | 'rejected'
  rejectionReason="License invalid"  // string (optional)
  verifiedAt="2026-03-13T10:00:00Z"  // ISO date string (optional)
/>
```

### VendorVerificationPanel
```jsx
<VendorVerificationPanel
  vendors={vendorsArray}          // Array of vendor objects
  onApprove={(vendor) => {...}}   // async function
  onReject={(vendor, reason) => {...}}  // async function
  filter="all"                    // 'all' | 'pending' | 'approved' | 'rejected'
/>
```

---

## Environment Variables Checklist

Make sure these are in your `.env`:

```bash
# Brevo SMTP (Required for emails)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USERNAME=your-username
BREVO_SMTP_PASSWORD=your-password
BREVO_SMTP_USE_TLS=1
BREVO_SENDER_EMAIL=your-verified-email@domain.com

# Django
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=mysql
DB_NAME=scrapay
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=127.0.0.1
DB_PORT=3306
```

---

That's it! These snippets should help you complete the integration quickly.

**Estimated integration time: 1-2 hours**

Good luck! 🚀
