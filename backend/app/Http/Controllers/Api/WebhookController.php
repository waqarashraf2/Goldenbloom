<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmNotification;
use App\Models\CrmSetting;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;

class WebhookController extends Controller
{
    // Webhook endpoint to receive leads from Website & Google Sheets
    public function incomingLead(Request $request)
    {
        // 1. Verify Secret Key
        $storedSecret = CrmSetting::get('webhook_secret_key', 'gb_sec_goldenbloom_998124');
        $providedKey = $request->header('X-CRM-Key') 
            ?: $request->query('api_key') 
            ?: $request->input('api_key');

        if (!$providedKey || $providedKey !== $storedSecret) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid CRM API Key.',
            ], 401);
        }

        // 2. Normalize input parameters
        $name = $request->input('name') 
            ?: $request->input('full_name') 
            ?: $request->input('Client Name') 
            ?: $request->input('Name') 
            ?: '';

        $phone = $request->input('phone') 
            ?: $request->input('phone_number') 
            ?: $request->input('mobile') 
            ?: $request->input('mobile_number') 
            ?: $request->input('contact') 
            ?: $request->input('Phone') 
            ?: $request->input('Phone Number') 
            ?: '';

        $email = $request->input('email') 
            ?: $request->input('Email') 
            ?: $request->input('email_address') 
            ?: null;

        // Auto-detect source from platform tag if provided (e.g. Meta, fb, ig)
        $platform = strtolower($request->input('platform', ''));
        $source = strtolower($request->input('source') ?: $request->input('Source') ?: '');
        if (!$source || $source === 'website') {
            if ($platform === 'ig' || $platform === 'instagram') {
                $source = 'instagram_ads';
            } elseif ($platform === 'fb' || $platform === 'facebook') {
                $source = 'facebook_ads';
            } elseif (empty($source)) {
                $source = 'website';
            }
        }

        $service = $request->input('service_requested') 
            ?: $request->input('service_required') 
            ?: $request->input('service') 
            ?: $request->input('subject') 
            ?: $request->input('Service') 
            ?: $request->input('Product') 
            ?: null;

        $notes = $request->input('lead_notes') 
            ?: $request->input('message') 
            ?: $request->input('notes') 
            ?: $request->input('Message') 
            ?: null;

        $campaign = $request->input('campaign_name') 
            ?: $request->input('campaign') 
            ?: $request->input('Campaign') 
            ?: ($source === 'website' ? 'goldenbloom.ae Contact Page' : 'Inbound Campaign');

        $adName = $request->input('ad_name') ?: $request->input('ad_set');

        if (empty($phone) && empty($email)) {
            return response()->json([
                'success' => false,
                'message' => 'Lead rejected: At least Phone or Email is required.',
            ], 422);
        }

        // Clean phone number (strip 'p:' or spaces or letters, preserve leading +)
        $phone = preg_replace('/[^\+0-9]/', '', $phone);

        if (empty($name)) {
            $name = $phone ? ('Lead ' . $phone) : 'Inbound Lead';
        }

        // Gather all dynamic / custom columns sent from Google Sheet or Ads
        $rawCustom = $request->input('custom_fields');
        $extraFields = $request->except([
            'api_key', 'name', 'full_name', 'Client Name', 'Name', 
            'phone', 'phone_number', 'mobile', 'mobile_number', 'contact', 'Phone', 'Phone Number', 
            'email', 'Email', 'email_address', 
            'source', 'Source', 'platform',
            'service_requested', 'service_required', 'service', 'subject', 'Service', 'Product', 
            'lead_notes', 'message', 'notes', 'Message', 
            'campaign_name', 'campaign', 'Campaign', 
            'ad_name', 'ad_set', 'custom_fields'
        ]);

        $customFields = array_merge(
            is_array($rawCustom) ? $rawCustom : [],
            is_array($extraFields) ? $extraFields : []
        );

        // Intelligently construct notes from extra parameters if notes is empty
        if (empty($notes) && !empty($customFields)) {
            $summaryParts = [];
            if (!empty($customFields['villa_location'])) $summaryParts[] = "Location: " . $customFields['villa_location'];
            if (!empty($customFields['property_type'])) $summaryParts[] = "Property: " . ucfirst(str_replace('_', ' ', $customFields['property_type']));
            if (!empty($customFields['project_timeline'])) $summaryParts[] = "Timeline: " . ucfirst(str_replace('_', ' ', $customFields['project_timeline']));
            if (!empty($platform)) $summaryParts[] = "Platform: " . strtoupper($platform);
            if (!empty($customFields['form_name'])) $summaryParts[] = "Form: " . $customFields['form_name'];
            if (!empty($summaryParts)) {
                $notes = implode(" | ", $summaryParts);
            }
        }

        // 3. Duplicate detection by phone
        $existing = null;
        if (!empty($phone)) {
            $existing = Lead::where('phone', $phone)->first();
        }

        $timestamp = date('d M Y, h:i A');

        if ($existing) {
            // Retrieve existing submissions or synthesize initial
            $existingCustom = $existing->custom_fields ?? [];
            $existingSubmissions = !empty($existingCustom['submissions']) && is_array($existingCustom['submissions'])
                ? $existingCustom['submissions']
                : [
                    [
                        'inquiry_number' => 1,
                        'received_at' => $existing->created_at ? $existing->created_at->format('d M Y, h:i A') : $timestamp,
                        'service' => $existing->service_requested,
                        'campaign' => $existing->campaign_name,
                        'source' => $existing->source,
                        'notes' => $existing->lead_notes,
                        'custom_fields' => array_diff_key($existingCustom, ['submissions' => true, 'submissions_count' => true]),
                    ]
                ];

            $newSubmissionNumber = count($existingSubmissions) + 1;
            $newSubmission = [
                'inquiry_number' => $newSubmissionNumber,
                'received_at' => $timestamp,
                'service' => $service ?: $existing->service_requested,
                'campaign' => $campaign ?: $existing->campaign_name,
                'source' => $source,
                'notes' => $notes ?: 'Repeat inquiry submitted',
                'custom_fields' => $customFields,
            ];

            $existingSubmissions[] = $newSubmission;

            // Merge custom fields and attach submissions history
            $mergedCustom = array_merge($existingCustom, $customFields);
            $mergedCustom['submissions'] = $existingSubmissions;
            $mergedCustom['submissions_count'] = count($existingSubmissions);

            $updatedNotes = ($existing->lead_notes ? $existing->lead_notes . "\n\n" : "") 
                . "[Inquiry #{$newSubmissionNumber} on {$timestamp} via {$source}]: " . ($notes ?: ($service ? "Service: {$service}" : "Repeat submission."));

            $existing->update([
                'lead_notes' => $updatedNotes,
                'service_requested' => $service ?: $existing->service_requested,
                'campaign_name' => $campaign ?: $existing->campaign_name,
                'custom_fields' => $mergedCustom,
            ]);

            // Notify Admins about repeat inquiry
            CrmNotification::notifyAdmins(
                "Repeat Inquiry Received! 🔄",
                "{$existing->name} ({$existing->phone}) submitted another inquiry (#{$newSubmissionNumber})" . ($service ? " for {$service}" : ""),
                $existing->id,
                ['lead_id' => $existing->id, 'type' => 'repeat_inquiry', 'client_name' => $existing->name, 'phone' => $existing->phone]
            );

            return response()->json([
                'success' => true,
                'message' => "Repeat inquiry #{$newSubmissionNumber} recorded for {$existing->name}.",
                'lead_id' => $existing->id,
                'submissions_count' => count($existingSubmissions),
                'is_duplicate' => true,
            ]);
        }

        // 4. Inbound leads must always remain Unassigned until Admin manually assigns them
        $assignedTo = null;

        // 5. Structure initial submission for brand new lead
        $initialSubmissions = [
            [
                'inquiry_number' => 1,
                'received_at' => $timestamp,
                'service' => $service,
                'campaign' => $campaign,
                'source' => $source,
                'notes' => $notes,
                'custom_fields' => $customFields,
            ]
        ];
        $customFields['submissions'] = $initialSubmissions;
        $customFields['submissions_count'] = 1;

        // 6. Create new lead
        $newLead = Lead::create([
            'name' => $name,
            'phone' => $phone,
            'email' => $email,
            'source' => $source,
            'status' => 'new',
            'service_requested' => $service,
            'campaign_name' => $campaign,
            'ad_name' => $adName,
            'lead_notes' => $notes,
            'assigned_to' => $assignedTo,
            'assigned_at' => null,
            'custom_fields' => $customFields,
        ]);

        // Notify Admins about new inbound lead
        CrmNotification::notifyAdmins(
            "New Lead Received! 🌿",
            "{$newLead->name} ({$newLead->phone}) submitted an inquiry" . ($service ? " for {$service}" : ""),
            $newLead->id,
            ['lead_id' => $newLead->id, 'type' => 'new_lead', 'client_name' => $newLead->name, 'phone' => $newLead->phone]
        );

        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully.',
            'lead_id' => $newLead->id,
            'assigned_to' => $assignedTo,
            'submissions_count' => 1,
            'custom_fields_saved' => count($customFields),
        ], 201);
    }

    // Get CRM Settings (Admin only)
    public function getSettings(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $secretKey = CrmSetting::get('webhook_secret_key', 'gb_sec_goldenbloom_998124');
        $autoAssign = CrmSetting::get('auto_assign_enabled', '1');
        $companyName = CrmSetting::get('company_name', 'Golden Bloom UAE');
        $websiteUrl = CrmSetting::get('website_url', 'https://goldenbloom.ae');
        $fcmServerKey = CrmSetting::get('fcm_server_key', '');

        $baseUrl = url('/api/webhooks/lead');

        return response()->json([
            'webhook_secret_key' => $secretKey,
            'webhook_url' => $baseUrl,
            'auto_assign_enabled' => $autoAssign === '1',
            'company_name' => $companyName,
            'website_url' => $websiteUrl,
            'fcm_server_key' => $fcmServerKey,
        ]);
    }

    // Update CRM Settings (Admin only)
    public function updateSettings(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'auto_assign_enabled' => 'nullable|boolean',
            'regenerate_key' => 'nullable|boolean',
            'company_name' => 'nullable|string',
            'website_url' => 'nullable|string',
            'fcm_server_key' => 'nullable|string',
        ]);

        if (!empty($validated['regenerate_key'])) {
            $newKey = 'gb_sec_' . bin2hex(random_bytes(10));
            CrmSetting::set('webhook_secret_key', $newKey);
        }

        if (isset($validated['auto_assign_enabled'])) {
            CrmSetting::set('auto_assign_enabled', $validated['auto_assign_enabled'] ? '1' : '0');
        }

        if (isset($validated['company_name'])) {
            CrmSetting::set('company_name', $validated['company_name']);
        }

        if (isset($validated['website_url'])) {
            CrmSetting::set('website_url', $validated['website_url']);
        }

        if (isset($validated['fcm_server_key'])) {
            CrmSetting::set('fcm_server_key', $validated['fcm_server_key']);
        }

        return response()->json([
            'message' => 'Settings saved successfully.',
            'settings' => [
                'webhook_secret_key' => CrmSetting::get('webhook_secret_key'),
                'webhook_url' => url('/api/webhooks/lead'),
                'auto_assign_enabled' => CrmSetting::get('auto_assign_enabled') === '1',
                'company_name' => CrmSetting::get('company_name'),
                'website_url' => CrmSetting::get('website_url'),
                'fcm_server_key' => CrmSetting::get('fcm_server_key'),
            ],
        ]);
    }
}
