import React, { useState } from 'react';
import { colors } from '../designSystem';
import VerificationBadge from './VerificationBadge';

/**
 * VendorVerificationPanel Component
 * Admin interface for managing vendor verifications
 * 
 * @param {Object} props
 * @param {Array} props.vendors - List of vendor objects
 * @param {Function} props.onApprove - Callback for vendor approval
 * @param {Function} props.onReject - Callback for vendor rejection  
 * @param {string} props.filter - Filter: 'all', 'pending', 'approved', 'rejected'
 */
const VendorVerificationPanel = ({ vendors = [], onApprove, onReject, filter = 'all' }) => {
  const [rejectionModal, setRejectionModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const filteredVendors = vendors.filter(vendor => {
    if (filter === 'all') return true;
    if (filter === 'pending') return vendor.verification_status === 'pending';
    if (filter === 'approved') return vendor.verification_status === 'approved';
    if (filter === 'rejected') return vendor.verification_status === 'rejected';
    return true;
  });

  const handleApprove = async (vendor) => {
    setProcessing(true);
    try {
      await onApprove(vendor);
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (vendor) => {
    setRejectionModal(vendor);
    setRejectionReason('');
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    setProcessing(true);
    try {
      await onReject(rejectionModal, rejectionReason);
      setRejectionModal(null);
      setRejectionReason('');
    } finally {
      setProcessing(false);
    }
  };

  const tableStyles = {
    container: {
      overflowX: 'auto',
      backgroundColor: colors.white,
      borderRadius: '0.75rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '0.75rem 1rem',
      textAlign: 'left',
      fontSize: '0.75rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: colors.neutral[600],
      borderBottom: `2px solid ${colors.neutral[200]}`,
      backgroundColor: colors.neutral[50],
    },
    td: {
      padding: '1rem',
      borderBottom: `1px solid ${colors.neutral[200]}`,
      fontSize: '0.875rem',
      color: colors.neutral[700],
    },
  };

  const buttonStyles = {
    approve: {
      padding: '0.5rem 1rem',
      backgroundColor: colors.success.main,
      color: colors.white,
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    reject: {
      padding: '0.5rem 1rem',
      backgroundColor: colors.danger.main,
      color: colors.white,
      border: 'none',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  };

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modal: {
      backgroundColor: colors.white,
      borderRadius: '0.75rem',
      padding: '2rem',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
    title: {
      fontSize: '1.25rem',
      fontWeight: 700,
      color: colors.neutral[900],
      marginBottom: '1rem',
    },
    textarea: {
      width: '100%',
      minHeight: '100px',
      padding: '0.75rem',
      border: `1px solid ${colors.neutral[300]}`,
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      resize: 'vertical',
      marginBottom: '1rem',
    },
    buttons: {
      display: 'flex',
      gap: '0.75rem',
      justifyContent: 'flex-end',
    },
  };

  return (
    <>
      <div style={tableStyles.container}>
        {filteredVendors.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: colors.neutral[500] }}>
            No vendors found for this filter
          </div>
        ) : (
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={tableStyles.th}>Vendor Name</th>
                <th style={tableStyles.th}>Business Name</th>
                <th style={tableStyles.th}>Email</th>
                <th style={tableStyles.th}>City</th>
                <th style={tableStyles.th}>Status</th>
                <th style={tableStyles.th}>Registered</th>
                <th style={tableStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(vendor => (
                <tr key={vendor.id}>
                  <td style={tableStyles.td}>{vendor.full_name || vendor.username}</td>
                  <td style={tableStyles.td}>{vendor.business_name}</td>
                  <td style={tableStyles.td}>{vendor.email}</td>
                  <td style={tableStyles.td}>{vendor.city || 'N/A'}</td>
                  <td style={tableStyles.td}>
                    <VerificationBadge status={vendor.verification_status} size="sm" />
                  </td>
                  <td style={tableStyles.td}>
                    {new Date(vendor.date_joined).toLocaleDateString()}
                  </td>
                  <td style={tableStyles.td}>
                    {vendor.verification_status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApprove(vendor)}
                          disabled={processing}
                          style={{
                            ...buttonStyles.approve,
                            ...(processing ? buttonStyles.disabled : {}),
                          }}
                          onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = colors.success.dark)}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = colors.success.main)}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectModal(vendor)}
                          disabled={processing}
                          style={{
                            ...buttonStyles.reject,
                            ...(processing ? buttonStyles.disabled : {}),
                          }}
                          onMouseEnter={(e) => !processing && (e.target.style.backgroundColor = colors.danger.dark)}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = colors.danger.main)}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                        {vendor.verification_status === 'approved' ? 'Verified' : 'Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal && (
        <div style={modalStyles.overlay} onClick={() => setRejectionModal(null)}>
          <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalStyles.title}>Reject Vendor: {rejectionModal.business_name}</h3>
            <p style={{ fontSize: '0.875rem', color: colors.neutral[600], marginBottom: '1rem' }}>
              Please provide a reason for rejection. This will be sent to the vendor via email.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Business license not valid, Address verification failed, etc."
              style={modalStyles.textarea}
            />
            <div style={modalStyles.buttons}>
              <button
                onClick={() => setRejectionModal(null)}
                disabled={processing}
                style={{
                  ...buttonStyles.approve,
                  backgroundColor: colors.neutral[500],
                  ...(processing ? buttonStyles.disabled : {}),
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={processing}
                style={{
                  ...buttonStyles.reject,
                  ...(processing ? buttonStyles.disabled : {}),
                }}
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorVerificationPanel;
