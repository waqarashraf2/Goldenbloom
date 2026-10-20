<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add soft deletes to users table
        if (!Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->softDeletes()->after('updated_at');
            });
        }

        // 2. Add assigned_user_name backup column to leads table
        if (!Schema::hasColumn('leads', 'assigned_user_name')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->string('assigned_user_name')->nullable()->after('assigned_to');
            });
        }

        // 3. Backfill assigned_user_name for existing leads
        try {
            DB::statement("
                UPDATE leads l
                JOIN users u ON l.assigned_to = u.id
                SET l.assigned_user_name = u.name
                WHERE l.assigned_to IS NOT NULL AND (l.assigned_user_name IS NULL OR l.assigned_user_name = '')
            ");
        } catch (\Throwable $e) {
            // Ignore if empty
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'deleted_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
        if (Schema::hasColumn('leads', 'assigned_user_name')) {
            Schema::table('leads', function (Blueprint $table) {
                $table->dropColumn('assigned_user_name');
            });
        }
    }
};
