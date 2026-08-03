'use strict'
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// ─── Credentials table (printed to console after seed) ────────────────────────
const CREDENTIALS = [
  { role: 'PATIENT',      email: 'jane.wanjiru@test.com',          password: 'Patient@123',  name: 'Jane Wanjiru' },
  { role: 'PATIENT',      email: 'john.kamau@test.com',            password: 'Patient@123',  name: 'John Kamau' },
  { role: 'PATIENT',      email: 'mary.njeri@test.com',            password: 'Patient@123',  name: 'Mary Njeri' },
  { role: 'DOCTOR',       email: 'dr.omondi@medibook.clinic',      password: 'Doctor@123',   name: 'Dr. James Omondi' },
  { role: 'DOCTOR',       email: 'dr.patel@medibook.clinic',       password: 'Doctor@123',   name: 'Dr. Priya Patel' },
  { role: 'DOCTOR',       email: 'dr.aisha@medibook.clinic',       password: 'Doctor@123',   name: 'Dr. Aisha Hassan' },
  { role: 'RECEPTIONIST', email: 'receptionist@medibook.clinic',   password: 'Recept@123',   name: 'Sarah Waweru' },
  { role: 'IT_ADMIN',     email: 'admin@medibook.clinic',         password: 'Admin@123',    name: 'IT Administrator' },
]

const DOCTOR_PROFILES = [
  { email: 'dr.omondi@medibook.clinic',  specialty: 'General Practice', bio: '15 years of family medicine experience.' },
  { email: 'dr.patel@medibook.clinic',   specialty: 'Cardiology',       bio: 'Specialist in cardiac imaging and interventional cardiology.' },
  { email: 'dr.aisha@medibook.clinic',   specialty: 'Pediatrics',       bio: 'Dedicated to children\'s health and development.' },
]

// ─── Slot generation helper ───────────────────────────────────────────────────
// Mon–Fri, 08:00–17:00, 30-min slots, lunch excluded (12:00–13:00)

