import React from "react";

interface CardProps { title?: string; children: React.ReactNode; className?: string; }

export function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 ${className}`}>
      {title && <h2 className="text-lg font-bold mb-4 text-gray-800">{title}</h2>}
      {children}
    </div>
  );
}