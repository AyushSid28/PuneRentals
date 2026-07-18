export type BachelorAnswer = "yes" | "no" | "depends";

export type BachelorVote = {
  id: string;
  society_key: string;
  user_id: string;
  bachelors_allowed: BachelorAnswer;
  visitors_restricted: BachelorAnswer | null;
  created_at: string;
};

export type BachelorVoteInput = {
  society_key: string;
  bachelors_allowed: BachelorAnswer;
  visitors_restricted?: BachelorAnswer;
  user_id: string;
};
