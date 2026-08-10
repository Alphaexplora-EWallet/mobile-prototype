import type { IconName } from "@/core/domain/icons";
import { Icon } from "./Icon";

export function LinkRow({
  icon,
  title,
  detail,
  meta,
  selected,
  onClick,
}: {
  icon: IconName;
  title: string;
  detail: string;
  meta?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`link-row ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="control-icon">
        <Icon name={icon} />
      </span>
      <span className="control-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="link-row-trailing">
        {meta && <small>{meta}</small>}
        <Icon name={selected ? "check" : "chevron-right"} />
      </span>
    </button>
  );
}
