import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import EventDiscovery from '../../components/features/events/EventDiscovery';

const EventDiscoveryPage = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Compact Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/50 to-cyan-600/50 mix-blend-multiply"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full mb-2 border border-white/20">
              <svg className="w-3.5 h-3.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xs font-semibold text-white">Khám phá sự kiện tình nguyện</span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1.5">
              Khám phá sự kiện mới
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-200"> và đăng ký ngay</span>
            </h1>
            
            <p className="text-xs md:text-sm text-cyan-100 max-w-2xl mx-auto">
              Tìm kiếm và tham gia các hoạt động tình nguyện đang mở đăng ký 🌟
            </p>
          </div>
        </div>
      </div>

      {/* Main Event Discovery Component */}
      <div className="pt-4">
        <EventDiscovery />
      </div>
    </div>
  );
};

// Add custom animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
`;
document.head.appendChild(style);

export default EventDiscoveryPage;