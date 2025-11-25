import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface SignupPageProps {
  onSignup: (role: "donor" | "hospital", userId: string) => void;
  onNavigateToLogin: () => void;
}

export function SignupPage({ onSignup, onNavigateToLogin }: SignupPageProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;

    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          role: 'donor' // Force donor role only
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Signup successful:', data);
        
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setShowSuccess(true);
        setTimeout(() => {
          onSignup('donor', data.user.id);
        }, 1500);
      } else {
        const error = await response.json();
        alert(`Signup failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Signup failed. Make sure the server is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md">
        {!showSuccess ? (
          <>
            <div className="flex flex-col items-center mb-8">
              <Logo className="mb-4" />
              <p className="text-[#333333] opacity-60">Create your donor account</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  name="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="signup-password"
                  type="password"
                  placeholder="Create a strong password"
                  className="w-full"
                  required
                />
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> Only donor accounts can be created here. 
                  Hospital accounts are managed separately by administrators.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D72638] hover:bg-[#A61B2B] text-white"
              >
                {isLoading ? "Creating Account..." : "Sign Up as Donor"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="text-sm text-[#D72638] hover:underline"
                >
                  Already have an account? Login
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="w-16 h-16 text-[#D72638] mb-4" />
            <p className="text-[#333333]">Donor account created successfully!</p>
            <p className="text-sm text-[#333333] opacity-60 mt-2">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
}