export type Account = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  email_verified: boolean;
  is_admin: boolean;
};
export type Ability = "account:read" | "favourites:read" | "favourites:write";
export type ApiToken = {
  id: string;
  name: string;
  abilities: Ability[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
  status: "active" | "expired";
};
export type TokenPage = {
  data: ApiToken[];
  meta: { current_page: number; last_page: number };
};
export type TokenInput = {
  name: string;
  abilities: Ability[];
  expiry_days: number;
};
export type FieldErrors = Record<string, string[]>;
