export interface Donor {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  phone_number?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  blood_type?: string;
  weight?: number;
  height?: number;
  has_chronic_illness?: boolean;
  chronic_illness_details?: string;
  has_traveled?: boolean;
  travel_details?: string;
  has_tattoo?: boolean;
  tattoo_details?: string;
  is_on_medication?: boolean;
  medication_details?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  eligibility_status?: 'pending' | 'eligible' | 'ineligible';
  last_donation_date?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DonorProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  bloodType: string;
  weight: number;
  height: number;
  hasChronicIllness: boolean;
  chronicIllnessDetails?: string;
  hasTraveled: boolean;
  travelDetails?: string;
  hasTattoo: boolean;
  tattooDetails?: string;
  isOnMedication: boolean;
  medicationDetails?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}