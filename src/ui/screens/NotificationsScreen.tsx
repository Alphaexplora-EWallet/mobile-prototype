import { useNotificationsViewModel } from "@/core/viewmodels/useSettingsViewModel";
import { PageBar } from "../layout/PageBar";
import { ControlRow } from "../primitives/ControlRow";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";
import { Toggle } from "../primitives/Toggle";

export function NotificationsScreen() {
  const vm = useNotificationsViewModel();

  return (
    <div className="onboarding-page notifications-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Notification options" />

      <section className="money-field">
        <span className="field-label">What you get notified about</span>
        <div className="control-list">
          {vm.preferences.map((preference) => (
            <ControlRow
              key={preference.kind}
              icon={preference.icon}
              title={preference.title}
              detail={preference.detail}
              trailing={
                <Toggle
                  checked={preference.enabled}
                  onChange={(enabled) => vm.setPreference(preference.kind, enabled)}
                  label={`${preference.title} notifications`}
                />
              }
            />
          ))}
        </div>
      </section>

      {vm.unread > 0 && (
        <button className="text-button mark-all-read" type="button" onClick={vm.markAllRead}>
          Mark all as read
        </button>
      )}

      {vm.isEmpty ? (
        <StateBlock
          tone="empty"
          message={
            vm.isFiltered
              ? "Nothing to show while these categories are switched off."
              : "Nothing here yet. Payments and security alerts will show up."
          }
        />
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
