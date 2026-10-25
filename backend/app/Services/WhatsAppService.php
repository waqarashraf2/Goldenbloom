<?php

namespace App\Services;

use App\Models\CrmSetting;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Dispatch WhatsApp alert for a newly received lead to configured admin numbers
     */
    public static function sendNewLeadAlert(Lead $lead): array
    {
        $enabled = CrmSetting::get('whatsapp_enabled', '1');
        if ($enabled !== '1') {
            return ['success' => false, 'message' => 'WhatsApp notifications are disabled.'];
        }

        $rawNumbers = CrmSetting::get('whatsapp_notify_numbers', '');
        if (empty(trim($rawNumbers))) {
            Log::info("WhatsApp alert skipped for Lead #{$lead->id}: No admin phone numbers configured.");
            return ['success' => false, 'message' => 'No WhatsApp recipient numbers configured.'];
        }

        $message = self::formatNewLeadMessage($lead);
        $numbers = array_filter(array_map('trim', explode(',', $rawNumbers)));

        $results = [];
        foreach ($numbers as $number) {
            $cleanNumber = self::normalizePhone($number);
            if (!empty($cleanNumber)) {
                $res = self::dispatchMessage($cleanNumber, $message, [
                    'event' => 'new_lead',
                    'lead_id' => $lead->id,
                    'client_name' => $lead->name,
                ]);
                $results[$cleanNumber] = $res;
            }
        }

        self::recordLastDispatch('new_lead', $lead->id, $numbers, $results);

        return [
            'success' => true,
            'recipients_count' => count($numbers),
            'results' => $results,
        ];
    }

    /**
     * Dispatch WhatsApp alert to the assigned telecaller
     */
    public static function sendAssignmentAlert(Lead $lead, User $telecaller): array
    {
        $enabled = CrmSetting::get('whatsapp_enabled', '1');
        $notifyTelecaller = CrmSetting::get('whatsapp_notify_telecaller_on_assign', '1');

        if ($enabled !== '1' || $notifyTelecaller !== '1') {
            return ['success' => false, 'message' => 'Telecaller assignment alerts disabled.'];
        }

        if (empty($telecaller->phone)) {
            Log::info("WhatsApp assignment alert skipped for Lead #{$lead->id}: User {$telecaller->name} has no phone number.");
            return ['success' => false, 'message' => "Telecaller {$telecaller->name} has no phone number on profile."];
        }

        $cleanNumber = self::normalizePhone($telecaller->phone);
        if (empty($cleanNumber)) {
            return ['success' => false, 'message' => 'Invalid telecaller phone number format.'];
        }

        $message = self::formatAssignmentMessage($lead, $telecaller);
        $res = self::dispatchMessage($cleanNumber, $message, [
            'event' => 'lead_assigned',
            'lead_id' => $lead->id,
            'telecaller_id' => $telecaller->id,
            'telecaller_name' => $telecaller->name,
        ]);

        self::recordLastDispatch('lead_assigned', $lead->id, [$cleanNumber], [$cleanNumber => $res]);

        return $res;
    }

    /**
     * Send a test WhatsApp alert to any phone number
     */
    public static function sendTestAlert(string $number, ?string $customText = null): array
    {
        $cleanNumber = self::normalizePhone($number);
        if (empty($cleanNumber)) {
            return ['success' => false, 'message' => 'Invalid phone number. Please include country code (e.g. +971501234567).'];
        }

        $text = $customText ?: ("🌿 *Golden Bloom CRM - WhatsApp Alert Test* 🌿\n\n"
            . "✅ Congratulations! Your phone number is successfully linked to receive instant lead notifications.\n\n"
            . "📅 *Time:* " . now()->format('d M Y, h:i A') . "\n"
            . "🔗 *Portal:* https://crm.goldenbloom.ae\n\n"
            . "You will receive alerts here whenever new leads arrive or are assigned.");

        return self::dispatchMessage($cleanNumber, $text, ['event' => 'test_alert']);
    }

    /**
     * Format high-converting, clean WhatsApp alert message for new leads
     */
    public static function formatNewLeadMessage(Lead $lead): string
    {
        $custom = is_array($lead->custom_fields) ? $lead->custom_fields : [];
        $location = $custom['villa_location'] ?? $custom['location'] ?? $custom['city'] ?? null;
        $propertyType = $custom['property_type'] ?? null;
        $timeline = $custom['project_timeline'] ?? null;

        $msg = "🌿 *NEW LEAD RECEIVED - Golden Bloom CRM* 🌿\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "👤 *Client:* " . ($lead->name ?: 'N/A') . "\n";
        $msg .= "📞 *Phone:* " . ($lead->phone ?: 'N/A') . "\n";

        if (!empty($lead->email)) {
            $msg .= "📧 *Email:* {$lead->email}\n";
        }

        if (!empty($lead->service_requested)) {
            $msg .= "🏷️ *Service:* {$lead->service_requested}\n";
        }

        if (!empty($location)) {
            $msg .= "📍 *Villa / Location:* {$location}\n";
        }

        if (!empty($propertyType)) {
            $msg .= "🏡 *Property Type:* {$propertyType}\n";
        }

        if (!empty($timeline)) {
            $msg .= "⏱️ *Timeline:* {$timeline}\n";
        }

        if (!empty($lead->lead_notes)) {
            $cleanedNotes = mb_substr(strip_tags($lead->lead_notes), 0, 160);
            $msg .= "💬 *Notes:* {$cleanedNotes}\n";
        }

        $msg .= "📅 *Received:* " . now()->format('d M Y, h:i A') . "\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "👉 *Open Lead in CRM:* \n";
        $msg .= "https://crm.goldenbloom.ae/?lead_id={$lead->id}\n";

        return $msg;
    }

    /**
     * Format message for telecaller lead assignment
     */
    public static function formatAssignmentMessage(Lead $lead, User $telecaller): string
    {
        $custom = is_array($lead->custom_fields) ? $lead->custom_fields : [];
        $location = $custom['villa_location'] ?? null;

        $msg = "🎯 *NEW LEAD ASSIGNED TO YOU* 🎯\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "Hello *{$telecaller->name}*, an admin assigned a lead to you:\n\n";
        $msg .= "👤 *Client:* " . ($lead->name ?: 'N/A') . "\n";
        $msg .= "📞 *Phone:* " . ($lead->phone ?: 'N/A') . "\n";

        if (!empty($lead->service_requested)) {
            $msg .= "🏷️ *Service:* {$lead->service_requested}\n";
        }

        if (!empty($location)) {
            $msg .= "📍 *Location:* {$location}\n";
        }

        $msg .= "━━━━━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "👉 *Open & Call Now:* \n";
        $msg .= "https://crm.goldenbloom.ae/?lead_id={$lead->id}\n";

        return $msg;
    }

    /**
     * Dispatch message to external WhatsApp API or Webhook Gateway
     */
    protected static function dispatchMessage(string $phone, string $message, array $metadata = []): array
    {
        $provider = CrmSetting::get('whatsapp_provider', 'webhook');
        $apiUrl = CrmSetting::get('whatsapp_api_url', '');
        $apiToken = CrmSetting::get('whatsapp_api_token', '');
        $instanceId = CrmSetting::get('whatsapp_instance_id', '');

        // Generate direct WhatsApp click URL (always available as universal fallback)
        $clickUrl = "https://api.whatsapp.com/send?phone=" . urlencode($phone) . "&text=" . urlencode($message);

        // If an automated API / Webhook gateway is configured:
        if (!empty($apiUrl)) {
            try {
                if ($provider === 'ultramsg') {
                    // UltraMsg API
                    $targetEndpoint = rtrim($apiUrl, '/') . "/{$instanceId}/messages/chat";
                    $response = Http::timeout(8)->post($targetEndpoint, [
                        'token' => $apiToken,
                        'to' => $phone,
                        'body' => $message,
                    ]);

                    return [
                        'success' => $response->successful(),
                        'provider' => 'ultramsg',
                        'status' => $response->status(),
                        'click_url' => $clickUrl,
                        'response' => $response->json() ?: $response->body(),
                    ];
                } elseif ($provider === 'wasapi') {
                    // Wasapi API
                    $response = Http::timeout(8)->withHeaders([
                        'Authorization' => "Bearer {$apiToken}",
                        'Content-Type' => 'application/json',
                    ])->post($apiUrl, [
                        'phone' => $phone,
                        'message' => $message,
                    ]);

                    return [
                        'success' => $response->successful(),
                        'provider' => 'wasapi',
                        'status' => $response->status(),
                        'click_url' => $clickUrl,
                        'response' => $response->json() ?: $response->body(),
                    ];
                } else {
                    // Generic Webhook Gateway (Make.com, Zapier, n8n, Evolution API, Custom)
                    $response = Http::timeout(8)->withHeaders(
                        !empty($apiToken) ? ['Authorization' => "Bearer {$apiToken}"] : []
                    )->post($apiUrl, [
                        'phone' => $phone,
                        'to' => $phone,
                        'message' => $message,
                        'metadata' => $metadata,
                        'timestamp' => now()->toIso8601String(),
                    ]);

                    return [
                        'success' => $response->successful(),
                        'provider' => 'webhook',
                        'status' => $response->status(),
                        'click_url' => $clickUrl,
                        'response' => $response->json() ?: $response->body(),
                    ];
                }
            } catch (\Throwable $e) {
                Log::error("WhatsApp dispatch error to {$phone}: " . $e->getMessage());
                return [
                    'success' => false,
                    'error' => $e->getMessage(),
                    'click_url' => $clickUrl,
                ];
            }
        }

        // When no external API is configured, log cleanly and provide the direct WhatsApp click URL
        Log::info("WhatsApp alert generated for {$phone}. (No external API URL configured; available via click_url).");
        return [
            'success' => true,
            'provider' => 'direct_link',
            'phone' => $phone,
            'click_url' => $clickUrl,
            'message' => 'WhatsApp alert created. Add an API or Webhook URL in settings for automatic background delivery.',
        ];
    }

    /**
     * Clean and normalize phone numbers (e.g. +971 50 123 4567 -> 971501234567)
     */
    public static function normalizePhone(string $phone): string
    {
        $cleaned = preg_replace('/[^0-9]/', '', $phone);
        // If UAE local number starting with 05 (e.g. 0501234567), prefix with UAE 971
        if (str_starts_with($cleaned, '05') && strlen($cleaned) === 10) {
            $cleaned = '971' . substr($cleaned, 1);
        }
        return $cleaned;
    }

    /**
     * Keep track of the last dispatched alert in CrmSetting for UI inspection
     */
    protected static function recordLastDispatch(string $event, int $leadId, array $recipients, array $results): void
    {
        try {
            CrmSetting::set('whatsapp_last_dispatch', [
                'event' => $event,
                'lead_id' => $leadId,
                'recipients' => $recipients,
                'timestamp' => now()->toIso8601String(),
                'results' => $results,
            ]);
        } catch (\Throwable $e) {
            // Ignore failure to write log
        }
    }
}
