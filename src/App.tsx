import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type AnimationEvent as ReactAnimationEvent,
  type ReactNode,
} from "react";
import finaLogoLockup from "./assets/fina-logo-lockup.svg";
import finaWordmark from "./assets/fina-wordmark.svg";
import finaWordmarkLight from "./assets/fina-wordmark-light.svg";
import sunsetJeepney from "./assets/sunset-jeepney.webp";
import welcomeManila from "./assets/welcome-manila.webp";

type Screen =
  | "welcome"
  | "sign-in"
  | "quiz"
  | "result"
  | "home"
  | "wallet"
  | "transfer"
  | "deposit"
  | "payments"
  | "quest"
  | "reward"
  | "profile";
type TabScreen = Extract<Screen, "home" | "wallet" | "payments" | "quest" | "profile">;
type CardId = "main" | "travel";
type Theme = "light" | "dark";
const ThemeContext = createContext<Theme>("light");
type CardVariant = "teal" | "sunset";
type CardDefinition = {
  id: CardId;
  number: string;
  fullNumber: string;
  expiry: string;
  balance: string;
  label: string;
  rewardLabel?: string;
  variant: CardVariant;
  artwork?: string;
};
type CardView = CardDefinition & {
  frozen: boolean;
  unlocked: boolean;
};
type IconName =
  | "arrow-down"
  | "arrow-left"
  | "bank"
  | "bolt"
  | "card"
  | "check"
  | "chevron-right"
  | "clock"
  | "contrast"
  | "eye"
  | "eye-off"
  | "globe"
  | "heart"
  | "home"
  | "limit"
  | "lock"
  | "mail"
  | "more"
  | "plus"
  | "qr"
  | "receipt"
  | "rotate"
  | "send"
  | "snow"
  | "star"
  | "target"
  | "user"
  | "wallet";

const quizAnswers = [
  { label: "I get it while the feeling is fresh", icon: "wallet" as IconName },
  { label: "I check my budget first", icon: "limit" as IconName },
  { label: "I save it for later", icon: "bank" as IconName },
  { label: "I usually avoid deciding", icon: "more" as IconName },
];

const transactions = [
  { icon: "☕", name: "Daily Brew", when: "Today, 8:23 AM", amount: "−₱160.00", positive: false },
  { icon: "◈", name: "FreshMart", when: "Yesterday, 6:42 PM", amount: "−₱845.75", positive: false },
  { icon: "↙", name: "Money received", when: "Yesterday, 11:18 AM", amount: "+₱2,000.00", positive: true },
];

const SIMULATED_NOTE =
  "This frontend prototype keeps financial actions safely simulated. The real service can connect here later.";

const amountPresets = ["500", "1,000", "2,500"];

const recentRecipients = [
  { initials: "JD", name: "Jomar D.", handle: "•••• 4471" },
  { initials: "MS", name: "Mira S.", handle: "0917 ••• 2288" },
  { initials: "AR", name: "Ate Rosa", handle: "•••• 9032" },
  { initials: "KL", name: "Kuya Lito", handle: "0998 ••• 1140" },
];

const depositMethods: { id: string; icon: IconName; title: string; detail: string }[] = [
  { id: "bank", icon: "bank", title: "Linked bank account", detail: "BPI Savings •••• 6612" },
  { id: "card", icon: "card", title: "Debit or credit card", detail: "Visa •••• 4102" },
  { id: "counter", icon: "wallet", title: "Over the counter", detail: "7-Eleven, Palawan, and partners" },
  { id: "qr", icon: "qr", title: "Scan to cash in", detail: "Show a QR at any partner branch" },
];

const billers: { id: string; icon: IconName; name: string; detail: string; due: string }[] = [
  { id: "power", icon: "bolt", name: "Meralco", detail: "Electricity", due: "Due Aug 18" },
  { id: "internet", icon: "globe", name: "Converge", detail: "Home internet", due: "Due Aug 22" },
  { id: "rent", icon: "home", name: "Landlord", detail: "Monthly rent", due: "Due Sep 1" },
  { id: "card-bill", icon: "receipt", name: "Card statement", detail: "Credit card", due: "Due Sep 4" },
];

const scheduledPayments = [
  { icon: "⚡", name: "Meralco", when: "Autopay · Aug 18", amount: "₱2,340.00" },
  { icon: "◎", name: "Converge", when: "Autopay · Aug 22", amount: "₱1,699.00" },
];

const cardOrder: readonly CardId[] = ["main", "travel"];

const cardDefinitions: Record<CardId, CardDefinition> = {
  main: {
    id: "main",
    number: "8421",
    fullNumber: "4829 5510 8823 8421",
    expiry: "05/29",
    balance: "₱24,680.50",
    label: "Main wallet",
    variant: "teal",
  },
  travel: {
    id: "travel",
    number: "1198",
    fullNumber: "4829 5510 8823 1198",
    expiry: "11/30",
    balance: "₱8,450.00",
    label: "Travel jar",
    rewardLabel: "Sunset Ride",
    variant: "sunset",
    artwork: sunsetJeepney,
  },
};

function getCardViews(
  frozenCards: Record<CardId, boolean>,
  rewardUnlocked: boolean,
  cardStyleApplied: boolean,
): CardView[] {
  return cardOrder.map((id) => {
    const card = cardDefinitions[id];
    return {
      ...card,
      label: id === "travel" && cardStyleApplied ? (card.rewardLabel ?? card.label) : card.label,
      frozen: frozenCards[id],
      unlocked: id === "main" || rewardUnlocked,
    };
  });
}

