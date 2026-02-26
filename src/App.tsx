import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { AlertsProvider } from './context/AlertsContext';
import MockLogin from './components/MockLogin';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import OrganizationsDashboard from './components/OrganizationsDashboard';
import FamiliesDashboard from './components/FamiliesDashboard';

type PageType = 'landing' | 'admin' | 'organizations' | 'families';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [activeTab, setActiveTab] = useState('overview');

  const handleNavigateTo = (page: string) => {
    setCurrentPage(page as PageType);
    setActiveTab('overview');
  };

  const handleNavigateBack = () => {
    setCurrentPage('landing');
    setActiveTab('overview');
  };

  return (
    <AuthProvider>
      <AlertsProvider>
        <ErrorBoundary componentName="App">
          <AppContent
            currentPage={currentPage}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleNavigateTo={handleNavigateTo}
            handleNavigateBack={handleNavigateBack}
          />
        </ErrorBoundary>
      </AlertsProvider>
    </AuthProvider>
  );
}

interface AppContentProps {
  currentPage: PageType;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleNavigateTo: (page: string) => void;
  handleNavigateBack: () => void;
}

function AppContent({
  currentPage,
  activeTab,
  setActiveTab,
  handleNavigateTo,
  handleNavigateBack
}: AppContentProps) {
  const { loggedInUser, login, logout } = useAuth();

  const handleLogin = (user: any) => {
    login(user);
    
    if (user.roleId === 'admin' || user.associatedType === null) {
      handleNavigateTo('admin');
    } else if (user.associatedType === 'organization') {
      handleNavigateTo('organizations');
    } else if (user.associatedType === 'family') {
      handleNavigateTo('families');
    } else {
      handleNavigateTo('admin');
    }
  };

  const handleLogout = () => {
    logout();
    handleNavigateTo('landing');
    setActiveTab('overview');
  };

  if (!loggedInUser && currentPage !== 'landing') {
    return (
      <ErrorBoundary componentName="MockLogin">
        <MockLogin onLogin={handleLogin} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen">
      {currentPage === 'landing' && (
        <ErrorBoundary componentName="LandingPage">
          <LandingPage onNavigateTo={handleNavigateTo} />
        </ErrorBoundary>
      )}
      {currentPage === 'admin' && loggedInUser && (
        <ErrorBoundary componentName="AdminDashboard">
          <AdminDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </ErrorBoundary>
      )}
      {currentPage === 'organizations' && loggedInUser && (
        <ErrorBoundary componentName="OrganizationsDashboard">
          <OrganizationsDashboard onNavigateBack={handleNavigateBack} />
        </ErrorBoundary>
      )}
      {currentPage === 'families' && loggedInUser && (
        <ErrorBoundary componentName="FamiliesDashboard">
          <FamiliesDashboard onNavigateBack={handleNavigateBack} />
        </ErrorBoundary>
      )}

      {loggedInUser && currentPage !== 'landing' && (
        <button
          onClick={handleLogout}
          className="fixed top-4 left-4 bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors z-40 flex items-center border border-gray-700"
        >
          تسجيل الخروج
        </button>
      )}
    </div>
  );
}

export default App;