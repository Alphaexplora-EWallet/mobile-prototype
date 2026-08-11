/**
 * Loading, error and empty states, previously copy-pasted across four screens
 * with the ARIA role sometimes present and sometimes not.
 *
 * The tone chooses the role, which is the part that kept getting dropped: a
 * loading message has to announce itself as `status` and a failure as `alert`,
 * or a screen reader never learns the screen changed.
 */
export type StateTone = "loading" | "error" | "empty";

export type StateAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "text";
};

const ROLE: Readonly<Record<StateTone, "status" | "alert" | undefined>> = {
  loading: "status",
  error: "alert",
  empty: undefined,
};

const BUTTON_CLASS: Readonly<Record<NonNullable<StateAction["variant"]>, string>> = {
  primary: "primary-button",
  secondary: "secondary-button",
  text: "text-button",
};

export function StateBlock({
  tone,
  title,
  message,
  action,
  className,
}: {
  tone: StateTone;
  title?: string;
  message: string;
  action?: StateAction;
  className?: string;
}) {
  const classes = ["activity-state", tone === "error" ? "activity-error" : null, className].filter(Boolean).join(" ");

  // A bare message stays a paragraph; anything richer needs a container.
  if (!title && !action) {
    return (
      <p className={classes} role={ROLE[tone]}>
        {message}
      </p>
    );
  }

  return (
    <section className={classes} role={ROLE[tone]}>
      {title && <h1>{title}</h1>}
      <p>{message}</p>
      {action && (
        <button className={BUTTON_CLASS[action.variant ?? "secondary"]} type="button" onClick={action.onPress}>
          {action.label}
        </button>
      )}
    </section>
  );
}
