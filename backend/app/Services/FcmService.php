<?php

namespace App\Services;

use App\Models\CrmSetting;
use App\Models\User;
use App\Models\UserDeviceToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send push notification to all active devices of a specific user
     */
    public static function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        try {
            $tokens = UserDeviceToken::where('user_id', $userId)
                ->pluck('token')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            if (empty($tokens)) {
                return false;
            }

            return self::sendToTokens($tokens, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::error('FCM sendToUser error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send push notification to all active Admins & Super Admins
     */
    public static function sendToAdmins(string $title, string $body, array $data = []): bool
    {
        try {
            $adminIds = User::whereIn('role', ['admin', 'super_admin'])
                ->where('is_active', true)
                ->pluck('id');

            $tokens = UserDeviceToken::whereIn('user_id', $adminIds)
                ->pluck('token')
                ->filter()
                ->unique()
                ->values()
                ->toArray();

            if (empty($tokens)) {
                return false;
            }

            return self::sendToTokens($tokens, $title, $body, $data);
        } catch (\Throwable $e) {
            Log::error('FCM sendToAdmins error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Dispatch FCM HTTP Push Notification to a list of device tokens
     */
    public static function sendToTokens(array $tokens, string $title, string $body, array $data = []): bool
    {
        if (empty($tokens)) {
            return false;
        }

        // Retrieve server key from CRM settings or config / env
        $serverKey = CrmSetting::get('fcm_server_key', env('FCM_SERVER_KEY', ''));

        if (empty($serverKey)) {
            Log::info('FCM push skipped: FCM Server Key is not configured in CRM settings yet.');
            return false;
        }

        try {
            $url = 'https://fcm.googleapis.com/fcm/send';

            // High-priority payload guaranteed to wake Android devices from sleep / background
            $payload = [
                'registration_ids' => array_values($tokens),
                'priority' => 'high',
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                    'sound' => 'default',
                    'icon' => 'notification_icon',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    'android_channel_id' => 'goldenbloom_leads_channel',
                ],
                'data' => array_merge($data, [
                    'title' => $title,
                    'body' => $body,
                    'lead_id' => isset($data['lead_id']) ? (string)$data['lead_id'] : '',
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                ]),
            ];

            $response = Http::withHeaders([
                'Authorization' => 'key=' . trim($serverKey),
                'Content-Type' => 'application/json',
            ])->timeout(10)->post($url, $payload);

            if ($response->successful()) {
                Log::info('FCM push sent successfully to ' . count($tokens) . ' devices.');
                return true;
            }

            Log::warning('FCM push failed: ' . $response->body());
            return false;
        } catch (\Throwable $e) {
            Log::error('FCM HTTP send error: ' . $e->getMessage());
            return false;
        }
    }
}
