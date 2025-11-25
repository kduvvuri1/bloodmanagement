// src/components/DonorDashboard.tsx
import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { UrgencyMeter } from "./UrgencyMeter";
import { Calendar, MapPin, History, Droplet, Clock, Loader2 } from "lucide-react";

interface DonorDashboardProps {
  onLogout: () => void;
}

interface DonorProfile {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  blood_type: string;
  date_of_birth: string;
  gender: string;
  phone_number: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  weight: number;
  height: number;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  // Add other fields as needed
}

export function DonorDashboard({ onLogout }: DonorDashboardProps) {
  const [donorProfile, setDonorProfile] = useState<DonorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonorProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Use the authenticated endpoint (no need for userId parameter)
        const response = await fetch('http://localhost:3001/api/donors/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch donor profile');
        }

        const profileData = await response.json();
        console.log('Fetched donor profile:', profileData);
        setDonorProfile(profileData);
      } catch (err) {
        console.error('Error fetching donor profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonorProfile();
  }, []);

  // Format address from separate fields
  const formatAddress = (profile: DonorProfile) => {
    const parts = [profile.street, profile.city, profile.state, profile.zip_code]
      .filter(part => part && part.trim() !== '');
    return parts.join(', ');
  };

  // Calculate next eligible date (56 days from now)
  const nextEligibleDate = new Date();
  nextEligibleDate.setDate(nextEligibleDate.getDate() + 56);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#D72638] animate-spin" />
          <p className="text-[#333333]">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <Navbar title="Donor Dashboard" onLogout={onLogout} />
        <div className="max-w-7xl mx-auto p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-[#D72638] hover:bg-[#A61B2B] text-white"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar title="Donor Dashboard" onLogout={onLogout} />

      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      {donorProfile ? `${donorProfile.first_name} ${donorProfile.last_name}` : 'No Profile Data'}
                    </CardTitle>
                    <CardDescription>Donor Profile</CardDescription>
                  </div>
                  <Badge className="bg-[#D72638] text-white">Eligible</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-[#333333] opacity-60">Blood Type</p>
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-[#D72638]" />
                      <span className="text-[#333333]">
                        {donorProfile?.blood_type || 'Not specified'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[#333333] opacity-60">Last Donation</p>
                    <p className="text-[#333333]">Never donated</p>
                  </div>
                </div>
                
                {/* Additional Profile Info */}
                {donorProfile && (
                  <div className="mt-6 grid grid-cols-2 gap-4 pt-6 border-t border-[#F3F4F6]">
                    <div className="space-y-1">
                      <p className="text-sm text-[#333333] opacity-60">Phone</p>
                      <p className="text-[#333333]">{donorProfile.phone_number || 'Not provided'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-[#333333] opacity-60">Address</p>
                      <p className="text-[#333333] text-sm">
                        {formatAddress(donorProfile) || 'Not provided'}
                      </p>
                    </div>
                    {donorProfile.date_of_birth && (
                      <div className="space-y-1">
                        <p className="text-sm text-[#333333] opacity-60">Date of Birth</p>
                        <p className="text-[#333333]">
                          {new Date(donorProfile.date_of_birth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {donorProfile.gender && (
                      <div className="space-y-1">
                        <p className="text-sm text-[#333333] opacity-60">Gender</p>
                        <p className="text-[#333333] capitalize">{donorProfile.gender}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <Calendar className="w-8 h-8 text-[#D72638] mb-3" />
                  <CardTitle className="mb-2">Schedule a Donation</CardTitle>
                  <CardDescription>Book your next appointment</CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <History className="w-8 h-8 text-[#D72638] mb-3" />
                  <CardTitle className="mb-2">Donation History</CardTitle>
                  <CardDescription>View past donations</CardDescription>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <MapPin className="w-8 h-8 text-[#D72638] mb-3" />
                  <CardTitle className="mb-2">Nearby Centers</CardTitle>
                  <CardDescription>Find donation centers</CardDescription>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Donations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {donorProfile ? (
                    <div className="text-center py-8">
                      <Droplet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-[#333333] opacity-60">No donation history yet</p>
                      <p className="text-sm text-[#333333] opacity-40 mt-2">
                        Schedule your first donation to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#333333] opacity-60">Complete your profile to see donation history</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Panel - Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#333333] opacity-60">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Next eligible date</span>
                  </div>
                  <p className="text-[#333333]">
                    {nextEligibleDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#333333] opacity-60">
                    <Droplet className="w-4 h-4" />
                    <span className="text-sm">Total donations</span>
                  </div>
                  <p className="text-[#333333]">0 donations</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#333333] opacity-60">
                    <Droplet className="w-4 h-4" />
                    <span className="text-sm">Lives impacted</span>
                  </div>
                  <p className="text-[#D72638]">0 lives saved</p>
                </div>

                {/* Additional Medical Info */}
                {donorProfile && (
                  <>
                    {donorProfile.weight && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#333333] opacity-60">
                          <Droplet className="w-4 h-4" />
                          <span className="text-sm">Weight</span>
                        </div>
                        <p className="text-[#333333]">{donorProfile.weight} kg</p>
                      </div>
                    )}
                    {donorProfile.height && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[#333333] opacity-60">
                          <Droplet className="w-4 h-4" />
                          <span className="text-sm">Height</span>
                        </div>
                        <p className="text-[#333333]">{donorProfile.height} cm</p>
                      </div>
                    )}
                  </>
                )}

                {/* Emergency Contact Info */}
                {donorProfile?.emergency_contact_name && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-[#333333] opacity-60">
                      <Droplet className="w-4 h-4" />
                      <span className="text-sm">Emergency Contact</span>
                    </div>
                    <p className="text-[#333333] text-sm">{donorProfile.emergency_contact_name}</p>
                    <p className="text-[#333333] text-xs opacity-60">{donorProfile.emergency_contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            </div>
        </div>
      </div>
    </div>
  );
}