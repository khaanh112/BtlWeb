import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DashboardService {
  // Get dashboard data based on user role
  async getDashboardData(user) {
    try {
      const dashboardData = {
        message: 'Dashboard VolunteerHub',
        user: user,
        widgets: {
          upcomingEvents: await this.getUpcomingEvents(user),
          recentActivity: await this.getRecentActivity(user),
          newlyPublishedEvents: await this.getNewlyPublishedEvents(),
          trendingEvents: await this.getTrendingEvents(),
          featuredPastEvents: await this.getFeaturedPastEvents(),
          trendingPosts: await this.getTrendingPosts()
        }
      };

      // Add role-specific data
      switch (user.role) {
        case 'VOLUNTEER':
          dashboardData.quickActions = [
            'Tìm kiếm sự kiện',
            'Xem lịch sử tham gia', 
            'Cập nhật hồ sơ'
          ];
          dashboardData.roleSpecific = await this.getVolunteerStats(user.id);
          break;
        case 'ORGANIZER':
          dashboardData.quickActions = [
            'Tạo sự kiện mới',
            'Quản lý đăng ký',
            'Xem báo cáo'
          ];
          dashboardData.roleSpecific = await this.getOrganizerStats(user.id);
          break;
        case 'ADMIN':
          dashboardData.quickActions = [
            'Duyệt sự kiện',
            'Quản lý người dùng',
            'Xem thống kê'
          ];
          dashboardData.roleSpecific = await this.getAdminStats();
          break;
      }

      return dashboardData;
    } catch (error) {
      console.error('DashboardService.getDashboardData error:', error);
      throw new Error('DASHBOARD_ERROR');
    }
  }

  // Get upcoming events based on user role
  async getUpcomingEvents(user) {
    try {
      const currentDate = new Date();
      
      if (user.role === 'VOLUNTEER') {
        // Get events the volunteer is registered for
        const registrations = await prisma.eventParticipant.findMany({
          where: {
            volunteerId: user.id,
            status: 'APPROVED',
            event: {
              startDate: { gte: currentDate },
              status: 'APPROVED'
            }
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                description: true,
                startDate: true,
                endDate: true,
                location: true,
                category: true,
                capacity: true,
                organizer: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                },
                _count: {
                  select: {
                    participants: {
                      where: { status: 'APPROVED' }
                    }
                  }
                }
              }
            }
          },
          take: 6,
          orderBy: { event: { startDate: 'asc' } }
        });
        
        return registrations.map(reg => ({
          ...reg.event,
          participantCount: reg.event._count.participants
        }));
      } else if (user.role === 'ORGANIZER') {
        // Get organizer's upcoming events
        const events = await prisma.event.findMany({
          where: {
            organizerId: user.id,
            startDate: { gte: currentDate },
            status: { in: ['APPROVED', 'PENDING'] }
          },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            category: true,
            capacity: true,
            status: true,
            organizer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: {
                  where: { status: 'APPROVED' }
                }
              }
            }
          },
          take: 6,
          orderBy: { startDate: 'asc' }
        });
        return events.map(event => ({
          ...event,
          participantCount: event._count.participants
        }));
      } else {
        // Admin sees all upcoming approved events
        const events = await prisma.event.findMany({
          where: {
            startDate: { gte: currentDate },
            status: 'APPROVED'
          },
          select: {
            id: true,
            title: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            category: true,
            capacity: true,
            organizer: {
              select: { 
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: {
                  where: { status: 'APPROVED' }
                }
              }
            }
          },
          take: 6,
          orderBy: { startDate: 'asc' }
        });
        return events.map(event => ({
          ...event,
          participantCount: event._count.participants
        }));
      }
    } catch (error) {
      console.error('DashboardService.getUpcomingEvents error:', error);
      return [];
    }
  }

  // Get recent activity for the user
  async getRecentActivity(user) {
    try {
      if (user.role === 'VOLUNTEER') {
        // Get recent registrations and status changes
        const recentRegistrations = await prisma.eventParticipant.findMany({
          where: { volunteerId: user.id },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true
              }
            }
          },
          take: 5,
          orderBy: { registeredAt: 'desc' }
        });
        
        return recentRegistrations.map(reg => ({
          type: 'registration',
          message: `Đăng ký sự kiện: ${reg.event.title}`,
          date: reg.registeredAt,
          status: reg.status
        }));
      }
      
      // TODO: Implement activity tracking for other roles
      return [];
    } catch (error) {
      console.error('DashboardService.getRecentActivity error:', error);
      return [];
    }
  }

  // Get volunteer-specific statistics
  async getVolunteerStats(userId) {
    try {
      const currentDate = new Date();
      
      const [totalRegistrations, completedEvents, upcomingEvents] = await Promise.all([
        prisma.eventParticipant.count({
          where: { volunteerId: userId, status: 'APPROVED' }
        }),
        prisma.eventParticipant.count({
          where: {
            volunteerId: userId,
            status: 'APPROVED',
            event: {
              endDate: { lt: currentDate }
            }
          }
        }),
        prisma.eventParticipant.count({
          where: {
            volunteerId: userId,
            status: 'APPROVED',
            event: {
              startDate: { gte: currentDate }
            }
          }
        })
      ]);

      return {
        participationStats: {
          totalEvents: totalRegistrations,
          completedEvents,
          upcomingEvents
        }
      };
    } catch (error) {
      console.error('DashboardService.getVolunteerStats error:', error);
      return {
        participationStats: {
          totalEvents: 0,
          completedEvents: 0,
          upcomingEvents: 0
        }
      };
    }
  }

  // Get organizer-specific statistics
  async getOrganizerStats(userId) {
    try {
      const currentDate = new Date();
      
      const [totalEvents, pendingApproval, activeEvents] = await Promise.all([
        prisma.event.count({
          where: { organizerId: userId }
        }),
        prisma.event.count({
          where: { organizerId: userId, status: 'PENDING' }
        }),
        prisma.event.count({
          where: {
            organizerId: userId,
            status: 'APPROVED',
            startDate: { gte: currentDate }
          }
        })
      ]);

      return {
        eventStats: {
          totalEvents,
          pendingApproval,
          activeEvents
        }
      };
    } catch (error) {
      console.error('DashboardService.getOrganizerStats error:', error);
      return {
        eventStats: {
          totalEvents: 0,
          pendingApproval: 0,
          activeEvents: 0
        }
      };
    }
  }

  // Get admin-specific statistics
  async getAdminStats() {
    try {
      const [totalUsers, pendingEvents, totalEvents] = await Promise.all([
        prisma.user.count(),
        prisma.event.count({
          where: { status: 'PENDING' }
        }),
        prisma.event.count()
      ]);

      return {
        systemStats: {
          totalUsers,
          pendingEvents,
          totalEvents
        }
      };
    } catch (error) {
      console.error('DashboardService.getAdminStats error:', error);
      return {
        systemStats: {
          totalUsers: 0,
          pendingEvents: 0,
          totalEvents: 0
        }
      };
    }
  }

  // Get newly published events (recently approved events with recent posts)
  async getNewlyPublishedEvents() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const newEvents = await prisma.event.findMany({
        where: {
          status: 'APPROVED',
          approvedAt: { gte: threeDaysAgo }
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startDate: true,
          endDate: true,
          category: true,
          capacity: true,
          approvedAt: true,
          organizer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              participants: {
                where: { status: 'APPROVED' }
              }
            }
          },
          communicationChannel: {
            select: {
              id: true,
              _count: {
                select: {
                  posts: true
                }
              }
            }
          }
        },
        orderBy: { approvedAt: 'desc' },
        take: 12
      });

      const formattedEvents = newEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startDate: event.startDate,
        endDate: event.endDate,
        category: event.category,
        capacity: event.capacity,
        approvedAt: event.approvedAt,
        organizer: event.organizer,
        participantCount: event._count.participants,
        postCount: event.communicationChannel?._count.posts || 0,
        type: 'event'
      }));

      // Fallback: If no newly published events, return recent approved events
      if (formattedEvents.length === 0) {
        const recentApproved = await prisma.event.findMany({
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            category: true,
            capacity: true,
            approvedAt: true,
            organizer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: {
                  where: { status: 'APPROVED' }
                }
              }
            },
            communicationChannel: {
              select: {
                id: true,
                _count: {
                  select: {
                    posts: true
                  }
                }
              }
            }
          },
          orderBy: { approvedAt: 'desc' },
          take: 12
        });

        return recentApproved.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          category: event.category,
          capacity: event.capacity,
          approvedAt: event.approvedAt,
          organizer: event.organizer,
          participantCount: event._count.participants,
          postCount: event.communicationChannel?._count.posts || 0,
          type: 'event'
        }));
      }

      return formattedEvents;
    } catch (error) {
      console.error('DashboardService.getNewlyPublishedEvents error:', error);
      return [];
    }
  }

  // Get trending events (high engagement: new members, posts, likes, comments)
  async getTrendingEvents() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Get all approved events with recent activity
      const events = await prisma.event.findMany({
        where: {
          status: 'APPROVED'
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startDate: true,
          endDate: true,
          category: true,
          capacity: true,
          organizer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          _count: {
            select: {
              participants: {
                where: { 
                  status: 'APPROVED',
                  registeredAt: { gte: oneWeekAgo }
                }
              }
            }
          },
          communicationChannel: {
            select: {
              id: true,
              posts: {
                where: {
                  createdAt: { gte: oneWeekAgo }
                },
                select: {
                  id: true,
                  _count: {
                    select: {
                      likes: true,
                      comments: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Calculate engagement score for each event
      const eventsWithScore = events.map(event => {
        const recentParticipants = event._count.participants;
        const recentPosts = event.communicationChannel?.posts.length || 0;
        const recentLikes = event.communicationChannel?.posts.reduce(
          (sum, post) => sum + post._count.likes, 0
        ) || 0;
        const recentComments = event.communicationChannel?.posts.reduce(
          (sum, post) => sum + post._count.comments, 0
        ) || 0;

        // Engagement score formula: weighted sum
        const engagementScore = 
          (recentParticipants * 5) +  // New members weight: 5
          (recentPosts * 3) +          // New posts weight: 3
          (recentLikes * 1) +          // Likes weight: 1
          (recentComments * 2);        // Comments weight: 2

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          category: event.category,
          capacity: event.capacity,
          organizer: event.organizer,
          engagementScore,
          recentActivity: {
            newMembers: recentParticipants,
            newPosts: recentPosts,
            likes: recentLikes,
            comments: recentComments
          },
          type: 'event'
        };
      });

      // Sort by engagement score and return top events
      const trendingEvents = eventsWithScore
        .filter(e => e.engagementScore > 0) // Only events with activity
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 12);

      // Fallback: If no trending events, return events by participant count
      if (trendingEvents.length === 0) {
        const recentEvents = await prisma.event.findMany({
          where: {
            status: 'APPROVED'
          },
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            startDate: true,
            endDate: true,
            category: true,
            capacity: true,
            organizer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            },
            _count: {
              select: {
                participants: {
                  where: { status: 'APPROVED' }
                }
              }
            }
          },
          orderBy: [
            { participants: { _count: 'desc' } },
            { approvedAt: 'desc' }
          ],
          take: 12
        });

        return recentEvents.map(event => ({
          id: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          startDate: event.startDate,
          endDate: event.endDate,
          category: event.category,
          capacity: event.capacity,
          organizer: event.organizer,
          participantCount: event._count.participants,
          engagementScore: 0,
          recentActivity: {
            newMembers: 0,
            newPosts: 0,
            likes: 0,
            comments: 0
          },
          type: 'event'
        }));
      }

      return trendingEvents;
    } catch (error) {
      console.error('DashboardService.getTrendingEvents error:', error);
      return [];
    }
  }

  // Get recent posts from all event channels
  async getRecentPosts() {
    try {
      const recentPosts = await prisma.channelPost.findMany({
        where: {
          channel: {
            event: {
              status: 'APPROVED'
            }
          }
        },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true
            }
          },
          channel: {
            select: {
              event: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 8
      });

      return recentPosts.map(post => ({
        id: post.id,
        content: post.content,
        imageUrl: post.imageUrl,
        createdAt: post.createdAt,
        author: post.author,
        event: post.channel.event,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        type: 'post'
      }));
    } catch (error) {
      console.error('DashboardService.getRecentPosts error:', error);
      return [];
    }
  }

  // Get featured past events (highly rated completed events)
  async getFeaturedPastEvents() {
    try {
      const currentDate = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // Get completed events with ratings from the past month
      const pastEvents = await prisma.event.findMany({
        where: {
          status: 'APPROVED',
          endDate: { 
            lt: currentDate,
            gte: oneMonthAgo  // Only events from the past month
          }
        },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          startDate: true,
          endDate: true,
          category: true,
          capacity: true,
          organizer: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          participants: {
            where: {
              status: 'COMPLETED',
              rating: { not: null }
            },
            select: {
              rating: true,
              feedback: true
            }
          },
          _count: {
            select: {
              participants: {
                where: { status: 'COMPLETED' }
              }
            }
          }
        },
        take: 50  // Get more to filter
      });

      // Calculate average rating and filter events with ratings
      const eventsWithRatings = pastEvents
        .map(event => {
          const ratings = event.participants.map(p => p.rating).filter(r => r !== null);
          const avgRating = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : 0;
          
          return {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startDate: event.startDate,
            endDate: event.endDate,
            category: event.category,
            capacity: event.capacity,
            organizer: event.organizer,
            avgRating: Math.round(avgRating * 10) / 10,  // Round to 1 decimal
            ratingCount: ratings.length,
            completedCount: event._count.participants,
            topFeedback: event.participants
              .filter(p => p.feedback && p.rating >= 4)
              .slice(0, 3)
              .map(p => p.feedback),
            type: 'event'
          };
        })
        .filter(event => event.avgRating >= 3.5 && event.ratingCount >= 1)  // Min 3.5 stars and 1 rating (lowered threshold)
        .sort((a, b) => {
          // Sort by rating first, then by rating count
          if (b.avgRating !== a.avgRating) {
            return b.avgRating - a.avgRating;
          }
          return b.ratingCount - a.ratingCount;
        })
        .slice(0, 8);  // Return top 8

      console.log('Featured past events found:', eventsWithRatings.length);
      
      // Fallback: If no highly rated events, return recent completed events with any rating
      if (eventsWithRatings.length === 0) {
        console.log('No highly rated events, returning recent completed events');
        const recentCompleted = pastEvents
          .filter(event => event.participants.length > 0)  // Has at least some participation
          .map(event => {
            const ratings = event.participants.map(p => p.rating).filter(r => r !== null);
            const avgRating = ratings.length > 0 
              ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
              : 0;
            
            return {
              id: event.id,
              title: event.title,
              description: event.description,
              location: event.location,
              startDate: event.startDate,
              endDate: event.endDate,
              category: event.category,
              capacity: event.capacity,
              organizer: event.organizer,
              avgRating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : null,
              ratingCount: ratings.length,
              completedCount: event._count.participants,
              topFeedback: event.participants
                .filter(p => p.feedback)
                .slice(0, 3)
                .map(p => p.feedback),
              type: 'event'
            };
          })
          .sort((a, b) => new Date(b.endDate) - new Date(a.endDate))  // Most recent first
          .slice(0, 8);
        
        // Second fallback: If still no events, extend search to 3 months
        if (recentCompleted.length === 0) {
          console.log('No events in past month, extending to 3 months');
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

          const olderEvents = await prisma.event.findMany({
            where: {
              status: 'APPROVED',
              endDate: { 
                lt: currentDate,
                gte: threeMonthsAgo
              }
            },
            select: {
              id: true,
              title: true,
              description: true,
              location: true,
              startDate: true,
              endDate: true,
              category: true,
              capacity: true,
              organizer: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              },
              participants: {
                where: {
                  status: 'COMPLETED'
                },
                select: {
                  rating: true,
                  feedback: true
                }
              },
              _count: {
                select: {
                  participants: {
                    where: { status: 'COMPLETED' }
                  }
                }
              }
            },
            orderBy: { endDate: 'desc' },
            take: 8
          });

          return olderEvents.map(event => {
            const ratings = event.participants.map(p => p.rating).filter(r => r !== null);
            const avgRating = ratings.length > 0 
              ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
              : 0;
            
            return {
              id: event.id,
              title: event.title,
              description: event.description,
              location: event.location,
              startDate: event.startDate,
              endDate: event.endDate,
              category: event.category,
              capacity: event.capacity,
              organizer: event.organizer,
              avgRating: avgRating > 0 ? Math.round(avgRating * 10) / 10 : null,
              ratingCount: ratings.length,
              completedCount: event._count.participants,
              topFeedback: event.participants
                .filter(p => p.feedback)
                .slice(0, 3)
                .map(p => p.feedback),
              type: 'event'
            };
          });
        }
        
        return recentCompleted;
      }
      
      return eventsWithRatings;
    } catch (error) {
      console.error('DashboardService.getFeaturedPastEvents error:', error);
      return [];
    }
  }

  // Get trending posts (based on likes and comments)
  async getTrendingPosts() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const posts = await prisma.channelPost.findMany({
        where: {
          createdAt: { gte: threeDaysAgo },
          channel: {
            event: {
              status: 'APPROVED'
            }
          }
        },
        select: {
          id: true,
          content: true,
          imageUrl: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true
            }
          },
          channel: {
            select: {
              event: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });

      // Calculate engagement score for each post
      const postsWithScore = posts.map(post => {
        const engagementScore = 
          (post._count.likes * 1) +      // Likes weight: 1
          (post._count.comments * 3);    // Comments weight: 3 (more valuable)

        return {
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
          author: post.author,
          event: post.channel.event,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          engagementScore,
          type: 'post'
        };
      });

      // Sort by engagement score and return top 6
      const trendingPosts = postsWithScore
        .sort((a, b) => b.engagementScore - a.engagementScore)
        .slice(0, 6);

      // Fallback: If no trending posts from last 3 days, get recent posts from last week
      if (trendingPosts.length === 0) {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const recentPosts = await prisma.channelPost.findMany({
          where: {
            createdAt: { gte: oneWeekAgo },
            channel: {
              event: {
                status: 'APPROVED'
              }
            }
          },
          select: {
            id: true,
            content: true,
            imageUrl: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                role: true
              }
            },
            channel: {
              select: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    category: true
                  }
                }
              }
            },
            _count: {
              select: {
                likes: true,
                comments: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 6
        });

        return recentPosts.map(post => ({
          id: post.id,
          content: post.content,
          imageUrl: post.imageUrl,
          createdAt: post.createdAt,
          author: post.author,
          event: post.channel.event,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          engagementScore: 0,
          type: 'post'
        }));
      }

      return trendingPosts;
    } catch (error) {
      console.error('DashboardService.getTrendingPosts error:', error);
      return [];
    }
  }
}

export default new DashboardService();