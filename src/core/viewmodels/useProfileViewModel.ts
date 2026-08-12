import { useEffect, useState } from "react";
import type { IconName } from "../domain/icons";
import type { KycStatus } from "../domain/compliance";
import { KYC_TIERS, nextKycTier } from "../domain/compliance";
import { unreadCount, visibleNotifications } from "../domain/notification";
import { levelFromXp } from "../domain/progress";
import type { OtpChallenge } from "../domain/security";
import { USER_STATUS_LABELS } from "../domain/user";
import { MOCK_MONEY_STYLE } from "../data/mock/quiz.mock";
import { MOCK_OTP_CODE } from "../data/mock/security.mock";
import type { Screen } from "../navigation/screens";
import { useNavigation } from "../navigation/useNavigation";
import { useBankingGateway } from "../platform/BankingGatewayContext";
import { useQuestStore } from "../stores/quest.store";
import { useSettingsStore } from "../stores/settings.store";
import { uiActions } from "../stores/ui.store";
import { userActions, useUserStore } from "../stores/user.store";

export type ProfileRow = {
  id: Screen;
  icon: IconName;
  title: string;
  detail: string;
  /** Trailing text — a tier name, an unread count. */
  meta?: string;
};

export type ProfileSection = {
  id: string;
  label: string;
  rows: readonly ProfileRow[];
};

/**
 * Profile used to be a hero, a paragraph and a button, with the entire account
 * layer — verification, limits, statements, security, linked accounts — hidden
 * behind an unlabelled `⋯` glyph that navigated to Settings. Thirteen built
 * screens sat two and three taps deep behind one icon with no name.
 *
 * So the rows live here now, and Settings keeps only what it is actually about:
 * appearance and privacy. Nothing is listed in both places.
 */
export function useProfileViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();

  const fullName = useUserStore((state) => state.fullName);
  const level = levelFromXp(useQuestStore((state) => state.xpTotal));
  // Counts what the Notifications screen will actually show. A badge promising
  // three items that opens onto a list of one is worse than no badge.
  const unread = unreadCount(
    visibleNotifications(
      useSettingsStore((state) => state.notifications),
      useSettingsStore((state) => state.notificationPreferences),
    ),
  );

  const [kyc, setKyc] = useState<KycStatus | null>(null);

  useEffect(() => {
    let active = true;
    void gateway.compliance.kycStatus().then((result) => {
      if (!active) return;
      // A badge is decoration. If the tier cannot be read the rest of the screen
      // is still perfectly usable, so this failure stays silent rather than
      // pushing an error state in front of nine working links.
      if (result.ok) setKyc(result.value);
    });
    return () => {
      active = false;
    };
  }, [gateway]);

  const tierName = kyc ? KYC_TIERS[kyc.tier].name : "";
  const upcoming = kyc ? nextKycTier(kyc.tier) : null;

  const sections: readonly ProfileSection[] = [
    {
      id: "account",
      label: "Account",
      rows: [
        { id: "personal-details", icon: "user", title: "Personal details", detail: "Name, mobile, and email" },
        {
          id: "kyc-status",
          icon: "shield",
          title: "Verification",
          detail: "Your tier and what it unlocks",
          meta: tierName || undefined,
        },
        { id: "account-details", icon: "landmark", title: "Account details", detail: "Number, status, and funding" },
        { id: "bank-accounts", icon: "bank", title: "Linked accounts", detail: "Bank accounts you can send from" },
        { id: "limits", icon: "limit", title: "Limits and fees", detail: "What each rail costs and allows" },
        { id: "statements", icon: "receipt", title: "Statements", detail: "Monthly summaries to download" },
      ],
    },
    {
      id: "security",
      label: "Security",
      rows: [
        { id: "security-settings", icon: "lock", title: "Security", detail: "PIN, biometrics, and devices" },
        {
          id: "notifications",
          icon: "mail",
          title: "Notifications",
          detail: "Payments, security, and quests",
          meta: unread > 0 ? String(unread) : undefined,
        },
      ],
    },
    {
      id: "app",
      label: "App",
      rows: [
        { id: "settings", icon: "contrast", title: "Settings", detail: "Appearance and privacy" },
        { id: "help", icon: "heart", title: "Help and disputes", detail: "Common questions and how to dispute" },
      ],
    },
  ];

  return {
    title: "Profile",
    name: fullName,
    styleLine: `${MOCK_MONEY_STYLE.name} · Level ${level.level}`,
    styleBlurb: MOCK_MONEY_STYLE.blurb,
    levelPercent: level.percent,
    levelLabel: `${level.percent}% of the way to level ${level.level + 1}`,
    /**
     * Empty until the tier loads, and empty again once there is nothing left to
     * verify — a badge reading "Fully verified · no tiers left" would be noise.
     */
    verificationBadge: kyc ? (upcoming ? `${tierName} · one tier left` : tierName) : "",
    sections,
    open: (id: Screen) => navigation.navigate(id),
    retakeQuiz: () => navigation.navigate("quiz"),
    /**
     * Asked, not done. The confirmed branch is resolved by the app shell, which
     * outlives this screen — signing out unmounts it.
     */
    signOut: () =>
      uiActions.showConfirm({
        title: "Sign out?",
        body: "You will be returned to the welcome screen. This prototype keeps nothing, so signing back in starts from the demo data again.",
        confirmLabel: "Sign out",
        action: "sign-out",
      }),
  };
}

