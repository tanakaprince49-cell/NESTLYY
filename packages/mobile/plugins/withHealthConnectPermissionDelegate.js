/**
 * Temporary local Expo config plugin for react-native-health-connect@3.5.0.
 *
 * Upstream plugin (node_modules/react-native-health-connect/app.plugin.js)
 * only injects an ACTION_SHOW_PERMISSIONS_RATIONALE intent-filter into
 * AndroidManifest.xml. It does NOT wire the HealthConnectPermissionDelegate,
 * which the library's README explicitly requires callers to do in
 * MainActivity.onCreate. Without it, the first tap on "Connect" crashes
 * the app natively with:
 *
 *   kotlin.UninitializedPropertyAccessException:
 *   lateinit property requestPermission has not been initialized
 *   at HealthConnectPermissionDelegate.launchPermissionsDialog(HealthConnectPermissionDelegate.kt:45)
 *
 * This plugin injects the missing import + setPermissionDelegate(this) call
 * into MainActivity.kt at prebuild time using @expo/config-plugins'
 * mergeContents helper (idempotent, marked with @generated blocks).
 *
 * See issue #260. Remove this plugin once upstream ships a fix or we bump
 * to a newer react-native-health-connect that handles the delegate
 * registration inside its own Expo plugin.
 */

const { withMainActivity } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const TAG = 'rn-health-connect-permission-delegate';

const IMPORT_LINE = 'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate';
const DELEGATE_CALL = 'HealthConnectPermissionDelegate.setPermissionDelegate(this)';

function transformMainActivity(config) {
  if (config.modResults.language !== 'kt') {
    console.warn(
      `[withHealthConnectPermissionDelegate] MainActivity language is "${config.modResults.language}", expected "kt". Skipping injection; Health Connect permission dialog will crash at runtime.`
    );
    return config;
  }

  const importResult = mergeContents({
    tag: `${TAG}-import`,
    src: config.modResults.contents,
    newSrc: IMPORT_LINE,
    anchor: /^package\s+/m,
    offset: 1,
    comment: '//',
  });
  if (!importResult.didMerge && !config.modResults.contents.includes(IMPORT_LINE)) {
    throw new Error(
      '[withHealthConnectPermissionDelegate] Failed to inject import into MainActivity.kt (no "package ..." line matched).'
    );
  }

  const callResult = mergeContents({
    tag: `${TAG}-call`,
    src: importResult.contents,
    newSrc: DELEGATE_CALL,
    anchor: /super\.onCreate\s*\(/,
    offset: 1,
    comment: '//',
  });
  if (!callResult.didMerge && !importResult.contents.includes(DELEGATE_CALL)) {
    throw new Error(
      '[withHealthConnectPermissionDelegate] Failed to inject setPermissionDelegate into MainActivity.kt (no "super.onCreate(...)" call matched). The Expo MainActivity template may have changed; update the anchor regex.'
    );
  }

  if (importResult.didMerge || callResult.didMerge) {
    console.log('[withHealthConnectPermissionDelegate] Injected Health Connect permission delegate into MainActivity.kt');
  }

  config.modResults.contents = callResult.contents;
  return config;
}

function withHealthConnectPermissionDelegate(config) {
  return withMainActivity(config, transformMainActivity);
}

module.exports = withHealthConnectPermissionDelegate;
// Exposed for local sanity checks; not part of the public plugin contract.
module.exports._transformMainActivity = transformMainActivity;
