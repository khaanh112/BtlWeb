import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import NotificationBell from '../features/notifications/NotificationBell';
import ConfirmModal from '../common/ConfirmModal';
import { useConfirm } from '../../hooks/useConfirm';

function Layout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const { isOpen, config, confirm, close } = useConfirm();
  
  // Compute isAuthenticated locally to ensure reactivity
  const isAuthenticated = !!user;

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy',
      type: 'warning'
    });
    
    if (confirmed) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 h-1"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
                  <svg className="relative h-11 w-11 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    VolunteerHub
                  </span>
                  <p className="text-xs text-gray-500 font-medium">Kết nối yêu thương</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-2 flex-1 justify-center">
              <Link
                to="/"
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive('/') 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Trang chủ
              </Link>
              <Link
                to="/events"
                className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive('/events') 
                    ? 'bg-teal-600 text-white shadow-md' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Khám phá sự kiện
              </Link>
              
              {isAuthenticated && (
                <>
                  {user?.role === 'VOLUNTEER' && (
                    <>
                      <Link
                        to="/events/my"
                        className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive('/events/my') 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Sự kiện của tôi
                      </Link>
                      <Link
                        to="/volunteer/profile"
                        className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive('/volunteer/profile') 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Hồ sơ
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'ORGANIZER' && (
                    <>
                      <Link
                        to="/events/my"
                        className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive('/events/my') 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Sự kiện của tôi
                      </Link>
                      <Link
                        to="/events/create"
                        className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                          isActive('/events/create') 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Tạo sự kiện
                      </Link>
                    </>
                  )}
                  
                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                        isActive('/admin') 
                          ? 'bg-teal-600 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Admin
                    </Link>
                  )}
                  
                  <Link
                    to="/dashboard"
                    className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/dashboard') 
                        ? 'bg-teal-600 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-4 min-w-fit">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <NotificationBell />
                  
                  <div className="hidden lg:flex items-center space-x-3 pl-4 border-l border-gray-300">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {user?.firstName && user?.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user?.email}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                          user?.role === 'ADMIN' 
                            ? 'bg-red-100 text-red-700'
                            : user?.role === 'ORGANIZER' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-teal-100 text-teal-700'
                        }`}>
                          {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'ORGANIZER' ? 'Tổ chức' : 'Tình nguyện'}
                        </span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>

                  {/* Mobile logout button */}
                  <button
                    onClick={handleLogout}
                    className="lg:hidden px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden bg-gray-50 border-t border-gray-200">
          <div className="px-4 py-3 space-y-1">
            <Link
              to="/"
              className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/events"
              className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isActive('/events') 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Khám phá sự kiện
            </Link>
            
            {isAuthenticated ? (
              <>
                {user?.role === 'VOLUNTEER' && (
                  <>
                    <Link
                      to="/events/my"
                      className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/events/my') 
                          ? 'bg-teal-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Đã đăng ký
                    </Link>
                    <Link
                      to="/volunteer/profile"
                      className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/volunteer/profile') 
                          ? 'bg-teal-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Hồ sơ
                    </Link>
                  </>
                )}
                
                {user?.role === 'ORGANIZER' && (
                  <>
                    <Link
                      to="/events/my"
                      className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/events/my') 
                          ? 'bg-teal-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Sự kiện của tôi
                    </Link>
                    <Link
                      to="/events/create"
                      className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isActive('/events/create') 
                          ? 'bg-teal-600 text-white' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Tạo sự kiện
                    </Link>
                  </>
                )}
                
                {user?.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/admin') 
                        ? 'bg-teal-600 text-white' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                
                <Link
                  to="/dashboard"
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/dashboard') 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/login') 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className={`block px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive('/register') 
                      ? 'bg-teal-600 text-white' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 text-white mt-12 border-t-4 border-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer Content */}
          <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand Section */}
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg blur-sm opacity-75"></div>
                  <svg className="relative h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="ml-3 text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  VolunteerHub
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Kết nối những trái tim tình nguyện, tạo nên những thay đổi tích cực cho cộng đồng.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Liên kết nhanh
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/events" className="text-gray-400 hover:text-teal-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Khám phá sự kiện
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-teal-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Về chúng tôi
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-teal-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Hỗ trợ
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Trung tâm trợ giúp
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center group">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="py-4 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-gray-400 text-sm">
                &copy; 2025 VolunteerHub. Tất cả quyền được bảo lưu.
              </p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isOpen}
        onClose={close}
        onConfirm={config.onConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        type={config.type}
        isLoading={config.isLoading}
      />
    </div>
  );
}

export default Layout;