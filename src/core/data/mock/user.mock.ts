import type { UserProfile } from "../../domain/user";

/**
 * The signed-in person.
 *
 * Two agreements are deliberate and must be kept: the name matches
 * `MOCK_CARDHOLDER.name` (the same human, one fact printed on a card and one
 * held on the account), and the mobile's last four digits match
 * `MOCK_OTP_DESTINATION` in security.mock.ts, so the code "sent to 0917 ••• 2288"
 * is plausibly sent to *this* user's phone.
 */
export const MOCK_USER: UserProfile = {
  fullName: "Maya Santos",
  mobile: "+63 917 555 2288",
  email: "maya.santos@example.ph",
  memberSinceLabel: "Member since Jan 2025",
  status: "active",
};
