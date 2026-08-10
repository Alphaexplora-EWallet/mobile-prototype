import type { ReactNode } from "react";
import type { IconName } from "@/core/domain/icons";
import { Icon } from "./Icon";

export function ControlRow({
  icon,
  title,
  detail,
  trailing,
}: {
  icon: IconName;
  title: string;
  detail: string;
  trailing: ReactNode;
}) {
  return (
    <div className="control-row">
      <span className="control-icon">
        <Icon name={icon} />
      </span>
      <span className="control-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="control-trailing">{trailing}</span>
    </div>
  );
}
