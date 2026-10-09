/**
 * Closed beta: testers get every Premium feature without purchases (there is
 * no store to buy from yet). Set EXPO_PUBLIC_BETA_ALL_ACCESS=1 only for the
 * "preview" build profile / preview updates — never for production builds
 * (enforced by __tests__/eas-config.test.ts).
 */
export const BETA_ALL_ACCESS = process.env.EXPO_PUBLIC_BETA_ALL_ACCESS === '1';
