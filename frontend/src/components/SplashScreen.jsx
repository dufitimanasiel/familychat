import React, { useState, useEffect } from 'react';

const SplashScreen = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onFinish();
      }, 300); // Allow fade out animation
    }, 5000); // Show for 5 seconds

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className={`text-center transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="FaceChat Logo" 
            className="h-32 w-32 md:h-40 md:w-40 rounded-full object-cover shadow-lg hover:shadow-xl transition-shadow duration-300 mx-auto"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">FaceChatFamily</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">Connect with friends instantly</p>
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
