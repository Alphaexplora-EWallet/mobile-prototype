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
                    <span className="transfer-contact-avatar" aria-hidden="true">
                      {person.initials}
                    </span>
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
                  <span className="transfer-contact-avatar transfer-add-avatar" aria-hidden="true">
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
        <div className="transfer-step-two-container">
          {/* Ambient Top Background Glow */}
          <div className="transfer-ambient-glow" aria-hidden="true" />

          {/* Recipient Hero */}
          {selectedRecipientDetails && (
            <div className="transfer-recipient-hero">
              <span className="transfer-hero-avatar">{selectedRecipientDetails.initials}</span>
              <div className="transfer-hero-copy">
                <small>SENDING TO</small>
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

          {/* Amount Hero */}
          <div className="transfer-amount-hero">
            <div className="transfer-amount-input-row">
              <span className="transfer-peso-circle" aria-hidden="true">
                <span className="transfer-peso-char">₱</span>
              </span>
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
              <span className="balance-label">Available balance</span>
              <div className="balance-value-row">
                <strong>{source.balanceLabel}</strong>
                <button type="button" className="transfer-max-link" onClick={vm.setMaxAmount}>
                  Use max
                </button>
              </div>
            </div>
          </div>

          {/* Pay With Card Group */}
          <div className="transfer-pay-with-card">
            <span className="pay-with-heading">PAY WITH</span>
            <div className="transfer-source-options">
              {cards.map((card) => {
                const isSelected = source.id === card.id;
                const isJar = card.id !== "main";
                return (
                  <button
                    key={card.id}
                    type="button"
                    className={`transfer-source-row ${isSelected ? "is-active" : ""}`}
                    onClick={() => vm.selectCard(card.id)}
                    aria-pressed={isSelected}
                  >
                    <span className={`source-icon-badge ${isJar ? "is-jar" : "is-wallet"}`}>
                      <Icon name={isJar ? "card" : "wallet"} />
                    </span>
                    <span className="source-info">
                      <strong>{card.displayLabel}</strong>
                      <small>{card.balanceLabel}</small>
                    </span>
                    <span className={`source-radio-indicator ${isSelected ? "is-selected" : ""}`}>
                      {isSelected && <Icon name="check" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fee Preview Banner */}
          {vm.feePreview && (
            <div className="transfer-fee-banner">
              <span className="fee-icon-wrap">
                <Icon name="bolt" />
              </span>
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

          {/* Note Input Card */}
          <div className="transfer-note-card">
            <Icon name="mail" />
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(event) => vm.setNote(event.target.value)}
            />
          </div>
        </div>
      )}

      <div className="money-actions">
        {vm.step === 1 ? (
          <button className="primary-button" type="button" disabled={!vm.canAdvance} onClick={vm.advance}>
            Continue
          </button>
        ) : (
          <button
            className="primary-button transfer-submit-btn"
            type="button"
            disabled={!vm.canAdvance}
            onClick={vm.advance}
          >
            <span>Continue and review</span>
            <Icon name="chevron-right" />
          </button>
        )}
        {vm.step === 2 && (
          <p className="prototype-note transfer-security-note">
            <Icon name="lock" /> {vm.simulatedNote}
          </p>
        )}
      </div>
    </div>
  );
}
