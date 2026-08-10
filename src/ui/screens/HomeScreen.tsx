import { Fragment, type AnimationEvent as ReactAnimationEvent } from "react";
import { useHomeViewModel } from "@/core/viewmodels/useHomeViewModel";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { QuickAction } from "../primitives/QuickAction";
import { CardFace } from "../cards/CardFace";
import { IMAGERY } from "../assets";

export function HomeScreen() {
  const vm = useHomeViewModel();
  const { deck, balance, quest, styleProgress } = vm;
  const stackingCard = deck.stackingId;
  const activeCard = deck.cards.find((card) => card.id === deck.activeId) ?? deck.cards[0];
  const rearCard = deck.cards.find((card) => card.id === deck.rearId);

  // The View owns the CSS-animation detail; the ViewModel only learns that the
  // promotion finished. Under React Native this becomes an Animated callback.
  const finishPromotion = (event: ReactAnimationEvent<HTMLButtonElement>) => {
    if (event.animationName === "home-card-stack-forward") vm.endStacking();
  };

  const handleCardPress = (card: { id: typeof deck.activeId }) => vm.pressCard(card.id);

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
          <button className="avatar-button" type="button" aria-label="Open profile">
            <Icon name="user" />
          </button>
        </span>
      </header>

      <section className="home-wallet-block">
        <div className="home-balance-heading">
          <span>{balance.heading}</span>
          <div>
            <strong key={activeCard.id} className={stackingCard ? "is-changing" : ""} aria-live="polite">
              {balance.label}
            </strong>
            <button type="button" onClick={vm.toggleBalance} aria-label={balance.toggleLabel}>
              <Icon name={balance.visible ? "eye" : "eye-off"} />
            </button>
          </div>
        </div>

        <div
          className={`home-card-deck ${stackingCard ? "is-switching" : ""}`}
          aria-label="Wallet cards"
          aria-busy={stackingCard ? true : undefined}
        >
          {deck.cards.map((card) => {
            const isActive = card.id === activeCard.id;
            const isStacking = stackingCard === card.id;
            return (
              <button
                className={`home-stack-card payment-card-${card.variant} ${isActive ? "is-active" : "is-rear"} ${isStacking ? "is-stacking" : ""}`}
                type="button"
                key={card.id}
                onClick={() => handleCardPress(card)}
                onAnimationEnd={isStacking ? finishPromotion : undefined}
                aria-label={
                  isActive
                    ? `Open ${card.displayLabel} card ending in ${card.last4}`
                    : `Bring ${card.displayLabel} card to front`
                }
                aria-pressed={isActive}
                aria-disabled={stackingCard ? true : undefined}
              >
                <CardFace card={card} />
              </button>
            );
          })}
          {rearCard && (
            <button
              className="home-stack-next"
              type="button"
              onClick={() => handleCardPress(rearCard)}
              aria-label={`Show next card, ${rearCard.displayLabel}`}
              aria-disabled={stackingCard ? true : undefined}
            >
              <Icon name="chevron-right" />
            </button>
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

      <section className="home-section">
        <h2>Made for your money style</h2>
        <button className="quest-card" type="button" onClick={vm.pressQuest}>
          <img src={IMAGERY.sunsetJeepney} alt="Jeepney traveling beside the coast at sunset" />
          <span className="quest-card-scrim" />
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
              <span className="mini-cta">Continue quest</span>
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
        <h2>Recent transactions</h2>
        <div className="transaction-list">
          {vm.transactions.map((transaction) => (
            <button
              type="button"
              className="transaction-row"
              key={transaction.id}
              onClick={() => vm.pressTransaction(transaction.name)}
            >
              <span className="transaction-icon">{transaction.glyph}</span>
              <span className="transaction-copy">
                <strong>{transaction.name}</strong>
                <small>{transaction.when}</small>
              </span>
              <strong className={transaction.positive ? "positive" : ""}>{transaction.amount}</strong>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
