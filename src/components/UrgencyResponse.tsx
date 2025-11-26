// src/components/UrgencyResponse.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MapPin, Navigation, Calendar, Clock, Phone, Mail, X, CheckCircle, Edit } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { UrgencyMeter } from "./UrgencyMeter";

interface UrgencyRequest {
  id: number;
  hospital_id: number;
  hospital_name: string;
  hospital_address: string;
  hospital_phone: string;
  blood_type: string;
  urgency_level: number;
  message: string;
  distance: number;
  created_at: string;
  user_response?: {
    response_type: string;
    scheduled_appointment_id?: number;
    appointment?: Appointment;
  };
}

interface Appointment {
  id: number;
  appointment_date: string;
  status: string;
  donor_arrived: boolean;
  donation_completed: boolean;
  cancelled_at?: string;
}

export function UrgencyResponse() {
  const [urgencyRequests, setUrgencyRequests] = useState<UrgencyRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<UrgencyRequest | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchUrgencyRequests();
  }, []);

  const fetchUrgencyRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/donors/urgency-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const requests = await response.json();
        setUrgencyRequests(requests);
      }
    } catch (error) {
      console.error('Error fetching urgency requests:', error);
    }
  };

  const handleRespond = (request: UrgencyRequest) => {
    setSelectedRequest(request);
    setShowAppointmentModal(true);
  };

  const handleReject = (request: UrgencyRequest) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleReschedule = (request: UrgencyRequest) => {
    setSelectedRequest(request);
    setSelectedDateTime(request.user_response?.appointment?.appointment_date?.split('.')[0] || '');
    setShowRescheduleModal(true);
  };

  const handleScheduleAppointment = async () => {
    if (!selectedRequest || !selectedDateTime) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/donors/schedule-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          urgencyRequestId: selectedRequest.id,
          hospitalId: selectedRequest.hospital_id,
          appointmentDate: selectedDateTime,
          bloodType: selectedRequest.blood_type
        })
      });

      if (response.ok) {
        alert('Appointment scheduled successfully!');
        setShowAppointmentModal(false);
        setSelectedRequest(null);
        fetchUrgencyRequests();
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Failed to schedule appointment');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/donors/reject-urgency-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          urgencyRequestId: selectedRequest.id,
          rejectionReason: rejectionReason
        })
      });

      if (response.ok) {
        alert('Request rejected successfully!');
        setShowRejectionModal(false);
        setSelectedRequest(null);
        setRejectionReason('');
        fetchUrgencyRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleRescheduleAppointment = async () => {
    if (!selectedRequest || !selectedDateTime) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/donors/reschedule-appointment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: selectedRequest.user_response?.scheduled_appointment_id,
          newAppointmentDate: selectedDateTime
        })
      });

      if (response.ok) {
        alert('Appointment rescheduled successfully!');
        setShowRescheduleModal(false);
        setSelectedRequest(null);
        fetchUrgencyRequests();
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Failed to reschedule appointment');
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/donors/cancel-appointment/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Appointment cancelled successfully!');
        fetchUrgencyRequests();
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
  };

  const getUrgencyColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-green-100 text-green-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-orange-100 text-orange-800';
      case 4: return 'bg-red-100 text-red-800';
      case 5: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyText = (level: number) => {
    switch (level) {
      case 1: return 'Low';
      case 2: return 'Moderate';
      case 3: return 'High';
      case 4: return 'Severe';
      case 5: return 'Critical';
      default: return 'Unknown';
    }
  };

  const getResponseBadge = (request: UrgencyRequest) => {
    if (!request.user_response) return null;
    
    switch (request.user_response.response_type) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Appointment Scheduled
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Request Rejected
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <X className="w-3 h-3 mr-1" />
            Appointment Cancelled
          </Badge>
        );
      default:
        return null;
    }
  };

  if (urgencyRequests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mb-4" />
          <CardDescription>No urgent blood requests at this time</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {urgencyRequests.map((request) => (
        <Card key={request.id} className="border-l-4 border-l-red-500 bg-red-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    {request.hospital_name}
                  </CardTitle>
                  <Badge className={getUrgencyColor(request.urgency_level)}>
                    {getUrgencyText(request.urgency_level)} Urgency
                  </Badge>
                  {getResponseBadge(request)}
                </div>
                <div className="flex items-center gap-4">
                  <UrgencyMeter level={request.urgency_level} size="sm" />
                  <CardDescription className="text-red-600">{request.message}</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-red-300 text-red-700">
                {request.blood_type} Needed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{request.hospital_address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-gray-500" />
                  <span>{request.distance.toFixed(1)} miles away</span>
                </div>
                {request.hospital_phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{request.hospital_phone}</span>
                  </div>
                )}
                {request.user_response?.appointment && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Appointment: {new Date(request.user_response.appointment.appointment_date).toLocaleString()}
                    </span>
                    {request.user_response.appointment.donor_arrived && (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Arrived
                      </Badge>
                    )}
                    {request.user_response.appointment.donation_completed && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        Donation Complete
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => openGoogleMaps(request.hospital_address)}
                  variant="outline"
                  className="w-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
                
                {!request.user_response ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRespond(request)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Donation
                    </Button>
                    <Button
                      onClick={() => handleReject(request)}
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                ) : request.user_response.response_type === 'accepted' && 
                  request.user_response.appointment?.status === 'scheduled' ? (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReschedule(request)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      onClick={() => handleCancelAppointment(request.user_response!.scheduled_appointment_id!)}
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Requested {new Date(request.created_at).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Appointment Scheduling Modal */}
      {showAppointmentModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule Donation</CardTitle>
              <CardDescription>
                Schedule your blood donation at {selectedRequest.hospital_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Select Date and Time
                </label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowAppointmentModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleAppointment}
                  disabled={!selectedDateTime}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Appointment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reject Request</CardTitle>
              <CardDescription>
                Are you sure you want to reject this blood request from {selectedRequest.hospital_name}?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for rejection (optional)
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a reason for rejecting this request..."
                  className="min-h-20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRejectionModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRejectRequest}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirm Rejection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reschedule Appointment</CardTitle>
              <CardDescription>
                Reschedule your donation at {selectedRequest.hospital_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  New Date and Time
                </label>
                <input
                  type="datetime-local"
                  value={selectedDateTime}
                  onChange={(e) => setSelectedDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowRescheduleModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRescheduleAppointment}
                  disabled={!selectedDateTime}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Reschedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
