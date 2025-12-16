import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventStore } from '../../stores/eventStore';
import { useAuthStore } from '../../stores/authStore';
import EventRating from '../../components/features/events/EventRating';
import { canRateParticipation } from '../../utils/canRate';
import api from '../../utils/api';
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { showSuccess, showError, showWarning } from '../../utils/toast';

function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, registerForEvent, fetchEventDetail, rateEvent, isLoading, error } = useEventStore();
  const { user } = useAuthStore();
  
  const [event, setEvent] = useState(null);
  const [eventRatings, setEventRatings] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isLoadingRatings, setIsLoadingRatings] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Fetch event ratings and feedback
  const fetchEventRatings = async () => {
    if (!user || user.role !== 'ORGANIZER') return;
    
    setIsLoadingRatings(true);
    try {
      const response = await api.get(`/events/${id}/feedback`);
      if (response.data.success) {
        setEventRatings(response.data);
      }
    } catch (error) {
      console.error('Error loading event ratings:', error);
      // Don't show error for ratings, as this is not critical
    } finally {
      setIsLoadingRatings(false);
    }
  };

  useEffect(() => {
    const loadEventDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const eventData = await fetchEventDetail(id);
        setEvent(eventData);
        
        // Load ratings for everyone (not just organizers)
        // We'll fetch ratings for all users to show public feedback
        await loadEventRatings();
      } catch (error) {
        console.error('Error loading event:', error);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    
    loadEventDetail();
  }, [id, fetchEventDetail]);

  // Function to load ratings for all users (public feedback)
  const loadEventRatings = async () => {
    setIsLoadingRatings(true);
    try {
      const response = await api.get(`/events/${id}/public-feedback`);
      if (response.data.success) {
        setEventRatings(response.data);
      }
    } catch (error) {
      console.error('Error loading event ratings:', error);
      // Ratings are not critical, continue without them
    } finally {
      setIsLoadingRatings(false);
    }
  };

  const handleRegister = () => {
    if (!user) {
      showWarning('Vui lòng đăng nhập để đăng ký tham gia sự kiện');
      navigate('/login', { state: { from: `/events/${id}` } });
      return;
    }
    setShowRegistrationModal(true);
  };

  const handleConfirmRegistration = async () => {
    setIsRegistering(true);
    
    try {
      const result = await registerForEvent(event.id);
      
      if (result.success) {
        showSuccess('Đăng ký thành công! Vui lòng chờ phê duyệt từ người tổ chức.');
        
        // Refresh event detail to update participant count and registration status
        try {
          const updatedEvent = await fetchEventDetail(id);
          setEvent(updatedEvent);
        } catch (err) {
          console.error('Error refreshing event:', err);
          // Even if refresh fails, registration was successful
        }
      } else {
        showError(result.error || 'Có lỗi xảy ra khi đăng ký');
      }
    } catch (error) {
      console.error('Lỗi đăng ký sự kiện:', error);
      showError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.');
    } finally {
      setIsRegistering(false);
      setShowRegistrationModal(false);
    }
  };

  const handleGoBack = () => {
    // Go back to previous page, or /events if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/events');
    }
  };

  const handleRatingSuccess = async () => {
    try {
      showSuccess('Cảm ơn bạn đã đánh giá sự kiện!');
      
      // Refresh event detail to show updated rating
      const updatedEvent = await fetchEventDetail(id);
      setEvent(updatedEvent);
      
      // Reload ratings/feedback
      await loadEventRatings();
    } catch (err) {
      console.error('Error refreshing after rating:', err);
    }
  };

  if (isLoading || isLoadingDetail) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-64">
          <div className="text-lg">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Lỗi</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Quay lại danh sách sự kiện
          </button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h1>
          <p className="text-gray-600 mb-4">Sự kiện bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button 
            onClick={handleGoBack}
            className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
          >
            Quay lại danh sách sự kiện
          </button>
        </div>
      </div>
    );
  }

  // Use userRegistration if available (backend attaches full participant record there),
  // otherwise fallback to participants list. userRegistration contains rating/ratedAt fields.
  const userParticipation = event.userRegistration || event.participants?.find(p => p.volunteer?.id === user?.id);
  const isRegistered = !!userParticipation;
  const isApproved = userParticipation?.status === 'APPROVED';
  const isRejected = userParticipation?.status === 'REJECTED';
  const isCompleted = userParticipation?.status === 'COMPLETED';
  const isOrganizer = event.organizer?.id === user?.id || event.organizerId === user?.id;
  
  // Check if event has expired
  const now = new Date();
  const eventEndDate = new Date(event.endDate);
  const isExpired = eventEndDate < now;
  
  const canRegister = !isRegistered && !isOrganizer && event.status === 'APPROVED' && !isExpired;
  // Only allow channel access for organizer and approved participants (not completed)
  const canAccessChannel = (isOrganizer || isApproved) && event.status === 'APPROVED';
  // Use participantCount from backend (already filtered for APPROVED only)
  // Or count manually if participants array is provided
  const participantCount = event.participantCount ?? 
    event.participants?.filter(p => p.status === 'APPROVED' || p.status === 'COMPLETED').length ?? 0;

  // Helper function to get organizer display name
  const getOrganizerName = () => {
    console.log('Organizer data:', event.organizer); // Debug log
    
    // Try to get full name from firstName and lastName
    if (event.organizer?.firstName && event.organizer?.lastName) {
      return `${event.organizer.firstName} ${event.organizer.lastName}`;
    }
    
    // Try event.organizer.name field
    if (event.organizer?.name) {
      return event.organizer.name;
    }
    
    // Try organizerName field (legacy)
    if (event.organizerName) {
      return event.organizerName;
    }
    
    // Extract name from email if available
    if (event.organizer?.email) {
      const emailName = event.organizer.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    return 'Đang cập nhật';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <button 
          onClick={handleGoBack}
          className="flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors group"
        >
          <svg className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách sự kiện
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Hero Banner */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-4">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-700 p-4 md:p-5">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
            </div>
            
            <div className="relative">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                <div className="flex-1">
                  {/* Category badge */}
                  <div className="inline-flex items-center px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full mb-3">
                    <svg className="w-3.5 h-3.5 mr-1.5 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-white text-xs font-semibold">{event.category}</span>
                  </div>

                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
                    {event.title}
                  </h1>
                  
                  {/* Meta info */}
                  <div className="flex flex-wrap gap-3 text-white/90 text-sm">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-medium">{event.location}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{getOrganizerName()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Status badge */}
                <div>
                  {!isOrganizer && isRegistered ? (
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${
                      isCompleted ? 'bg-gray-500 text-white' :
                      isRejected ? 'bg-red-500 text-white' :
                      'bg-emerald-500 text-white'
                    }`}>
                      {isCompleted ? '✓ Đã hoàn thành' : 
                       isRejected ? '✗ Đã bị từ chối' : 
                       '✓ Đã đăng ký'}
                    </span>
                  ) : (
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${
                      event.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                      event.status === 'PENDING' ? 'bg-amber-500 text-white' :
                      event.status === 'REJECTED' ? 'bg-red-500 text-white' :
                      event.status === 'COMPLETED' ? 'bg-gray-500 text-white' :
                      'bg-gray-500 text-white'
                    }`}>
                      {event.status === 'APPROVED' ? '✓ Đã phê duyệt' : 
                       event.status === 'PENDING' ? '⏳ Chờ phê duyệt' :
                       event.status === 'REJECTED' ? '✗ Đã từ chối' :
                       event.status === 'COMPLETED' ? '🏁 Đã kết thúc' : 'Không xác định'}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Quick info cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2.5 border border-white/20">
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-md p-1.5 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 font-medium">Thời gian</div>
                      <div className="text-xs font-bold">
                        {new Date(event.startDate).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-md p-1.5 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 font-medium">Giờ bắt đầu</div>
                      <div className="text-xs font-bold">
                        {new Date(event.startDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                  <div className="flex items-center text-white">
                    <div className="bg-white/20 rounded-md p-1.5 mr-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs text-white/70 font-medium">Người tham gia</div>
                      <div className="text-xs font-bold">
                        {participantCount} {event.capacity ? `/ ${event.capacity}` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Event content */}
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Mô tả sự kiện</h2>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {event.description}
                </div>
              </div>

              {event.requirements && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Yêu cầu</h2>
                  <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {event.requirements}
                  </div>
                </div>
              )}

              {/* Event Ratings Section */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2">Đánh giá từ tình nguyện viên</h2>
                {isLoadingRatings ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-100 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                ) : eventRatings && eventRatings.feedback && eventRatings.feedback.length > 0 ? (
                  <div className="space-y-3">
                    {/* Rating Summary */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIconSolid
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= Math.round(eventRatings.averageRating) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-base font-semibold text-gray-900">
                            {eventRatings.averageRating.toFixed(1)}/5
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">
                          ({eventRatings.totalRatings} đánh giá)
                        </span>
                      </div>
                      
                      {/* Rating Distribution */}
                      <div className="space-y-0.5">
                        {eventRatings.ratingDistribution.map((dist) => (
                          <div key={dist.stars} className="flex items-center space-x-2 text-xs">
                            <span className="w-7 text-xs">{dist.stars}★</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-yellow-400 h-1.5 rounded-full" 
                                style={{ 
                                  width: `${eventRatings.totalRatings > 0 ? (dist.count / eventRatings.totalRatings) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                            <span className="w-7 text-right text-xs">{dist.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Individual Reviews */}
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                      {eventRatings.feedback.map((review, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <StarIconSolid
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium text-gray-900">{review.volunteer}</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.ratedAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {review.feedback && (
                            <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                              "{review.feedback}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <StarIcon className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">
                      Chưa có đánh giá nào
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Sự kiện này chưa có đánh giá từ tình nguyện viên hoặc chưa kết thúc.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-base font-semibold mb-3">Thông tin sự kiện</h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Danh mục:</span>
                    <span className="ml-2 px-2 py-1 bg-teal-100 text-teal-800 rounded text-xs">
                      {event.category}
                    </span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Người tổ chức:</span>
                    <div className="mt-1">{getOrganizerName()}</div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-600">Thời gian kết thúc:</span>
                    <div className="mt-1">
                      {new Date(event.endDate).toLocaleDateString('vi-VN')} {' '}
                      {new Date(event.endDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {event.maxParticipants && (
                    <div>
                      <span className="font-medium text-gray-600">Số lượng tối đa:</span>
                      <div className="mt-1">{event.maxParticipants} người</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {/* Show expired notice if event has ended */}
                {isExpired && !isOrganizer && (
                  <div className="w-full px-4 py-2.5 bg-red-100 border-2 border-red-300 text-red-800 rounded-lg text-center font-bold text-sm flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Sự kiện đã kết thúc
                  </div>
                )}
                
                {canAccessChannel && (
                  <button
                    onClick={() => navigate(`/events/${id}/channel`)}
                    className="w-full px-4 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium text-sm flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Vào kênh trao đổi
                  </button>
                )}
                
                {isOrganizer && (
                  <button
                    onClick={() => navigate(`/events/${id}/participants`)}
                    className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-sm flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Quản lý người tham gia
                  </button>
                )}
                
                {canRegister && (
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="w-full px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 font-medium text-sm"
                  >
                    {isRegistering ? 'Đang đăng ký...' : 'Đăng ký tham gia'}
                  </button>
                )}
                
                {isRegistered && !isOrganizer && !isRejected && (
                  <div className="space-y-2">
                    {/* Show completion status if completed, otherwise show registered status */}
                    {isCompleted ? (
                      <div className="w-full px-4 py-2.5 bg-gray-100 text-gray-800 rounded-lg text-center font-medium text-sm">
                        ✓ Đã hoàn thành
                      </div>
                    ) : (
                      <div className="w-full px-4 py-2.5 bg-green-100 text-green-800 rounded-lg text-center font-medium text-sm">
                        ✓ Đã đăng ký tham gia
                      </div>
                    )}
                    {/* Show rating button if participation is completed and not rated yet */}
                    {isCompleted && canRateParticipation(userParticipation) && (
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="w-full px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm flex items-center justify-center"
                      >
                        <StarIcon className="w-5 h-5 mr-2" />
                        Đánh giá sự kiện
                      </button>
                    )}

                    {/* Show rating if already rated */}
                    {isCompleted && !canRateParticipation(userParticipation) && (
                      <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-700">Đánh giá của bạn:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIconSolid
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= userParticipation.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">({userParticipation.rating}/5)</span>
                        </div>
                        {userParticipation.feedback && (
                          <p className="text-sm text-gray-600 text-center italic">
                            "{userParticipation.feedback}"
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Show completion status for approved participants */}
                    {isApproved && new Date(event.endDate) < new Date() && !userParticipation?.completedAt && (
                      <div className="w-full px-4 py-2.5 bg-orange-100 text-orange-800 rounded-lg text-center font-medium text-sm">
                        ⏳ Chờ người tổ chức xác nhận hoàn thành
                      </div>
                    )}
                  </div>
                )}
                
                {isRejected && !isOrganizer && (
                  <div className="w-full px-4 py-2.5 bg-red-100 text-red-800 rounded-lg text-center font-medium text-sm">
                    ✗ Đăng ký bị từ chối
                    {userParticipation?.rejectionReason && (
                      <div className="text-sm text-red-600 mt-1">
                        Lý do: {userParticipation.rejectionReason}
                      </div>
                    )}
                  </div>
                )}
                
                {event.status !== 'APPROVED' && (
                  <div className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-center font-medium text-sm">
                    {event.status === 'PENDING' ? 'Sự kiện đang chờ phê duyệt' :
                     event.status === 'REJECTED' ? 'Sự kiện đã bị từ chối' :
                     event.status === 'COMPLETED' ? 'Sự kiện đã kết thúc' :
                     'Sự kiện không còn mở đăng ký'}
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100">
                <InformationCircleIcon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">
                Xác nhận đăng ký
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bạn có muốn đăng ký tham gia sự kiện <strong>"{event?.title}"</strong> không?
                </p>
                <div className="mt-4 text-xs text-gray-400 space-y-1 text-left">
                  <p>📍 <strong>Địa điểm:</strong> {event?.location}</p>
                  <p>📅 <strong>Thời gian:</strong> {new Date(event?.startDate).toLocaleDateString('vi-VN')}</p>
                  <p>👥 <strong>Người tham gia:</strong> {participantCount} / {event?.capacity || '∞'}</p>
                </div>
                <div className="mt-4 p-3 bg-teal-50 rounded-md">
                  <div className="text-xs text-teal-800">
                    <p><strong>Lưu ý:</strong></p>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                      <li>Đăng ký sẽ được xem xét bởi người tổ chức</li>
                      <li>Bạn sẽ nhận thông báo về kết quả phê duyệt</li>
                      <li>Có thể hủy đăng ký trước khi sự kiện bắt đầu</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRegistrationModal(false)}
                    disabled={isRegistering}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleConfirmRegistration}
                    disabled={isRegistering}
                    className="px-4 py-2 bg-teal-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-300 disabled:opacity-50"
                  >
                    {isRegistering ? 'Đang đăng ký...' : 'Xác nhận đăng ký'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Rating Modal */}
      {showRatingModal && (
        <EventRating 
          eventId={id}
          eventTitle={event.title}
          onClose={() => setShowRatingModal(false)}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
}

export default EventDetailPage;
