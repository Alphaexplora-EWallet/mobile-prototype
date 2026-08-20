import { useBillEntryViewModel } from "@/core/viewmodels/useBillsViewModel";
import { PageBar } from "../layout/PageBar";
import { AmountField } from "../money/AmountField";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";
import { BillerRow } from "../primitives/BillerRow";
import { LinkRow } from "../primitives/LinkRow";
import type { IconName } from "@/core/domain/icons";

export function BillEntryScreen() {
  const vm = useBillEntryViewModel();

  return (
    <div className="onboarding-page money-page bill-entry-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Bill options" />

      {!vm.isReady ? (
        <section className="money-field pay-bills-section">
          <label className="money-note biller-search">
            <span className="input-shell">
              <Icon name="search" />
              <input
                type="search"
                placeholder="Search billers"
                aria-label="Search billers"
                value={vm.searchQuery}
                onChange={(event) => vm.setSearchQuery(event.target.value)}
              />
            </span>
          </label>

          {/* Category Filter Pills */}
          <div className="biller-category-pills" role="tablist" aria-label="Biller categories">
            {vm.categoryPills.map((pill) => {
              const isActive = vm.selectedCategory === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`category-pill ${isActive ? "is-active" : ""}`}
                  onClick={() => vm.setSelectedCategory(pill.id)}
                >
                  <Icon name={pill.icon} />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {vm.emptySearch && <StateBlock tone="empty" message="No billers match that search." />}

          {/* Scheduled & Autopay Section */}
          {vm.scheduledLabels.length > 0 && vm.searchQuery.trim() === "" && (
            <div className="biller-group pay-scheduled-section">
              <div className="section-header-row">
                <span className="field-label">Scheduled & Autopay</span>
                <span className="badge-counter">{vm.scheduledLabels.length}</span>
              </div>
              <div className="control-list transaction-list">
                {vm.scheduledLabels.map((payment) => (
                  <LinkRow
                    key={payment.id}
                    icon={payment.glyph as IconName}
                    title={payment.name}
                    detail={payment.when}
                    meta={payment.amountLabel}
                    onClick={() => vm.openAutopay(payment.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {vm.showFavorites && (
            <div className="biller-group">
              <span className="field-label">Favorites</span>
              <div className="control-list">
                {vm.favorites.map((biller) => (
                  <BillerRow
                    key={biller.id}
                    biller={biller}
                    favorited={biller.favorited}
                    onPress={() => vm.selectBiller(biller.id)}
                    onToggleFavorite={() => vm.toggleFavorite(biller.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {vm.catalog.map((group) => (
            <div className="biller-group" key={group.category}>
              <span className="field-label">{group.label}</span>
              <div className="control-list">
                {group.billers.map((biller) => (
                  <BillerRow
                    key={biller.id}
                    biller={biller}
                    favorited={biller.favorited}
                    onPress={() => vm.selectBiller(biller.id)}
                    onToggleFavorite={() => vm.toggleFavorite(biller.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <>
          <section className="biller-hero">
            <span className="biller-icon">
              <Icon name={vm.billerIcon} />
            </span>
            <h1>{vm.billerName}</h1>
            <small>
              {vm.billerDetail} · {vm.billerDue}
            </small>
          </section>

          <label className="money-note">
            <span className="field-label">Account number</span>
            <span className="input-shell">
              <Icon name="receipt" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Your account with this biller"
                aria-label="Biller account number"
                value={vm.accountNumber}
                onChange={(event) => vm.setAccountNumber(event.target.value)}
              />
            </span>
          </label>

          <button
            className="secondary-button verify-button"
            type="button"
            disabled={!vm.canValidate}
            onClick={() => void vm.validate()}
          >
            {vm.isValidating ? "Checking with the biller…" : "Check this account"}
          </button>

          {vm.accountName && (
            <p className="verified-name" role="status">
              <Icon name="check" />
              <span>
                {vm.accountName}
                {vm.amountDueLabel ? ` · ${vm.amountDueLabel} due` : ""}
              </span>
            </p>
          )}

          {vm.accountName && (
            <AmountField
              label="Amount to pay"
              value={vm.amount}
              onChange={vm.setAmount}
              available={vm.availableLabel}
              presets={[]}
              selectedPresetId={null}
              onSelectPreset={vm.setAmount}
            />
          )}

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canContinue} onClick={vm.review}>
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}
