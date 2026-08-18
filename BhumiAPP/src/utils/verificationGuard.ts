import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

const VERIFICATION_MESSAGES: Record<'pending' | 'rejected', { title: string; message: string }> = {
  pending: {
    title: 'Admin Verification Required ⏳',
    message:
      'Your farmer registration is currently under Admin verification. The Add Land feature will be automatically enabled in your app as soon as your profile is verified and approved by the Admin.',
  },
  rejected: {
    title: 'Verification Rejected ❌',
    message:
      'Your profile verification was rejected by the Admin. Please update your profile/KYC information and resubmit before adding land parcels.',
  },
};

/**
 * Reusable gate for "protected actions" — anything that creates or modifies a
 * farmer resource (add/edit/delete land, tree & green-family registration,
 * insurance purchase, project enrollment, marketplace purchase, wallet
 * withdrawal, scheme applications, etc.).
 *
 * Call this synchronously at the top of the action handler, before any
 * navigation or API call:
 *
 *   const handleSubmit = () => {
 *     if (!isFarmerVerified()) return;
 *     ...
 *   };
 *
 * Returns true if the action may proceed. Otherwise shows a blocking alert
 * with the appropriate pending/rejected message and returns false. The
 * backend independently enforces the same rule (VerifiedFarmer dependency) —
 * this is a UX convenience, not the source of truth.
 */
export function isFarmerVerified(): boolean {
  const user = useAuthStore.getState().user;

  if (user?.isActive === false) {
    Alert.alert(
      'Account Suspended 🛑',
      'Your farmer account has been suspended by Admin. Please contact Bhumi support.'
    );
    return false;
  }

  const status = (user?.verificationStatus || '').toLowerCase();
  const kycStatus = ((user as any)?.kyc_status || (user as any)?.kycStatus || '').toLowerCase();

  if (status === 'approved' || status === 'verified' || kycStatus === 'approved' || kycStatus === 'verified') {
    return true;
  }

  const key = status === 'rejected' || kycStatus === 'rejected' ? 'rejected' : 'pending';
  const { title, message } = VERIFICATION_MESSAGES[key];
  Alert.alert(title, message);
  return false;
}
