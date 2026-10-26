import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/fcm_service.dart';

class MainWebViewScreen extends StatefulWidget {
  final String? initialLeadId;
  const MainWebViewScreen({super.key, this.initialLeadId});

  @override
  State<MainWebViewScreen> createState() => MainWebViewScreenState();
}

class MainWebViewScreenState extends State<MainWebViewScreen> {
  InAppWebViewController? webViewController;
  PullToRefreshController? pullToRefreshController;
  double progress = 0;
  bool isOffline = false;

  final String baseCrmUrl = 'https://crm.goldenbloom.ae';

  @override
  void initState() {
    super.initState();

    pullToRefreshController = PullToRefreshController(
      settings: PullToRefreshSettings(
        color: const Color(0xFF92400E), // amber-800
      ),
      onRefresh: () async {
        webViewController?.reload();
      },
    );
  }

  /// Open specific lead modal in CRM from FCM notification click
  void openLead(String leadId) {
    if (webViewController != null) {
      final targetUrl = '$baseCrmUrl/?lead_id=$leadId';
      webViewController!.loadUrl(
        urlRequest: URLRequest(url: WebUri(targetUrl)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final initialUrl = widget.initialLeadId != null && widget.initialLeadId!.isNotEmpty
        ? '$baseCrmUrl/?lead_id=${widget.initialLeadId}'
        : baseCrmUrl;

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        if (webViewController != null && await webViewController!.canGoBack()) {
          webViewController!.goBack();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              InAppWebView(
                initialUrlRequest: URLRequest(url: WebUri(initialUrl)),
                initialSettings: InAppWebViewSettings(
                  applicationNameForUserAgent: 'GoldenBloomApp/1.0',
                  useShouldOverrideUrlLoading: true,
                  mediaPlaybackRequiresUserGesture: false,
                  javaScriptEnabled: true,
                  supportZoom: false,
                  transparentBackground: true,
                  allowsInlineMediaPlayback: true,
                ),
                pullToRefreshController: pullToRefreshController,
                onWebViewCreated: (controller) {
                  webViewController = controller;

                  // Native bridge for web buttons to request OS notification permission directly
                  controller.addJavaScriptHandler(
                    handlerName: 'requestNativeNotificationPermission',
                    callback: (args) async {
                      try {
                        final status = await Permission.notification.request();
                        return status.isGranted;
                      } catch (e) {
                        debugPrint('Error requesting native notification permission: $e');
                        return false;
                      }
                    },
                  );
                },
                onProgressChanged: (controller, prg) {
                  setState(() {
                    progress = prg / 100;
                  });
                  if (prg == 100) {
                    pullToRefreshController?.endRefreshing();
                  }
                },
                onLoadStop: (controller, url) async {
                  pullToRefreshController?.endRefreshing();

                  // Inject native app flags into JavaScript environment
                  try {
                    await controller.evaluateJavascript(
                      source: """
                        window.__IS_GOLDENBLOOM_APP__ = true;
                        window.isNativeApp = true;
                        try {
                          localStorage.setItem('gb_is_native_app', 'true');
                          localStorage.setItem('gb_screen_alerts_enabled', 'true');
                          window.dispatchEvent(new CustomEvent('gb_native_app_ready'));
                        } catch(e) {}
                      """,
                    );
                  } catch (_) {}

                  // Extract auth token from browser localStorage and sync FCM token
                  try {
                    final tokenResult = await controller.evaluateJavascript(
                      source: "localStorage.getItem('crm_token');",
                    );
                    if (tokenResult != null && tokenResult.toString().isNotEmpty) {
                      final token = tokenResult.toString().replaceAll('"', '');
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setString('crm_token', token);
                      FcmService().syncDeviceToken();
                    }
                  } catch (_) {}
                },
                shouldOverrideUrlLoading: (controller, navigationAction) async {
                  final uri = navigationAction.request.url;
                  if (uri != null) {
                    final urlStr = uri.toString();
                    // Intercept telephone calls and open native phone dialer
                    if (urlStr.startsWith('tel:')) {
                      final launchUri = Uri.parse(urlStr);
                      if (await canLaunchUrl(launchUri)) {
                        await launchUrl(launchUri);
                      }
                      return NavigationActionPolicy.CANCEL;
                    }
                    // Intercept WhatsApp links and open native WhatsApp app
                    if (urlStr.startsWith('https://wa.me') || urlStr.startsWith('whatsapp:')) {
                      final launchUri = Uri.parse(urlStr);
                      if (await canLaunchUrl(launchUri)) {
                        await launchUrl(launchUri, mode: LaunchMode.externalApplication);
                      }
                      return NavigationActionPolicy.CANCEL;
                    }
                  }
                  return NavigationActionPolicy.ALLOW;
                },
              ),
              if (progress < 1.0)
                LinearProgressIndicator(
                  value: progress,
                  color: const Color(0xFF92400E), // amber-800
                  backgroundColor: Colors.transparent,
                  minHeight: 2.5,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
