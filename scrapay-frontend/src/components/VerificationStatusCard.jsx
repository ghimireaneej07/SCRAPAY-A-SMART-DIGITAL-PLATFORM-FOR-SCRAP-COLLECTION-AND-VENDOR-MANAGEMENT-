import React from 'react';
import { colors } from '../designSystem';
import VerificationBadge from './VerificationBadge';

/**
 * VerificationStatusCard Component
 * Displays vendor verification status in the vendor dashboard
 * 
 * @param {Object} props
 * @param {string} props.status - Verification status: 'pending', 'approved', 'rejected'
 * @param {string} props.rejectionReason - Reason for rejection (if applicable)
 * @param {string} props.verifiedAt - Date when verification was approved
 */
const VerificationStatusCard = ({ status = 'pending', rejectionReason = '', verifiedAt = null }) => {
  const getCardConfig = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'verified':
        return {
          bg: `linear-gradient(135deg, ${colors.success[50]} 0%, ${colors.success[100]} 100%)`,
          borderColor: colors.success[300],
          icon: '🎉',
          title: 'Account Verified',
          message: 'Your vendor account has been successfully verified. You can now receive and manage scrap pickup requests from customers.',
          verifiedDate: verifiedAt,
        };
      case 'pending':
        return {
          bg: `linear-gradient(135deg, ${colors.warning[50]} 0%, ${colors.warning[100]} 100%)`,
          borderColor: colors.warning[300],
          icon: '⏳',
          title: 'Verification in Progress',
          message: 'Your account is currently under verification. You cannot receive pickup requests until admin approval. This usually takes 24-48 hours.',
          verifiedDate: null,
        };
      case 'rejected':
        return {
          bg: `linear-gradient(135deg, ${colors.danger[50]} 0%, ${colors.danger[100]} 100%)`,
          borderColor: colors.danger[300],
          icon: '⚠️',
          title: 'Verification Rejected',
          message: rejectionReason || 'Your verification request was not approved. Please contact support for more information.',
          verifiedDate: null,
        };
      default:
        return {
          bg: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
          borderColor: colors.neutral[300],
          icon: '📋',
          title: 'Unverified Account',
          message: 'Your account is not yet verified. Please complete your profile and wait for admin approval.',
          verifiedDate: null,
        };
    }
  };

  const config = getCardConfig();

  const cardStyle = {
    background: config.bg,
    border: `2px solid ${config.borderColor}`,
    borderRadius: '1rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  };

  const iconStyle = {
    fontSize: '2rem',
  };

  const titleStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: colors.neutral[900],
    margin: 0,
  };

  const messageStyle = {
    fontSize: '0.9375rem',
    color: colors.neutral[700],
    lineHeight: 1.6,
    marginBottom: '1rem',
  };

  const badgeContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  };

  const dateStyle = {
    fontSize: '0.875rem',
    color: colors.neutral[600],
    fontStyle: 'italic',
  };

  return (
    <div style={cardStyle} className="animate-fadeUp">
      <div style={headerStyle}>
        <span style={iconStyle}>{config.icon}</span>
        <h3 style={titleStyle}>{config.title}</h3>
      </div>
      
      <p style={messageStyle}>{config.message}</p>

      <div style={badgeContainerStyle}>
        <VerificationBadge status={status} size="md" />
        
        {config.verifiedDate && (
          <span style={dateStyle}>
            Verified on {new Date(config.verifiedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        )}
      </div>

      {status.toLowerCase() === 'rejected' && rejectionReason && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          backgroundColor: colors.white,
          borderLeft: `4px solid ${colors.danger[500]}`,
          borderRadius: '0.375rem',
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem',
            color: colors.neutral[700],
            fontWeight: 600,
          }}>
            Reason: {rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationStatusCard;
