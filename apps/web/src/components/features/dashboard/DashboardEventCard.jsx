import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserGroupIcon,
  ChatBubbleLeftIcon,
  FireIcon,
  SparklesIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const DashboardEventCard = ({ event, variant = 'default' }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Môi trường': 'bg-green-100 text-green-800',
      'Giáo dục': 'bg-blue-100 text-blue-800',
      'Y tế': 'bg-red-100 text-red-800',
      'Cộng đồng': 'bg-purple-100 text-purple-800',
      'Từ thiện': 'bg-yellow-100 text-yellow-800',
      'Cứu trợ thiên tai': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const handleClick = () => {
    navigate(`/events/${event.id}`);
  };

  // For newly published events
  if (variant === 'new') {
    return (
      <div 
        onClick={handleClick}
        className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-teal-300 group transform hover:-translate-y-1"
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-cyan-600"></div>
        
        <div className="p-3">
          {/* Header with badge */}
          <div className="flex items-start justify-between mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
            <div className="flex items-center text-[10px] text-white bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 rounded-full shadow-md">
              <SparklesIcon className="h-3 w-3 mr-0.5 animate-pulse" />
              Mới
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-teal-600 transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>

          {/* Event info */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center text-xs text-gray-600">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-teal-500" />
              <span className="font-medium">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-cyan-500" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-xs font-semibold text-gray-700">
                <UserGroupIcon className="h-3.5 w-3.5 mr-1 text-teal-500" />
                <span>{event.participantCount}</span>
              </div>
              <div className="flex items-center text-xs font-semibold text-gray-700">
                <ChatBubbleLeftIcon className="h-3.5 w-3.5 mr-1 text-cyan-500" />
                <span>{event.postCount}</span>
              </div>
            </div>
            {event.organizer && (
              <div className="flex items-center">
                {event.organizer.avatar ? (
                  <img 
                    src={event.organizer.avatar} 
                    alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                    className="h-6 w-6 rounded-full ring-2 ring-teal-200"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center ring-2 ring-teal-200">
                    <span className="text-[10px] font-bold text-teal-600">
                      {event.organizer.firstName?.[0]}{event.organizer.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For featured past events (highly rated)
  if (variant === 'featured') {
    return (
      <div 
        onClick={handleClick}
        className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-purple-300 group transform hover:-translate-y-1"
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
        
        <div className="p-3">
          {/* Header with rating badge */}
          <div className="flex items-start justify-between mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
            <div className="flex items-center text-[10px] text-white bg-gradient-to-r from-purple-500 to-pink-600 px-2 py-0.5 rounded-full shadow-md">
              <StarIconSolid className="h-3 w-3 mr-0.5 text-yellow-300" />
              {event.avgRating}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>

          {/* Event info */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center text-xs text-gray-600">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-purple-500" />
              <span className="font-medium">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-pink-500" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Rating Display */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 mb-2 border border-purple-100">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIconSolid
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= Math.round(event.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-purple-900">
                {event.avgRating}/5
              </span>
            </div>
            <div className="text-[10px] text-gray-600">
              <span className="font-semibold">{event.ratingCount}</span> đánh giá • 
              <span className="font-semibold ml-1">{event.completedCount}</span> người tham gia
            </div>
          </div>

          {/* Top Feedback Preview */}
          {event.topFeedback && event.topFeedback.length > 0 && (
            <div className="bg-white rounded-lg p-1.5 border border-purple-100 mb-2">
              <p className="text-[10px] text-gray-600 italic line-clamp-2">
                "{event.topFeedback[0]}"
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="text-[10px] text-gray-500">
              Đã hoàn thành
            </div>
            {event.organizer && (
              <div className="flex items-center">
                {event.organizer.avatar ? (
                  <img 
                    src={event.organizer.avatar} 
                    alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                    className="h-6 w-6 rounded-full ring-2 ring-purple-200"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center ring-2 ring-purple-200">
                    <span className="text-[10px] font-bold text-purple-600">
                      {event.organizer.firstName?.[0]}{event.organizer.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For trending events
  if (variant === 'trending') {
    return (
      <div 
        onClick={handleClick}
        className="relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-orange-300 group transform hover:-translate-y-1"
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
        
        <div className="p-3">
          {/* Header with trending badge */}
          <div className="flex items-start justify-between mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
            <div className="flex items-center text-[10px] text-white bg-gradient-to-r from-orange-500 to-amber-600 px-2 py-0.5 rounded-full shadow-md animate-pulse">
              <FireIcon className="h-3 w-3 mr-0.5" />
              Hot
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-gray-900 mb-1.5 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>

          {/* Event info */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center text-xs text-gray-600">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
              <span className="font-medium">{formatDate(event.startDate)}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <MapPinIcon className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          </div>

          {/* Recent Activity Stats */}
          {event.recentActivity && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-2 mb-2 border border-orange-100">
              <div className="text-[10px] font-bold text-orange-900 mb-1">
                📊 Hoạt động (7 ngày)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs">
                  <span className="text-gray-600">Thành viên:</span>
                  <span className="font-bold text-orange-700 ml-1">
                    +{event.recentActivity.newMembers}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Bài đăng:</span>
                  <span className="font-bold text-orange-700 ml-1">
                    +{event.recentActivity.newPosts}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Likes:</span>
                  <span className="font-bold text-orange-700 ml-1">
                    {event.recentActivity.likes}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-gray-600">Comments:</span>
                  <span className="font-bold text-orange-700 ml-1">
                    {event.recentActivity.comments}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer - Organizer info only */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex items-center text-xs font-semibold text-gray-700">
                <UserGroupIcon className="h-3.5 w-3.5 mr-1 text-orange-500" />
                <span>{event.recentActivity?.newMembers || 0}</span>
              </div>
              <div className="flex items-center text-xs font-semibold text-gray-700">
                <ChatBubbleLeftIcon className="h-3.5 w-3.5 mr-1 text-amber-500" />
                <span>{event.recentActivity?.newPosts || 0}</span>
              </div>
            </div>
            {event.organizer && (
              <div className="flex items-center">
                {event.organizer.avatar ? (
                  <img 
                    src={event.organizer.avatar} 
                    alt={`${event.organizer.firstName} ${event.organizer.lastName}`}
                    className="h-6 w-6 rounded-full ring-2 ring-orange-200"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center ring-2 ring-orange-200">
                    <span className="text-[10px] font-bold text-orange-600">
                      {event.organizer.firstName?.[0]}{event.organizer.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Upcoming events variant - compact horizontal card
  if (variant === 'upcoming') {
    return (
      <div 
        onClick={handleClick}
        className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-2 border-transparent hover:border-cyan-300 group"
      >
        <div className="flex items-center p-4 gap-4">
          {/* Date Badge */}
          <div className="flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl p-3 text-center shadow-md min-w-[70px]">
            <div className="text-2xl font-bold">
              {new Date(event.startDate).getDate()}
            </div>
            <div className="text-xs uppercase">
              {new Date(event.startDate).toLocaleDateString('vi-VN', { month: 'short' })}
            </div>
          </div>

          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-cyan-600 transition-colors">
              {event.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <MapPinIcon className="h-4 w-4 mr-1 text-cyan-500 flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              {event.participantCount !== undefined && (
                <div className="flex items-center text-xs font-semibold text-gray-700">
                  <UserGroupIcon className="h-3.5 w-3.5 mr-1 text-cyan-500" />
                  <span>{event.participantCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Arrow Icon */}
          <div className="flex-shrink-0 text-cyan-500 group-hover:translate-x-1 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
    >
      <div className="p-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)} mb-3`}>
          {event.category}
        </span>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {formatDate(event.startDate)}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardEventCard;