/** Which detail is being edited. Name is the only one that saves unchallenged. */
export type EditableField = "fullName" | "mobile" | "email";

const FIELD_LABELS: Readonly<Record<EditableField, string>> = {
  fullName: "Full name",
  mobile: "Mobile number",
  email: "Email address",
};

/** Changing where a code can be sent has to be proved with a code. */
const NEEDS_STEP_UP: Readonly<Record<EditableField, boolean>> = {
  fullName: false,
  mobile: true,
  email: true,
};

const isValid = (field: EditableField, value: string): boolean => {
  const trimmed = value.trim();
  if (field === "email") return /.+@.+\..+/.test(trimmed);
  if (field === "mobile") return trimmed.replace(/\D/g, "").length >= 10;
  return trimmed.length > 1;
};

/**
 * The user's own details, which the app had no surface for at all — the name on
 * Profile came from the *card* fixture and mobile and email existed nowhere.
 *
 * Three modes in one screen rather than three screens: reading, editing one
 * field, and proving it. A mobile or email change moves the address that
 * receives one-time codes, so changing it unproven would hand an attacker the
 * factor itself; the name has no such consequence and saves directly.
 */
export function usePersonalDetailsViewModel() {
  const navigation = useNavigation();
  const gateway = useBankingGateway();
  const user = useUserStore((state) => state);

  const [editing, setEditing] = useState<EditableField | null>(null);
  const [draft, setDraft] = useState("");
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [code, setCode] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);

  const digits = challenge?.digits ?? 6;

  const commit = (field: EditableField, value: string) => {
    const trimmed = value.trim();
    if (field === "fullName") userActions.setFullName(trimmed);
    else if (field === "mobile") userActions.setMobile(trimmed);
    else userActions.setEmail(trimmed);
    setSavedLabel(`${FIELD_LABELS[field]} updated.`);
    setEditing(null);
    setChallenge(null);
    setCode("");
  };

  return {
    title: "Personal details",
    intro: "What we call you, and where we can reach you.",
    rows: [
      { id: "fullName" as const, icon: "user" as IconName, label: FIELD_LABELS.fullName, value: user.fullName },
      { id: "mobile" as const, icon: "phone" as IconName, label: FIELD_LABELS.mobile, value: user.mobile },
      { id: "email" as const, icon: "mail" as IconName, label: FIELD_LABELS.email, value: user.email },
    ],
    readOnlyRows: [
      { label: "Member since", value: user.memberSinceLabel },
      { label: "Account status", value: USER_STATUS_LABELS[user.status] },
    ],
    savedLabel,
    error,
    /** Null while reading the list, a field id while editing one. */
    editing,
    editingLabel: editing ? FIELD_LABELS[editing] : "",
    draft,
    setDraft: (value: string) => {
      setDraft(value);
      setError(null);
    },
    canSave: editing !== null && isValid(editing, draft) && !isWorking,
    isWorking,
    /** True once a code has been requested and is waiting to be entered. */
    isVerifying: challenge !== null,
    verifyIntro: challenge ? `We sent a ${digits}-digit code to ${challenge.maskedDestination}.` : "",
    expiresLabel: challenge?.expiresInLabel ?? "",
    digits,
    code,
    setCode: (value: string) => setCode(value.replace(/\D/g, "").slice(0, digits)),
    canVerify: code.length === digits && !isWorking,
    hint: `Sandbox code: ${MOCK_OTP_CODE}`,
    edit: (field: EditableField) => {
      setEditing(field);
      setDraft(field === "fullName" ? user.fullName : field === "mobile" ? user.mobile : user.email);
      setChallenge(null);
      setCode("");
      setError(null);
      setSavedLabel(null);
    },
    cancel: () => {
      setEditing(null);
      setChallenge(null);
      setCode("");
      setError(null);
    },
    save: async () => {
      if (editing === null || !isValid(editing, draft)) return;
      if (!NEEDS_STEP_UP[editing]) {
        commit(editing, draft);
        return;
      }
      setIsWorking(true);
      setError(null);
      const result = await gateway.security.requestOtp("profile-change");
      setIsWorking(false);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setChallenge(result.value);
    },
    verify: async () => {
      if (editing === null || code.length !== digits) return;
      setIsWorking(true);
      setError(null);
      const result = await gateway.security.verifyOtp("profile-change", code);
      setIsWorking(false);
      if (!result.ok) {
        setError(result.error.message);
        setCode("");
        return;
      }
      commit(editing, draft);
    },
    back: navigation.goBack,
  };
}
