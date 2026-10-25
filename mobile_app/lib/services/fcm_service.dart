import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// High-Priority Notification Channel for Android heads-up alerts
const AndroidNotificationChannel leadsChannel = AndroidNotificationChannel(
  'goldenbloom_leads_channel',
  'Golden Bloom Leads Alerts',
  description: 'Instant alerts when new leads arrive or are assigned to you',
  importance: Importance.max,
  playSound: true,
  enableVibration: true,
);

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  // Notification is automatically displayed on Android heads-up banner via FCM system payload
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  Function(String leadId)? onLeadNotificationTapped;

  Future<void> initialize({Function(String leadId)? onLeadTap}) async {
    onLeadNotificationTapped = onLeadTap;

    // 1. Request OS Permission
    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    // 2. Setup Local Notification Channel for Heads-up Alert
    const initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null && response.payload!.isNotEmpty) {
          try {
            final data = jsonDecode(response.payload!);
            final leadId = data['lead_id']?.toString() ?? '';
            if (leadId.isNotEmpty && onLeadNotificationTapped != null) {
              onLeadNotificationTapped!(leadId);
            }
          } catch (_) {}
        }
      },
    );

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(leadsChannel);

    // 3. Foreground Notification Listener (Display banner even if app is in front)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      final notification = message.notification;
      final android = message.notification?.android;

      if (notification != null) {
        flutterLocalNotificationsPlugin.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              leadsChannel.id,
              leadsChannel.name,
              channelDescription: leadsChannel.description,
              icon: android?.smallIcon ?? '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
              playSound: true,
              enableVibration: true,
            ),
          ),
          payload: jsonEncode(message.data),
        );
      }
    });

    // 4. Notification Tapped from Background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleMessageTap(message);
    });

    // 5. Notification Tapped from Terminated (Closed) State
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageTap(initialMessage);
    }

    // 6. Register Device Token with CRM Backend
    await syncDeviceToken();
  }

  void _handleMessageTap(RemoteMessage message) {
    final leadId = message.data['lead_id']?.toString() ?? '';
    if (leadId.isNotEmpty && onLeadNotificationTapped != null) {
      onLeadNotificationTapped!(leadId);
    }
  }

  /// Send FCM token to Laravel Backend API
  Future<void> syncDeviceToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);

      final authToken = prefs.getString('crm_token');
      if (authToken == null || authToken.isEmpty) {
        // Will sync once user logs in
        return;
      }

      final url = Uri.parse('https://api.goldenbloom.ae/api/fcm/token');
      await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
        body: jsonEncode({
          'token': token,
          'device_type': 'android',
          'device_name': 'Mobile Device',
        }),
      );
    } catch (_) {
      // Silently retry later
    }
  }
}
