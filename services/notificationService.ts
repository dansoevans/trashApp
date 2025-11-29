// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Configure notification handler

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function setupNotifications(): Promise<boolean> {
    try {
        console.log('Setting up notifications...');

        // Configure notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10B981',
                sound: 'default',
                enableVibrate: true,
                enableLights: true,
                showBadge: true,
            });
        }

        // Get current permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permissions if not granted
        if (existingStatus !== 'granted') {

            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                    allowAlert: true,
                    allowBadge: true,
                    allowSound: true,
                    allowAnnouncements: true,
                },
            });
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permissions not granted');
            return false;
        }

        // Get Expo push token (for future push notifications)
        try {
            const token = (await Notifications.getExpoPushTokenAsync()).data;
            console.log('Expo push token:', token);

            // Here you would typically send this token to your backend
            // await savePushTokenToBackend(token);
        } catch (tokenError) {
            console.warn('Failed to get Expo push token:', tokenError);
            // Continue without push token - local notifications will still work
        }

        console.log('Notifications setup completed successfully');
        return true;
    } catch (error) {
        console.error('Error setting up notifications:', error);
        return false;
    }
}

export async function askNotificationPermission(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
            return true;
        }

        // Request permissions with detailed options
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowAnnouncements: true,
            },
        });

        const granted = status === 'granted';

        if (granted) {
            console.log('Notification permission granted');
            // Re-run setup to configure channels
            await setupNotifications();
        } else {
            console.warn('Notification permission denied');
        }

        return granted;
    } catch (error) {
        console.warn('Notification permission error:', error);
        return false;
    }
}

export async function sendLocalNotification(
    title: string,
    body: string,
    data?: any
): Promise<void> {
    try {
        // Check if we have permission
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            console.warn('Cannot send notification - permission not granted');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: title || 'WasteMaster',
                body: body || 'Notification',
                data: data || {},
                sound: true,
                vibrate: [0, 250, 250, 250],
                autoDismiss: true,
                sticky: false,
            },
            trigger: null, // Send immediately
        });

        console.log('Local notification sent:', title);
    } catch (error) {
        console.warn('Error sending local notification:', error);
    }
}

export async function sendScheduledNotification(
    title: string,
    body: string,
    trigger: { date: Date },
    data?: any
): Promise<void> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            console.warn('Cannot send scheduled notification - permission not granted');
            return;
        }

        await Notifications.scheduleNotificationAsync({
            content: {
                title: title || 'WasteMaster',
                body: body || 'Scheduled Notification',
                data: data || {},
                sound: true,
                autoDismiss: true,
            },
            trigger,
        });

        console.log('Scheduled notification set:', title);
    } catch (error) {
        console.warn('Error sending scheduled notification:', error);
    }
}

export async function sendPickupReminder(
    pickupDate: string,
    pickupTime: string,
    address: string,
    wasteType: string
): Promise<void> {
    try {
        const notificationDate = new Date(`${pickupDate}T${pickupTime}`);
        // Schedule reminder 1 hour before pickup
        notificationDate.setHours(notificationDate.getHours() - 1);

        // Check if the reminder is in the future
        if (notificationDate <= new Date()) {
            console.warn('Pickup reminder time is in the past, sending immediate notification instead');
            await sendLocalNotification(
                'Pickup Reminder',
                `Your ${wasteType} pickup is scheduled for today at ${pickupTime}. Address: ${address}`
            );
            return;
        }

        await sendScheduledNotification(
            'Pickup Reminder ⏰',
            `Your ${wasteType} pickup is scheduled for ${pickupTime} today. Please ensure your waste is ready for collection.`,
            { date: notificationDate },
            {
                type: 'PICKUP_REMINDER',
                pickupDate,
                pickupTime,
                address,
                wasteType,
            }
        );
    } catch (error) {
        console.warn('Error scheduling pickup reminder:', error);
        // Fallback to immediate notification
        await sendLocalNotification(
            'Pickup Scheduled',
            `Your ${wasteType} pickup is scheduled for ${pickupDate} at ${pickupTime}`
        );
    }
}

