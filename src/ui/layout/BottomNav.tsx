import type { TabScreen } from "@/core/navigation/screens";
import { TAB_ITEMS } from "@/core/navigation/screens";
import { Icon } from "../primitives/Icon";

export function BottomNav({ active, onNavigate }: { active: TabScreen; onNavigate: (tab: TabScreen) => void }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {TAB_ITEMS.map((item) => (
        <button
          className={active === item.id ? "is-active" : ""}
          type="button"
          key={item.id}
          onClick={() => onNavigate(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
