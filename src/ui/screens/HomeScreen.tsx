import { Fragment } from "react";
import { useHomeViewModel } from "@/core/viewmodels/useHomeViewModel";
import { HomeSkyline } from "../assets/HomeSkyline";
import { HomeCardSummary } from "../cards/HomeCardSummary";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { QuickAction } from "../primitives/QuickAction";
import { TransactionRow } from "../money/TransactionRow";

export function HomeScreen() {
  const vm = useHomeViewModel();
  const { balance, quest, styleProgress } = vm;

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
        <div className="home-balance-heading">
          <HomeSkyline />
          <span>{balance.heading}</span>
          <div>
            <strong aria-live="polite">{balance.label}</strong>
            <button type="button" onClick={vm.toggleBalance} aria-label={balance.toggleLabel}>
              <Icon name={balance.visible ? "eye" : "eye-off"} />
            </button>
          </div>
        </div>

        <HomeCardSummary card={vm.card} onPress={vm.pressCard} />

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

      <section className="home-section">
        <h2>Today's goal</h2>
        <button className="quest-card" type="button" onClick={vm.pressQuest}>
          <span className="quest-card-content">
            <span className="quest-heading">
              <span className="quest-icon">
                <Icon name="target" />
              </span>
              <strong>
                {quest.titleLines.map((line, index) => (
                  <Fragment key={line}>
                    {index > 0 && <br />}
                    {line}
                  </Fragment>
                ))}
              </strong>
            </span>
            <span className="quest-spend">{quest.spendLabel}</span>
            <span className="progress-track quest-progress">
              <span style={{ width: `${quest.progressPercent}%` }} />
            </span>
            <span className="quest-meta">
              <span>
                <Icon name="clock" /> {quest.hoursLeftLabel}
              </span>
              <span className="mini-cta">View goal details</span>
            </span>
          </span>
        </button>
      </section>

      <section className="style-progress">
        <span className="style-avatar">☀</span>
        <span className="style-copy">
          <strong>{styleProgress.title}</strong>
          <span className="progress-track">
            <span style={{ width: `${styleProgress.percent}%` }} />
          </span>
        </span>
        <span className="mini-ring">{styleProgress.percentLabel}</span>
      </section>

      <section className="home-section transactions-section">
        <div className="home-section-heading">
          <h2>Recent transactions</h2>
          <button type="button" onClick={vm.goToActivity}>
            View all
          </button>
        </div>
        <div className="transaction-list">
          {vm.transactions.map((transaction) => (
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
