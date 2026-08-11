import { useLinkedAccountsViewModel } from "@/core/viewmodels/useLinkedAccountsViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { StateBlock } from "../primitives/StateBlock";

/**
 * GAP-09 — linked bank accounts management. Reached from Settings; lists the
 * accounts behind the transfer source pickers and lets the user add, remove
 * (blocking the last one) and mark a default.
 */
export function BankAccountsScreen() {
  const vm = useLinkedAccountsViewModel();

  return (
    <div className="onboarding-page linked-accounts-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Linked accounts options" />

      <section className="activity-intro">
        <h1>Linked accounts</h1>
        <p>{vm.intro}</p>
      </section>

      {vm.notice && (
        <StateBlock tone="error" title="Account kept" message={vm.notice} className="linked-accounts-notice" />
      )}

      {vm.items.length === 0 ? (
        <StateBlock tone="empty" message="You have no linked bank accounts yet." />
      ) : (
        <section className="recipient-list" aria-label="Linked bank accounts">
          {vm.items.map((item) => (
            <div className="recipient-list-row linked-account-row" key={item.id}>
              <span className="recipient-initials linked-account-icon" aria-hidden="true">
                <Icon name="bank" />
              </span>
              <span className="control-copy">
                <strong>{item.bankName}</strong>
                <small>
                  {item.handle} · {item.accountName}
                </small>
                <small className="linked-account-status">{item.statusLabel}</small>
              </span>
              {item.isDefault && <em className="default-badge">Default</em>}
              <button
                type="button"
                className="clear-button"
                disabled={item.isDefault}
                aria-pressed={item.isDefault}
                aria-label={`Make ${item.bankName} ${item.handle} default`}
                onClick={() => vm.setDefault(item.id)}
              >
                <Icon name="star" />
              </button>
              <button
                type="button"
                className="clear-button"
                aria-label={`Remove ${item.bankName} ${item.handle}`}
                onClick={() => vm.remove(item.id)}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </section>
      )}

      <button className="destination-cta" type="button" onClick={vm.toggleForm}>
        <span className="destination-cta-icon">
          <Icon name="plus" />
        </span>
        <span className="control-copy">
          <strong>Link a bank account</strong>
          <small>{vm.showForm ? "Hide the form" : "Add an account you can send from"}</small>
        </span>
        <Icon name="chevron-right" />
      </button>

      {vm.showForm && (
        <section className="money-field link-account-form" aria-label="Link a bank account">
          <span className="field-label">Bank</span>
          {vm.isLoadingBanks ? (
            <StateBlock tone="loading" message="Loading the bank directory…" />
          ) : (
            <div className="control-list">
              {vm.banks.map((bank) => (
                <LinkRow
                  key={bank.id}
                  icon="bank"
                  title={bank.title}
                  detail={bank.detail}
                  selected={bank.selected}
                  onClick={() => vm.selectBank(bank.id)}
                />
              ))}
            </div>
          )}

          <label className="money-note">
            <span className="field-label">Account number</span>
            <span className="input-shell">
              <Icon name="card" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="10 to 16 digits"
                aria-label="Account number"
                value={vm.accountNumber}
                onChange={(event) => vm.setAccountNumber(event.target.value)}
              />
            </span>
          </label>

          <label className="money-note">
            <span className="field-label">Account name</span>
            <span className="input-shell">
              <Icon name="user" />
              <input
                type="text"
                placeholder="Name on the account"
                aria-label="Account name"
                value={vm.accountName}
                onChange={(event) => vm.setAccountName(event.target.value)}
              />
            </span>
          </label>

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSave} onClick={vm.save}>
              Link account
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
