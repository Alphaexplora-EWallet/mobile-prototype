import type { ReactNode } from "react";

export function Trait({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="trait">
      <span>{icon}</span>
      <small>{label}</small>
    </div>
  );
}
