/**
 * =========================================================================
 * GOLDEN BLOOM CRM - 1-CLICK GOOGLE SHEET AUTO-SYNC SCRIPT
 * Target Website: https://goldenbloom.ae
 * =========================================================================
 * 
 * HIDAYAT (NON-TECHNICAL USERS KE LIYE):
 * 1. Apni Google Sheet kholen jahan Facebook Ads ya Google Forms ka data aata hai.
 * 2. Upar menu mein "Extensions" par click karen, phir "Apps Script" par click karen.
 * 3. Jo purana code wahan likha ho, usay select karke delete kar den.
 * 4. Neeche diya gaya poora code wahan paste kar den.
 * 5. Upar "Save" icon par click karen.
 * 6. "Run" button ke sath drop-down se "setupTrigger" select karen aur "Run" par click kar den.
 * 
 * BAS! Ab jaise hi Sheet mein koi nayi row aayegi, woh foran Golden Bloom CRM mein auto-sync ho kar
 * Telecaller ko assign ho jayegi.
 * =========================================================================
 */

// CRM Webhook Configuration
const CRM_WEBHOOK_URL = "http://127.0.0.1:8000/api/webhooks/lead";
const CRM_SECRET_KEY  = "gb_sec_goldenbloom_998124";

/**
 * Ye function automatic run hoga jab bhi koi row add ya edit hogi
 */
function onFormSubmitOrEdit(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Agar sirf header hai ya sheet khali hai to ruk jao
  if (lastRow < 2) return;

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const rowData = sheet.getRange(lastRow, 1, 1, lastCol).getValues()[0];

  // Lead Data Object
  let payload = {
    api_key: CRM_SECRET_KEY,
    source: "google_sheet",
    name: "",
    phone: "",
    email: "",
    service_requested: "",
    message: "",
    custom_fields: {} // Naye aur extra columns automatically yahan save honge
  };

  for (let i = 0; i < headers.length; i++) {
    const headerTitle = String(headers[i]).trim();
    const colName = headerTitle.toLowerCase();
    const value = rowData[i];

    if (value === null || value === undefined || String(value).trim() === "") continue;

    // Smart Column Matching
    if ((colName.includes("name") || colName.includes("client")) && !payload.name) {
      payload.name = String(value);
    } else if ((colName.includes("phone") || colName.includes("mobile") || colName.includes("contact") || colName.includes("number")) && !payload.phone) {
      payload.phone = String(value);
    } else if ((colName.includes("email") || colName.includes("mail")) && !payload.email) {
      payload.email = String(value);
    } else if ((colName.includes("service") || colName.includes("product") || colName.includes("requirement") || colName.includes("flower")) && !payload.service_requested) {
      payload.service_requested = String(value);
    } else if ((colName.includes("note") || colName.includes("message") || colName.includes("detail")) && !payload.message) {
      payload.message = String(value);
    } else {
      // Har extra column (City, Budget, Instagram, Event Date, etc.) automatically custom_fields mein jayega!
      payload.custom_fields[headerTitle] = value;
    }
  }

  // Send to Golden Bloom CRM
  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, options);
    Logger.log("Golden Bloom CRM Response: " + response.getContentText());
  } catch (err) {
    Logger.log("Failed to sync lead with CRM: " + err);
  }
}

/**
 * Trigger install karne ke liye ek dafa is function ko select karke 'Run' karen:
 */
function setupTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Remove duplicate triggers if any
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // 1. Trigger for Google Forms attached to sheet
  ScriptApp.newTrigger("onFormSubmitOrEdit")
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  // 2. Trigger for automated row additions / Zapier / Meta integrations
  ScriptApp.newTrigger("onFormSubmitOrEdit")
    .forSpreadsheet(ss)
    .onChange()
    .create();

  Logger.log("SUCCESS! Golden Bloom CRM Auto-Sync Trigger is now ACTIVE!");
}