export async function sendPickupConfirmation(
    pickupDate: string,
    pickupTime: string,
    wasteType: string
): Promise<void> {
    await sendLocalNotification(
        'Pickup Confirmed! ✅',
        `Your ${wasteType} waste pickup has been scheduled for ${pickupDate} at ${pickupTime}. You'll receive a reminder before pickup.`,
        {
            type: 'PICKUP_CONFIRMED',
            pickupDate,
            pickupTime,
            wasteType,
        }
    );
}

export async function sendPickupStatusUpdate(
    status: string,
    pickupDate: string,
    pickupTime: string
): Promise<void> {
    let title = '';
    let body = '';

    switch (status) {
        case 'Assigned':
            title = 'Collector Assigned 🚚';
            body = `A collector has been assigned to your pickup scheduled for ${pickupDate} at ${pickupTime}.`;
            break;
        case 'InProgress':
            title = 'Pickup In Progress 🎯';
            body = `Your collector is on the way for the ${pickupTime} pickup.`;
            break;
        case 'Completed':
            title = 'Pickup Completed! ✅';
            body = `Your waste pickup scheduled for ${pickupDate} has been completed. Thank you for using WasteMaster!`;
            break;
        case 'Cancelled':
            title = 'Pickup Cancelled ❌';
            body = `Your pickup scheduled for ${pickupDate} at ${pickupTime} has been cancelled.`;
            break;
        default:
            title = 'Pickup Status Update';
            body = `Your pickup status has been updated to ${status}.`;
    }

    await sendLocalNotification(title, body, {
        type: 'STATUS_UPDATE',
        status,
        pickupDate,
        pickupTime,
    });
}

export async function cancelAllScheduledNotifications(): Promise<void> {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        console.log('All scheduled notifications cancelled');
    } catch (error) {
        console.warn('Error cancelling scheduled notifications:', error);
    }
}

export async function getPendingNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
        return await Notifications.getPendingNotificationsAsync();
    } catch (error) {
        console.warn('Error getting pending notifications:', error);
        return [];
    }
}

// Notification categories for interactive notifications
export async function setupNotificationCategories(): Promise<void> {
    try {
        await Notifications.setNotificationCategoryAsync('PICKUP_ACTIONS', [
            {
                identifier: 'VIEW_DETAILS',
                buttonTitle: 'View Details',
                options: {
                    opensAppToForeground: true,
                },
            },
            {
                identifier: 'RESCHEDULE',
                buttonTitle: 'Reschedule',
                options: {
                    opensAppToForeground: true,
                },
            },
            {
                identifier: 'CANCEL',
                buttonTitle: 'Cancel Pickup',
                options: {
                    opensAppToForeground: true,
                    isDestructive: true,
                },
            },
        ]);

        console.log('Notification categories setup completed');
    } catch (error) {
        console.warn('Error setting up notification categories:', error);
    }
}

// Notification listeners
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

export function removeNotificationListener(
    subscription: Notifications.Subscription
): void {
    subscription.remove();
}

// Utility function to check notification permissions
export async function checkNotificationPermissions(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: Notifications.PermissionStatus;
}> {
    try {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        return {
            granted: status === 'granted',
            canAskAgain,
            status,
        };
    } catch (error) {
        console.warn('Error checking notification permissions:', error);
        return {
            granted: false,
            canAskAgain: false,
            status: 'undetermined' as Notifications.PermissionStatus,
        };
    }
}

// Request notification permission with user-friendly messages
export async function requestNotificationPermissionWithExplanation(): Promise<boolean> {
    try {
        const { granted, canAskAgain } = await checkNotificationPermissions();

        if (granted) {
            return true;
        }

        if (!canAskAgain) {
            Alert.alert(
                'Notifications Disabled',
                'Notifications are currently disabled. Please enable them in your device settings to receive pickup reminders and status updates.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Notifications.getPermissionsAsync() },
                ]
            );
            return false;
        }

        // Show explanation before requesting permission
        Alert.alert(
            'Enable Notifications',
            'Get reminders for your pickups, status updates, and important alerts about your waste collection services.',
            [
                { text: 'Not Now', style: 'cancel' },
                {
                    text: 'Enable',
                    onPress: async () => {
                        await askNotificationPermission();
                    },
                },
            ]
        );

        return false;
    } catch (error) {
        console.warn('Error requesting notification permission:', error);
        return false;
    }
}