import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET || 'access_secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
  // Token expiration in seconds
  accessExpiresInSeconds: parseInt(process.env.JWT_ACCESS_EXPIRES_IN_SECONDS || '900', 10), // 15 minutes
  refreshExpiresInSeconds: parseInt(process.env.JWT_REFRESH_EXPIRES_IN_SECONDS || '604800', 10), // 7 days
}));
