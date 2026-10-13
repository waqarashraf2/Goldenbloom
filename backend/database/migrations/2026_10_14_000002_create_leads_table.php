<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->index();
            $table->string('email')->nullable();
            $table->string('source')->default('website'); // website, facebook_ads, google_sheet, csv_import, manual
            $table->string('status')->default('new'); // new, connected, not_connected, follow_up, interested, not_interested, closed_won, closed_lost
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->string('service_requested')->nullable();
            $table->string('campaign_name')->nullable();
            $table->string('ad_name')->nullable();
            $table->text('lead_notes')->nullable();
            $table->json('custom_fields')->nullable();
            $table->string('last_call_status')->nullable(); // connected, no_answer, busy, switched_off, callback_requested
            $table->timestamp('last_contacted_at')->nullable();
            $table->dateTime('next_follow_up_date')->nullable();
            $table->integer('call_attempts')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
