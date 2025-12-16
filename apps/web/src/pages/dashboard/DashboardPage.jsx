import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useDashboardStore } from '../../stores/dashboardStore';
import AuthGuard from '../../components/features/auth/AuthGuard';
import DashboardEventCard from '../../components/features/dashboard/DashboardEventCard';
import DashboardPostCard from '../../components/features/dashboard/DashboardPostCard';
import { 
  SparklesIcon,
  FireIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const DashboardPage = () => {
  const { user } = useAuthStore();
  const { dashboardData, isLoading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200 border-t-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4">
          <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md text-center shadow-sm">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchDashboardData()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Thử lại
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const { widgets, roleSpecific } = dashboardData || {};

  // Debug logging
  console.log('Dashboard widgets:', widgets);
  console.log('Featured past events:', widgets?.featuredPastEvents);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Main Content - Centered layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Main Feed - Left content (wider) */}
            <main className="flex-1 min-w-0">
              <div className="space-y-4">
                {/* Empty State */}
                {(!widgets?.newlyPublishedEvents?.length &&
                  !widgets?.trendingEvents?.length &&
                  !widgets?.featuredPastEvents?.length &&
                  !widgets?.trendingPosts?.length && 
                  !widgets?.upcomingEvents?.length) && (
                  <div className="text-center py-12">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 max-w-lg mx-auto">
                      <div className="w-16 h-16 bg-teal-50 rounded-lg flex items-center justify-center mx-auto mb-6">
                        <SparklesIcon className="h-8 w-8 text-teal-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Chào mừng đến VolunteerHub!
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Hãy bắt đầu hành trình tình nguyện ý nghĩa của bạn
                      </p>
                      <button
                        onClick={() => window.location.href = '/events'}
                        className="px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                      >
                        Khám phá sự kiện ngay →
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 1: Newly Published Events - Sự kiện mới công bố */}
                {widgets?.newlyPublishedEvents?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-4 mt-8">
                      <div className="flex items-center gap-3">
                        <div className="bg-teal-50 text-teal-600 rounded-lg p-2">
                          <SparklesIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">
                            Sự kiện mới công bố
                          </h2>
                          <p className="text-sm text-gray-600">Sự kiện vừa được duyệt và có tin bài mới</p>
                        </div>
                      </div>
                      {widgets.newlyPublishedEvents.length > 6 && (
                        <button 
                          onClick={() => window.location.href = '/events'}
                          className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Xem tất cả →
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {widgets.newlyPublishedEvents.slice(0, 6).map((event) => (
                        <DashboardEventCard key={event.id} event={event} variant="new" />
                      ))}
                    </div>
                  </>
                )}

                {/* Section 2: Trending Events - Sự kiện thu hút nhất */}
                {widgets?.trendingEvents?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-orange-50 text-orange-600 rounded-lg p-1.5">
                          <FireIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">
                            Sự kiện thu hút nhất
                          </h2>
                          <p className="text-xs text-gray-600">Tăng thành viên và trao đổi nhanh trong 7 ngày qua</p>
                        </div>
                      </div>
                      {widgets.trendingEvents.length > 6 && (
                        <button 
                          onClick={() => window.location.href = '/events'}
                          className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                          Xem tất cả →
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {widgets.trendingEvents.slice(0, 6).map((event) => (
                        <DashboardEventCard key={event.id} event={event} variant="trending" />
                      ))}
                    </div>
                  </>
                )}

                {/* Section 3: Featured Past Events - Sự kiện nổi bật */}
                {widgets?.featuredPastEvents?.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg p-2 shadow-lg">
                          <HeartIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900">
                            Sự kiện nổi bật
                          </h2>
                          <p className="text-xs text-gray-600">Sự kiện được đánh giá cao nhất</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {widgets.featuredPastEvents.slice(0, 6).map((event) => (
                        <DashboardEventCard key={event.id} event={event} variant="featured" />
                      ))}
                    </div>
                  </>
                )}

              </div>
            </main>

            {/* Right Sidebar - Trending Posts */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-4 space-y-3">
                {/* Trending Posts Widget */}
                {widgets?.trendingPosts?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-3 border border-gray-100">
                    <div className="flex items-center mb-2">
                      <div className="bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-lg p-1.5 shadow-md">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                      </div>
                      <h3 className="ml-2 text-sm font-bold text-gray-900">
                        Bài viết hot
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {widgets.trendingPosts.slice(0, 5).map((post) => (
                        <div 
                          key={post.id}
                          onClick={() => window.location.href = `/events/${post.event.id}/channel`}
                          className="group cursor-pointer"
                        >
                          <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                            {post.author?.avatar ? (
                              <img 
                                src={post.author.avatar} 
                                alt={`${post.author.firstName} ${post.author.lastName}`}
                                className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-orange-700">
                                  {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                                {post.author?.firstName} {post.author?.lastName}
                              </p>
                              <p className="text-[10px] text-gray-600 line-clamp-3 mt-0.5 leading-relaxed">
                                {post.content}
                              </p>
                              {post.imageUrl && (
                                <div className="mt-1.5 rounded-lg overflow-hidden">
                                  <img 
                                    src={post.imageUrl} 
                                    alt="Post" 
                                    className="w-full h-24 object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                                <span className="flex items-center">
                                  <span className="mr-0.5">❤️</span>
                                  {post.likeCount}
                                </span>
                                <span className="flex items-center">
                                  <span className="mr-0.5">💬</span>
                                  {post.commentCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default DashboardPage;