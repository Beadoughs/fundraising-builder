"use client";

import { useEffect, useState } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

function getTimeLeft(endDate: string): TimeLeft {
  const diff = new Date(endDate).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, ended: false };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => getTimeLeft(endDate));

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(endDate));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endDate]);

  if (timeLeft.ended) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
        This fundraiser has ended — thank you for your support!
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="rounded-xl border border-brand/15 bg-brand/5 px-4 py-4">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-brand">
        Time left to order
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="rounded-lg bg-white px-2 py-2.5 text-center shadow-sm sm:px-3"
          >
            <p className="text-xl font-bold tabular-nums text-brand sm:text-2xl">
              {unit.label === "Days" ? unit.value : pad(unit.value)}
            </p>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 sm:text-xs">
              {unit.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
