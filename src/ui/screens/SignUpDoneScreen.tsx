import { useSignUpDoneViewModel } from "@/core/viewmodels/useSignUpViewModel";
import { BrandMark } from "../layout/BrandMark";
import { Icon } from "../primitives/Icon";

export function SignUpDoneScreen() {
  const vm = useSignUpDoneViewModel();

  return (
    <div className="onboarding-page sign-up-done-page">
      <header className="welcome-logo">
        <BrandMark tagline />
      </header>

      <section className="signup-done-hero">
        <span className="confirm-lock signup-done-check">
          <Icon name="check" />
        </span>
        <h1>
          Your wallet is
          <br />
          ready, {vm.firstName}.
        </h1>
        <p>
          Money that follows your life — and rewards you for it. Your number is registered, your PIN is set, and your
          wallet is ready to go.
        </p>
      </section>

      <div className="money-actions">
        <button className="primary-button" type="button" onClick={vm.takeQuiz}>
          <span>✦</span> Find my money style <b>›</b>
        </button>
        <button className="secondary-button" type="button" onClick={vm.goToWallet}>
          Go to my wallet
        </button>
        <p className="prototype-note">You can take the quiz any time from your Profile.</p>
      </div>
    </div>
  );
}
