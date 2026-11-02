import {
  buildGoogleCalendarUrl,
  formatIndonesianDate,
  formatTimeRange,
} from "@/lib/invitations/format";
import type { PublicSchedule } from "@/lib/invitations/types";
import { SectionHeading } from "@/components/invitation/sections/section-heading";

/** Only rendered when at least one EventSchedule exists. Rows divided by hairlines, no cards. */
export function ScheduleSection({ schedules }: { schedules: PublicSchedule[] }) {
  if (schedules.length === 0) return null;

  return (
    <section aria-labelledby="schedule-heading" className="px-8 py-20">
      <div className="mx-auto max-w-md">
        <SectionHeading id="schedule-heading">Rangkaian Acara</SectionHeading>

        <ol className="divide-y divide-[color:var(--ii-secondary)] border-y border-[color:var(--ii-secondary)]">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="py-8">
              <p
                className="text-2xl text-[color:var(--ii-primary)]"
                style={{ fontFamily: "var(--ii-heading-font)" }}
              >
                {schedule.title}
              </p>
              <dl className="mt-4 grid grid-cols-[5rem_1fr] gap-y-2 text-sm text-[color:var(--ii-text)]">
                <dt className="pt-0.5 text-[11px] tracking-[0.2em] uppercase opacity-60">
                  Tanggal
                </dt>
                <dd>{formatIndonesianDate(schedule.date)}</dd>
                <dt className="pt-0.5 text-[11px] tracking-[0.2em] uppercase opacity-60">Waktu</dt>
                <dd>{formatTimeRange(schedule.startTime, schedule.endTime)}</dd>
                {schedule.venue && (
                  <>
                    <dt className="pt-0.5 text-[11px] tracking-[0.2em] uppercase opacity-60">
                      Tempat
                    </dt>
                    <dd>
                      <span className="text-[color:var(--ii-primary)]">{schedule.venue.name}</span>
                      <span className="block opacity-80">{schedule.venue.address}</span>
                    </dd>
                  </>
                )}
              </dl>
              {schedule.description && (
                <p className="mt-4 text-sm text-[color:var(--ii-text)] opacity-80">
                  {schedule.description}
                </p>
              )}
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <a
                  href={buildGoogleCalendarUrl(schedule)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[color:var(--ii-primary)] underline underline-offset-4"
                >
                  Simpan Tanggal
                </a>
                {schedule.venue?.mapUrl && (
                  <a
                    href={schedule.venue.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[color:var(--ii-primary)] underline underline-offset-4"
                  >
                    Buka Peta
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
