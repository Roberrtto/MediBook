import { Stethoscope, ShieldCheck, CalendarClock, FileLock2 } from 'lucide-react'

const POINTS = [
  { icon: CalendarClock, text: 'Real-time slots, zero double-bookings' },
  { icon: FileLock2, text: 'Records encrypted at rest, AES-256' },
  { icon: ShieldCheck, text: 'Role-based access for every clinic role' },
]

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[42%] flex-col justify-between bg-primary-700 px-10 py-10 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-card bg-white/15">
            <Stethoscope size={19} />
          </div>
          <span className="font-display text-xl font-semibold">MediBook</span>
        </div>

        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Clinic scheduling and records, on one platform.
          </h2>
          <p className="mt-3 max-w-sm text-primary-100">
            Built to replace the appointment book and the filing cabinet with a single
            secure system clinics, doctors, and patients can all trust.
          </p>
          <ul className="mt-8 flex flex-col gap-3.5">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-primary-50">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-primary-200">SWE 2030VA · Software Requirement Engineering · Group 1</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface px-5 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
