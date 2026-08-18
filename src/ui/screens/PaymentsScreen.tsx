import { useState } from "react";
import { Icon } from "../primitives/Icon";
import { LinkRow } from "../primitives/LinkRow";
import { usePaymentsViewModel } from "@/core/viewmodels/useMoneyMovementViewModel";

export function PaymentsScreen() {
  const vm = usePaymentsViewModel();
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <div className="tab-page money-page pay-tab-screen">
      {/* Screen Header */}
      <header className="pay-clean-header">
        <h1 className="pay-clean-title">Pay</h1>
        <button
          className="pay-clean-options-btn"
          type="button"
          aria-label="Payment options"
          onClick={() => setOptionsOpen(true)}
        >
          <Icon name="more" />
        </button>
      </header>

      {/* Main Hero Viewfinder Card */}
      <button
        className={`pay-scanner-hero-card ${vm.flashOn ? "has-flash-on" : ""}`}
        type="button"
        onClick={vm.scanToPay}
        aria-label="Scan to pay: Point camera at any QR Ph code"
      >
        {/* Decorative Wave Vector Background */}
        <svg className="scanner-hero-waves" viewBox="0 0 340 180" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M 0,110 C 70,140 140,80 220,125 C 270,150 310,135 340,140 L 340,180 L 0,180 Z"
            fill="rgba(255, 255, 255, 0.08)"
          />
          <path
            d="M 0,135 C 80,105 160,165 240,115 C 280,95 315,120 340,115 L 340,180 L 0,180 Z"
            fill="rgba(255, 255, 255, 0.14)"
          />
        </svg>

        {/* Illuminated Neon Viewfinder */}
        <div className="scanner-viewfinder-frame" aria-hidden="true">
          <div className="viewfinder-corner top-left" />
          <div className="viewfinder-corner top-right" />
          <div className="viewfinder-corner bottom-left" />
          <div className="viewfinder-corner bottom-right" />

          {/* Central QR Glyph Matrix */}
          <div className="viewfinder-qr-glyph">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="8" y="8" width="6" height="6" rx="1.5" fill="currentColor" />
              <rect x="30" y="4" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="34" y="8" width="6" height="6" rx="1.5" fill="currentColor" />
              <rect x="4" y="30" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="3" />
              <rect x="8" y="34" width="6" height="6" rx="1.5" fill="currentColor" />
              <circle cx="34" cy="34" r="3" fill="currentColor" />
              <circle cx="43" cy="34" r="2" fill="currentColor" />
              <circle cx="34" cy="43" r="2" fill="currentColor" />
              <circle cx="24" cy="24" r="2.5" fill="currentColor" />
              <circle cx="24" cy="11" r="2" fill="currentColor" />
              <circle cx="11" cy="24" r="2" fill="currentColor" />
              <circle cx="43" cy="24" r="2" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Card Copy */}
        <div className="scanner-hero-copy">
          <h2>Scan to pay</h2>
          <p>Pay instantly at merchants, billers, and stores nationwide.</p>
        </div>
      </button>

      {/* Action Controls Below Card */}
      <div className="pay-bottom-action-panel">
        <button
          className={`pay-action-pill-btn ${vm.flashOn ? "is-active" : ""}`}
          type="button"
          onClick={vm.toggleFlash}
          aria-pressed={vm.flashOn}
        >
          <span className="action-circle-icon">
            <Icon name="bolt" />
          </span>
          <span className="action-circle-label">{vm.flashOn ? "Turn off flash" : "Turn on flash"}</span>
        </button>

        <div className="pay-action-divider" aria-hidden="true" />

        <button className="pay-action-pill-btn" type="button" onClick={vm.uploadQr}>
          <span className="action-circle-icon">
            <Icon name="image" />
          </span>
          <span className="action-circle-label">Upload QR</span>
        </button>
      </div>

      {/* Frame Guidance Caption */}
      <p className="scanner-frame-guidance">Position the QR code within the frame</p>

      {/* Payment Options Bottom Sheet */}
      {optionsOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => setOptionsOpen(false)}>
          <section
            className="action-sheet pay-options-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Payment options"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sheet-handle" />
            <h2 id="options-sheet-title">Payment options</h2>
            <div className="control-list">
              <LinkRow
                icon="receipt"
                title="Pay a bill"
                detail="Utilities, telecom, government"
                onClick={() => {
                  setOptionsOpen(false);
                  vm.goTo("bill-entry");
                }}
              />
              <LinkRow
                icon="phone"
                title="Buy load"
                detail="Smart, Globe, DITO prepaid"
                onClick={() => {
                  setOptionsOpen(false);
                  vm.goTo("load-entry");
                }}
              />
              <LinkRow
                icon="qr"
                title="Show my QR code"
                detail="Receive payments to wallet"
                onClick={() => {
                  setOptionsOpen(false);
                  vm.showMyQr();
                }}
              />
              <LinkRow
                icon="plus"
                title="Add money"
                detail="Top up from banks or cash-in"
                onClick={() => {
                  setOptionsOpen(false);
                  vm.goTo("deposit");
                }}
              />
              <LinkRow
                icon="send"
                title="Send money"
                detail="Transfer to bank or wallet"
                onClick={() => {
                  setOptionsOpen(false);
                  vm.goTo("transfer");
                }}
              />
            </div>
            <button className="secondary-button" type="button" onClick={() => setOptionsOpen(false)}>
              Close
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