function maskBalance(balance: string) {
  return balance.replace(/\d/g, "•");
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = window.localStorage.getItem("fina-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [screen, setScreen] = useState<Screen>("welcome");
  const [selectedAnswer, setSelectedAnswer] = useState(0);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedCard, setSelectedCard] = useState<CardId>("main");
  const [limitSetup, setLimitSetup] = useState(false);
  const [limitConfirmed, setLimitConfirmed] = useState(false);
  const [rewardUnlocked, setRewardUnlocked] = useState(false);
  const [cardStyleApplied, setCardStyleApplied] = useState(false);
  const [frozenCards, setFrozenCards] = useState<Record<CardId, boolean>>({ main: false, travel: false });
  const [onlinePayments, setOnlinePayments] = useState(true);
  const [atmWithdrawals, setAtmWithdrawals] = useState(true);
  const [sheet, setSheet] = useState<string | null>(null);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("fina-theme", theme);
  }, [theme]);

  const navigate = (next: Screen) => {
    setSheet(null);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openLimitSetup = () => {
    setSelectedCard("main");
    setLimitSetup(true);
    navigate("wallet");
  };

  const confirmLimit = () => {
    setLimitSetup(false);
    setLimitConfirmed(true);
    navigate("quest");
  };

  const completeQuest = () => {
    setRewardUnlocked(true);
    navigate("reward");
  };

  const moneyScreenProps = {
    selectedCard,
    onSelectCard: setSelectedCard,
    frozenCards,
    rewardUnlocked,
    cardStyleApplied,
    onBack: () => navigate("home"),
    onSimulate: setSheet,
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return <WelcomeScreen onStart={() => navigate("quiz")} onSignIn={() => navigate("sign-in")} />;
      case "sign-in":
        return <SignInScreen onBack={() => navigate("welcome")} onContinue={() => navigate("home")} />;
      case "quiz":
        return (
          <QuizScreen selected={selectedAnswer} onSelect={setSelectedAnswer} onContinue={() => navigate("result")} />
        );
      case "result":
        return <ResultScreen onContinue={() => navigate("home")} onClose={() => navigate("home")} />;
      case "home":
        return (
          <HomeScreen
            theme={theme}
            onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            balanceVisible={balanceVisible}
            onToggleBalance={() => setBalanceVisible((value) => !value)}
            selectedCard={selectedCard}
            frozenCards={frozenCards}
            rewardUnlocked={rewardUnlocked}
            cardStyleApplied={cardStyleApplied}
            onSelectCard={setSelectedCard}
            onWallet={() => navigate("wallet")}
            onQuest={() => navigate("quest")}
            onNavigate={navigate}
            onAction={setSheet}
          />
        );
      case "quest":
        return (
          <QuestScreen
            isTracking={limitConfirmed}
            onBack={() => navigate("home")}
            onSetLimit={openLimitSetup}
            onComplete={completeQuest}
          />
        );
      case "wallet":
        return (
          <WalletScreen
            selectedCard={selectedCard}
            onSelectCard={setSelectedCard}
            limitSetup={limitSetup}
            rewardUnlocked={rewardUnlocked}
            cardStyleApplied={cardStyleApplied}
            frozenCards={frozenCards}
            onlinePayments={onlinePayments}
            atmWithdrawals={atmWithdrawals}
            onFrozenChange={(card, value) => setFrozenCards((current) => ({ ...current, [card]: value }))}
            onOnlineChange={setOnlinePayments}
            onAtmChange={setAtmWithdrawals}
            onConfirmLimit={confirmLimit}
            onCancelLimit={() => setLimitSetup(false)}
            onNavigate={navigate}
          />
        );
      case "transfer":
        return <TransferScreen {...moneyScreenProps} />;
      case "deposit":
        return <DepositScreen {...moneyScreenProps} />;
      case "payments":
        return <PaymentsScreen {...moneyScreenProps} onNavigate={navigate} />;
      case "reward":
        return (
          <RewardScreen
            onApply={() => {
              setCardStyleApplied(true);
              setSelectedCard("travel");
              navigate("wallet");
            }}
            onHome={() => navigate("home")}
          />
        );
      case "profile":
        return <ProfileScreen onRestart={() => navigate("quiz")} />;
    }
  };

  const tabScreen = screen === "quest" ? "quest" : screen;
  const showTabs = ["home", "wallet", "payments", "quest", "profile"].includes(screen);

  return (
    <ThemeContext.Provider value={theme}>
      <main className="app-stage">
        <section className="phone-shell" aria-label="FIN-A mobile app prototype">
          <StatusBar />
          <div className={`screen screen-${screen}`}>{renderScreen()}</div>
          {showTabs && <BottomNav active={tabScreen as TabScreen} onNavigate={navigate} />}
          {sheet && <ActionSheet action={sheet} onClose={() => setSheet(null)} />}
        </section>
      </main>
    </ThemeContext.Provider>
  );
}

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span>9:41</span>
      <span className="dynamic-island" />
      <span className="status-icons">▮▮▮ ◒ ▰</span>
    </div>
  );
}

function BrandMark({
  compact = false,
  tagline = false,
  light = false,
  preserveInk = false,
}: {
  compact?: boolean;
  tagline?: boolean;
  light?: boolean;
  preserveInk?: boolean;
}) {
  const theme = useContext(ThemeContext);
  const useLightWordmark = light || (theme === "dark" && !preserveInk);
  return (
    <img
      className={`brand-mark ${compact ? "brand-mark-compact" : ""} ${tagline ? "brand-mark-lockup" : ""}`}
      src={tagline ? finaLogoLockup : useLightWordmark ? finaWordmarkLight : finaWordmark}
      alt={tagline ? "FIN-A, Financial Assistant App" : "FIN-A"}
    />
  );
}

function WelcomeScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="onboarding-page welcome-page">
      <header className="welcome-logo">
        <BrandMark tagline />
      </header>
      <section className="welcome-copy">
        <h1>
          Money that
          <br />
          follows your life
        </h1>
        <p>
          Turn meals, rides, savings,
          <br />
          and transfers into rewards.
        </p>
      </section>

      <figure className="welcome-visual">
        <img
          src={welcomeManila}
          alt="Friends walking through a sunny Manila street beside a jeepney and neighborhood store"
        />
        <span className="welcome-visual-fade" />
      </figure>

      <div className="welcome-actions">
        <button className="primary-button welcome-primary" type="button" onClick={onStart}>
          <span>✦</span> Start my journey <b>›</b>
        </button>
        <button className="secondary-button" type="button" onClick={onSignIn}>
          I already have an account
        </button>
        <div className="welcome-dots" aria-label="Welcome step 1 of 3">
          <span className="is-active" />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function SignInScreen({ onBack, onContinue }: { onBack: () => void; onContinue: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className="onboarding-page sign-in-page">
      <header className="centered-app-bar sign-in-header">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to welcome">
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="sign-in-copy">
        <p className="eyebrow">Welcome back</p>
        <h1>
          Pick up where
          <br />
          you left off
        </h1>
        <p>Your wallet, quests, and money style are waiting.</p>
      </section>

      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          onContinue();
        }}
      >
        <label>
          <span>Email address</span>
          <span className="input-shell">
            <Icon name="mail" />
            <input
              type="email"
              autoComplete="email"
              placeholder="maya@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </span>
        </label>
        <label>
          <span>Password</span>
          <span className="input-shell">
            <Icon name="lock" />
            <input
              type={passwordVisible ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setPasswordVisible((value) => !value)}
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              <Icon name={passwordVisible ? "eye-off" : "eye"} />
            </button>
          </span>
        </label>
        <button className="forgot-button" type="button">
          Forgot password?
        </button>
        <button className="primary-button" type="submit">
          Sign in
        </button>
      </form>

      <div className="demo-auth">
        <span>Frontend prototype</span>
        <p>No real account or credentials are required.</p>
        <button className="secondary-button" type="button" onClick={onContinue}>
          Continue with demo account
        </button>
      </div>
    </div>
  );
}

