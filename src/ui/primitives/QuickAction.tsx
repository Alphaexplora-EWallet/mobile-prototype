import type { IconName } from "@/core/domain/icons";
import { Icon } from "./Icon";

export function QuickAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      <span>
        <Icon name={icon} />
      </span>
      <small>{label}</small>
    </button>
  );
}
