import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Activity, User, Building2, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: (role: "donor" | "hospital") => void;
  onNavigateToSignup: () => void;
}

export function LoginPage({ onLogin, onNavigateToSignup }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState<"donor" | "hospital">("donor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get(`${activeTab}-email`) as string;
    const password = formData.get(`${activeTab}-password`) as string;

    console.log('Login attempt:', { email, password: '***', role: activeTab });

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: activeTab })
      });
      
      console.log('Login response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(activeTab);
      } else {
        const errorData = await response.json();
        console.error('Login failed:', errorData);
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Make sure the server is running on port 3001.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      {/* Background illustration */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <Activity className="absolute top-20 left-10 w-32 h-32 text-[#D72638]" />
        <Activity className="absolute bottom-20 right-10 w-40 h-40 text-[#D72638]" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-8 w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo className="mb-4" />
          <p className="text-[#333333] opacity-60">Blood Donation Management System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as "donor" | "hospital")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="donor" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Donor
            </TabsTrigger>
            <TabsTrigger value="hospital" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Hospital
            </TabsTrigger>
          </TabsList>

          <TabsContent value="donor">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="donor-email">Email</Label>
                <Input
                  id="donor-email"
                  name="donor-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="donor-password">Password</Label>
                <Input
                  id="donor-password"
                  name="donor-password"
                  type="password"
                  placeholder="Enter your password"
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D72638] hover:bg-[#A61B2B] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login as Donor'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={onNavigateToSignup}
                  className="text-sm text-[#D72638] hover:underline"
                >
                  Don't have an account? Sign up
                </button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="hospital">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-700">
                  <strong>Hospital Access:</strong> Use your administrator-provided credentials to login.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-email">Hospital Email</Label>
                <Input
                  id="hospital-email"
                  name="hospital-email"
                  type="email"
                  placeholder="Enter hospital email"
                  className="w-full"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospital-password">Password</Label>
                <Input
                  id="hospital-password"
                  name="hospital-password"
                  type="password"
                  placeholder="Enter hospital password"
                  className="w-full"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#D72638] hover:bg-[#A61B2B] text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login as Hospital'
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-[#333333] opacity-60">
                  Hospital accounts are managed by administrators.
                </p>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}