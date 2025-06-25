export type User = {
  id: string;
  username: string;
  email: string;
  display_name: string;
  display_picture_url: string | null;
  status_message: string | null;
};

export type UpdateProfileData = {
  display_name?: string;
  status_message?: string;
  display_picture_url?: string;
};

export type UserWithPassword = User & {
  password_hash: string;
};

export type UserProfile = User & {
  created_at: Date;
};