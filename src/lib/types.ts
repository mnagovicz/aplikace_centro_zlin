export interface Game {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  reward_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  game_id: string;
  name: string;
  question: string;
  answers: string[];
  correct_answer_index: number;
  order_number: number;
  qr_token: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  name: string;
  email: string;
  session_token: string;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  completion_code: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface PlayerCheckpoint {
  id: string;
  player_id: string;
  checkpoint_id: string;
  answered_correctly: boolean;
  answered_at: string;
}

export interface AdminUser {
  id: string;
  role: "superadmin" | "staff";
  display_name: string | null;
  created_at: string;
}
