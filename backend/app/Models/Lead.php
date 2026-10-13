<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'email',
        'source',
        'status',
        'assigned_to',
        'assigned_at',
        'service_requested',
        'campaign_name',
        'ad_name',
        'lead_notes',
        'custom_fields',
        'last_call_status',
        'last_contacted_at',
        'next_follow_up_date',
        'call_attempts',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'assigned_at' => 'datetime',
            'last_contacted_at' => 'datetime',
            'next_follow_up_date' => 'datetime',
            'call_attempts' => 'integer',
        ];
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class)->orderBy('created_at', 'desc');
    }
}
