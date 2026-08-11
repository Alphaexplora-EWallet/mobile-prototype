import { useHelpViewModel } from "@/core/viewmodels/useSupportViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";

export function HelpScreen() {
  const vm = useHelpViewModel();

  return (
    <div className="onboarding-page help-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Help options" />

      <section className="activity-intro">
        <h1>How can we help?</h1>
        <p>{vm.intro}</p>
      </section>

      <section className="help-topics" aria-label="Help topics">
        {vm.topics.map((topic) => (
          <div className={topic.open ? "help-topic is-open" : "help-topic"} key={topic.id}>
            <button type="button" aria-expanded={topic.open} onClick={() => vm.toggle(topic.id)}>
              <span>{topic.question}</span>
              <Icon name={topic.open ? "arrow-down" : "chevron-right"} />
            </button>
            {topic.open && <p>{topic.answer}</p>}
          </div>
        ))}
      </section>

      <section className="money-field">
        <span className="field-label">Still stuck?</span>
        <div className="money-actions">
          <button className="secondary-button" type="button" disabled={!vm.canDispute} onClick={vm.dispute}>
            Dispute a payment
          </button>
          <p className="prototype-note">{vm.disputeHint}</p>
          <button className="text-button" type="button" onClick={vm.contact}>
            Contact support
          </button>
        </div>
      </section>
    </div>
  );
}
