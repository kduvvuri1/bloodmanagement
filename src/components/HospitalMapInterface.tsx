//HospitalMapInterface.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Navigation, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface HospitalMapInterfaceProps {
  hospitalName: string;
  address: string;
  bloodTypeNeeded?: string;
}

interface Donor {
  id: number;
  name: string;
  bloodType: string;
  distance: string;
  position: { x: string; y: string };
  eligible: boolean;
}

export function HospitalMapInterface({ hospitalName, address, bloodTypeNeeded }: HospitalMapInterfaceProps) {
  const [selectedDonor, setSelectedDonor] = useState<number | null>(null);

  // Mock nearby donors data (all available donors in the area)
  const allNearbyDonors: Donor[] = [
    { id: 1, name: "John Doe", bloodType: "O+", distance: "0.5 mi", position: { x: "60%", y: "40%" }, eligible: true },
    { id: 2, name: "Sarah Smith", bloodType: "A+", distance: "0.8 mi", position: { x: "35%", y: "25%" }, eligible: true },
    { id: 3, name: "Mike Johnson", bloodType: "B+", distance: "1.2 mi", position: { x: "70%", y: "65%" }, eligible: true },
    { id: 4, name: "Emma Wilson", bloodType: "O-", distance: "0.3 mi", position: { x: "55%", y: "60%" }, eligible: true },
    { id: 5, name: "David Lee", bloodType: "AB+", distance: "1.5 mi", position: { x: "25%", y: "55%" }, eligible: false },
    { id: 6, name: "Lisa Brown", bloodType: "A-", distance: "0.9 mi", position: { x: "75%", y: "30%" }, eligible: true },
    { id: 7, name: "Tom Garcia", bloodType: "B-", distance: "1.1 mi", position: { x: "40%", y: "70%" }, eligible: true },
    { id: 8, name: "Rachel Kim", bloodType: "O+", distance: "0.7 mi", position: { x: "45%", y: "35%" }, eligible: true },
    { id: 9, name: "James Wilson", bloodType: "A+", distance: "1.0 mi", position: { x: "65%", y: "55%" }, eligible: true },
    { id: 10, name: "Maria Rodriguez", bloodType: "O+", distance: "0.6 mi", position: { x: "50%", y: "70%" }, eligible: true },
  ];

  // Filter donors by blood type needed
  const nearbyDonors = bloodTypeNeeded 
    ? allNearbyDonors.filter(d => d.bloodType === bloodTypeNeeded)
    : allNearbyDonors;

  const eligibleDonors = nearbyDonors.filter(d => d.eligible);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Nearby Donors Map</CardTitle>
            <CardDescription>
              {bloodTypeNeeded ? (
                <>
                  {eligibleDonors.length} eligible {bloodTypeNeeded} donors within 2 miles
                </>
              ) : (
                <>Select blood type to view available donors</>
              )}
            </CardDescription>
          </div>
          {bloodTypeNeeded && (
            <Badge variant="outline" className="border-[#D72638] text-[#D72638]">
              <User className="w-3 h-3 mr-1" />
              {eligibleDonors.length} Active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Map placeholder - wireframe representation */}
          <div className="relative w-full h-80 bg-[#F3F4F6] rounded-lg border-2 border-dashed border-[#333333] border-opacity-20 overflow-hidden">
            {/* Grid pattern to simulate map */}
            <div className="absolute inset-0 opacity-10">
              <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className="border border-[#333333]" />
                ))}
              </div>
            </div>
            
            {/* Roads representation */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#333333] opacity-20" />
              <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-[#333333] opacity-20" />
              <div className="absolute top-1/4 left-0 right-0 h-[2px] bg-[#333333] opacity-10" />
              <div className="absolute top-3/4 left-0 right-0 h-[2px] bg-[#333333] opacity-10" />
              <div className="absolute top-0 bottom-0 left-1/4 w-[2px] bg-[#333333] opacity-10" />
              <div className="absolute top-0 bottom-0 left-3/4 w-[2px] bg-[#333333] opacity-10" />
            </div>

            {/* Hospital location marker (center) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="bg-[#D72638] rounded-full p-3 shadow-lg animate-pulse">
                <MapPin className="w-8 h-8 text-white fill-white" />
              </div>
              <div className="mt-2 bg-white px-3 py-1 rounded shadow-md border-2 border-[#D72638]">
                <p className="text-xs text-[#333333]">{hospitalName}</p>
              </div>
            </div>

            {/* Donor markers */}
            <TooltipProvider>
              {nearbyDonors.map((donor) => (
                <Tooltip key={donor.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`absolute z-10 cursor-pointer transition-all duration-200 ${
                        selectedDonor === donor.id ? 'scale-125' : 'hover:scale-110'
                      }`}
                      style={{
                        left: donor.position.x,
                        top: donor.position.y,
                        transform: 'translate(-50%, -50%)'
                      }}
                      onClick={() => setSelectedDonor(selectedDonor === donor.id ? null : donor.id)}
                    >
                      <div className={`relative ${donor.eligible ? 'opacity-100' : 'opacity-40'}`}>
                        {/* Donor marker circle */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          donor.eligible 
                            ? 'bg-blue-500 border-blue-700' 
                            : 'bg-gray-400 border-gray-600'
                        } shadow-md`}>
                          <User className="w-3 h-3 text-white" />
                        </div>
                        {/* Pulse animation for eligible donors */}
                        {donor.eligible && (
                          <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p className="font-medium">{donor.name}</p>
                      <p>Blood Type: <span className="text-[#D72638]">{donor.bloodType}</span></p>
                      <p>Distance: {donor.distance}</p>
                      <p className={donor.eligible ? "text-green-600" : "text-gray-500"}>
                        {donor.eligible ? "Eligible" : "Not eligible"}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>

            {/* Compass */}
            <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-md z-10">
              <Navigation className="w-4 h-4 text-[#D72638]" style={{ transform: 'rotate(45deg)' }} />
            </div>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-md text-xs space-y-2 z-10">
              <p className="font-medium text-[#333333]">Legend</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#D72638] rounded-full" />
                <span className="text-[#333333]">Hospital</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full" />
                <span className="text-[#333333]">Eligible Donor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded-full" />
                <span className="text-[#333333]">Not Eligible</span>
              </div>
            </div>
          </div>

          {/* Nearby Donors List */}
          {bloodTypeNeeded ? (
            <div className="space-y-2">
              <p className="text-sm text-[#333333]">Nearby Eligible Donors ({bloodTypeNeeded}):</p>
              {eligibleDonors.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                  {eligibleDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className={`flex items-center justify-between p-2 border rounded cursor-pointer transition-colors ${
                        selectedDonor === donor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-[#F3F4F6] hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedDonor(selectedDonor === donor.id ? null : donor.id)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-[#333333]">{donor.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{donor.bloodType}</Badge>
                        <span className="text-xs text-[#333333] opacity-60">{donor.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#F3F4F6] rounded text-center">
                  <p className="text-sm text-[#333333] opacity-60">No eligible {bloodTypeNeeded} donors found nearby</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-[#F3F4F6] rounded text-center">
              <p className="text-sm text-[#333333] opacity-60">Please select a blood type in the Urgency Alert System to view donors</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
