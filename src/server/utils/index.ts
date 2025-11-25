// Utility functions
export const calculateUrgency = (factors: {
  availableDonors: number;
  bloodInventory: number;
  patientNeeds: number;
  upcomingAppointments: number;
}): number => {
  const score = (
    factors.availableDonors * 0.2 +
    factors.bloodInventory * 0.3 +
    factors.patientNeeds * 0.4 +
    factors.upcomingAppointments * 0.1
  );
  
  return Math.min(Math.max(Math.round(score), 1), 5);
};

export const validateBloodType = (bloodType: string): boolean => {
  const validTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  return validTypes.includes(bloodType);
};