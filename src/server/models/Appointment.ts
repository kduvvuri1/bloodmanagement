export interface Appointment {
  id: number;
  donor_id: number;
  hospital_id: number;
  appointment_date: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  blood_type?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}