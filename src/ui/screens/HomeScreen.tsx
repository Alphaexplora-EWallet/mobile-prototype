import { Fragment } from "react";
import { useHomeViewModel } from "@/core/viewmodels/useHomeViewModel";
import { HomeSkyline } from "../assets/HomeSkyline";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { QuickAction } from "../primitives/QuickAction";
import { TransactionRow } from "../money/TransactionRow";

export function HomeScreen() {
  const vm = useHomeViewModel();
  const { balance, quest, cashFlow } = vm;

  return (
    <div className="tab-page home-page">
      <header className="home-header">
        <BrandMark compact />
        <span className="home-header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={vm.toggleTheme}
            aria-label={vm.themeToggleLabel}
            aria-pressed={vm.theme === "dark"}
            title={vm.themeToggleLabel}
          >
            <Icon name="contrast" />
          </button>
          <button
            className="bell-button"
            type="button"
            aria-label="Open notifications"
            onClick={() => vm.goTo("notifications")}
          >
            <Icon name="bell" />
          </button>
          <button className="avatar-button" type="button" aria-label="Open profile" onClick={vm.openProfile}>
            <Icon name="user" />
          </button>
        </span>
      </header>

      <section className="home-wallet-block">
        <HomeSkyline />
        <div className="home-balance-heading">
          <div className="home-balance-title-row">
            <span>{balance.heading}</span>
            <button
              type="button"
              className="balance-eye-btn"
              onClick={vm.toggleBalance}
              aria-label={balance.toggleLabel}
            >
              <Icon name={balance.visible ? "eye" : "eye-off"} />
            </button>
          </div>
          <strong aria-live="polite">{balance.label}</strong>
          {balance.delta && (
            <div className="home-balance-delta">
              <span className={`trend-pill ${balance.delta.direction === "up" ? "positive" : "negative"}`}>
                {balance.delta.label}
              </span>
            </div>
          )}
        </div>

        <div className="quick-actions home-card-actions">
          {vm.quickActions.map((action) => (
            <QuickAction
              key={action.id}
              icon={action.icon}
              label={action.label}
              onClick={() => vm.pressQuickAction(action.id)}
            />
          ))}
        </div>
      </section>

      <section className="home-section goal-section">
        <button className="quest-card" type="button" onClick={vm.pressQuest} aria-label="View goal details">
          <svg className="quest-card-bg" viewBox="0 0 340 180" aria-hidden="true" preserveAspectRatio="none">
            {/* Mountains background */}
            <path d="M160 180 L240 65 L320 180 Z" fill="#1d6fdc" opacity="0.85" />
            <path d="M190 180 L260 40 L340 180 Z" fill="#1558b8" opacity="0.9" />
            {/* Summit Flag */}
            <line x1="260" y1="40" x2="260" y2="22" stroke="#ffffff" strokeWidth="1.5" />
            <polygon points="260,22 274,28 260,34" fill="#fbbf24" />
            {/* Winding Trail */}
            <path
              d="M170 180 C200 160, 240 145, 230 115 C220 90, 255 70, 260 42"
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.8"
            />
            {/* Soft Clouds */}
            <ellipse cx="210" cy="75" rx="20" ry="6" fill="#ffffff" opacity="0.2" />
            <ellipse cx="305" cy="80" rx="16" ry="5" fill="#ffffff" opacity="0.2" />
          </svg>

          <span className="quest-card-content">
            <span className="quest-heading">
              <span className="quest-icon">
                <Icon name="target" />
              </span>
              <span className="quest-title-block">
                <small className="quest-eyebrow">Today's goal</small>
                <strong>
                  {quest.titleLines.map((line, index) => (
                    <Fragment key={line}>
                      {index > 0 && <br />}
                      {line}
                    </Fragment>
                  ))}
                </strong>
              </span>
            </span>

            <span className="quest-spend">{quest.spendLabel}</span>
            <span className="progress-track quest-progress">
              <span style={{ width: `${quest.progressPercent}%` }} />
            </span>
            <span className="quest-meta">
              <span>
                <Icon name="clock" /> {quest.hoursLeftLabel}
              </span>
              <span className="quest-cta-pill">
                View goal details <Icon name="chevron-right" />
              </span>
            </span>
          </span>
        </button>
      </section>

      <section className="home-cashflow-card">
        <div className="cashflow-header">
          <h2>Cash flow</h2>
          <button type="button" className="cashflow-dropdown-btn">
            This month <Icon name="chevron-down" />
          </button>
        </div>
        <div className="cashflow-body">
          <div className="cashflow-stats">
            <div className="cashflow-stat-col">
              <span className="cashflow-label">
                <span className="dot dot-income" /> Income
              </span>
              <strong className="cashflow-amount">
                {cashFlow
                  ? cashFlow.incomeLabel.startsWith("₱")
                    ? cashFlow.incomeLabel
                    : `₱${cashFlow.incomeLabel}`
                  : "₱25,750.00"}
              </strong>
              <span className="trend-pill positive">{cashFlow?.incomeChange?.label ?? "↑ 12%"}</span>
            </div>

            <div className="cashflow-stat-col">
              <span className="cashflow-label">
                <span className="dot dot-expenses" /> Expenses
              </span>
              <strong className="cashflow-amount">
                {cashFlow
                  ? cashFlow.expensesLabel.startsWith("₱")
                    ? cashFlow.expensesLabel
                    : `₱${cashFlow.expensesLabel}`
                  : "₱8,320.00"}
              </strong>
              <span className="trend-pill negative">{cashFlow?.expensesChange?.label ?? "↓ 8%"}</span>
            </div>
          </div>

          <div className="cashflow-donut-container">
            <svg viewBox="0 0 100 100" className="cashflow-donut" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray="95 240"
                strokeDashoffset="0"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="14"
                strokeDasharray="50 240"
                strokeDashoffset="-95"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="14"
                strokeDasharray="45 240"
                strokeDashoffset="-145"
              />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#f87171"
                strokeWidth="14"
                strokeDasharray="50 240"
                strokeDashoffset="-190"
              />
              <circle cx="50" cy="50" r="31" fill="var(--surface, #ffffff)" />
              <text x="50" y="56" textAnchor="middle" fill="var(--ink)" fontSize="18" fontWeight="800">
                ₱
              </text>
            </svg>
          </div>
        </div>
      </section>

      <section className="home-tip-card">
        <div className="tip-icon-badge">
          <Icon name="bulb" />
        </div>
        <div className="tip-content">
          <strong>Tip for you</strong>
          <p>You're on track! Keep going to reach your goals faster.</p>
        </div>
        <Icon name="chevron-right" />
      </section>

      <section className="home-section transactions-section">
        <div className="home-section-heading">
          <h2>Recent transactions</h2>
          <button type="button" onClick={vm.goToActivity} aria-label="View all">
            See all
          </button>
        </div>
        <div className="transaction-list">
          {vm.transactions.slice(0, 2).map((transaction) => (
            <TransactionRow
              key={transaction.id}
              row={transaction}
              onPress={() => vm.pressTransaction(transaction.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
