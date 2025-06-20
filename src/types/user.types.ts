export type User = {
  id: string;
  username: string;
  email: string;
  display_name: string;
  display_picture_url: string | null;
  status_message: string | null;
};

export type UserWithPassword = User & {
  password_hash: string;
};

export type UserProfile = User & {
  created_at: Date; // Note: In your original code this was a string, Date is more accurate.
};