function generateSlots(doctorId, daysAhead = 14) {
  const slots = []
  const now = new Date()

  for (let d = -7; d < daysAhead; d++) {
    const day = new Date(now)
    day.setDate(now.getDate() + d)
    day.setHours(0, 0, 0, 0)

    const dow = day.getDay()
    if (dow === 0 || dow === 6) continue // skip weekends

    for (let h = 8; h < 17; h++) {
      if (h === 12) continue // skip lunch hour

      for (const m of [0, 30]) {
        const start = new Date(day)
        start.setHours(h, m, 0, 0)
        const end = new Date(start)
        end.setMinutes(end.getMinutes() + 30)

        slots.push({ doctorId, startTime: start, endTime: end })
      }
    }
  }
  return slots
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  Seeding MediBook database...\n')

  // 1. Clean existing data (order matters due to foreign keys)
  await prisma.auditLog.deleteMany()
  await prisma.medicalRecord.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.slot.deleteMany()
  await prisma.doctor.deleteMany()
  await prisma.user.deleteMany()

  // 2. Create all users
  const userMap = {}
  for (const cred of CREDENTIALS) {
    const passwordHash = await bcrypt.hash(cred.password, 12)
    const user = await prisma.user.create({
      data: {
        name:         cred.name,
        email:        cred.email,
        passwordHash,
        role:         cred.role,
        phone:        cred.role === 'PATIENT' ? '+254700000001' : '+254700000010',
        notifications: {
          smsReminder:     true,
          smsConfirmation: true,
          emailSummary:    true,
        },
      },
    })
    userMap[cred.email] = user
    console.log(`  ✓ User: ${user.name} (${user.role})`)
  }

  // 3. Create doctor profiles
  const doctorMap = {}
  for (const dp of DOCTOR_PROFILES) {
    const user = userMap[dp.email]
    const doctor = await prisma.doctor.create({
      data: {
        userId:    user.id,
        specialty: dp.specialty,
        bio:       dp.bio,
      },
    })
    doctorMap[dp.email] = doctor
    console.log(`  ✓ Doctor profile: ${user.name} — ${dp.specialty}`)
  }

  // 4. Generate slots for each doctor
  for (const dp of DOCTOR_PROFILES) {
    const doctor = doctorMap[dp.email]
    const slots = generateSlots(doctor.id)
    await prisma.slot.createMany({ data: slots })
    console.log(`  ✓ Slots: ${slots.length} slots for ${dp.specialty} doctor`)
  }

  // 5. Create sample appointments (past + upcoming)
  const jane      = userMap['jane.wanjiru@test.com']
  const john      = userMap['john.kamau@test.com']
  const mary      = userMap['mary.njeri@test.com']
  const receptionist = userMap['receptionist@medibook.clinic']

  const omondi  = doctorMap['dr.omondi@medibook.clinic']
  const patel   = doctorMap['dr.patel@medibook.clinic']
  const aisha   = doctorMap['dr.aisha@medibook.clinic']

  // Helper: find the first unbooked slot for a doctor on a given offset from today
  async function getSlot(doctorId, daysOffset) {
    const target = new Date()
    target.setDate(target.getDate() + daysOffset)
    target.setHours(0, 0, 0, 0)
    const end = new Date(target)
    end.setDate(end.getDate() + 1)

    return prisma.slot.findFirst({
      where: { doctorId, startTime: { gte: target, lt: end }, isBooked: false },
      orderBy: { startTime: 'asc' },
    })
  }

  // Past completed appointment — Jane with Dr. Omondi (7 days ago)
  const slot1 = await getSlot(omondi.id, -5)
  if (slot1) {
    const appt1 = await prisma.appointment.create({
      data: {
        patientId:      jane.id,
        doctorId:       omondi.id,
        slotId:         slot1.id,
        status:         'COMPLETED',
        reason:         'Persistent headaches and fatigue',
        createdById:    jane.id,
        createdByName:  jane.name,
        createdByRole:  'PATIENT',
      },
    })
    await prisma.slot.update({ where: { id: slot1.id }, data: { isBooked: true } })

    // Add medical record for this completed appointment
    await prisma.medicalRecord.create({
      data: {
        patientId:      jane.id,
        appointmentId:  appt1.id,
        diagnosis:      'Tension headaches secondary to dehydration and stress. No neurological signs observed.',
        prescription:   'Paracetamol 500mg — twice daily for 5 days. Ibuprofen 400mg — as needed for breakthrough pain.',
        labOrders:      'Full blood count (FBC). Urea and electrolytes (U&E). Thyroid function test (TFT).',
        privateNote:    'Patient appears anxious. Consider referral to counselling if symptoms persist next visit.',
        createdById:    userMap['dr.omondi@medibook.clinic'].id,
        createdByName:  'Dr. James Omondi',
      },
    })
    console.log(`  ✓ Appointment: Jane — Dr. Omondi (COMPLETED + medical record)`)
  }

  // Past completed — John with Dr. Patel (3 days ago)
  const slot2 = await getSlot(patel.id, -3)
  if (slot2) {
    const appt2 = await prisma.appointment.create({
      data: {
        patientId:      john.id,
        doctorId:       patel.id,
        slotId:         slot2.id,
        status:         'COMPLETED',
        reason:         'Chest discomfort during exercise',
        createdById:    john.id,
        createdByName:  john.name,
        createdByRole:  'PATIENT',
      },
    })
    await prisma.slot.update({ where: { id: slot2.id }, data: { isBooked: true } })

    await prisma.medicalRecord.create({
      data: {
        patientId:      john.id,
        appointmentId:  appt2.id,
        diagnosis:      'Exercise-induced angina — mild. ECG shows minor ST changes on exertion.',
        prescription:   'Glyceryl trinitrate (GTN) spray — as needed. Aspirin 75mg — once daily.',
        labOrders:      'Cardiac enzyme panel. Lipid profile. 24-hour Holter monitor.',
        privateNote:    'Ordered echocardiogram. Advise patient to avoid strenuous activity until results.',
        createdById:    userMap['dr.patel@medibook.clinic'].id,
        createdByName:  'Dr. Priya Patel',
      },
    })
    console.log(`  ✓ Appointment: John — Dr. Patel (COMPLETED + medical record)`)
  }

  // Upcoming — Jane with Dr. Aisha (tomorrow)
  const slot3 = await getSlot(aisha.id, 1)
  if (slot3) {
    await prisma.appointment.create({
      data: {
        patientId:      jane.id,
        doctorId:       aisha.id,
        slotId:         slot3.id,
        status:         'CONFIRMED',
        reason:         'Child vaccination schedule review',
        createdById:    jane.id,
        createdByName:  jane.name,
        createdByRole:  'PATIENT',
      },
    })
    await prisma.slot.update({ where: { id: slot3.id }, data: { isBooked: true } })
    console.log(`  ✓ Appointment: Jane — Dr. Aisha (CONFIRMED, tomorrow)`)
  }

  // Upcoming — Mary with Dr. Omondi (in 2 days, booked by receptionist)
  const slot4 = await getSlot(omondi.id, 2)
  if (slot4) {
    await prisma.appointment.create({
      data: {
        patientId:          mary.id,
        doctorId:           omondi.id,
        slotId:             slot4.id,
        status:             'CONFIRMED',
        reason:             'Annual checkup',
        createdById:        receptionist.id,
        createdByName:      receptionist.name,
        createdByRole:      'RECEPTIONIST', // demonstrates audit trail — receptionist booked this
      },
    })
    await prisma.slot.update({ where: { id: slot4.id }, data: { isBooked: true } })
    console.log(`  ✓ Appointment: Mary — Dr. Omondi (CONFIRMED in 2 days, booked by receptionist)`)
  }

  // Walk-in — John with Dr. Patel (today, created by receptionist)
  const slot5 = await getSlot(patel.id, 0)
  if (slot5) {
    await prisma.appointment.create({
      data: {
        patientId:      john.id,
        doctorId:       patel.id,
        slotId:         slot5.id,
        status:         'CONFIRMED',
        reason:         'Walk-in: chest follow-up',
        isWalkIn:       true,
        walkInName:     john.name,
        walkInPhone:    '+254712345678',
        createdById:    receptionist.id,
        createdByName:  receptionist.name,
        createdByRole:  'RECEPTIONIST',
      },
    })
    await prisma.slot.update({ where: { id: slot5.id }, data: { isBooked: true } })
    console.log(`  ✓ Appointment: John — Dr. Patel (walk-in today, booked by receptionist)`)
  }

  // 6. Seed a few audit log entries so the receptionist dashboard has data
  const systemEntries = [
    {
      userId:      jane.id,
      userName:    jane.name,
      userRole:    'PATIENT',
      action:      'LOGIN',
      resource:    'auth',
      description: `${jane.name} signed in`,
    },
    {
      userId:      receptionist.id,
      userName:    receptionist.name,
      userRole:    'RECEPTIONIST',
      action:      'WALK_IN_BOOK',
      resource:    'appointments',
      description: `${receptionist.name} created a walk-in booking for ${john.name} with Dr. Patel`,
    },
    {
      userId:      receptionist.id,
      userName:    receptionist.name,
      userRole:    'RECEPTIONIST',
      action:      'BOOK',
      resource:    'appointments',
      description: `${receptionist.name} booked an appointment for ${mary.name} with Dr. Omondi`,
    },
    {
      userId:      userMap['dr.omondi@medibook.clinic'].id,
      userName:    'Dr. James Omondi',
      userRole:    'DOCTOR',
      action:      'ADD_NOTE',
      resource:    'records',
      description: `Dr. James Omondi added a clinical note for patient ${jane.name}`,
    },
  ]
  await prisma.auditLog.createMany({ data: systemEntries })
  console.log(`  ✓ Audit log: ${systemEntries.length} seed entries`)

  // ── Print credentials table ────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────────────────')
  console.log('  MOCK CREDENTIALS — share these with your team for testing')
  console.log('─────────────────────────────────────────────────────────────────')
  console.log('  ROLE           EMAIL                             PASSWORD       DASHBOARD')
  console.log('─────────────────────────────────────────────────────────────────')
  for (const c of CREDENTIALS) {
    const role  = c.role.padEnd(14)
    const email = c.email.padEnd(41)
    const pass  = c.password.padEnd(14)
    const dash  = `/${c.role.toLowerCase()}`
    console.log(`  ${role} ${email} ${pass} ${dash}`)
  }
  console.log('─────────────────────────────────────────────────────────────────\n')
  console.log('✅  Seed complete. Run `npm run db:studio` to inspect the data.\n')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
