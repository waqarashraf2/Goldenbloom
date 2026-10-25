import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'services/fcm_service.dart';
import 'screens/main_webview_screen.dart';

final GlobalKey<MainWebViewScreenState> webViewKey = GlobalKey<MainWebViewScreenState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Style status bar
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize Firebase & FCM
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase init error: $e');
  }

  runApp(const GoldenBloomApp());
}

class GoldenBloomApp extends StatefulWidget {
  const GoldenBloomApp({super.key});

  @override
  State<GoldenBloomApp> createState() => _GoldenBloomAppState();
}

class _GoldenBloomAppState extends State<GoldenBloomApp> {
  String? pendingLeadId;

  @override
  void initState() {
    super.initState();

    // Initialize FCM notification handlers
    FcmService().initialize(
      onLeadTap: (leadId) {
        if (webViewKey.currentState != null) {
          webViewKey.currentState!.openLead(leadId);
        } else {
          setState(() {
            pendingLeadId = leadId;
          });
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Golden Bloom CRM',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF92400E), // Golden Bloom Amber
          primary: const Color(0xFF92400E),
        ),
        useMaterial3: true,
      ),
      home: MainWebViewScreen(
        key: webViewKey,
        initialLeadId: pendingLeadId,
      ),
    );
  }
}
