// src/components/GoogleMapsInterface.tsx
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, User, Loader2, Mail, Phone, Navigation, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Button } from "./ui/button";

declare global {
  interface Window {
    google: any;
    gm_authFailure: () => void;
  }
}

interface GoogleMapsInterfaceProps {
  hospitalName: string;
  address: string;
  bloodTypeNeeded?: string;
  hospitalId?: number;
}

interface Donor {
  id: number;
  first_name: string;
  last_name: string;
  blood_type: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  eligibility_status: string;
  email?: string;
  phone_number?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  has_responded?: boolean;
  appointment_date?: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyAevbPFsJcunpyjcaRvL5Rn0LuiUllxak4";

let scriptLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  if (window.google?.maps?.Map) return Promise.resolve();

  const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
  if (existingScript) {
    scriptLoadPromise = new Promise((resolve) => {
      const checkReady = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkReady);
          resolve();
        }
      }, 50);
    });
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      const checkReady = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkReady);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkReady);
        if (window.google?.maps?.Map) resolve();
        else reject(new Error('Timeout'));
      }, 5000);
    };
    
    script.onerror = () => reject(new Error('Failed to load'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

export function GoogleMapsInterface({ hospitalName, address, bloodTypeNeeded, hospitalId }: GoogleMapsInterfaceProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const hospitalMarkerRef = useRef<google.maps.Marker | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  const [donors, setDonors] = useState<Donor[]>([]);
  const [hospitalCoords, setHospitalCoords] = useState({ lat: 33.7490, lng: -84.3880 });
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [hoveredDonor, setHoveredDonor] = useState<Donor | null>(null);
  const [activeTab, setActiveTab] = useState<'eligible' | 'ineligible'>('eligible');

  // Split donors into eligible and ineligible
  const eligibleDonors = donors.filter(donor => donor.eligibility_status === 'eligible');
  const ineligibleDonors = donors.filter(donor => donor.eligibility_status === 'ineligible');

  useEffect(() => {
    window.gm_authFailure = () => {
      setMapError("Google Maps authentication failed.");
    };
    return () => { delete window.gm_authFailure; };
  }, []);

  // Initialize map (same as before, but updated to show both types of donors)
  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      try {
        await loadGoogleMapsScript();
        
        if (!mounted || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: hospitalCoords,
          zoom: 12,
          styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });

        mapInstance.current = map;
        geocoderRef.current = new google.maps.Geocoder();
        infoWindowRef.current = new google.maps.InfoWindow();

        // Geocode hospital address
        if (address && geocoderRef.current) {
          geocoderRef.current.geocode({ address }, (results, status) => {
            if (status === 'OK' && results && results[0] && mounted) {
              const location = results[0].geometry.location;
              const coords = { lat: location.lat(), lng: location.lng() };
              
              setHospitalCoords(coords);
              map.setCenter(coords);

              // Add hospital marker
              const hospitalMarker = new google.maps.Marker({
                position: coords,
                map,
                title: hospitalName,
                icon: {
                  url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="20" fill="#D72638"/>
                      <path d="M20 10 L20 30 M10 20 L30 20" stroke="white" stroke-width="4"/>
                    </svg>
                  `),
                  scaledSize: new google.maps.Size(40, 40),
                  anchor: new google.maps.Point(20, 20),
                },
              });
              
              hospitalMarkerRef.current = hospitalMarker;

              // Add 5-mile radius circle
              const circle = new google.maps.Circle({
                strokeColor: "#3B82F6",
                strokeOpacity: 0.4,
                strokeWeight: 2,
                fillColor: "#3B82F6",
                fillOpacity: 0.1,
                map,
                center: coords,
                radius: 8046.72,
              });
              
              circleRef.current = circle;
            }
          });
        }

        if (mounted) {
          setMapLoaded(true);
          setMapError(null);
        }
      } catch (error) {
        console.error('Map initialization error:', error);
        if (mounted) setMapError('Failed to load map');
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (hospitalMarkerRef.current) hospitalMarkerRef.current.setMap(null);
      if (circleRef.current) circleRef.current.setMap(null);
      if (infoWindowRef.current) infoWindowRef.current.close();
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
    };
  }, [hospitalName, address]);

  // Calculate distance function (same as before)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    if (!window.google?.maps?.geometry) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;
      return distanceKm * 0.621371;
    }

    const hospitalLocation = new google.maps.LatLng(lat1, lng1);
    const donorLocation = new google.maps.LatLng(lat2, lng2);
    const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(
      hospitalLocation,
      donorLocation
    );
    return distanceMeters * 0.000621371;
  };

  // Fetch donors with urgency responses
  useEffect(() => {
    const fetchDonors = async () => {
      if (!bloodTypeNeeded || !mapLoaded || !geocoderRef.current) {
        clearMarkers();
        setDonors([]);
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        
        const compatibilityMap: Record<string, string[]> = {
          'A+': ['A+', 'A-', 'O+', 'O-'],
          'A-': ['A-', 'O-'],
          'B+': ['B+', 'B-', 'O+', 'O-'],
          'B-': ['B-', 'O-'],
          'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
          'AB-': ['A-', 'B-', 'AB-', 'O-'],
          'O+': ['O+', 'O-'],
          'O-': ['O-']
        };
        
        const compatibleTypes = compatibilityMap[bloodTypeNeeded] || [bloodTypeNeeded];

        // Fetch all donors with urgency responses
        const res = await fetch(`http://localhost:3001/api/hospitals/nearby-donors-with-responses?bloodType=${bloodTypeNeeded}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Failed to fetch donors');

        const data = await res.json();
        const allDonors = data.donors || [];
        
        // Process donors with distance calculations
        const donorsWithDistance = await processDonorsWithDistance(allDonors);
        setDonors(donorsWithDistance);

        // Render all donors on map with different colors for eligible/ineligible
        renderDonorsWithGeocoding(donorsWithDistance);
        
      } catch (err) {
        console.error('Error fetching donors:', err);
        setDonors([]);
        clearMarkers();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonors();
  }, [bloodTypeNeeded, mapLoaded]);

  const clearMarkers = () => {
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
  };

  // Process donors and calculate distances (same as before)
  const processDonorsWithDistance = async (donors: Donor[]): Promise<Donor[]> => {
    const donorsWithDistance: Donor[] = [];

    for (const donor of donors) {
      const fullAddress = `${donor.street}, ${donor.city}, ${donor.state} ${donor.zip_code}`;
      
      try {
        if (donor.latitude && donor.longitude) {
          const distance = calculateDistance(
            hospitalCoords.lat, 
            hospitalCoords.lng, 
            donor.latitude, 
            donor.longitude
          );
          if (distance <= 5) {
            donorsWithDistance.push({ ...donor, distance });
          }
          continue;
        }

        const result = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
          geocoderRef.current!.geocode({ address: fullAddress }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              resolve(results[0]);
            } else {
              console.warn(`Geocoding failed for ${donor.first_name} ${donor.last_name}:`, status);
              resolve(null);
            }
          });
        });

        if (!result) continue;

        const location = result.geometry.location;
        const donorCoords = { lat: location.lat(), lng: location.lng() };
        const distance = calculateDistance(
          hospitalCoords.lat, 
          hospitalCoords.lng, 
          donorCoords.lat, 
          donorCoords.lng
        );

        if (distance <= 5) {
          donorsWithDistance.push({ 
            ...donor, 
            distance,
            latitude: donorCoords.lat,
            longitude: donorCoords.lng
          });
        }
      } catch (error) {
        console.error(`Error processing ${donor.first_name} ${donor.last_name}:`, error);
      }
    }

    return donorsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  const createInfoWindowContent = (donor: Donor) => {
    const distance = donor.distance || 0;
    const statusColor = donor.eligibility_status === 'eligible' ? '#10B981' : '#EF4444';
    const statusText = donor.eligibility_status === 'eligible' ? 'Eligible' : 'Ineligible';
    
    return `
      <div style="padding: 12px; min-width: 250px; font-family: Arial, sans-serif; color: #333;">
        <h3 style="margin: 0 0 8px 0; color: #1f2937; border-bottom: 2px solid ${statusColor}; padding-bottom: 8px;">
          ${donor.first_name} ${donor.last_name}
        </h3>
        
        <div style="display: grid; gap: 6px; font-size: 14px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #D72638; min-width: 80px;">Blood Type:</strong>
            <span style="font-weight: bold; background: #fef2f2; padding: 2px 8px; border-radius: 4px; color: #dc2626;">
              ${donor.blood_type}
            </span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #D72638; min-width: 80px;">Status:</strong>
            <span style="color: ${statusColor}; font-weight: bold; background: ${statusColor}20; padding: 2px 8px; border-radius: 4px;">
              ${statusText}
            </span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: #D72638; min-width: 80px;">Distance:</strong>
            <span>${distance.toFixed(1)} miles</span>
          </div>
          
          ${donor.has_responded ? `
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
              <strong style="color: #10B981;">✅ Responded to Urgency</strong>
            </div>
            ${donor.appointment_date ? `
              <div style="display: flex; align-items: center; gap: 8px;">
                <strong style="color: #D72638; min-width: 80px;">Appointment:</strong>
                <span>${new Date(donor.appointment_date).toLocaleString()}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>
      </div>
    `;
  };

  const renderDonorsWithGeocoding = async (donors: Donor[]) => {
    if (!mapInstance.current || !infoWindowRef.current) return;

    clearMarkers();
    console.log('Rendering donors with eligibility status');

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(hospitalCoords);

    for (const donor of donors) {
      if (!donor.latitude || !donor.longitude) continue;

      try {
        const coords = { lat: donor.latitude, lng: donor.longitude };
        const isEligible = donor.eligibility_status === "eligible";
        const hasResponded = donor.has_responded;
        
        // Different colors based on eligibility and response status
        let markerColor = '#9CA3AF'; // Default gray for ineligible
        if (isEligible) {
          markerColor = hasResponded ? '#10B981' : '#3B82F6'; // Green for responded, blue for eligible
        }

        const marker = new google.maps.Marker({
          position: coords,
          map: mapInstance.current!,
          title: `${donor.first_name} ${donor.last_name} (${donor.blood_type}) - ${donor.eligibility_status} - ${donor.distance?.toFixed(1)} miles`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                <circle cx="15" cy="15" r="15" fill="${markerColor}"/>
                <circle cx="15" cy="10" r="4" fill="white"/>
                <path d="M8 22s2-5 7-5 7 5 7 5" stroke="white" stroke-width="2" fill="none"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15),
          },
        });

        marker.addListener("mouseover", () => {
          infoWindowRef.current!.setContent(createInfoWindowContent(donor));
          infoWindowRef.current!.open(mapInstance.current!, marker);
          setHoveredDonor(donor);
        });

        marker.addListener("mouseout", () => {
          infoWindowRef.current!.close();
          setHoveredDonor(null);
        });

        markersRef.current.push(marker);
        bounds.extend(coords);
        
      } catch (error) {
        console.error(`Error rendering ${donor.first_name} ${donor.last_name} on map:`, error);
      }
    }

    if (donors.length > 0 && mapInstance.current) {
      mapInstance.current.fitBounds(bounds);
      const listener = google.maps.event.addListenerOnce(mapInstance.current, 'bounds_changed', () => {
        const zoom = mapInstance.current!.getZoom();
        if (zoom && zoom > 13) mapInstance.current!.setZoom(13);
      });
    }
  };

  const handleDonorCardHover = (donor: Donor) => {
    setHoveredDonor(donor);
  };

  const handleDonorCardLeave = () => {
    setHoveredDonor(null);
  };

  const updateAppointmentStatus = async (appointmentId: number, updates: any) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:3001/api/hospitals/appointments/${appointmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      // Refresh donors list to show updated status
      // You might want to implement a more efficient state update here
      window.location.reload();
    }
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
};

  const handleDeleteAppointment = async (donorId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/hospitals/appointments/${donorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Refresh donors list
        setDonors(prev => prev.map(d => 
          d.id === donorId ? { ...d, has_responded: false, appointment_date: undefined } : d
        ));
      }
    } catch (error) {
      console.error('Error deleting appointment:', error);
    }
  };

  const eligibleCount = eligibleDonors.length;
  const ineligibleCount = ineligibleDonors.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Nearby Donors Map</CardTitle>
            <CardDescription>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching for donors...
                </div>
              ) : bloodTypeNeeded ? (
                `${eligibleCount} eligible, ${ineligibleCount} ineligible ${bloodTypeNeeded} donors within 5 miles`
              ) : (
                "Select a blood type to see nearby donors"
              )}
            </CardDescription>
          </div>
          {bloodTypeNeeded && (
            <div className="flex gap-2">
              <Badge variant="outline" className="border-green-500 text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                {eligibleCount} Eligible
              </Badge>
              <Badge variant="outline" className="border-red-500 text-red-700">
                <XCircle className="w-3 h-3 mr-1" />
                {ineligibleCount} Ineligible
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative w-full rounded-lg border-2 border-gray-200 bg-gray-50 overflow-hidden" style={{ height: '384px' }}>
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && !mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-[#D72638] animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
                <div className="text-center text-red-600">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Map Error</p>
                  <p className="text-sm mt-1">{mapError}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Donor List with Tabs */}
          {bloodTypeNeeded && donors.length > 0 && (
            <div className="text-sm">
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'eligible'
                      ? 'border-b-2 border-green-500 text-green-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('eligible')}
                >
                  Eligible Donors ({eligibleCount})
                </button>
                <button
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'ineligible'
                      ? 'border-b-2 border-red-500 text-red-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('ineligible')}
                >
                  Ineligible Donors ({ineligibleCount})
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(activeTab === 'eligible' ? eligibleDonors : ineligibleDonors).map(donor => (
                  <div 
                    key={donor.id} 
                    className={`p-3 rounded border transition-all cursor-pointer ${
                      hoveredDonor?.id === donor.id 
                        ? 'bg-blue-50 border-blue-300 shadow-sm' 
                        : donor.eligibility_status === 'eligible'
                        ? 'bg-green-50 border-green-200 hover:bg-green-100'
                        : 'bg-red-50 border-red-200 hover:bg-red-100'
                    }`}
                    onMouseEnter={() => handleDonorCardHover(donor)}
                    onMouseLeave={handleDonorCardLeave}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{donor.first_name} {donor.last_name}</span>
                        <Badge variant="outline" className={
                          donor.eligibility_status === 'eligible' 
                            ? 'border-green-300 text-green-700'
                            : 'border-red-300 text-red-700'
                        }>
                          {donor.blood_type}
                        </Badge>
                        {donor.has_responded && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Responded
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Navigation className="w-3 h-3" />
                        <span>{donor.distance?.toFixed(1)} mi</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      {donor.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{donor.phone_number}</span>
                        </div>
                      )}
                      {donor.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-32">{donor.email}</span>
                        </div>
                      )}
                      <span className="text-xs">{donor.city}, {donor.state}</span>
                    </div>

                    {donor.has_responded && donor.appointment_date && (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-green-700">
                          <Calendar className="w-3 h-3" />
                          <span>Appointment: {new Date(donor.appointment_date).toLocaleString()}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAppointment(donor.id);
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                        >
                          Delete
                        </Button>
                      </div>
                    )}

                    {/* Hover Info Panel */}
                    {hoveredDonor?.id === donor.id && (
                      <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Status:</span>
                            <span className={
                              donor.eligibility_status === 'eligible' 
                                ? 'text-green-600 font-medium'
                                : 'text-red-600 font-medium'
                            }>
                              {donor.eligibility_status}
                            </span>
                          </div>
                          {/* ... rest of hover info ... */}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}



          {bloodTypeNeeded && !isLoading && donors.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No compatible donors found within 5 miles</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
