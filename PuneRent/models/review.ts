export type Review = {
  id: string;
  society_key: string;
  user_id: string;
  body: string;
  owner_strictness: number | null;
  created_at: string;
};

export type ReviewInput = {
  society_key: string;
  body: string;
  owner_strictness?: number;
  user_id: string;
};
