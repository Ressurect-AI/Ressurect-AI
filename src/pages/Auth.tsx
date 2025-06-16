
import React from 'react';
import AuthForm from '@/components/AuthForm';
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/');
  };

  return <AuthForm onAuthSuccess={handleAuthSuccess} />;
};

export default Auth;
