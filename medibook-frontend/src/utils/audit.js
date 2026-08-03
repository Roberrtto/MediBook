'use strict'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

/**
 * Write a row to the AuditLog table.
 * Called on every mutation in the system — no change can happen without a trace.
 *
 * @param {{
 *   user:       { id: string, name: string, role: string },
 *   action:     string,   // BOOK | CANCEL | RESCHEDULE | ADD_NOTE | LOGIN | LOGOUT | REGISTER | UPDATE_PREFS | WALK_IN_BOOK
 *   resource:   string,   // appointments | records | users | auth
 *   resourceId: string?,
 *   description: string,  // human-readable — shown in the receptionist audit log UI
 *   metadata:   object?,  // { before, after } for UPDATE actions
 *   ipAddress:  string?,
 * }}
 */
async function writeAudit({ user, action, resource, resourceId, description, metadata, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:      user.id,
        userName:    user.name,
        userRole:    user.role,
        action,
        resource,
        resourceId:  resourceId || null,
        description,
        metadata:    metadata   || null,
        ipAddress:   ipAddress  || null,
      },
    })
  } catch (err) {
    // Audit failures must never crash the main request — log and continue.
    console.error('[AUDIT] Failed to write audit log:', err.message)
  }
}

module.exports = { writeAudit }
