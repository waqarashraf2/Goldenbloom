# 🌸 Golden Bloom CRM — Leads & Telecalling Management System

Website: [https://goldenbloom.ae](https://goldenbloom.ae)  
Target Contact Page: [https://goldenbloom.ae/contact/](https://goldenbloom.ae/contact/)

---

## 🚀 1-Click Startup Guide

To start the CRM, simply double-click:
```bat
C:\xampp\htdocs\Clients Projects\goldenbloom\start-crm.bat
```
This launcher will automatically:
1. Start the **Laravel Backend API** on port `8000` (`http://127.0.0.1:8000/api`)
2. Start the **Next.js Frontend** on port `3000` (`http://localhost:3000`)
3. Automatically open your default web browser to the CRM login page.

---

## 🔑 Default Accounts (1-Click Quick Demo Login)

The login screen features a 1-click credential switcher for immediate access:

| Role | Email | Password | Access & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@goldenbloom.ae` | `password123` | **Full Enterprise Access**: All leads, Telecaller performance inspector, Tab access permissions, Google Sheets visual studio, CSV Import, Round-Robin auto-distribute. |
| **Telecaller 1** | `sarah@goldenbloom.ae` | `password123` | **Strictly Restricted**: Only assigned leads, Call logging (Connected, Busy, No Answer, Switched Off, Callback), Follow-up schedules, Client discussion notes. |
| **Telecaller 2** | `ali@goldenbloom.ae` | `password123` | **Strictly Restricted**: Only assigned leads, Call logs history, Follow-up reminders. |

---

## 📊 Core Features & Architecture

### 1. Multi-Role & Strict Data Privacy (RBAC)
- **Admin**: Complete business overview, telecaller deep-dive inspector, audit trail, enable/disable sidebar tabs per user.
- **Telecallers**: Only see leads explicitly assigned to them. Unassigned and other agents' leads are strictly inaccessible.

### 2. Google Sheet Studio & Dynamic Column Mapper
- **CRM Tab**: **"Google Sheets & Webhooks"**
- For Meta, Instagram, TikTok, or custom event campaigns:
  - Match CRM fields with custom Google Sheet column headers using the visual 2-column mapper.
  - Automatically generates ready-to-paste Google Apps Scripts.
  - Syncs dynamic campaign columns directly into the CRM without database changes.
- Standalone File: [`GOOGLE_SHEET_SYNC_SCRIPT.js`](file:///C:/xampp/htdocs/Clients%20Projects/goldenbloom/GOOGLE_SHEET_SYNC_SCRIPT.js)

### 3. Website Contact Form Webhook
- Target Page: `https://goldenbloom.ae/contact/`
- Integration Script: `WEBSITE_CONTACT_FORM_INTEGRATION.html`
- Directly submits new enquiries to the CRM endpoint with auto Round-Robin distribution.

### 4. Telecaller Call Workflow & Deep-Dive Inspector
- **Call Statuses**: `Connected`, `Line Busy`, `Ringing / No Answer`, `Switched Off`, `Asked to Call Back`.
- **Call Outcomes**: Interested / Send Quote, Follow-up Scheduled, Meeting Scheduled, Deal Closed (Won), Lost.
- **Admin Inspector**: Click any telecaller on the Dashboard to inspect their exact busy count, connection rate, and conversation remarks stream.

---

## 🛠️ Tech Stack & Database
- **Backend**: Laravel 12 API (PHP 8.2+) with Laravel Sanctum
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Database**: MySQL (`goldenbloom_crm` on `127.0.0.1:3306`)
