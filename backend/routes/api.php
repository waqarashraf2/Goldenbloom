<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CallLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LeadController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WebhookController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/webhooks/lead', [WebhookController::class, 'incomingLead']);

// Protected routes (Sanctum Authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard & Analytics
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Leads Management
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);
    Route::post('/leads/assign', [LeadController::class, 'assign']);
    Route::post('/leads/auto-distribute', [LeadController::class, 'autoDistribute']);
    Route::post('/leads/import-csv', [LeadController::class, 'importCsv']);
    Route::get('/leads-export', [LeadController::class, 'exportCsv']);

    // Call Logging & Interaction History
    Route::get('/call-logs', [CallLogController::class, 'index']);
    Route::post('/call-logs', [CallLogController::class, 'store']);

    // Telecaller & User Management (Admin)
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    // CRM Settings & Webhook Key Config
    Route::get('/settings', [WebhookController::class, 'getSettings']);
    Route::post('/settings', [WebhookController::class, 'updateSettings']);
});
