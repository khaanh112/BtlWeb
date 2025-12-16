import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Link } from 'react-router-dom';
import { useEventStore } from '../../stores/eventStore';
import EventCard from '../../components/features/events/EventCard';
import { CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const MyEventsPage = () => {
  const { user } = useAuthStore();
  const { events, myEvents, myRegistrations, isLoading, fetchEvents, fetchMyEvents, fetchMyRegistrations, refreshEvents, error } = useEventStore();
  
  const [activeFilter, setActiveFilter] = useState('active'); // active (upcoming+pending), completed, all

  useEffect(() => {
    if (!user?.id) return;
    
    if (user.role === 'VOLUNTEER') {
      fetchMyRegistrations();
    } else if (user.role === 'ORGANIZER') {
      fetchMyEvents();
    }
  }, [user?.id, user?.role, fetchMyEvents, fetchMyRegistrations]);

  // Categorize events for volunteers
  const categorizedEvents = useMemo(() => {
    if (user?.role !== 'VOLUNTEER') return { upcoming: [], completed: [], pending: [], rejected: [] };
    
    const now = new Date();
    const upcoming = [];
    const completed = [];
    const pending = [];
    const rejected = [];

    myRegistrations.forEach(reg => {
      const event = reg.event;
      if (!event) return;

      const eventWithReg = { ...event, registration: reg };

      if (reg.status === 'PENDING') {
        pending.push(eventWithReg);
      } else if (reg.status === 'REJECTED') {
        rejected.push(eventWithReg);
      } else if (reg.status === 'APPROVED') {
        if (reg.completedAt || new Date(event.endDate) < now) {
          completed.push(eventWithReg);
        } else {
          upcoming.push(eventWithReg);
        }
      }
    });

    return { upcoming, completed, pending, rejected };
  }, [myRegistrations, user?.role]);

  // Filter events based on active filter
  const filteredEvents = useMemo(() => {
    if (user?.role === 'ORGANIZER') {
      return myEvents;
    }

    // Volunteer: chỉ hiển thị sự kiện đang tham gia (upcoming + pending)
    return [...categorizedEvents.upcoming, ...categorizedEvents.pending];
  }, [categorizedEvents, myEvents, user?.role]);

  // Stats for volunteer
  const stats = useMemo(() => {
    if (user?.role !== 'VOLUNTEER') return null;
    return {
      upcoming: categorizedEvents.upcoming.length,
      completed: categorizedEvents.completed.length,
      pending: categorizedEvents.pending.length,
      rejected: categorizedEvents.rejected.length,
      total: myRegistrations.length
    };
  }, [categorizedEvents, myRegistrations, user?.role]);

  const filters = user?.role === 'VOLUNTEER' ? [] : [];

  const EmptyState = ({ title, description, actionText, actionLink, icon: Icon }) => (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-teal-50 mb-4">
        {Icon ? (
          <Icon className="w-8 h-8 text-teal-600" />
        ) : (
          <CalendarIcon className="w-8 h-8 text-teal-600" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
        >
          {actionText}
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      )}
    </div>
  );

    const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse">
          <div className="h-56 bg-gradient-to-r from-gray-200 to-gray-300"></div>
          <div className="p-6">
            <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h1 className="text-lg font-bold text-gray-900 mb-1">
              {user?.role === 'VOLUNTEER' ? 'Sự kiện của tôi' : 'Quản lý sự kiện'}
            </h1>
            <p className="text-gray-600 text-xs">
              {user?.role === 'VOLUNTEER' 
                ? 'Các sự kiện bạn đã đăng ký và đang tham gia'
                : 'Quản lý các sự kiện bạn đã tổ chức'
              }
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-red-800">Có lỗi xảy ra</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center">
              {isLoading ? 'Đang tải...' : `${filteredEvents.length} sự kiện`}
            </h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                if (user?.role === 'VOLUNTEER') {
                  await fetchMyRegistrations();
                } else if (user?.role === 'ORGANIZER') {
                  await fetchMyEvents();
                }
              }}
              className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Làm mới
            </button>
            
            {user?.role === 'ORGANIZER' && (
              <Link
                to="/events/create"
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Tạo sự kiện mới
              </Link>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredEvents.length > 0 ? (
          <div className={`grid gap-4 ${
            user?.role === 'ORGANIZER' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {filteredEvents.map((event) => {
              // Ensure event has all required fields
              const eventData = {
                ...event,
                participantCount: event.participantCount || event._count?.participants || 0,
                organizer: event.organizer || {
                  firstName: 'Unknown',
                  lastName: 'Organizer'
                }
              };

              return (
                <EventCard
                  key={event.id}
                  event={eventData}
                  showActions={true}
                  hideRegistration={true}
                  variant={user?.role === 'ORGANIZER' ? 'organizer' : 'participant'}
                />
              );
            })}
          </div>
        ) : (
          user?.role === 'VOLUNTEER' ? (
            <EmptyState
              title="📅 Chưa có sự kiện"
              description="Đăng ký tham gia các sự kiện mới để bắt đầu hành trình tình nguyện của bạn!"
              actionText="Khám phá sự kiện mới"
              actionLink="/events"
              icon={CalendarIcon}
            />
          ) : (
            <EmptyState
              title="Chưa tạo sự kiện nào"
              description="Bắt đầu tạo sự kiện đầu tiên để kêu gọi sự tham gia từ cộng đồng"
              actionText="Tạo sự kiện mới"
              actionLink="/events/create"
              icon={CalendarIcon}
            />
          )
        )}
      </div>
    </div>
  );
};

export default MyEventsPage;