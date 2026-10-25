<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CrmNotification extends Model
{
    use HasFactory;

    protected $table = 'crm_notifications';

    protected $fillable = [
        'user_id',
        'title',
        'message',
        'type',
        'lead_id',
        'data',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Dispatch notification to all active Admins & Super Admins
     */
    public static function notifyAdmins(string $title, string $message, ?int $leadId = null, array $data = []): void
    {
        try {
            $admins = User::whereIn('role', ['admin', 'super_admin'])
                ->where('is_active', true)
                ->get();

            $now = now();
            $records = [];
            foreach ($admins as $admin) {
                $records[] = [
                    'user_id' => $admin->id,
                    'title' => $title,
                    'message' => $message,
                    'type' => $data['type'] ?? 'new_lead',
                    'lead_id' => $leadId,
                    'data' => json_encode($data),
                    'is_read' => false,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if (!empty($records)) {
                static::insert($records);
            }

            // 1. Trigger Real-time FCM Mobile Push (Lock Screen & Banner)
            \App\Services\FcmService::sendToAdmins(
                $title,
                $message,
                array_merge($data, ['lead_id' => $leadId, 'type' => $data['type'] ?? 'new_lead'])
            );

            // 2. Trigger Instant WhatsApp Alert to configured Admin Phone Numbers
            if ($leadId) {
                $lead = Lead::find($leadId);
                if ($lead) {
                    \App\Services\WhatsAppService::sendNewLeadAlert($lead);
                }
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to notify admins: ' . $e->getMessage());
        }
    }

    /**
     * Dispatch notification to a specific user (e.g. telecaller on assignment)
     */
    public static function notifyUser(int $userId, string $title, string $message, ?int $leadId = null, array $data = []): void
    {
        try {
            $targetUser = User::find($userId);
            if (!$targetUser || !$targetUser->is_active) {
                return;
            }

            static::create([
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $data['type'] ?? 'lead_assigned',
                'lead_id' => $leadId,
                'data' => $data,
                'is_read' => false,
            ]);

            // 1. Trigger Real-time FCM Mobile Push (Lock Screen & Banner)
            \App\Services\FcmService::sendToUser(
                $userId,
                $title,
                $message,
                array_merge($data, ['lead_id' => $leadId, 'type' => $data['type'] ?? 'lead_assigned'])
            );

            // 2. Trigger Instant WhatsApp Alert to assigned Telecaller's phone
            if ($leadId) {
                $lead = Lead::find($leadId);
                if ($lead) {
                    \App\Services\WhatsAppService::sendAssignmentAlert($lead, $targetUser);
                }
            }
        } catch (\Throwable $e) {
            \Log::error('Failed to notify user: ' . $e->getMessage());
        }
    }
}
