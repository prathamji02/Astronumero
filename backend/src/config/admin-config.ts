/**
 * Admin Configuration Module
 *
 * Reads predefined administrator credentials from server environment variables.
 * To update administrator credentials:
 * 1. Edit ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env
 * 2. Restart the backend service.
 *
 * Never commit backend/.env to version control or expose credentials to client code.
 */

export interface AdminCredentials {
  email: string;
  initialPassword: string;
}

export function getPredefinedAdminCredentials(): AdminCredentials {
  const email = process.env.ADMIN_EMAIL?.trim();
  const initialPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !initialPassword) {
    throw new Error(
      'FATAL CONFIGURATION ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.\n' +
      'Please check your backend/.env file and ensure both ADMIN_EMAIL and ADMIN_PASSWORD are set.'
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(`FATAL CONFIGURATION ERROR: ADMIN_EMAIL "${email}" is not a valid email address.`);
  }

  if (initialPassword.length < 8) {
    throw new Error('FATAL CONFIGURATION ERROR: ADMIN_PASSWORD must be at least 8 characters long.');
  }

  return { email, initialPassword };
}
