import { useNotificationsViewModel } from "@/core/viewmodels/useSettingsViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function NotificationsScreen() {
  const vm = useNotificationsViewModel();

  return (
    <div className="onboarding-page notifications-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Notification options" />

      {vm.unread > 0 && (
        <button className="text-button mark-all-read" type="button" onClick={vm.markAllRead}>
          Mark all as read
        </button>
      )}

      {vm.isEmpty ? (
        <StateBlock tone="empty" message="Nothing here yet. Payments and security alerts will show up." />
      ) : (
        <section className="notification-list" aria-label="Notifications">
          {vm.items.map((item) => (
            <button
              type="button"
              className={item.read ? "notification-row" : "notification-row is-unread"}
              key={item.id}
              onClick={() => vm.open(item.id)}
            >
              <span className="notification-icon">
                <Icon name={item.icon} />
              </span>
              <span className="notification-copy">
                <strong>{item.title}</strong>
                <small>{item.body}</small>
                <small className="notification-when">{item.when}</small>
              </span>
              {!item.read && <span className="unread-dot" aria-label="Unread" />}
            </button>
          ))}
        </section>
      )}
    </div>
  );
}
