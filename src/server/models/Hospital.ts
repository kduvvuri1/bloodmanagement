export interface Hospital {
  id: number;
  user_id: number;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone_number?: string;
  email?: string;
  blood_urgency_level: number;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  created_at: Date;
  updated_at: Date;
}