<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserDeviceToken;
use App\Services\FcmService;
use Illuminate\Http\Request;

class FcmController extends Controller
{
    /**
     * Register or update mobile FCM device token for authenticated user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string|max:1000',
            'device_type' => 'nullable|string|in:android,ios,web',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        UserDeviceToken::updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $validated['token'],
            ],
            [
                'device_type' => $validated['device_type'] ?? 'android',
                'device_name' => $validated['device_name'] ?? null,
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Device registered successfully for push notifications.',
        ]);
    }

    /**
     * Remove device token on logout
     */
    public function destroy(Request $request)
    {
        $user = $request->user();
        $token = $request->input('token');

        if ($token) {
            UserDeviceToken::where('user_id', $user->id)
                ->where('token', $token)
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Device unregistered.',
        ]);
    }

    /**
     * Send test push alert to current user's devices
     */
    public function test(Request $request)
    {
        $user = $request->user();

        $sent = FcmService::sendToUser(
            $user->id,
            "Golden Bloom Test Alert 🔔",
            "Your mobile is successfully connected! Instant WhatsApp-style alerts are active.",
            ['type' => 'test', 'status' => 'verified']
        );

        return response()->json([
            'success' => $sent,
            'message' => $sent 
                ? 'Test notification sent to your mobile devices.' 
                : 'Could not send test notification. Make sure your mobile app has registered a device token and FCM Server Key is set.',
        ]);
    }
}
