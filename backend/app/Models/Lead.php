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
        'assigned_user_name',
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

    protected $appends = [
        'submissions_count',
        'submissions',
    ];

    public function getSubmissionsAttribute(): array
    {
        $custom = $this->custom_fields ?? [];
        if (!empty($custom['submissions']) && is_array($custom['submissions'])) {
            return $custom['submissions'];
        }

        // Return synthesized initial submission
        return [
            [
                'inquiry_number' => 1,
                'received_at' => $this->created_at ? $this->created_at->format('d M Y, h:i A') : 'Initial Ingestion',
                'service' => $this->service_requested,
                'campaign' => $this->campaign_name,
                'source' => $this->source,
                'notes' => $this->lead_notes,
                'custom_fields' => array_diff_key($custom, ['submissions' => true, 'submissions_count' => true]),
            ]
        ];
    }

    public function getSubmissionsCountAttribute(): int
    {
        $custom = $this->custom_fields ?? [];
        if (!empty($custom['submissions_count'])) {
            return (int) $custom['submissions_count'];
        }
        if (!empty($custom['submissions']) && is_array($custom['submissions'])) {
            return count($custom['submissions']);
        }
        return 1;
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to')->withTrashed();
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class)->orderBy('created_at', 'desc');
    }
}
