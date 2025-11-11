"use client";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between shadow-lg">
      <Link href="/" className="text-2xl font-extrabold tracking-tight">TrackFit</Link>
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/workouts">Allenamenti</Link>
        <Link href="/subscription">Abbonamento</Link>
        <Link href="/coaches">Coach</Link>
        <Link href="/gyms">Palestre</Link>
        <Link href="/reports">Report</Link>
      </div>
    </nav>
  );
}