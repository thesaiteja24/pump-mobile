import { useEffect } from 'react';
import { Platform } from 'react-native';
import SpInAppUpdates, {
  IAUUpdateKind,
  IAUAvailabilityStatus,
  NeedsUpdateResponse,
  AndroidNeedsUpdateResponse,
} from 'sp-react-native-in-app-updates';

const inAppUpdates = new SpInAppUpdates(
  __DEV__ // isDebug
);

export const useInAppUpdate = () => {
  useEffect(() => {
    // Only run in production and on supported platforms
    if (__DEV__) return;

    const checkUpdate = async () => {
      try {
        const result: NeedsUpdateResponse = await inAppUpdates.checkNeedsUpdate();
        
        if (result.shouldUpdate) {
          if (Platform.OS === 'android' && result.other) {
            const androidResult = result as AndroidNeedsUpdateResponse;
            
            if (androidResult.other.updateAvailability === IAUAvailabilityStatus.AVAILABLE) {
              // Trigger the NATIVE Google Play 'Immediate' update UI.
              // This covers the entire app and handles download/install natively.
              await inAppUpdates.startUpdate({
                updateType: IAUUpdateKind.IMMEDIATE,
              });
            }
          } else if (Platform.OS === 'ios') {
            // On iOS, this triggers a native UIAlertController prompt
            await inAppUpdates.startUpdate({
              title: 'Update Available',
              message: 'A new version of the app is available. Please update to continue.',
              buttonUpgradeText: 'Update Now',
              buttonCancelText: 'Later',
              forceUpgrade: false, // Set to true if you want to force it
            });
          }
        }
      } catch (error) {
        console.log('Update check failed:', error);
      }
    };

    checkUpdate();
  }, []);
};
