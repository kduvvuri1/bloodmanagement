import { useState, useEffect } from "react";
import { LoginPage } from "./components/LoginPage";
import { SignupPage } from "./components/SignupPage";
import { DonorProfileSetup } from "./components/DonorProfileSetup";
import { DonorEligibility } from "./components/DonorEligibility";
import { DonorDashboard } from "./components/DonorDashboard";
import { HospitalDashboard } from "./components/HospitalDashboard";

type Page = "login" | "signup" | "donor-profile-setup" | "donor-eligibility" | "donor-dashboard" | "hospital-dashboard";
type Role = "donor" | "hospital" | null;

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [userRole, setUserRole] = useState<Role>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is logged in on app start
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setUserRole(user.role);
      setUserId(user.id);
      
      console.log('App loaded with user:', user);
      
      if (user.role === 'donor') {
        if (user.profileCompleted) {
          setCurrentPage("donor-eligibility");
        } else {
          setCurrentPage("donor-profile-setup");
        }
      } else {
        setCurrentPage("hospital-dashboard");
      }
    }
  }, []);

  const handleLogin = (role: Role) => {
    setUserRole(role);
    const userData = localStorage.getItem('user');
    
    if (userData) {
      const user = JSON.parse(userData);
      setUserId(user.id);
      
      console.log('Login handled, user profileCompleted:', user.profileCompleted);
      
      if (role === "donor") {
        if (user.profileCompleted) {
          setCurrentPage("donor-eligibility");
        } else {
          setCurrentPage("donor-profile-setup");
        }
      } else {
        setCurrentPage("hospital-dashboard");
      }
    }
  };

  const handleSignup = (role: Role, newUserId: string) => {
    setUserRole(role);
    setUserId(newUserId);
    
    console.log('Signup handled, new user ID:', newUserId);
    
    if (role === "donor") {
      setCurrentPage("donor-profile-setup");
    } else {
      setCurrentPage("hospital-dashboard");
    }
  };

  const handleProfileComplete = () => {
    console.log('Profile completed, moving to eligibility');
    setCurrentPage("donor-eligibility");
  };

  const handleEligibilityComplete = () => {
    console.log('Eligibility completed, moving to dashboard');
    setCurrentPage("donor-dashboard");
  };

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    setUserId(null);
    setCurrentPage("login");
  };

  console.log('Current page:', currentPage, 'User role:', userRole, 'User ID:', userId);

  return (
    <>
      {currentPage === "login" && (
        <LoginPage
          onLogin={handleLogin}
          onNavigateToSignup={() => setCurrentPage("signup")}
        />
      )}

      {currentPage === "signup" && (
        <SignupPage
          onSignup={handleSignup}
          onNavigateToLogin={() => setCurrentPage("login")}
        />
      )}

      {currentPage === "donor-profile-setup" && (
        <DonorProfileSetup
          onComplete={handleProfileComplete}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "donor-eligibility" && (
        <DonorEligibility
          onComplete={handleEligibilityComplete}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "donor-dashboard" && (
        <DonorDashboard onLogout={handleLogout} />
      )}

      {currentPage === "hospital-dashboard" && (
        <HospitalDashboard onLogout={handleLogout} />
      )}
    </>
  );
}