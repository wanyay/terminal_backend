import { registerAs } from '@nestjs/config';

export default registerAs('throttler', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),       // time window in seconds
  limit: parseInt(process.env.THROTTLE_LIMIT || '20', 10),   // max requests per TTL
}));
