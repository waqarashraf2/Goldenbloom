<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $users = User::withCount(['leads', 'callLogs'])->latest()->get();

        return response()->json($users);
    }

    public function store(Request $request)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $allowedRoles = $request->user()->role === 'super_admin' ? 'super_admin,admin,telecaller' : 'telecaller';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'role' => 'required|string|in:' . $allowedRoles,
            'allowed_tabs' => 'nullable|array',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'is_active' => true,
            'allowed_tabs' => $validated['allowed_tabs'] ?? (in_array($validated['role'], ['admin', 'super_admin'])
                ? ['dashboard', 'leads', 'followups', 'telecallers', 'import', 'settings', 'reports', 'activities', 'integrations']
                : ['leads', 'followups', 'call_history']),
        ]);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    public function update(Request $request, User $user)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $allowedRoles = $request->user()->role === 'super_admin' ? 'super_admin,admin,telecaller' : 'telecaller';

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'phone' => 'nullable|string|max:50',
            'role' => 'nullable|string|in:' . $allowedRoles,
            'is_active' => 'nullable|boolean',
            'allowed_tabs' => 'nullable|array',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 422);
        }

        if ($user->role === 'super_admin') {
            return response()->json(['message' => 'Super Admin account cannot be deleted.'], 403);
        }

        if ($user->role === 'admin' && $request->user()->role !== 'super_admin') {
            return response()->json(['message' => 'Only Super Admin can delete admin accounts.'], 403);
        }

        $reassignTo = $request->input('reassign_to');
        $leadCount = $user->leads()->count();

        if (!empty($reassignTo) && $reassignTo !== 'unassigned') {
            $targetUser = User::find($reassignTo);
            if (!$targetUser) {
                return response()->json(['message' => 'The selected telecaller to reassign leads does not exist.'], 422);
            }
            $user->leads()->update([
                'assigned_to' => $targetUser->id,
                'assigned_at' => now(),
            ]);
            $actionMsg = "{$leadCount} lead(s) successfully reassigned to {$targetUser->name}.";
        } else {
            // Move leads to Unassigned Pool (Triage) for Admin & Super Admin review
            $user->leads()->update([
                'assigned_to' => null,
                'assigned_at' => null,
            ]);
            $actionMsg = "{$leadCount} lead(s) moved to Unassigned Triage pool.";
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'message' => "Team member \"{$userName}\" deleted successfully. {$actionMsg}",
            'reassigned_count' => $leadCount,
        ]);
    }
}
