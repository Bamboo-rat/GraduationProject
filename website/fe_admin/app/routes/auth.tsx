import type { Route } from "./+types/auth";
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import Auth from "~/pages/Auth";
import { useAuth } from '~/AuthContext';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "FoodSave - Admin Login" },
    { name: "description", content: "Login to FoodSave admin portal" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#D9FFDF] via-[#E8FFED] to-[#F0FFF4]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Auth />;
  }

  return null;
}
