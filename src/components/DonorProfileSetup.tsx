import { useState } from "react";
import { Navbar } from "./Navbar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { CheckCircle2 } from "lucide-react";

interface DonorProfileSetupProps {
  onComplete: () => void;
  onLogout: () => void;
}

export function DonorProfileSetup({ onComplete, onLogout }: DonorProfileSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    
    // Medical Information
    bloodType: "",
    weight: "",
    height: "",
    
    // Health History
    hasChronicIllness: "",
    chronicIllnessDetails: "",
    hasTraveled: "",
    travelDetails: "",
    hasTattoo: "",
    tattooDetails: "",
    isOnMedication: "",
    medicationDetails: "",
    
    // Emergency Contact
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    
    // Format based on length
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (field: string, value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange(field, formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Submit all data to backend
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        alert('User data not found. Please login again.');
        return;
      }

      const user = JSON.parse(userData);
      
      console.log('Submitting profile data for user:', user.id);
      
      // Combine address fields into one string for backend
      const address = `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}`;
      
      const response = await fetch('http://localhost:3001/api/donors/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
          address: address // Send combined address to backend
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile saved successfully:', result);
        
        // Update user profile completion status in localStorage
        const updatedUser = { ...user, profileCompleted: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setShowSuccess(true);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        const error = await response.json();
        console.error('Profile save error:', error);
        alert(`Failed to save profile: ${error.error}`);
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      alert('Failed to save profile. Make sure the server is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Navbar title="Profile Setup" onLogout={onLogout} />
        <div className="max-w-3xl mx-auto p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-20 h-20 text-[#D72638] mb-4" />
              <CardTitle className="mb-2">Profile Complete!</CardTitle>
              <CardDescription>
                Your donor profile has been successfully set up.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar title="Complete Your Profile" onLogout={onLogout} />

      <div className="max-w-3xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Donor Profile Setup</CardTitle>
            <CardDescription>
              Please complete your profile to start donating blood. This is a one-time setup.
            </CardDescription>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-[#D72638] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-[#333333] opacity-60 mt-2">
              Step {currentStep} of 4
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#333333]">Personal Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(val) => handleInputChange('gender', val)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handlePhoneChange('phoneNumber', e.target.value)}
                      required
                      placeholder="(555) 123-4567"
                      maxLength={14}
                    />
                    <p className="text-xs text-gray-500">Format: (XXX) XXX-XXXX</p>
                  </div>

                  {/* Address Fields */}
                  <div className="space-y-4">
                    <Label>Address *</Label>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street" className="text-sm">Street Address</Label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="123 Main St"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-sm">State</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                          placeholder="NY"
                          required
                          maxLength={2}
                          className="uppercase"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        placeholder="10001"
                        required
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Medical Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#333333]">Medical Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bloodType">Blood Type *</Label>
                    <Select 
                      value={formData.bloodType} 
                      onValueChange={(val) => handleInputChange('bloodType', val)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="unknown">I don't know</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight (kg) *</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="40"
                        max="200"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        placeholder="e.g., 70"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height (cm) *</Label>
                      <Input
                        id="height"
                        type="number"
                        min="100"
                        max="250"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        placeholder="e.g., 175"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Health History */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#333333]">Health History</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Do you have any chronic illnesses? *</Label>
                      <RadioGroup 
                        value={formData.hasChronicIllness} 
                        onValueChange={(val) => handleInputChange('hasChronicIllness', val)}
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="chronic-yes" />
                          <Label htmlFor="chronic-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="chronic-no" />
                          <Label htmlFor="chronic-no" className="cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                      {formData.hasChronicIllness === 'yes' && (
                        <Input
                          placeholder="Please specify"
                          value={formData.chronicIllnessDetails}
                          onChange={(e) => handleInputChange('chronicIllnessDetails', e.target.value)}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Have you traveled outside the country in the last 3 months? *</Label>
                      <RadioGroup 
                        value={formData.hasTraveled} 
                        onValueChange={(val) => handleInputChange('hasTraveled', val)}
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="travel-yes" />
                          <Label htmlFor="travel-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="travel-no" />
                          <Label htmlFor="travel-no" className="cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                      {formData.hasTraveled === 'yes' && (
                        <Input
                          placeholder="Where did you travel?"
                          value={formData.travelDetails}
                          onChange={(e) => handleInputChange('travelDetails', e.target.value)}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Do you have any tattoos or piercings from the last 12 months? *</Label>
                      <RadioGroup 
                        value={formData.hasTattoo} 
                        onValueChange={(val) => handleInputChange('hasTattoo', val)}
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="tattoo-yes" />
                          <Label htmlFor="tattoo-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="tattoo-no" />
                          <Label htmlFor="tattoo-no" className="cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                      {formData.hasTattoo === 'yes' && (
                        <Input
                          placeholder="Please provide details"
                          value={formData.tattooDetails}
                          onChange={(e) => handleInputChange('tattooDetails', e.target.value)}
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Are you currently taking any medications? *</Label>
                      <RadioGroup 
                        value={formData.isOnMedication} 
                        onValueChange={(val) => handleInputChange('isOnMedication', val)}
                        required
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="medication-yes" />
                          <Label htmlFor="medication-yes" className="cursor-pointer">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="medication-no" />
                          <Label htmlFor="medication-no" className="cursor-pointer">No</Label>
                        </div>
                      </RadioGroup>
                      {formData.isOnMedication === 'yes' && (
                        <Input
                          placeholder="Please list medications"
                          value={formData.medicationDetails}
                          onChange={(e) => handleInputChange('medicationDetails', e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Emergency Contact */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#333333]">Emergency Contact</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                      required
                      placeholder="Jane Smith"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handlePhoneChange('emergencyContactPhone', e.target.value)}
                      required
                      placeholder="(555) 987-6543"
                      maxLength={14}
                    />
                    <p className="text-xs text-gray-500">Format: (XXX) XXX-XXXX</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                    <Input
                      id="emergencyContactRelationship"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                      placeholder="e.g., Spouse, Parent, Friend"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#D72638] hover:bg-[#A61B2B] text-white"
                >
                  {isLoading ? "Saving..." : currentStep === 4 ? 'Complete Profile' : 'Next'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}