import dotenv from "dotenv";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4001),
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  // Frontend origin (for CORS + links in emails) and this API's public URL.
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5175",
  apiUrl: process.env.API_URL ?? "http://localhost:4001",

  // Single-use token lifetimes (minutes)
  tokens: {
    emailVerifyTtlMin: Number(process.env.EMAIL_VERIFY_TTL_MIN ?? 60 * 24), // 24h
    passwordResetTtlMin: Number(process.env.PASSWORD_RESET_TTL_MIN ?? 60), // 1h
  },

  // Email delivery (off in dev → mailer logs to console)
  email: {
    enabled: Boolean(process.env.EMAIL_PROVIDER),
    from: process.env.EMAIL_FROM ?? "Ebookr <no-reply@ebookr.io>",
  },

  // Stripe billing (optional — endpoints are gated off until keys are set)
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    pricePro: process.env.STRIPE_PRICE_PRO ?? "",
    priceTeam: process.env.STRIPE_PRICE_TEAM ?? "",
    trialDays: Number(process.env.STRIPE_TRIAL_DAYS ?? 0),
    get enabled() {
      return Boolean(this.secretKey && this.pricePro);
    },
  },
};
