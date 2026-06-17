import { useEffect, useState } from "react";

interface Props {
  hour12: boolean;
  /** "auto" = browser's local zone, otherwise an IANA zone name. */
  timeZone: string;
}

function greeting(hour: number): string {
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Clock({ hour12, timeZone }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = timeZone === "auto" ? undefined : timeZone;

  // Greeting follows the displayed zone, not the machine's.
  const hourInZone = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(now),
  );

  return (
    <header className="clock">
      <h1 className="clock-time">
        {now.toLocaleTimeString([], {
          hour: hour12 ? "numeric" : "2-digit",
          minute: "2-digit",
          hour12,
          timeZone: tz,
        })}
      </h1>
      <p className="clock-greeting">
        {greeting(hourInZone)} ·{" "}
        {now.toLocaleDateString([], {
          weekday: "long",
          month: "long",
          day: "numeric",
          timeZone: tz,
        })}
        {tz && ` · ${tz.split("/").pop()?.replace(/_/g, " ")}`}
      </p>
    </header>
  );
}
