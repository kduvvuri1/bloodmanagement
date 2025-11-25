export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'donor' | 'hospital';
  profile_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  role: 'donor' | 'hospital';
  profile_completed: boolean;
}