function QuizScreen({
  selected,
  onSelect,
  onContinue,
}: {
  selected: number;
  onSelect: (value: number) => void;
  onContinue: () => void;
}) {
  return (
    <div className="onboarding-page quiz-page">
      <header className="centered-app-bar">
        <button className="icon-button" type="button" aria-label="Go back">
          <Icon name="arrow-left" />
        </button>
        <BrandMark compact />
        <span className="app-bar-spacer" />
      </header>

      <section className="quiz-intro">
        <h1>Find your money style</h1>
        <div className="progress-heading">
          <strong>3 of 5</strong>
        </div>
        <div className="progress-track" aria-label="Question 3 of 5">
          <span style={{ width: "60%" }} />
        </div>
      </section>

      <div className="orbit-accent" aria-hidden="true">
        <span>✦</span>
      </div>

      <fieldset className="answer-list">
        <legend>When you want something, what usually happens?</legend>
        {quizAnswers.map((answer, index) => (
          <button
            className={`answer-option ${selected === index ? "is-selected" : ""}`}
            key={answer.label}
            type="button"
            aria-pressed={selected === index}
            onClick={() => onSelect(index)}
          >
            <span className="answer-icon">
              <Icon name={answer.icon} />
            </span>
            <span>{answer.label}</span>
            {selected === index && (
              <span className="answer-check">
                <Icon name="check" />
              </span>
            )}
          </button>
        ))}
      </fieldset>

      <div className="sticky-action onboarding-action">
        <button className="primary-button" type="button" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}

function ResultScreen({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
  return (
    <div className="onboarding-page result-page">
      <header className="split-app-bar">
        <BrandMark compact />
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close result">
          ×
        </button>
      </header>

      <section className="result-content">
        <p className="eyebrow">Meet your money style</p>
        <h1>The Free Spirit</h1>
        <p className="result-label">Spender profile</p>

        <div className="wallet-character" aria-hidden="true">
          <span className="character-sun">☀</span>
          <div className="character-orbit" />
          <div className="character-wallet">
            <span>⌣</span>
          </div>
          <span className="character-star character-star-one">✦</span>
          <span className="character-star character-star-two">✧</span>
        </div>

        <p className="result-description">
          You enjoy the moment and value freedom. FIN-A will help you spend with intention—without taking away the fun.
        </p>

        <div className="trait-row" aria-label="Your money style traits">
          <Trait icon={<Icon name="bolt" />} label="Spontaneous" />
          <Trait icon={<span className="palm-glyph">♨</span>} label="Experience-led" />
          <Trait icon={<Icon name="heart" />} label="Big-hearted" />
        </div>

        <p className="growth-note">
          <span>✧</span> Money styles can change as your habits grow.
        </p>
      </section>

      <div className="sticky-action onboarding-action">
        <button className="primary-button" type="button" onClick={onContinue}>
          Build my plan
        </button>
      </div>
    </div>
  );
}

function Trait({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="trait">
      <span>{icon}</span>
      <small>{label}</small>
    </div>
  );
}

function HomeScreen({
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
              aria-label={balanceVisible ? `Hide ${activeCard.label} balance` : `Show ${activeCard.label} balance`}
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
                  isActive ? `Open ${card.label} card ending in ${card.number}` : `Bring ${card.label} card to front`
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
              aria-label={`Show next card, ${rearCard.label}`}
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
          <img src={sunsetJeepney} alt="Jeepney traveling beside the coast at sunset" />
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
          {transactions.map((transaction) => (
            <button
              type="button"
              className="transaction-row"
              key={transaction.name}
              onClick={() => onAction(transaction.name)}
            >
              <span className="transaction-icon">{transaction.icon}</span>
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

function QuickAction({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}>
      <span>
        <Icon name={icon} />
      </span>
      <small>{label}</small>
    </button>
  );
}

function QuestScreen({
  isTracking,
  onBack,
  onSetLimit,
  onComplete,
}: {
  isTracking: boolean;
  onBack: () => void;
  onSetLimit: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="tab-page quest-page">
      <header className="centered-app-bar page-app-bar">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to home">
          <Icon name="arrow-left" />
        </button>
        <strong>Quest</strong>
        <button className="icon-button clear-button" type="button" aria-label="Quest options">
          <Icon name="more" />
        </button>
      </header>

      <section className="quest-title-block">
        <span className="large-quest-icon">
          <Icon name="target" />
        </span>
        <div>
          <h1>Keep today intentional</h1>
          <p>Stay within the limit you chose and make every peso count.</p>
        </div>
      </section>

      {isTracking && (
        <div className="tracking-status">
          <Icon name="check" />
          <span>
            <strong>₱3,000 limit active</strong>
            <small>Your quest is now tracking today’s spending.</small>
          </span>
        </div>
      )}

      <section className="quest-ring-wrap" aria-label="41 percent of the daily limit used">
        <div className="quest-ring">
          <div>
            <strong>₱1,240</strong>
            <span>spent</span>
            <i />
            <b>₱1,760</b>
            <span>left today</span>
          </div>
        </div>
        <span className="ring-percent">41%</span>
      </section>

      <section className="why-section">
        <h2>
          <span>✦</span> Why this fits you
        </h2>
        <p>
          You value freedom and experiences.
          <br />A clear limit keeps the fun without the regret.
        </p>
      </section>

      <section className="reward-strip">
        <span className="xp-star">
          <Icon name="star" />
        </span>
        <span>
          <strong>80 XP</strong>
          <small>Reward</small>
        </span>
        <i />
        <img src={sunsetJeepney} alt="Sunset Ride card preview" />
        <span>
          <small>Unlock</small>
          <strong className="teal-text">Sunset Ride</strong>
          <small>card style</small>
        </span>
      </section>

      <div className="quest-actions">
        <button className="primary-button" type="button" onClick={isTracking ? onComplete : onSetLimit}>
          {isTracking ? "Preview end-of-day result" : "Set ₱3,000 limit"}
        </button>
        <button className="text-button" type="button" onClick={isTracking ? onBack : onSetLimit}>
          {isTracking ? "Back to home" : "Choose another amount"}
        </button>
      </div>
    </div>
  );
}

type WalletProps = {
  selectedCard: CardId;
  onSelectCard: (card: CardId) => void;
  limitSetup: boolean;
  rewardUnlocked: boolean;
  cardStyleApplied: boolean;
  frozenCards: Record<CardId, boolean>;
  onlinePayments: boolean;
  atmWithdrawals: boolean;
  onFrozenChange: (card: CardId, value: boolean) => void;
  onOnlineChange: (value: boolean) => void;
  onAtmChange: (value: boolean) => void;
  onConfirmLimit: () => void;
  onCancelLimit: () => void;
  onNavigate: (screen: Screen) => void;
};

function WalletScreen(props: WalletProps) {
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const selectedNumber = cards.find((card) => card.id === props.selectedCard)?.number ?? cards[0].number;
  return (
    <div className="tab-page wallet-page">
      <header className="centered-app-bar page-app-bar">
        <span className="app-bar-spacer" />
        <strong>{props.limitSetup ? "Set spending limit" : "My Cards"}</strong>
        <button className="icon-button clear-button" type="button" aria-label="Card options">
          <Icon name="more" />
        </button>
      </header>

      {props.limitSetup && (
        <div className="quest-context-banner">
          <Icon name="target" />
          <span>
            <strong>Quest step</strong>
            <small>Set a limit on your main card to continue.</small>
          </span>
        </div>
      )}

      <section className="card-stack" aria-label="Your cards">
        {cards.map((card) => (
          <PaymentCard
            key={card.id}
            card={card}
            selected={props.selectedCard === card.id}
            onClick={() => props.onSelectCard(card.id)}
            onFreeze={() => props.onFrozenChange(card.id, !props.frozenCards[card.id])}
          />
        ))}
      </section>

      <button className="add-card-button" type="button">
        <Icon name="plus" /> Add card
      </button>

      {!props.limitSetup && (
        <section className="money-field wallet-move-money">
          <h2>Move money</h2>
          <div className="control-list">
            <LinkRow
              icon="send"
              title="Send money"
              detail={`From •••• ${selectedNumber}`}
              onClick={() => props.onNavigate("transfer")}
            />
            <LinkRow
              icon="arrow-down"
              title="Add money"
              detail="Top up this card"
              onClick={() => props.onNavigate("deposit")}
            />
            <LinkRow
              icon="receipt"
              title="Pay a bill"
              detail="Billers and QR payments"
              onClick={() => props.onNavigate("payments")}
            />
          </div>
        </section>
      )}

      <section className={`controls-section ${props.limitSetup ? "is-highlighted" : ""}`}>
        <h2>Controls for •••• {selectedNumber}</h2>
        <div className="control-list">
          <ControlRow
            icon="snow"
            title="Freeze card"
            detail="Temporarily block your card"
            trailing={
              <Toggle
                checked={props.frozenCards[props.selectedCard]}
                onChange={(value) => props.onFrozenChange(props.selectedCard, value)}
                label="Freeze card"
              />
            }
          />
          <ControlRow
            icon="globe"
            title="Online payments"
            detail="Enable online transactions"
            trailing={<Toggle checked={props.onlinePayments} onChange={props.onOnlineChange} label="Online payments" />}
          />
          <ControlRow
            icon="bank"
            title="ATM withdrawals"
            detail="Enable for cash withdrawals"
            trailing={<Toggle checked={props.atmWithdrawals} onChange={props.onAtmChange} label="ATM withdrawals" />}
          />
          <ControlRow
            icon="limit"
            title="Spending limit"
            detail="Daily limit for this card"
            trailing={
              <strong className="limit-amount">
                ₱3,000 <small>/ day</small>
              </strong>
            }
          />
        </div>
      </section>

      {props.limitSetup && (
        <div className="wallet-limit-actions">
          <button className="primary-button" type="button" onClick={props.onConfirmLimit}>
            Confirm ₱3,000 limit
          </button>
          <button className="text-button" type="button" onClick={props.onCancelLimit}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function PaymentCard({
  card,
  selected,
  onClick,
  onFreeze,
}: {
  card: CardView;
  selected: boolean;
  onClick: () => void;
  onFreeze: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!selected) {
      setFlipped(false);
      setRevealed(false);
      setAuthOpen(false);
    }
  }, [selected]);

  useEffect(() => {
    if (!revealed) return;
    const privacyTimer = window.setTimeout(() => setRevealed(false), 20_000);
    return () => window.clearTimeout(privacyTimer);
  }, [revealed]);

  useEffect(() => {
    const hideSensitiveDetails = () => {
      if (document.hidden) setRevealed(false);
    };
    const hideOnBlur = () => setRevealed(false);
    document.addEventListener("visibilitychange", hideSensitiveDetails);
    window.addEventListener("blur", hideOnBlur);
    return () => {
      document.removeEventListener("visibilitychange", hideSensitiveDetails);
      window.removeEventListener("blur", hideOnBlur);
    };
  }, []);

  useEffect(() => {
    if (!authOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAuthOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [authOpen]);

  const toggleFlip = () => {
    if (!selected) onClick();
    setFlipped((value) => {
      if (value) {
        setRevealed(false);
        setAuthOpen(false);
      }
      return !value;
    });
  };

  const toggleFreeze = () => {
    if (!selected) onClick();
    onFreeze();
  };

  return (
    <article className={`payment-card-shell ${selected ? "is-selected" : ""}`}>
      <div className={`payment-card-flipper ${flipped ? "is-flipped" : ""}`}>
        <section className={`payment-card payment-card-front payment-card-${card.variant}`} aria-hidden={flipped}>
          <CardFace card={card} />
          <button
            className="card-select-surface"
            type="button"
            onClick={onClick}
            aria-label={`${card.label} card ending in ${card.number}${selected ? ", selected" : ""}`}
            aria-pressed={selected}
            tabIndex={flipped ? -1 : 0}
          />

          <aside className="card-utility-rail" aria-label={`${card.label} quick actions`}>
            <button
              type="button"
              onClick={toggleFreeze}
              tabIndex={flipped ? -1 : 0}
              aria-pressed={card.frozen}
              aria-label={`${card.frozen ? "Unfreeze" : "Freeze"} ${card.label} card`}
            >
              <Icon name="snow" />
              <span>{card.frozen ? "Unfreeze" : "Freeze"}</span>
            </button>
            <i />
            <button
              type="button"
              onClick={toggleFlip}
              tabIndex={flipped ? -1 : 0}
              aria-label={`View secure details for ${card.label} card`}
            >
              <Icon name="eye" />
              <span>Details</span>
            </button>
          </aside>
        </section>

        <section className="payment-card payment-card-back" aria-hidden={!flipped}>
          <div className="card-back-top">
            <span className="card-back-number" aria-live="polite">
              {revealed ? card.fullNumber : `•••• •••• •••• ${card.number}`}
            </span>
            <button
              className="card-reveal-button"
              type="button"
              onClick={() => (revealed ? setRevealed(false) : setAuthOpen(true))}
              tabIndex={flipped ? 0 : -1}
              aria-label={revealed ? "Hide card number" : "Reveal full card number"}
              aria-pressed={revealed}
            >
              <Icon name={revealed ? "eye-off" : "eye"} />
            </button>
          </div>
          <div className="card-back-meta">
            <span>
              <small>Account opened</small>
              <strong>Jan 2025</strong>
            </span>
            <span>
              <small>Expires</small>
              <strong>{card.expiry}</strong>
            </span>
            <span>
              <small>Security code</small>
              <strong>{revealed ? "427" : "•••"}</strong>
            </span>
          </div>
          <div className="signature-line">
            <small>Signature</small>
            <strong>Maya Santos</strong>
          </div>
          <div className="card-back-brand">
            <span>{card.label}</span>
            <BrandMark compact light />
          </div>

          {authOpen && (
            <div className="card-auth-panel" role="dialog" aria-modal="true" aria-label="Confirm your identity">
              <strong>Confirm it’s you</strong>
              <small>This prototype simulates biometric verification.</small>
              <div>
                <button
                  autoFocus
                  type="button"
                  onClick={() => {
                    setAuthOpen(false);
                    setRevealed(true);
                  }}
                >
                  Use demo Face ID
                </button>
                <button type="button" onClick={() => setAuthOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {selected && (
        <span className="selected-check" aria-label="Selected card">
          <Icon name="check" />
        </span>
      )}

      <button className="card-flip-button" type="button" onClick={toggleFlip} aria-pressed={flipped}>
        <Icon name="rotate" /> {flipped ? "Show card front" : "Flip to card details"}
      </button>
    </article>
  );
}

function CardFace({ card }: { card: CardView }) {
  return (
    <>
      {card.artwork && <img className="card-artwork" src={card.artwork} alt="" />}
      <span className="card-overlay" />
      <span className="card-front-content">
        <span className="card-top">
          <BrandMark compact light={card.variant === "teal"} preserveInk={card.variant === "sunset"} />
          <small>debit</small>
        </span>
        <span className="card-middle">
          <span className="chip" />
          <span className="contactless">)))</span>
        </span>
        <span className="card-data-row">
          <span className="card-number">•••• {card.number}</span>
          <span className="card-expiry">
            <small>
              Valid
              <br />
              thru
            </small>
            <strong>{card.expiry}</strong>
          </span>
        </span>
        <span className="card-bottom">
          <strong>Maya Santos</strong>
          <b>VISA</b>
        </span>
        <span className="card-tag">{card.frozen ? "Frozen" : card.unlocked ? card.label : "Locked reward"}</span>
      </span>
    </>
  );
}

function ControlRow({
  icon,
  title,
  detail,
  trailing,
}: {
  icon: IconName;
  title: string;
  detail: string;
  trailing: ReactNode;
}) {
  return (
    <div className="control-row">
      <span className="control-icon">
        <Icon name={icon} />
      </span>
      <span className="control-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="control-trailing">{trailing}</span>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      className={`toggle ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function RewardScreen({ onApply, onHome }: { onApply: () => void; onHome: () => void }) {
  return (
    <div className="onboarding-page reward-page">
      <header>
        <BrandMark compact />
      </header>
      <section className="reward-content">
        <div className="celebration-orbit" aria-hidden="true">
          <span>✦</span>
          <i>✧</i>
          <b>✦</b>
        </div>
        <p className="eyebrow">Quest complete</p>
        <h1>You kept it intentional</h1>
        <p>You stayed within your ₱3,000 limit today.</p>
        <div className="xp-earned">
          <strong>80</strong>
          <b>XP</b>
          <span>earned</span>
        </div>
        <div className="level-progress">
          <span>
            <b>Level 3</b>
            <b>Level 4</b>
          </span>
          <div className="progress-track">
            <i style={{ width: "76%" }} />
          </div>
        </div>

        <div className="unlocked-card">
          <img src={sunsetJeepney} alt="Jeepney traveling along the coast at sunset" />
          <span className="card-overlay" />
          <span className="card-top">
            <BrandMark compact preserveInk />
            <small>debit</small>
          </span>
          <span className="card-middle">
            <span className="chip" />
            <span className="contactless">)))</span>
          </span>
          <span className="card-number">•••• 8421</span>
          <span className="unlocked-card-name">
            <strong>Sunset Ride</strong>
            <small>✦ Just unlocked</small>
          </span>
          <b className="visa">VISA</b>
          <span className="new-badge">
            New
            <br />
            style
          </span>
        </div>
      </section>
      <div className="reward-actions">
        <button className="primary-button" type="button" onClick={onApply}>
          Use this card style
        </button>
        <button className="secondary-button" type="button" onClick={onHome}>
          Back to home
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="tab-page profile-page">
      <header className="centered-app-bar page-app-bar">
        <span />
        <strong>Profile</strong>
        <button className="icon-button clear-button" type="button" aria-label="Profile options">
          <Icon name="more" />
        </button>
      </header>
      <section className="profile-hero">
        <span className="profile-avatar">
          <Icon name="user" />
        </span>
        <h1>Maya Santos</h1>
        <p>The Free Spirit · Level 3</p>
        <div className="profile-level">
          <span style={{ width: "75%" }} />
        </div>
      </section>
      <section className="profile-section">
        <h2>Your money style</h2>
        <p>You value freedom, experiences, and generosity. Your plan focuses on spending with intention.</p>
      </section>
      <section className="profile-section">
        <h2>Prototype controls</h2>
        <button className="secondary-button" type="button" onClick={onRestart}>
          Retake money style quiz
        </button>
      </section>
    </div>
  );
}

function PageBar({ title, onBack, optionsLabel }: { title: string; onBack?: () => void; optionsLabel: string }) {
  return (
    <header className="centered-app-bar page-app-bar">
      {onBack ? (
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to home">
          <Icon name="arrow-left" />
        </button>
      ) : (
        <span className="app-bar-spacer" />
      )}
      <strong>{title}</strong>
      <button className="icon-button clear-button" type="button" aria-label={optionsLabel}>
        <Icon name="more" />
      </button>
    </header>
  );
}

function LinkRow({
  icon,
  title,
  detail,
  meta,
  selected,
  onClick,
}: {
  icon: IconName;
  title: string;
  detail: string;
  meta?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`link-row ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="control-icon">
        <Icon name={icon} />
      </span>
      <span className="control-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="link-row-trailing">
        {meta && <small>{meta}</small>}
        <Icon name={selected ? "check" : "chevron-right"} />
      </span>
    </button>
  );
}

function SourcePicker({
  label,
  cards,
  selected,
  onSelect,
}: {
  label: string;
  cards: CardView[];
  selected: CardId;
  onSelect: (card: CardId) => void;
}) {
  return (
    <section className="money-field">
      <span className="field-label">{label}</span>
      <div className="source-picker" role="group" aria-label={`${label} account`}>
        {cards.map((card) => (
          <button
            className={`source-option ${selected === card.id ? "is-selected" : ""}`}
            type="button"
            key={card.id}
            onClick={() => onSelect(card.id)}
            aria-pressed={selected === card.id}
          >
            <span className="source-option-top">
              <Icon name="card" />
              <strong>{card.label}</strong>
            </span>
            <small>•••• {card.number}</small>
            <b>{card.balance}</b>
            {card.frozen && <em>Frozen</em>}
          </button>
        ))}
      </div>
    </section>
  );
}

function AmountField({
  label,
  value,
  onChange,
  available,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  available: string;
}) {
  return (
    <section className="money-field">
      <span className="field-label">{label}</span>
      <div className="amount-field">
        <span className="amount-input">
          <span className="amount-currency" aria-hidden="true">
            ₱
          </span>
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={label}
          />
        </span>
        <small className="amount-available">Available {available}</small>
      </div>
      <div className="amount-presets">
        {amountPresets.map((preset) => (
          <button
            className={`amount-preset ${value === preset ? "is-selected" : ""}`}
            type="button"
            key={preset}
            onClick={() => onChange(preset)}
            aria-pressed={value === preset}
          >
            ₱{preset}
          </button>
        ))}
      </div>
    </section>
  );
}

type MoneyScreenProps = {
  selectedCard: CardId;
  onSelectCard: (card: CardId) => void;
  frozenCards: Record<CardId, boolean>;
  rewardUnlocked: boolean;
  cardStyleApplied: boolean;
  onBack: () => void;
  onSimulate: (action: string) => void;
};

function TransferScreen(props: MoneyScreenProps) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState(recentRecipients[0].initials);
  const [note, setNote] = useState("");
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const source = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="onboarding-page money-page transfer-page">
      <PageBar title="Send money" onBack={props.onBack} optionsLabel="Transfer options" />

      <SourcePicker label="From" cards={cards} selected={source.id} onSelect={props.onSelectCard} />
      <AmountField label="Amount to send" value={amount} onChange={setAmount} available={source.balance} />

      <section className="money-field">
        <span className="field-label">Send to</span>
        <div className="recipient-row">
          {recentRecipients.map((person) => (
            <button
              className={`recipient-chip ${recipient === person.initials ? "is-selected" : ""}`}
              type="button"
              key={person.initials}
              onClick={() => setRecipient(person.initials)}
              aria-pressed={recipient === person.initials}
            >
              <span aria-hidden="true">{person.initials}</span>
              <strong>{person.name}</strong>
              <small>{person.handle}</small>
            </button>
          ))}
          <button
            className="recipient-chip recipient-add"
            type="button"
            onClick={() => props.onSimulate("New recipient")}
          >
            <span aria-hidden="true">
              <Icon name="plus" />
            </span>
            <strong>New</strong>
            <small>Add recipient</small>
          </button>
        </div>
      </section>

      <label className="money-note">
        <span className="field-label">Note (optional)</span>
        <span className="input-shell">
          <Icon name="mail" />
          <input
            type="text"
            placeholder="What is this for?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </span>
      </label>

      <div className="summary-strip">
        <Icon name="bolt" />
        <span>
          <strong>Fee ₱0.00</strong>
          <small>Arrives instantly to FIN-A wallets</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={() => props.onSimulate("Send money")}>
          Continue
        </button>
        <p className="prototype-note">{SIMULATED_NOTE}</p>
      </div>
    </div>
  );
}

function DepositScreen(props: MoneyScreenProps) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(depositMethods[0].id);
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const destination = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="onboarding-page money-page deposit-page">
      <PageBar title="Add money" onBack={props.onBack} optionsLabel="Deposit options" />

      <SourcePicker label="To" cards={cards} selected={destination.id} onSelect={props.onSelectCard} />
      <AmountField label="Amount to add" value={amount} onChange={setAmount} available={destination.balance} />

      <section className="money-field">
        <span className="field-label">Choose a method</span>
        <div className="control-list">
          {depositMethods.map((item) => (
            <LinkRow
              key={item.id}
              icon={item.icon}
              title={item.title}
              detail={item.detail}
              selected={method === item.id}
              onClick={() => setMethod(item.id)}
            />
          ))}
        </div>
      </section>

      <div className="summary-strip">
        <Icon name="arrow-down" />
        <span>
          <strong>No fee</strong>
          <small>Arrives in seconds once confirmed</small>
        </span>
      </div>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={() => props.onSimulate("Add money")}>
          Add money
        </button>
        <p className="prototype-note">{SIMULATED_NOTE}</p>
      </div>
    </div>
  );
}

function PaymentsScreen(props: MoneyScreenProps & { onNavigate: (screen: Screen) => void }) {
  const cards = getCardViews(props.frozenCards, props.rewardUnlocked, props.cardStyleApplied);
  const source = cards.find((card) => card.id === props.selectedCard) ?? cards[0];

  return (
    <div className="tab-page money-page payments-page">
      <PageBar title="Pay" optionsLabel="Payment options" />

      <button className="pay-scan-card" type="button" onClick={() => props.onSimulate("Pay with QR")}>
        <span className="pay-scan-icon">
          <Icon name="qr" />
        </span>
        <span className="pay-scan-copy">
          <strong>Scan to pay</strong>
          <small>Point your camera at any QR Ph code</small>
        </span>
        <Icon name="chevron-right" />
      </button>

      <section className="money-field">
        <span className="field-label">Move money</span>
        <div className="control-list">
          <LinkRow
            icon="send"
            title="Send money"
            detail={`From •••• ${source.number}`}
            onClick={() => props.onNavigate("transfer")}
          />
          <LinkRow
            icon="arrow-down"
            title="Add money"
            detail="Cash in from bank, card, or counter"
            onClick={() => props.onNavigate("deposit")}
          />
        </div>
      </section>

      <section className="money-field">
        <span className="field-label">Pay a bill</span>
        <div className="control-list">
          {billers.map((biller) => (
            <LinkRow
              key={biller.id}
              icon={biller.icon}
              title={biller.name}
              detail={biller.detail}
              meta={biller.due}
              onClick={() => props.onSimulate(`Pay ${biller.name}`)}
            />
          ))}
        </div>
      </section>

      <section className="home-section">
        <h2>Scheduled</h2>
        <div className="transaction-list">
          {scheduledPayments.map((payment) => (
            <button
              type="button"
              className="transaction-row"
              key={payment.name}
              onClick={() => props.onSimulate(payment.name)}
            >
              <span className="transaction-icon">{payment.icon}</span>
              <span className="transaction-copy">
                <strong>{payment.name}</strong>
                <small>{payment.when}</small>
              </span>
              <strong>{payment.amount}</strong>
            </button>
          ))}
        </div>
      </section>

      <p className="prototype-note">{SIMULATED_NOTE}</p>
    </div>
  );
}

function BottomNav({ active, onNavigate }: { active: TabScreen; onNavigate: (screen: Screen) => void }) {
  const items: { id: TabScreen; label: string; icon: IconName }[] = [
    { id: "home", label: "Home", icon: "home" },
    { id: "wallet", label: "Wallet", icon: "wallet" },
    { id: "payments", label: "Pay", icon: "qr" },
    { id: "quest", label: "Quests", icon: "target" },
    { id: "profile", label: "Profile", icon: "user" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          className={active === item.id ? "is-active" : ""}
          type="button"
          key={item.id}
          onClick={() => onNavigate(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function ActionSheet({ action, onClose }: { action: string; onClose: () => void }) {
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="action-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sheet-handle" />
        <span className="sheet-icon">
          <Icon name="wallet" />
        </span>
        <h2 id="sheet-title">{action}</h2>
        <p>{SIMULATED_NOTE}</p>
        <button className="primary-button" type="button" onClick={onClose}>
          Got it
        </button>
      </section>
    </div>
  );
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-down": (
      <>
        <path d="M12 4v14" />
        <path d="M6 13l6 6 6-6" />
      </>
    ),
    "arrow-left": (
      <>
        <path d="M15 18l-6-6 6-6" />
      </>
    ),
    bank: (
      <>
        <path d="M3 10h18M5 10v8m4-8v8m6-8v8m4-8v8M3 21h18M12 3l9 5H3l9-5z" />
      </>
    ),
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
    card: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M2.5 10h19" />
      </>
    ),
    check: <path d="M5 12.5l4 4L19 7" />,
    "chevron-right": <path d="M9 18l6-6-6-6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    contrast: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 000 18V3z" fill="currentColor" stroke="none" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    "eye-off": (
      <>
        <path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c6.5 0 10 6 10 6a15 15 0 01-3 3.6M6.2 6.2C3.6 8 2 12 2 12s3.5 6 10 6c1 0 2-.15 2.8-.4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14 0 18M12 3c-3 3.5-3 14 0 18" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.4 5.4 0 00-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 00-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 000-7.6z" />
    ),
    home: (
      <>
        <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" />
      </>
    ),
    limit: (
      <>
        <path d="M4 19a8 8 0 1116 0" />
        <path d="M12 15l4-4M7 19h10" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    qr: (
      <>
        <rect x="3" y="3" width="6" height="6" />
        <rect x="15" y="3" width="6" height="6" />
        <rect x="3" y="15" width="6" height="6" />
        <path d="M15 15h3v3h3v3h-6v-6z" />
      </>
    ),
    receipt: (
      <>
        <path d="M5 3h14v18l-3-2-3 2-3-2-3 2V3z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
    rotate: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M6.1 8A7 7 0 0118.5 6.5L20 12M4 12l1.5 5.5A7 7 0 0017.9 16" />
      </>
    ),
    send: (
      <>
        <path d="M22 2L9.5 14.5M22 2l-7 20-4.5-7.5L3 10l19-8z" />
      </>
    ),
    snow: (
      <>
        <path d="M12 2v20M4.2 6.5l15.6 11M4.2 17.5l15.6-11M9 4l3 2 3-2M9 20l3-2 3 2" />
      </>
    ),
    star: <path d="M12 2l3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8l3-6z" />,
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M14 10l6-6M16 4h4v4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0116 0" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 7a2 2 0 012-2h14a2 2 0 012 2v12H5a2 2 0 01-2-2V7z" />
        <path d="M3 8h16a2 2 0 012 2v3h-6a2 2 0 010-4h6" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default App;
