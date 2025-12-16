import { PrismaClient } from '@prisma/client';
import webPush from 'web-push';

const prisma = new PrismaClient();
let io = null; // Will be set by setSocketIO method

// Configure Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@volunteerhub.com';

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID keys are required. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file');
}

webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
console.log('✅ VAPID keys configured successfully');

class NotificationService {
  // Set Socket.IO instance
  setSocketIO(socketIO) {
    io = socketIO;
    console.log('✅ Socket.IO instance set for NotificationService');
  }

  // Emit real-time notification via Socket.IO
  emitNotification(userId, notification) {
    if (io) {
      io.to(`user-${userId}`).emit('new-notification', notification);
      console.log(`Emitted real-time notification to user ${userId}`);
    }
  }

  // Send notification (both push and Socket.IO)
  async sendNotification(userId, payload, options = {}) {
    try {
      // Save to database
      const notificationLog = await prisma.notificationLog.create({
        data: {
          userId,
          type: payload.data?.type || 'EVENT_APPROVAL_REQUIRED',
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          isRead: false
        }
      });

      // Emit real-time notification via Socket.IO with database ID
      this.emitNotification(userId, {
        id: notificationLog.id,
        type: notificationLog.type,
        title: notificationLog.title,
        body: notificationLog.body,
        data: notificationLog.data,
        isRead: false,
        createdAt: notificationLog.createdAt
      });

      // Send push notification
      await this.sendPushNotification(userId, payload, options);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Subscribe user to push notifications
  async subscribeToPush(userId, subscription) {
    try {
      const { endpoint, keys } = subscription;
      
      // Check if subscription already exists
      const existingSubscription = await prisma.pushSubscription.findUnique({
        where: {
          userId_endpoint: {
            userId,
            endpoint
          }
        }
      });

      if (existingSubscription) {
        // Update existing subscription
        return await prisma.pushSubscription.update({
          where: { id: existingSubscription.id },
          data: {
            p256dhKey: keys.p256dh,
            authKey: keys.auth
          }
        });
      }

      // Create new subscription
      return await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint,
          p256dhKey: keys.p256dh,
          authKey: keys.auth
        }
      });
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw new Error('SUBSCRIPTION_FAILED');
    }
  }

  // Unsubscribe user from push notifications
  async unsubscribeFromPush(userId, endpoint) {
    try {
      // Check if subscription exists first
      const existingSubscription = await prisma.pushSubscription.findUnique({
        where: {
          userId_endpoint: {
            userId,
            endpoint
          }
        }
      });

      if (!existingSubscription) {
        // Subscription doesn't exist, return success anyway
        return { success: true, message: 'Subscription not found' };
      }

      // Delete the subscription
      const result = await prisma.pushSubscription.delete({
        where: {
          userId_endpoint: {
            userId,
            endpoint
          }
        }
      });
      return result;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw new Error('UNSUBSCRIPTION_FAILED');
    }
  }

  // Send push notification to specific user
  async sendPushNotification(userId, payload, options = {}) {
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId }
      });

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      const pushOptions = {
        TTL: options.ttl || 86400, // 24 hours default
        urgency: options.urgency || 'normal' // low, normal, high
      };

      const promises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dhKey,
              auth: subscription.authKey
            }
          };

          return await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(payload),
            pushOptions
          );
        } catch (error) {
          console.error(`Failed to send notification to subscription ${subscription.id}:`, error);
          
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id }
            }).catch(deleteError => {
              console.error('Error deleting invalid subscription:', deleteError);
            });
          }
          return null;
        }
      });

      const results = await Promise.allSettled(promises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      
      console.log(`Sent ${successful}/${subscriptions.length} push notifications to user ${userId}`);
      return { successful, total: subscriptions.length };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendBulkPushNotifications(userIds, payload, options = {}) {
    const promises = userIds.map(userId => 
      this.sendPushNotification(userId, payload, options)
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    
    console.log(`Bulk notification: ${successful}/${userIds.length} users notified`);
    return { successful, total: userIds.length };
  }

  // Story 4.2.2: Admin notification for new events requiring approval
  async notifyAdminNewEvent(eventId) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!event) {
        throw new Error('EVENT_NOT_FOUND');
      }

      // Get all admin users
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true }
      });

      if (admins.length === 0) {
        console.log('No admin users found for event approval notification');
        return;
      }

      const payload = {
        title: 'Sự kiện mới cần phê duyệt',
        body: `${event.organizer.firstName} ${event.organizer.lastName} đã tạo sự kiện "${event.title}"`,
        icon: '/icons/event-notification.png',
        badge: '/icons/badge.png',
        data: {
          type: 'EVENT_APPROVAL_REQUIRED',
          eventId: event.id,
          url: `/admin/events/pending/${event.id}`
        },
        actions: [
          {
            action: 'approve',
            title: 'Phê duyệt'
          },
          {
            action: 'view',
            title: 'Xem chi tiết'
          }
        ]
      };

      // Send to all admins (both Socket.IO and Push)
      const adminIds = admins.map(admin => admin.id);
      const promises = adminIds.map(adminId => 
        this.sendNotification(adminId, payload, { urgency: 'high' })
      );
      await Promise.allSettled(promises);
      
      return { success: true, notifiedAdmins: adminIds.length };
    } catch (error) {
      console.error('Error notifying admin of new event:', error);
      throw error;
    }
  }

  // Story 4.2.3: Organizer notification for volunteer registration
  async notifyOrganizerNewRegistration(eventId, volunteerId) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: { id: true }
          }
        }
      });

      const volunteer = await prisma.user.findUnique({
        where: { id: volunteerId },
        select: {
          firstName: true,
          lastName: true
        }
      });

      if (!event || !volunteer) {
        throw new Error('EVENT_OR_VOLUNTEER_NOT_FOUND');
      }

      const payload = {
        title: 'Đăng ký tham gia mới',
        body: `${volunteer.firstName} ${volunteer.lastName} đã đăng ký tham gia sự kiện "${event.title}"`,
        icon: '/icons/registration-notification.png',
        badge: '/icons/badge.png',
        data: {
          type: 'NEW_REGISTRATION',
          eventId: event.id,
          volunteerId: volunteerId,
          url: `/organizer/events/${event.id}/registrations`
        },
        actions: [
          {
            action: 'approve',
            title: 'Phê duyệt'
          },
          {
            action: 'view',
            title: 'Xem danh sách'
          }
        ]
      };

      return await this.sendNotification(event.organizer.id, payload);
    } catch (error) {
      console.error('Error notifying organizer of new registration:', error);
      throw error;
    }
  }

  // Story 4.2.4: Registration status change notification
  async notifyVolunteerRegistrationStatus(participantId, status, isCompleted = null) {
    try {
      const participant = await prisma.eventParticipant.findUnique({
        where: { id: participantId },
        include: {
          event: {
            select: {
              id: true,
              title: true
            }
          },
          volunteer: {
            select: { id: true }
          }
        }
      });

      if (!participant) {
        throw new Error('PARTICIPANT_NOT_FOUND');
      }

      let title, body, actions;
      
      if (isCompleted === true) {
        title = '🎉 Chúc mừng bạn đã hoàn thành!';
        body = `Bạn đã hoàn thành xuất sắc sự kiện "${participant.event.title}". Cảm ơn sự đóng góp ý nghĩa của bạn!`;
        actions = [
          {
            action: 'rate_event',
            title: 'Đánh giá sự kiện'
          },
          {
            action: 'view_history',
            title: 'Xem lịch sử'
          }
        ];
      } else if (status === 'APPROVED') {
        title = 'Đăng ký được phê duyệt';
        body = `Bạn đã được phê duyệt tham gia sự kiện "${participant.event.title}"`;
        actions = [
          {
            action: 'view_event',
            title: 'Xem sự kiện'
          },
          {
            action: 'view_channel',
            title: 'Tham gia thảo luận'
          }
        ];
      } else if (status === 'REJECTED') {
        title = 'Đăng ký bị từ chối';
        body = `Đăng ký tham gia sự kiện "${participant.event.title}" của bạn bị từ chối`;
        actions = [
          {
            action: 'view_reason',
            title: 'Xem lý do'
          },
          {
            action: 'find_other',
            title: 'Tìm sự kiện khác'
          }
        ];
      }

      const payload = {
        title,
        body,
        icon: '/icons/status-notification.png',
        badge: '/icons/badge.png',
        data: {
          type: 'REGISTRATION_STATUS_CHANGE',
          eventId: participant.event.id,
          participantId: participant.id,
          status,
          url: `/volunteer/events/${participant.event.id}`
        },
        actions
      };

      return await this.sendNotification(participant.volunteer.id, payload);
    } catch (error) {
      console.error('Error notifying volunteer of registration status:', error);
      throw error;
    }
  }

  // Story 4.2.5: Event status change notification
  async notifyOrganizerEventStatus(eventId, status) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organizer: {
            select: { id: true }
          }
        }
      });

      if (!event) {
        throw new Error('EVENT_NOT_FOUND');
      }

      let title, body, actions;
      
      if (status === 'APPROVED') {
        title = 'Sự kiện được phê duyệt';
        body = `Sự kiện "${event.title}" của bạn đã được phê duyệt và công bố`;
        actions = [
          {
            action: 'view_event',
            title: 'Xem sự kiện'
          },
          {
            action: 'manage',
            title: 'Quản lý'
          }
        ];
      } else if (status === 'REJECTED') {
        title = 'Sự kiện bị từ chối';
        body = `Sự kiện "${event.title}" của bạn bị từ chối phê duyệt`;
        actions = [
          {
            action: 'view_reason',
            title: 'Xem lý do'
          },
          {
            action: 'create_new',
            title: 'Tạo sự kiện mới'
          }
        ];
      }

      const payload = {
        title,
        body,
        icon: '/icons/event-status-notification.png',
        badge: '/icons/badge.png',
        data: {
          type: 'EVENT_STATUS_CHANGE',
          eventId: event.id,
          status,
          url: `/organizer/events/${event.id}`
        },
        actions
      };

      return await this.sendNotification(event.organizer.id, payload, { urgency: 'high' });
    } catch (error) {
      console.error('Error notifying organizer of event status:', error);
      throw error;
    }
  }

  // Get user's notification history (for Story 4.2.6)
  async getNotificationHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const [notifications, totalCount] = await Promise.all([
        prisma.notificationLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.notificationLog.count({
          where: { userId }
        })
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          isRead: n.isRead,
          readAt: n.readAt,
          createdAt: n.createdAt
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting notification history:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notificationLog.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        throw new Error('NOTIFICATION_NOT_FOUND');
      }

      if (notification.userId !== userId) {
        throw new Error('UNAUTHORIZED');
      }

      await prisma.notificationLog.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllNotificationsAsRead(userId) {
    try {
      const result = await prisma.notificationLog.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return result.count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Check if user has valid push subscriptions
  async hasValidSubscriptions(userId) {
    try {
      const count = await prisma.pushSubscription.count({
        where: { userId }
      });
      return count > 0;
    } catch (error) {
      console.error('Error checking user subscriptions:', error);
      return false;
    }
  }

  // Delete all read notifications for a user
  async deleteReadNotifications(userId) {
    try {
      const result = await prisma.notificationLog.deleteMany({
        where: {
          userId,
          isRead: true
        }
      });

      console.log(`Deleted ${result.count} read notifications for user ${userId}`);
      return result.count;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }
}

export default new NotificationService();