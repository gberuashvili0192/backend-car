export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    message: 'Invalid phone or password',
  },
  USER_NOT_FOUND: {
    code: 'AUTH_002',
    message: 'User not found',
  },
  EMAIL_EXISTS: {
    code: 'AUTH_003',
    message: 'User with this email already exists',
  },
  INVALID_OTP: {
    code: 'AUTH_003',
    message: 'Invalid or expired OTP',
  },
  OTP_EXPIRED: {
    code: 'AUTH_005',
    message: 'OTP code has expired',
  },
  INVALID_PHONE_FORMAT: {
    code: 'AUTH_006',
    message: 'Invalid phone number format',
  },
  INVALID_ROLE: {
    code: 'AUTH_007',
    message: 'Invalid user role',
  },
  PHONE_NOT_VERIFIED: {
    code: 'AUTH_004',
    message: 'Phone number not verified',
  },
  PHONE_ALREADY_EXISTS: {
    code: 'AUTH_005',
    message: 'User with this phone number already exists',
  },
} as const;
