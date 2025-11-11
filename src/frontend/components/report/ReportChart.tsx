"use client";
import { Report } from "@backend/domain/model/types";

interface ReportChartProps { report: Report; }

export function ReportChart({ report }: ReportChartProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Report â€“ {report.periodo}</h2>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-blue-700">{report.distanzaTotale?.toFixed(1) ?? "â€”"}</p>
          <p className="text-xs text-gray-500 mt-1">km totali</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-green-700">{report.tempoTotaleMinuti ?? "â€”"}</p>
          <p className="text-xs text-gray-500 mt-1">minuti totali</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-2xl font-extrabold text-orange-600">{report.ritmoMedio?.toFixed(2) ?? "â€”"}</p>
          <p className="text-xs text-gray-500 mt-1">min/km medio</p>
        </div>
      </div>
      {/* TODO: aggiungere grafico settimanale con recharts o chart.js */}
    </div>
  );
}