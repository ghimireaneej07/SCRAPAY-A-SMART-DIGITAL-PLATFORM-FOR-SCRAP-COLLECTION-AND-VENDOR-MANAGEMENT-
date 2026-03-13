import React from 'react';
import { colors } from '../designSystem';

/**
 * VerificationBadge Component
 * Displays vendor verification status with appropriate styling
 * 
 * @param {Object} props
 * @param {string} props.status - Verification status: 'pending', 'approved', 'rejected'
 * @param {string} props.size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {boolean} props.showIcon - Whether to show icon (default: true)
 */
const VerificationBadge = ({ status = 'pending', size = 'md', showIcon = true }) => {
  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'verified':
        return {
          bg: colors.success[50],
          border: colors.success[300],
          text: colors.success[700],
          icon: '✓',
          label: 'Verified Vendor',
        };
      case 'pending':
        return {
          bg: colors.warning[50],
          border: colors.warning[300],
          text: colors.warning[700],
          icon: '⏳',
          label: 'Verification Pending',
        };
      case 'rejected':
        return {
          bg: colors.danger[50],
          border: colors.danger[300],
          text: colors.danger[700],
          icon: '✕',
          label: 'Verification Rejected',
        };
      default:
        return {
          bg: colors.neutral[50],
          border: colors.neutral[300],
          text: colors.neutral[600],
          icon: '•',
          label: 'Unverified',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: '0.25rem 0.5rem',
          fontSize: '0.75rem',
          gap: '0.25rem',
        };
      case 'lg':
        return {
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          gap: '0.5rem',
        };
      default: // md
        return {
          padding: '0.375rem 0.75rem',
          fontSize: '0.8125rem',
          gap: '0.375rem',
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles();

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeStyles.gap,
    padding: sizeStyles.padding,
    backgroundColor: config.bg,
    color: config.text,
    border: `1px solid ${config.border}`,
    borderRadius: '0.375rem',
    fontSize: sizeStyles.fontSize,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    whiteSpace: 'nowrap',
  };

  return (
    <span style={badgeStyle}>
      {showIcon && <span style={{ fontSize: '0.875em' }}>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
};

export default VerificationBadge;
