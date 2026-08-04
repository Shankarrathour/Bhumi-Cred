/**
 * Centralized utility functions for form validation
 */

// Matches standard email format
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Matches exactly 10 digits
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

// Matches exactly 12 digits
export const isValidAadhaar = (aadhaar: string): boolean => {
  if (!aadhaar) return false;
  const re = /^[0-9]{12}$/;
  return re.test(aadhaar);
};

// Matches standard 10-character PAN format (5 letters, 4 digits, 1 letter)
export const isValidPAN = (pan: string): boolean => {
  if (!pan) return false;
  const re = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return re.test(pan);
};

// Matches exactly 6 digits
export const isValidPincode = (pincode: string): boolean => {
  if (!pincode) return false;
  const re = /^[0-9]{6}$/;
  return re.test(pincode);
};

// Basic DD/MM/YYYY validation (doesn't validate actual calendar dates strictly but checks format)
export const isValidDate = (date: string): boolean => {
  if (!date) return false;
  const re = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
  return re.test(date);
};

// Checks if a string has at least minimum length (default 1)
export const isNonEmptyStr = (str: string, minLength: number = 1): boolean => {
  return typeof str === 'string' && str.trim().length >= minLength;
};

// Checks that a value contains only letters (A–Z, a–z) and spaces, and is non-empty
export const isOnlyLettersAndSpaces = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  return /^[A-Za-z\s]+$/.test(value);
};

// Strips any character that is not a letter or a space
export const sanitizeLettersOnly = (value: string): string =>
  value.replace(/[^A-Za-z\s]/g, '');

// Letters, spaces, hyphen and dot only — no digits (State, District, Tehsil, Gram Panchayat, Village/City)
export const isValidAddressText = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  return /^[A-Za-z\s\-.]+$/.test(value.trim());
};

// Letters, digits and spaces only (Business Name)
export const isValidBusinessName = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  return /^[A-Za-z0-9\s]+$/.test(value.trim());
};

// Indian Driving Licence: 10-16 alphanumeric characters once spaces/hyphens are stripped
export const isValidDrivingLicence = (value: string): boolean => {
  if (!value) return false;
  const cleaned = value.toUpperCase().replace(/[\s-]/g, '');
  return /^[A-Z0-9]{10,16}$/.test(cleaned);
};

// Indian Voter ID (EPIC): 3 letters followed by 7 digits
export const isValidVoterId = (value: string): boolean => {
  if (!value) return false;
  return /^[A-Z]{3}[0-9]{7}$/.test(value.trim().toUpperCase());
};

// Non-negative whole number (Years of Experience)
export const isNonNegativeInteger = (value: string): boolean => {
  if (!value || !value.trim()) return false;
  return /^\d+$/.test(value.trim());
};
