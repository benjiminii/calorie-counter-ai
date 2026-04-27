import type { ExpoConfig } from 'expo/config';
import { withEntitlementsPlist, type ConfigPlugin } from 'expo/config-plugins';

const appJson = require('./app.json');

// Expo picks up `app.config.ts` in preference to `app.json`. We keep most of
// the config in `app.json` for readability and only override what needs
// runtime/env interpolation here.
export default (): ExpoConfig => {
  const base = appJson.expo as ExpoConfig;

  const iosUrlScheme = process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME;
  if (!iosUrlScheme && process.env.EAS_BUILD_PROFILE) {
    // Fail builds loudly if the required scheme is missing; locally we still
    // allow a null scheme so `expo prebuild` and typegen keep working.
    throw new Error(
      'EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME is required for EAS builds. ' +
        'Set it in your .env.local (dev) or EAS env (CI) before building.'
    );
  }

  const clerkPlugin: [string, Record<string, unknown>] = [
    '@clerk/expo',
    {
      appleSignIn: false,
      ...(iosUrlScheme ? { googleSignIn: { iosUrlScheme } } : {}),
    },
  ];
  
  // Free Apple developer accounts cannot sign apps with the Sign In with Apple
  // capability. `expo-apple-authentication` unconditionally adds the entitlement
  // (no opt-out), so this plugin runs LAST and strips it back out for dev builds.
  const stripAppleSignIn: ConfigPlugin = (config) =>
    withEntitlementsPlist(config, (c) => {
      delete c.modResults['com.apple.developer.applesignin'];
      return c;
    });

  const basePlugins = (base.plugins ?? []) as ExpoConfig['plugins'];
  const plugins = [
    ...(basePlugins ?? []).filter(
      (p) => !(Array.isArray(p) && p[0] === '@clerk/expo') && p !== '@clerk/expo'
    ),
    clerkPlugin,
    stripAppleSignIn,
  ] as ExpoConfig['plugins'];

  return { ...base, plugins };
};
