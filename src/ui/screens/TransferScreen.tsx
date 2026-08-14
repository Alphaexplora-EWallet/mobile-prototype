import { useEffect, useRef } from "react";
import { Icon } from "../primitives/Icon";
import { PageBar } from "../layout/PageBar";
import { StateBlock } from "../primitives/StateBlock";
import { useTransferViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

const STEP_TITLE: Readonly<Record<1 | 2, string>> = { 1: "Send to", 2: "Amount" };

export function TransferScreen() {
  const vm = useTransferViewModel();
  const { cards, source, amount, note, selectedRecipientDetails } = vm;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [vm.step]);

  return (
    <div className="onboarding-page money-page transfer-page container-free-flow">
      <h1 className="sr-only" tabIndex={-1} ref={headingRef}>
        {STEP_TITLE[vm.step]}
      </h1>
      <PageBar title="Send money" onBack={vm.back} optionsLabel="Transfer options" />

      {vm.step === 1 && (
        <>
          {/* Borderless Search Line */}
          <div className="transfer-search-bar">
            <Icon name="search" />
            <input
              type="search"
              placeholder="Search name, phone, or bank"
              aria-label="Search recipients"
              value={vm.searchQuery}
              onChange={(event) => vm.setSearchQuery(event.target.value)}
            />
          </div>

          {/* Quick Destination Flat Rows (0 boxes, 0 pills) */}
          <div className="transfer-quick-destinations">
            <button className="transfer-destination-row" type="button" onClick={vm.sendToBank}>
              <span className="destination-row-icon">
                <Icon name="bank" />
              </span>
              <span className="destination-row-text">
                <strong>Bank transfer</strong>
                <small>InstaPay or PESONet</small>
              </span>
              <Icon name="chevron-right" />
            </button>

            <button className="transfer-destination-row" type="button" onClick={vm.sendToMobile}>
              <span className="destination-row-icon">
                <Icon name="send" />
              </span>
              <span className="destination-row-text">
                <strong>Send to mobile</strong>
                <small>Instant to phone number</small>
              </span>
              <Icon name="chevron-right" />
            </button>

            <button className="transfer-destination-row" type="button" onClick={vm.scanQr}>
              <span className="destination-row-icon">
                <Icon name="qr" />
              </span>
              <span className="destination-row-text">
                <strong>Scan QR code</strong>
                <small>QR Ph merchant or person</small>
              </span>
              <Icon name="chevron-right" />
            </button>
          </div>

          {/* Saved Recipients Borderless Contact List */}
          <section className="transfer-contacts-section">
            <div className="transfer-section-heading">
              <span>Saved recipients</span>
              {vm.recipients.length > 0 && (
                <button type="button" className="transfer-manage-btn" onClick={vm.manageRecipients}>
                  Manage
                </button>
              )}
            </div>

            {vm.recipients.length === 0 ? (
              <>
                <StateBlock tone="empty" message="You have not saved any recipients yet." />
                <button className="primary-button" type="button" onClick={vm.manageRecipients}>
                  Add a recipient
                </button>
              </>
            ) : (
              <div className="transfer-contact-list">
                {vm.filteredRecipients.map((person) => (
                  <button
                    key={person.id}
                    className={`transfer-contact-row ${vm.selectedRecipient === person.id ? "is-selected" : ""}`}
                    type="button"
                    onClick={() => vm.selectRecipient(person.id)}
                    aria-pressed={vm.selectedRecipient === person.id}
                  >
                    <span className="transfer-contact-avatar">{person.initials}</span>
                    <span className="transfer-contact-info">
                      <strong>{person.name}</strong>
                      <small>{person.handle}</small>
                    </span>
                    {vm.selectedRecipient === person.id && (
                      <span className="transfer-selected-mark">
                        <Icon name="check" />
                      </span>
                    )}
                  </button>
                ))}

                <button
                  className="transfer-contact-row transfer-add-row"
                  type="button"
                  aria-label="Add recipient"
                  onClick={vm.manageRecipients}
                >
                  <span className="transfer-contact-avatar transfer-add-avatar">
                    <Icon name="plus" />
                  </span>
                  <span className="transfer-contact-info">
                    <strong>Add new recipient</strong>
                    <small>Save a bank or mobile contact</small>
                  </span>
                  <Icon name="chevron-right" />
                </button>

                {vm.filteredRecipients.length === 0 && vm.searchQuery.trim() !== "" && (
                  <StateBlock tone="empty" message="No recipients match that search." />
                )}
              </div>
            )}
          </section>
        </>
      )}

      {vm.step === 2 && (
        <>
          {/* Pure Typographic Recipient Header (0 cards, 0 pills) */}
          {selectedRecipientDetails && (
            <div className="transfer-recipient-hero">
              <span className="transfer-hero-avatar">{selectedRecipientDetails.initials}</span>
              <div className="transfer-hero-copy">
                <small>Sending to</small>
                <strong>{selectedRecipientDetails.name}</strong>
                <p>
                  <span>{selectedRecipientDetails.handle}</span>
                  <button
                    type="button"
                    className="transfer-change-link"
                    onClick={vm.back}
                    aria-label="Change recipient"
                  >
                    Change
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Floating Amount Hero (0 box, 0 card) */}
          <div className="transfer-amount-hero">
            <div className="transfer-amount-input-row">
              <span className="transfer-currency-sign">₱</span>
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(event) => vm.setAmount(event.target.value)}
                aria-label="Amount to send"
                autoFocus
              />
            </div>
            <div className="transfer-amount-balance-row">
              <span>Available {source.balanceLabel}</span>
              <button type="button" className="transfer-max-link" onClick={vm.setMaxAmount}>
                Use max
              </button>
            </div>
          </div>

          {/* Source Account (Clean borderless inline row) */}
          <div className="transfer-source-line">
            <small>Pay with</small>
            <div className="transfer-source-options">
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`transfer-source-btn ${source.id === card.id ? "is-active" : ""}`}
                  onClick={() => vm.selectCard(card.id)}
                  aria-pressed={source.id === card.id}
                >
                  <Icon name="card" />
                  <strong>{card.displayLabel}</strong>
                  <span>({card.balanceLabel})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fee preview caption */}
          {vm.feePreview && (
            <div className="transfer-fee-line">
              <Icon name="bolt" />
              <span>
                <strong>{vm.feePreview.feeLabel}</strong> · {vm.feePreview.arrivalLabel}
              </span>
            </div>
          )}

          {vm.amountError && (
            <p className="transfer-error" role="alert">
              {vm.amountError}
            </p>
          )}

          {/* Borderless Note Field */}
          <div className="transfer-note-line">
            <Icon name="mail" />
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(event) => vm.setNote(event.target.value)}
            />
          </div>
        </>
      )}

      <div className="money-actions">
        <button className="primary-button" type="button" disabled={!vm.canAdvance} onClick={vm.advance}>
          {vm.step === 1 ? "Continue" : "Continue and review"}
        </button>
        {vm.step === 2 && <p className="prototype-note">{vm.simulatedNote}</p>}
      </div>
    </div>
  );
}
