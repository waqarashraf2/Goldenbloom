<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class WhatsAppController extends Controller
{
    /**
     * Get WhatsApp Notification Settings
     */
    public function getSettings(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $lastDispatch = CrmSetting::get('whatsapp_last_dispatch');
        if (is_string($lastDispatch)) {
            $lastDispatch = json_decode($lastDispatch, true);
        }

        return response()->json([
            'whatsapp_enabled' => CrmSetting::get('whatsapp_enabled', '1') === '1',
            'whatsapp_notify_numbers' => CrmSetting::get('whatsapp_notify_numbers', ''),
            'whatsapp_notify_telecaller_on_assign' => CrmSetting::get('whatsapp_notify_telecaller_on_assign', '1') === '1',
            'whatsapp_provider' => CrmSetting::get('whatsapp_provider', 'webhook'),
            'whatsapp_api_url' => CrmSetting::get('whatsapp_api_url', ''),
            'whatsapp_api_token' => CrmSetting::get('whatsapp_api_token', ''),
            'whatsapp_instance_id' => CrmSetting::get('whatsapp_instance_id', ''),
            'whatsapp_last_dispatch' => $lastDispatch,
        ]);
    }

    /**
     * Update WhatsApp Notification Settings
     */
    public function updateSettings(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'whatsapp_enabled' => 'nullable|boolean',
            'whatsapp_notify_numbers' => 'nullable|string',
            'whatsapp_notify_telecaller_on_assign' => 'nullable|boolean',
            'whatsapp_provider' => 'nullable|string',
            'whatsapp_api_url' => 'nullable|string',
            'whatsapp_api_token' => 'nullable|string',
            'whatsapp_instance_id' => 'nullable|string',
        ]);

        if (isset($validated['whatsapp_enabled'])) {
            CrmSetting::set('whatsapp_enabled', $validated['whatsapp_enabled'] ? '1' : '0');
        }

        if (isset($validated['whatsapp_notify_numbers'])) {
            CrmSetting::set('whatsapp_notify_numbers', $validated['whatsapp_notify_numbers']);
        }

        if (isset($validated['whatsapp_notify_telecaller_on_assign'])) {
            CrmSetting::set('whatsapp_notify_telecaller_on_assign', $validated['whatsapp_notify_telecaller_on_assign'] ? '1' : '0');
        }

        if (isset($validated['whatsapp_provider'])) {
            CrmSetting::set('whatsapp_provider', $validated['whatsapp_provider']);
        }

        if (isset($validated['whatsapp_api_url'])) {
            CrmSetting::set('whatsapp_api_url', $validated['whatsapp_api_url']);
        }

        if (isset($validated['whatsapp_api_token'])) {
            CrmSetting::set('whatsapp_api_token', $validated['whatsapp_api_token']);
        }

        if (isset($validated['whatsapp_instance_id'])) {
            CrmSetting::set('whatsapp_instance_id', $validated['whatsapp_instance_id']);
        }

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp notification settings saved successfully.',
            'settings' => [
                'whatsapp_enabled' => CrmSetting::get('whatsapp_enabled') === '1',
                'whatsapp_notify_numbers' => CrmSetting::get('whatsapp_notify_numbers'),
                'whatsapp_notify_telecaller_on_assign' => CrmSetting::get('whatsapp_notify_telecaller_on_assign') === '1',
                'whatsapp_provider' => CrmSetting::get('whatsapp_provider'),
                'whatsapp_api_url' => CrmSetting::get('whatsapp_api_url'),
                'whatsapp_api_token' => CrmSetting::get('whatsapp_api_token'),
                'whatsapp_instance_id' => CrmSetting::get('whatsapp_instance_id'),
            ],
        ]);
    }

    /**
     * Send test WhatsApp alert
     */
    public function sendTest(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'nullable|string',
        ]);

        $res = WhatsAppService::sendTestAlert($validated['phone'], $validated['message'] ?? null);

        return response()->json($res);
    }
}
