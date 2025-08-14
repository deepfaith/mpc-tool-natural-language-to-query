import fs from 'fs';
import path from 'path';

const AUDIT_LOG_DIR = path.resolve(process.cwd(), 'logs');
const AUDIT_LOG_FILE = path.join(AUDIT_LOG_DIR, 'audit.log');

// Ensure logs directory exists
if (!fs.existsSync(AUDIT_LOG_DIR)) {
  fs.mkdirSync(AUDIT_LOG_DIR, { recursive: true });
}

/**
 * Logs an audit entry for a tool/NL API call.
 * @param {object} entry - Audit record { user, method, params, result, role, status, ts }
 */
export async function logAudit(entry = {}) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...entry
    }) + '\n';

    fs.appendFile(AUDIT_LOG_FILE, line, err => {
      if (err) {
        // Don't crash main thread on logging error
        console.warn('[AuditLogger] Could not write log:', err.message);
      }
    });
  } catch (err) {
    console.warn('[AuditLogger] Logging error:', err.message);
  }
}
