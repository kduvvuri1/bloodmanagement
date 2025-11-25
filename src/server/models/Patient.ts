export interface Patient {
  id: number;
  hospital_id: number;
  patient_name: string;
  blood_type: string;
  condition?: string;
  urgency_level: number;
  units_required: number;
  status: 'pending' | 'fulfilled' | 'cancelled';
  admission_date: Date;
  required_date?: Date;
  fulfilled_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PatientRequest {
  patientName: string;
  bloodType: string;
  condition?: string;
  urgencyLevel: number;
  unitsRequired: number;
  requiredDate?: string;
  notes?: string;
}