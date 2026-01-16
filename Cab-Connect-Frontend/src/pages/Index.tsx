import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/LoginPage';
import { Dashboard } from '@/components/Dashboard';
import ChooseAction from "./chooseAction";


const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl font-medium">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <ChooseAction /> : <LoginPage />;
};

export default Index;