<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CrmNotification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get recent notifications for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = CrmNotification::where('user_id', $user->id)
            ->latest()
            ->take(30)
            ->get();

        $unreadCount = CrmNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Fast polling endpoint for new unread notifications
     */
    public function unread(Request $request)
    {
        $user = $request->user();
        $sinceId = (int) $request->query('since_id', 0);

        $query = CrmNotification::where('user_id', $user->id)
            ->where('is_read', false);

        if ($sinceId > 0) {
            $query->where('id', '>', $sinceId);
        }

        $newNotifications = $query->latest()->take(10)->get();

        $totalUnreadCount = CrmNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'new_notifications' => $newNotifications,
            'unread_count' => $totalUnreadCount,
        ]);
    }

    /**
     * Mark notification(s) as read
     */
    public function markAsRead(Request $request)
    {
        $user = $request->user();
        $id = $request->input('id');

        if ($id) {
            CrmNotification::where('user_id', $user->id)
                ->where('id', $id)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        } else {
            CrmNotification::where('user_id', $user->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        }

        $remainingUnread = CrmNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'unread_count' => $remainingUnread,
        ]);
    }

    /**
     * Delete/Clear all read notifications for user
     */
    public function clear(Request $request)
    {
        $user = $request->user();

        CrmNotification::where('user_id', $user->id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notifications cleared.',
            'unread_count' => 0,
        ]);
    }
}
