import { useEffect, useState, type AnimationEvent as ReactAnimationEvent } from "react";
import type { CardId, CardView } from "@/core/domain/card";
import { maskBalance } from "@/core/domain/card";
import { getCardViews } from "@/core/data/cardViews";
import { MOCK_TRANSACTIONS } from "@/core/data/mock/payments.mock";
import type { Screen } from "@/core/navigation/screens";
import type { Theme } from "../theme/ThemeContext";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";
import { QuickAction } from "../primitives/QuickAction";
import { CardFace } from "../cards/CardFace";
import { IMAGERY } from "../assets";

export function HomeScreen({
  theme,
  onToggleTheme,
  balanceVisible,
  onToggleBalance,
  selectedCard,
  frozenCards,
  rewardUnlocked,
  cardStyleApplied,
  onSelectCard,
  onWallet,
  onQuest,
  onNavigate,
  onAction,
}: {
  theme: Theme;
  onToggleTheme: () => void;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  selectedCard: CardId;
  frozenCards: Record<CardId, boolean>;
  rewardUnlocked: boolean;
  cardStyleApplied: boolean;
  onSelectCard: (card: CardId) => void;
  onWallet: () => void;
  onQuest: () => void;
  onNavigate: (screen: Screen) => void;
  onAction: (action: string) => void;
}) {
  const [stackingCard, setStackingCard] = useState<CardId | null>(null);
  const cards = getCardViews(frozenCards, rewardUnlocked, cardStyleApplied);
  const selectedIndex = cards.findIndex((card) => card.id === selectedCard);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const activeCard = cards[activeIndex] ?? cards[0];
  const rearCard = cards.length > 1 ? cards[(activeIndex + 1) % cards.length] : undefined;
  const deckCards = rearCard ? [activeCard, rearCard] : [activeCard];

  useEffect(() => {
    if (!stackingCard) return;
    const animationFallback = window.setTimeout(() => setStackingCard(null), 520);
    return () => window.clearTimeout(animationFallback);
  }, [stackingCard]);

  const handleCardPress = (card: CardView, isActive: boolean) => {
    if (stackingCard) return;
    if (isActive) {
      onWallet();
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) setStackingCard(card.id);
    onSelectCard(card.id);
  };

  const finishPromotion = (event: ReactAnimationEvent<HTMLButtonElement>) => {
    if (event.animationName === "home-card-stack-forward") setStackingCard(null);
  };

  return (
    <div className="tab-page home-page">
      <header className="home-header">
        <BrandMark compact />
        <span className="home-header-actions">
          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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
          <span>Available balance</span>
          <div>
            <strong key={activeCard.id} className={stackingCard ? "is-changing" : ""} aria-live="polite">
              {balanceVisible ? activeCard.balance : maskBalance(activeCard.balance)}
            </strong>
            <button
              type="button"
              onClick={onToggleBalance}
              aria-label={
                balanceVisible ? `Hide ${activeCard.displayLabel} balance` : `Show ${activeCard.displayLabel} balance`
              }
            >
              <Icon name={balanceVisible ? "eye" : "eye-off"} />
            </button>
          </div>
        </div>

        <div
          className={`home-card-deck ${stackingCard ? "is-switching" : ""}`}
          aria-label="Wallet cards"
          aria-busy={stackingCard ? true : undefined}
        >
          {deckCards.map((card) => {
            const isActive = card.id === activeCard.id;
            const isStacking = stackingCard === card.id;
            return (
              <button
                className={`home-stack-card payment-card-${card.variant} ${isActive ? "is-active" : "is-rear"} ${isStacking ? "is-stacking" : ""}`}
                type="button"
                key={card.id}
                onClick={() => handleCardPress(card, isActive)}
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
              onClick={() => handleCardPress(rearCard, false)}
              aria-label={`Show next card, ${rearCard.displayLabel}`}
              aria-disabled={stackingCard ? true : undefined}
            >
              <Icon name="chevron-right" />
            </button>
          )}
        </div>

        <div className="quick-actions home-card-actions">
          <QuickAction icon="send" label="Send" onClick={() => onNavigate("transfer")} />
          <QuickAction icon="plus" label="Add money" onClick={() => onNavigate("deposit")} />
          <QuickAction icon="qr" label="Pay" onClick={() => onNavigate("payments")} />
        </div>
      </section>

      <section className="home-section">
        <h2>Made for your money style</h2>
        <button className="quest-card" type="button" onClick={onQuest}>
          <img src={IMAGERY.sunsetJeepney} alt="Jeepney traveling beside the coast at sunset" />
          <span className="quest-card-scrim" />
          <span className="quest-card-content">
            <span className="quest-heading">
              <span className="quest-icon">
                <Icon name="target" />
              </span>
              <strong>
                Keep today
                <br />
                intentional
              </strong>
            </span>
            <span className="quest-spend">₱1,240 of ₱3,000</span>
            <span className="progress-track quest-progress">
              <span style={{ width: "41%" }} />
            </span>
            <span className="quest-meta">
              <span>
                <Icon name="clock" /> 2h left today
              </span>
              <span className="mini-cta">Continue quest</span>
            </span>
          </span>
        </button>
      </section>

      <section className="style-progress">
        <span className="style-avatar">☀</span>
        <span className="style-copy">
          <strong>The Free Spirit · Level 3</strong>
          <span className="progress-track">
            <span style={{ width: "75%" }} />
          </span>
        </span>
        <span className="mini-ring">75%</span>
      </section>

      <section className="home-section transactions-section">
        <h2>Recent transactions</h2>
        <div className="transaction-list">
          {MOCK_TRANSACTIONS.map((transaction) => (
            <button
              type="button"
              className="transaction-row"
              key={transaction.name}
              onClick={() => onAction(transaction.name)}
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
