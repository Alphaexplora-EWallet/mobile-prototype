import { useLayoutEffect, useState } from "react";

import type { CardId } from "@/core/domain/card";
import type { Screen } from "@/core/navigation/screens";
import { isTabScreen } from "@/core/navigation/screens";
import { INITIAL_FROZEN } from "@/core/data/mock/cards.mock";

import type { Theme } from "@/ui/theme/ThemeContext";
import { ThemeProvider } from "@/ui/theme/ThemeContext";
import { StatusBar } from "@/ui/layout/StatusBar";
import { BottomNav } from "@/ui/layout/BottomNav";
import { ActionSheet } from "@/ui/overlays/ActionSheet";
import { WelcomeScreen } from "@/ui/screens/WelcomeScreen";
import { SignInScreen } from "@/ui/screens/SignInScreen";
import { QuizScreen } from "@/ui/screens/QuizScreen";
import { ResultScreen } from "@/ui/screens/ResultScreen";
import { HomeScreen } from "@/ui/screens/HomeScreen";
import { QuestScreen } from "@/ui/screens/QuestScreen";
import { WalletScreen } from "@/ui/screens/WalletScreen";
import { TransferScreen } from "@/ui/screens/TransferScreen";
import { DepositScreen } from "@/ui/screens/DepositScreen";
import { PaymentsScreen } from "@/ui/screens/PaymentsScreen";
import { RewardScreen } from "@/ui/screens/RewardScreen";
import { ProfileScreen } from "@/ui/screens/ProfileScreen";

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
  const [frozenCards, setFrozenCards] = useState<Record<CardId, boolean>>(INITIAL_FROZEN);
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

  return (
    <ThemeProvider value={theme}>
      <main className="app-stage">
        <section className="phone-shell" aria-label="FIN-A mobile app prototype">
          <StatusBar />
          <div className={`screen screen-${screen}`}>{renderScreen()}</div>
          {isTabScreen(screen) && <BottomNav active={screen} onNavigate={navigate} />}
          {sheet && <ActionSheet action={sheet} onClose={() => setSheet(null)} />}
        </section>
      </main>
    </ThemeProvider>
  );
}

export default App;
