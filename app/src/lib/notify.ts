// A daily local reminder at 8:20, shortly after the new brief is published.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export async function enableDailyReminder(ownerName: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const cur = await Notifications.getPermissionsAsync();
    let granted = cur.granted;
    if (!granted && cur.canAskAgain) granted = (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('daily', { name: 'Daily brief', importance: Notifications.AndroidImportance.DEFAULT });
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Your Morning Brief is ready', body: `Today's stories from ${ownerName}'s reading list.` },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 8, minute: 20, channelId: 'daily' },
    });
    return true;
  } catch {
    return false;
  }
}

export async function disableDailyReminder() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
