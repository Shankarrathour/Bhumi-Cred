import { Alert } from 'react-native';
import { useAuthStore } from '../store/authStore';

const VERIFICATION_MESSAGES: Record<'pending' | 'rejected', { title: string; message: string }> = {
  pending: {
    title: 'Verification Pending',
    message:
      'Your profile verification is still pending. Once your profile is verified by the Admin, you will be able to use this feature.',
  },
  rejected: {
    title: 'Verification Rejected',
    message:
      'Your profile verification was rejected by the Admin. Please update your profile/KYC information and submit it again before using this feature.',
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
  const status = useAuthStore.getState().user?.verificationStatus;

  if (status === 'approved') {
    return true;
  }

  const key = status === 'rejected' ? 'rejected' : 'pending';
  const { title, message } = VERIFICATION_MESSAGES[key];
  Alert.alert(title, message);
  return false;
}
