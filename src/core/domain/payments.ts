import type { IconName } from "./icons";

export type DepositMethod = {
  id: string;
  icon: IconName;
  title: string;
  detail: string;
};

export type Biller = {
  id: string;
  icon: IconName;
  name: string;
  detail: string;
  due: string;
};

export type Recipient = {
  initials: string;
  name: string;
  handle: string;
};
