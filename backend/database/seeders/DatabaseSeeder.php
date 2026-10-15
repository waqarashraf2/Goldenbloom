<?php

namespace Database\Seeders;

use App\Models\CallLog;
use App\Models\CrmSetting;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin@goldenbloom.ae'],
            [
                'name' => 'Golden Bloom Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone' => '+971500000000',
                'is_active' => true,
                'allowed_tabs' => ['dashboard', 'leads', 'followups', 'telecallers', 'import', 'settings', 'reports'],
            ]
        );

        // 2. Create Telecallers
        $telecaller1 = User::firstOrCreate(
            ['email' => 'sarah@goldenbloom.ae'],
            [
                'name' => 'Sarah Khan',
                'password' => Hash::make('password123'),
                'role' => 'telecaller',
                'phone' => '+971501234567',
                'is_active' => true,
                'allowed_tabs' => ['leads', 'followups', 'call_history'],
            ]
        );

        $telecaller2 = User::firstOrCreate(
            ['email' => 'ali@goldenbloom.ae'],
            [
                'name' => 'Ali Raza',
                'password' => Hash::make('password123'),
                'role' => 'telecaller',
                'phone' => '+971509876543',
                'is_active' => true,
                'allowed_tabs' => ['leads', 'followups', 'call_history'],
            ]
        );

        // 3. Settings
        CrmSetting::set('webhook_secret_key', 'gb_sec_goldenbloom_998124');
        CrmSetting::set('auto_assign_enabled', '0');
        CrmSetting::set('company_name', 'Golden Bloom UAE');
        CrmSetting::set('website_url', 'https://goldenbloom.ae');

        // 4. Sample Leads
        $lead1 = Lead::firstOrCreate(
            ['phone' => '+971521112233'],
            [
                'name' => 'Fatima Al Mansoori',
                'email' => 'fatima.m@example.com',
                'source' => 'website',
                'status' => 'follow_up',
                'assigned_to' => $telecaller1->id,
                'assigned_at' => now()->subDays(1),
                'service_requested' => 'Luxury Wedding Flower Decoration',
                'campaign_name' => 'Website Contact Form',
                'lead_notes' => 'Inquired via goldenbloom.ae/contact. Needs floral setup for a 200-guest ballroom in Dubai.',
                'last_call_status' => 'connected',
                'last_contacted_at' => now()->subHours(4),
                'next_follow_up_date' => now()->addDay()->setHour(14)->setMinute(0),
                'call_attempts' => 1,
            ]
        );

        $lead2 = Lead::firstOrCreate(
            ['phone' => '+971554445566'],
            [
                'name' => 'Rashid Al Nuaimi',
                'email' => 'rashid.nuaimi@example.com',
                'source' => 'facebook_ads',
                'status' => 'interested',
                'assigned_to' => $telecaller1->id,
                'assigned_at' => now()->subDays(2),
                'service_requested' => 'Corporate Event Florals & Gifting',
                'campaign_name' => 'FB_Dubai_Luxury_Gifting_Oct',
                'ad_name' => 'Video_Ad_Roses_Bouquet',
                'lead_notes' => 'Filled Facebook Instant Lead Form. Wants monthly corporate arrangement subscription.',
                'last_call_status' => 'connected',
                'last_contacted_at' => now()->subHours(2),
                'next_follow_up_date' => now()->addDays(2)->setHour(11)->setMinute(30),
                'call_attempts' => 2,
            ]
        );

        $lead3 = Lead::firstOrCreate(
            ['phone' => '+971567778899'],
            [
                'name' => 'Mariam Al Qasimi',
                'email' => 'mariam.q@example.com',
                'source' => 'google_sheet',
                'status' => 'not_connected',
                'assigned_to' => $telecaller2->id,
                'assigned_at' => now()->subHours(6),
                'service_requested' => 'Anniversary Flower Box Delivery',
                'campaign_name' => 'Influencer Sheet Sync',
                'lead_notes' => 'Imported automatically from Google Sheet sync.',
                'last_call_status' => 'no_answer',
                'last_contacted_at' => now()->subHours(3),
                'next_follow_up_date' => now()->setHour(17)->setMinute(0),
                'call_attempts' => 1,
            ]
        );

        $lead4 = Lead::firstOrCreate(
            ['phone' => '+971503332211'],
            [
                'name' => 'Zayd Al Hashimi',
                'email' => 'zayd.hashimi@example.com',
                'source' => 'website',
                'status' => 'new',
                'assigned_to' => null, // Unassigned!
                'service_requested' => 'Custom Bridal Bouquet & Car Decor',
                'campaign_name' => 'Website Direct',
                'lead_notes' => 'Urgent inquiry received on website contact page for this weekend.',
                'call_attempts' => 0,
            ]
        );

        $lead5 = Lead::firstOrCreate(
            ['phone' => '+971589991122'],
            [
                'name' => 'Hessa Al Suwaidi',
                'email' => 'hessa.s@example.com',
                'source' => 'facebook_ads',
                'status' => 'closed_won',
                'assigned_to' => $telecaller2->id,
                'assigned_at' => now()->subDays(3),
                'service_requested' => 'VIP Flower Hamper Delivery - Downtown Dubai',
                'campaign_name' => 'FB_VIP_Bouquets',
                'lead_notes' => 'Payment received via payment link. Order confirmed!',
                'last_call_status' => 'connected',
                'last_contacted_at' => now()->subDays(1),
                'call_attempts' => 3,
            ]
        );

        // 5. Sample Call Logs
        CallLog::create([
            'lead_id' => $lead1->id,
            'user_id' => $telecaller1->id,
            'call_status' => 'connected',
            'outcome' => 'follow_up',
            'notes' => 'Connected with client Fatima. She likes our portfolio. Sent brochure on WhatsApp, follow up tomorrow at 2 PM to finalize package.',
            'follow_up_date' => now()->addDay()->setHour(14)->setMinute(0),
            'duration_seconds' => 195,
        ]);

        CallLog::create([
            'lead_id' => $lead2->id,
            'user_id' => $telecaller1->id,
            'call_status' => 'connected',
            'outcome' => 'interested',
            'notes' => 'Rashid wants weekly fresh flowers for 3 office branches in Business Bay. Requested official quote.',
            'follow_up_date' => now()->addDays(2)->setHour(11)->setMinute(30),
            'duration_seconds' => 340,
        ]);

        CallLog::create([
            'lead_id' => $lead3->id,
            'user_id' => $telecaller2->id,
            'call_status' => 'no_answer',
            'outcome' => 'not_connected',
            'notes' => 'Call rang, no answer. Left a WhatsApp message and scheduled retry for this evening.',
            'follow_up_date' => now()->setHour(17)->setMinute(0),
            'duration_seconds' => 30,
        ]);

        CallLog::create([
            'lead_id' => $lead5->id,
            'user_id' => $telecaller2->id,
            'call_status' => 'connected',
            'outcome' => 'closed_won',
            'notes' => 'Deal closed! Client placed order for 5 luxury orchid hampers for corporate partners. Delivery scheduled for Friday.',
            'duration_seconds' => 480,
        ]);
    }
}
