<?php

use App\Models\CallLog;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Setup Super Admin
        User::updateOrCreate(
            ['email' => 'superadmin@goldenbloom.ae'],
            [
                'name' => 'Golden Bloom Super Admin',
                'password' => Hash::make('Golden@123'),
                'role' => 'super_admin',
                'phone' => '+971500000001',
                'is_active' => true,
                'allowed_tabs' => ['dashboard', 'leads', 'followups', 'telecallers', 'import', 'settings', 'reports', 'activities', 'integrations'],
            ]
        );

        // 2. Setup Admin
        User::updateOrCreate(
            ['email' => 'admin@goldenbloom.ae'],
            [
                'name' => 'Golden Bloom Admin',
                'password' => Hash::make('GoldenBloom@123'),
                'role' => 'admin',
                'phone' => '+971500000000',
                'is_active' => true,
                'allowed_tabs' => ['dashboard', 'leads', 'followups', 'telecallers', 'import', 'settings', 'reports', 'activities', 'integrations'],
            ]
        );

        // 3. Clean Demo Data (Test/Sample leads and test call logs)
        CallLog::query()->delete();
        Lead::query()->delete();
    }

    public function down(): void
    {
        // No rollback needed for demo data wipe
    }
};
