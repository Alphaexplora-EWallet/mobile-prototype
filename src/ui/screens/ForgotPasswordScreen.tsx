import { useForgotPasswordViewModel } from "@/core/viewmodels/useAuthViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function ForgotPasswordScreen() {
  const vm = useForgotPasswordViewModel();

  return (
    <div className="onboarding-page forgot-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Reset options" />

      {vm.sentTo ? (
        <StateBlock
          tone="empty"
          title="Check your inbox"
          message={vm.confirmation}
          action={{ label: "Back to sign in", onPress: vm.back, variant: "primary" }}
        />
      ) : (
        <>
          <section className="activity-intro">
            <h1>Reset your password</h1>
            <p>{vm.intro}</p>
          </section>

          <label className="money-note">
            <span className="field-label">Email</span>
            <span className="input-shell">
              <Icon name="mail" />
              <input
                type="email"
                placeholder="you@example.com"
                aria-label="Email address"
                value={vm.email}
                onChange={(event) => vm.setEmail(event.target.value)}
              />
            </span>
          </label>

          {vm.error && (
            <p className="transfer-error" role="alert">
              {vm.error}
            </p>
          )}

          <div className="money-actions">
            <button className="primary-button" type="button" disabled={!vm.canSubmit} onClick={() => void vm.submit()}>
              {vm.isSending ? "Sending…" : "Send reset link"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
