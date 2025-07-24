import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
            Developed with 
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            by{' '}
            <a 
              href="https://vinamrasharma.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
            >
              Vinamra Sharma
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};