import type { IconName } from "@/core/domain/icons";
import { Icon } from "./Icon";

/** An equal-weight quick action in the Payments tab's two-up "Move money" row. */
export function MoveMoneyTile({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: IconName;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button className="move-money-tile" type="button" onClick={onClick}>
      <span className="move-money-tile-icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}
