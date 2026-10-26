import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Loud & High-Priority Notification Channel for Golden Bloom Leads
final Int64List _vibrationPattern = Int64List.fromList([0, 500, 200, 500, 200, 500]);

const AndroidNotificationChannel leadsChannel = AndroidNotificationChannel(
  'goldenbloom_leads_channel',
  'Golden Bloom Leads Alerts',
  description: 'Instant alerts with loud sound and vibration for new and assigned leads',
  importance: Importance.max,
  playSound: true,
  enableVibration: true,
  enableLights: true,
);

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
}

class FcmService {
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;
  FcmService._internal();

  Function(String leadId)? onLeadNotificationTapped;
  Timer? _pollerTimer;
  int _lastSeenNotificationId = 0;

  Future<void> initialize({Function(String leadId)? onLeadTap}) async {
    onLeadNotificationTapped = onLeadTap;

    // 1. Explicitly prompt user for OS notification permission (Android 13+ & iOS)
    try {
      final status = await Permission.notification.request();
      debugPrint('POST_NOTIFICATIONS permission status: $status');
    } catch (e) {
      debugPrint('Permission request error: $e');
    }

    // 2. Setup Local Notification Channel for Heads-up Alert with Loud Sound & Vibration
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

    final androidPlugin = flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(leadsChannel);
      await androidPlugin.requestNotificationsPermission();
    }

    // 3. Try Firebase Messaging Listeners (if Firebase initialized)
    try {
      final messaging = FirebaseMessaging.instance;
      await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        final notification = message.notification;
        final data = message.data;
        final leadId = data['lead_id']?.toString() ?? '';

        showLeadNotification(
          title: notification?.title ?? 'New Lead Received! 🌿',
          body: notification?.body ?? 'A new inquiry has arrived in Golden Bloom CRM',
          leadId: leadId,
        );
      });

      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        _handleMessageTap(message);
      });

      final initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageTap(initialMessage);
      }

      await syncDeviceToken();
    } catch (e) {
      debugPrint('FCM listeners skipped or failed: $e');
    }

    // 4. Start Background Real-time Poller (Works even without Firebase!)
    startFallbackPoller();
  }

  /// Fire a loud native ring alert on device
  Future<void> showLeadNotification({
    required String title,
    required String body,
    String? leadId,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      leadsChannel.id,
      leadsChannel.name,
      channelDescription: leadsChannel.description,
      importance: Importance.max,
      priority: Priority.max,
      playSound: true,
      enableVibration: true,
      vibrationPattern: _vibrationPattern,
      category: AndroidNotificationCategory.call,
      fullScreenIntent: true,
      styleInformation: BigTextStyleInformation(body),
    );

    final notificationDetails = NotificationDetails(android: androidDetails);

    final payload = jsonEncode({'lead_id': leadId ?? ''});

    await flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }

  void _handleMessageTap(RemoteMessage message) {
    final leadId = message.data['lead_id']?.toString() ?? '';
    if (leadId.isNotEmpty && onLeadNotificationTapped != null) {
      onLeadNotificationTapped!(leadId);
    }
  }

  /// Background fast poller that checks backend every 12 seconds for real-time ring alerts
  void startFallbackPoller() {
    _pollerTimer?.cancel();
    _pollerTimer = Timer.periodic(const Duration(seconds: 12), (timer) async {
      try {
        final prefs = await SharedPreferences.getInstance();
        final authToken = prefs.getString('crm_token');
        if (authToken == null || authToken.isEmpty) return;

        final url = Uri.parse(
          'https://api.goldenbloom.ae/api/notifications/unread?since_id=$_lastSeenNotificationId',
        );

        final res = await http.get(url, headers: {
          'Accept': 'application/json',
          'Authorization': 'Bearer $authToken',
        });

        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final List newNotifs = data['new_notifications'] ?? [];

          for (final item in newNotifs) {
            final id = item['id'] as int? ?? 0;
            if (id > _lastSeenNotificationId) {
              _lastSeenNotificationId = id;
            }

            final title = item['title'] ?? 'New Lead Alert! 🌿';
            final message = item['message'] ?? 'Check Golden Bloom CRM';
            final leadId = item['lead_id']?.toString();

            await showLeadNotification(
              title: title,
              body: message,
              leadId: leadId,
            );
          }
        }
      } catch (_) {}
    });
  }

  /// Send FCM token to Laravel Backend API
  Future<void> syncDeviceToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('fcm_token', token);

      final authToken = prefs.getString('crm_token');
      if (authToken == null || authToken.isEmpty) return;

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
    } catch (_) {}
  }
}
