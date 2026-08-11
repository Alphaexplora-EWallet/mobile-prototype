import { useRecipientsViewModel } from "@/core/viewmodels/useTransferDestinationViewModel";
import { PageBar } from "../layout/PageBar";
import { Icon } from "../primitives/Icon";
import { StateBlock } from "../primitives/StateBlock";

export function RecipientsScreen() {
  const vm = useRecipientsViewModel();

  return (
    <div className="onboarding-page recipients-page">
      <PageBar title={vm.title} onBack={vm.back} optionsLabel="Recipient options" />

      <section className="activity-intro">
        <h1>Choose a recipient</h1>
        <p>{vm.intro}</p>
      </section>

      <button className="destination-cta" type="button" onClick={vm.addMobile}>
        <span className="destination-cta-icon">
          <Icon name="send" />
        </span>
        <span className="control-copy">
          <strong>Send to a mobile number</strong>
          <small>Any FIN-A wallet registered to a Philippine number</small>
        </span>
        <Icon name="chevron-right" />
      </button>

      <button className="destination-cta" type="button" onClick={vm.addBankAccount}>
        <span className="destination-cta-icon">
          <Icon name="bank" />
        </span>
        <span className="control-copy">
          <strong>Send to a bank account</strong>
          <small>Any Philippine bank over InstaPay or PESONet</small>
        </span>
        <Icon name="chevron-right" />
      </button>

      {vm.items.length === 0 ? (
        <StateBlock tone="empty" message="You have not saved any recipients yet." />
      ) : (
        <section className="recipient-list" aria-label="Saved recipients">
          {vm.items.map((item) => (
            <div className={`recipient-list-row ${item.selected ? "is-selected" : ""}`} key={item.id}>
              <button
                type="button"
                className="recipient-list-choose"
                aria-pressed={item.selected}
                onClick={() => vm.select(item.id)}
              >
                <span className="recipient-initials" aria-hidden="true">
                  {item.initials}
                </span>
                <span className="control-copy">
                  <strong>{item.name}</strong>
                  <small>{item.handle}</small>
                </span>
                {item.selected && <Icon name="check" />}
              </button>
              <button
                type="button"
                className="clear-button"
                aria-label={`Remove ${item.name}`}
                onClick={() => vm.remove(item.id)}
              >
                <Icon name="trash" />
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
