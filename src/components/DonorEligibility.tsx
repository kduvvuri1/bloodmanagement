import { useState, useEffect } from "react";
import { Navbar } from "./Navbar";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { CheckCircle2 } from "lucide-react";

interface DonorEligibilityProps {
  onComplete: () => void;
  onLogout: () => void;
}

interface UserProfile {
  gender?: string;
  // Add other profile fields as needed
}

export function DonorEligibility({ onComplete, onLogout }: DonorEligibilityProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile to get gender
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const token = localStorage.getItem('token');
          
          // Fetch donor profile to get gender
          const response = await fetch(`http://localhost:3001/api/donors/profile?userId=${user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const profileData = await response.json();
            setUserProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Base questions for all donors
  const baseQuestions = [
    {
      id: "recent-donation",
      question: "Have you donated blood in the last 56 days?",
      eligibleAnswer: "no",
    },
    {
      id: "feeling-ill",
      question: "Are you currently feeling ill, have a fever, or experiencing cold or flu symptoms?",
      eligibleAnswer: "no",
    },
    {
      id: "medication",
      question: "Have you taken any blood-thinning medication (aspirin, warfarin, etc.) in the last 48 hours?",
      eligibleAnswer: "no",
    },
    {
      id: "weight",
      question: "Do you meet the minimum weight requirement (110 lbs / 50 kg)?",
      eligibleAnswer: "yes",
    },
    {
      id: "recent-surgery",
      question: "Have you had any surgery or medical procedure in the last 6 months?",
      eligibleAnswer: "no",
    },
    {
      id: "dental-work",
      question: "Have you had dental work (extraction, root canal, surgery) in the last 72 hours?",
      eligibleAnswer: "no",
    },
  ];

  // Pregnancy-related questions for female donors
  const pregnancyQuestions = [
    {
      id: "pregnancy",
      question: "Are you currently pregnant or have been pregnant in the last 6 months?",
      eligibleAnswer: "no",
    },
    {
      id: "breastfeeding",
      question: "Are you currently breastfeeding?",
      eligibleAnswer: "no", // Note: Breastfeeding donors are usually eligible, but we need to check
    },
    {
      id: "recent-pregnancy",
      question: "Have you been pregnant in the last 6 months?",
      eligibleAnswer: "no",
    },
  ];

  // Combine questions based on gender
  const allQuestions = [
    ...baseQuestions,
    ...(userProfile?.gender?.toLowerCase() === 'female' ? pregnancyQuestions : [])
  ];

  const progress = (Object.keys(answers).length / allQuestions.length) * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if all answers are eligible
    const isEligible = allQuestions.every(question => 
      answers[question.id] === question.eligibleAnswer
    );

    if (isEligible) {
      setShowResult(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      alert("Based on your answers, you may not be eligible to donate blood at this time. Please consult with our staff for more information.");
    }
  };

  const allAnswered = Object.keys(answers).length === allQuestions.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-8 h-8 text-[#D72638] animate-pulse" />
          <p className="text-[#333333]">Loading eligibility questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar title="Eligibility Checklist" onLogout={onLogout} />

      <div className="max-w-3xl mx-auto p-8">
        {!showResult ? (
          <Card>
            <CardHeader>
              <CardTitle>Donor Eligibility Checklist</CardTitle>
              <CardDescription>
                Please answer these questions truthfully to confirm your eligibility before donating blood.
                {userProfile?.gender?.toLowerCase() === 'female' && (
                  <span className="text-[#D72638] font-medium block mt-2">
                       Additional pregnancy-related questions are included for female donors.
                  </span>
                )}
              </CardDescription>
              <Progress value={progress} className="mt-4" />
              <div className="flex justify-between text-sm text-[#333333] opacity-60 mt-2">
                <span>Questions answered: {Object.keys(answers).length} of {allQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {allQuestions.map((q, index) => (
                  <div 
                    key={q.id} 
                    className="space-y-3 pb-6 border-b border-[#F3F4F6] last:border-0"
                  >
                    <Label className="text-[#333333] text-base">
                      {index + 1}. {q.question}
                    </Label>
                    <RadioGroup
                      value={answers[q.id]}
                      onValueChange={(value) =>
                        setAnswers({ ...answers, [q.id]: value })
                      }
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                        <RadioGroupItem value="yes" id={`${q.id}-yes`} />
                        <Label htmlFor={`${q.id}-yes`} className="cursor-pointer flex-1">
                          Yes
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                        <RadioGroupItem value="no" id={`${q.id}-no`} />
                        <Label htmlFor={`${q.id}-no`} className="cursor-pointer flex-1">
                          No
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {/* Special notes for certain questions */}
                    {q.id === "weight" && (
                      <p className="text-sm text-[#333333] opacity-60 mt-2">
                        Minimum weight requirement ensures donor safety during blood collection.
                      </p>
                    )}
                    {q.id === "pregnancy" && (
                      <p className="text-sm text-[#333333] opacity-60 mt-2">
                        For the safety of both mother and baby, pregnant individuals are not eligible to donate.
                      </p>
                    )}
                    {q.id === "breastfeeding" && (
                      <p className="text-sm text-[#333333] opacity-60 mt-2">
                        Breastfeeding donors are usually eligible, but we recommend consulting with your healthcare provider.
                      </p>
                    )}
                  </div>
                ))}

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={!allAnswered}
                    className="w-full bg-[#D72638] hover:bg-[#A61B2B] text-white disabled:opacity-50 text-lg py-6"
                  >
                    {allAnswered ? 'Submit Eligibility Check' : 'Please Answer All Questions'}
                  </Button>
                  
                  {!allAnswered && (
                    <p className="text-center text-sm text-[#333333] opacity-60 mt-2">
                      {allQuestions.length - Object.keys(answers).length} question(s) remaining
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CheckCircle2 className="w-20 h-20 text-[#D72638] mb-4" />
              <CardTitle className="mb-2 text-2xl">You are eligible to donate!</CardTitle>
              <CardDescription className="text-lg text-center">
                Thank you for completing the eligibility questionnaire.
                <br />
                Proceeding to your dashboard...
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}