'use client';

import { useState, useEffect } from 'react';
import { UserHeader } from 'gov-layout';
import { useSocket } from '@/contexts/SocketContext';
import NotificationDetailModal from '@/components/notification/NotificationDetailModal';
import FeedbackModal from '@/components/feedback/FeedbackModal';
import MunicipalRatingModal from '@/components/feedback/MunicipalRatingModal';
import {
  getNotificationTitle,
  getNotificationType,
  getNotificationCategory,
  formatNotificationDate,
  filterNotificationsByRole,
} from '@/utils/govNotificationHelpers';

import { useTypewriter } from '@/hooks/useTypewriter';

interface RoleHeaderUser {
  firstName?: string;
  displayName?: string;
  pictureUrl?: string | null;
}

interface RoleHeaderProps {
  user: RoleHeaderUser | null;
  lastName: string;
  userRole: 'USERS' | 'DRIVE' | 'CAREU' | 'STAFF' | 'CAREGIVER';
  variant?: 'default' | 'large';
  locked?: boolean;
  onToggleSidebar?: () => void;
  enableAutoFeedback?: boolean;
  enableMunicipalRating?: boolean;
}

const INFORMATIONAL_TYPES = [
  'JOB_ACCEPTED',
  'JOB_COMPLETED',
  'JOB_STATUS_UPDATED',
  'VOLUNTEER_ASSIGNED',
  'QUEUE_APPROVED',
  'QUEUE_CONFIRMED',
  'QUEUE_CANCELLED',
  'QUEUE_REJECTED',
  'NEW_QUEUE_REQUEST',
  'EDIT_REQUEST_NEW',
  'EDIT_REQUEST_APPROVED',
  'EDIT_REQUEST_REJECTED',
  'APPOINTMENT_REMINDER',
  'CAREGIVER_REQUEST_SUBMITTED',
  'CAREGIVER_REQUEST_APPROVED',
  'CAREGIVER_REQUEST_REJECTED',
  'REWARD_REDEMPTION_SUBMITTED',
  'REWARD_REDEMPTION_APPROVED',
  'REWARD_REDEMPTION_REJECTED',
  'REWARD_REDEMPTION_COMPLETED',
];

export default function RoleHeader({
  user,
  lastName,
  userRole,
  variant = 'default',
  locked = false,
  onToggleSidebar,
  enableAutoFeedback = false,
  enableMunicipalRating = false,
}: RoleHeaderProps) {
  const { notifications: socketNotifications, markAsRead, markAllAsRead, unreadCount } = useSocket();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showMunicipalModal, setShowMunicipalModal] = useState(false);
  const [municipalJobId, setMunicipalJobId] = useState<number | null>(null);
  const [hasSkippedFeedback, setHasSkippedFeedback] = useState(false);

  useEffect(() => {
    if (!enableAutoFeedback) return;
    const unreadFeedback = socketNotifications.find(
      (n: any) => n.type === 'FEEDBACK_REQUEST' && !n.read
    );
    if (unreadFeedback && !showFeedbackModal && !showMunicipalModal && !hasSkippedFeedback) {
      setSelectedNotification({
        id: unreadFeedback.id,
        type: 'feedback_request',
        originalType: unreadFeedback.type,
        title: unreadFeedback.title,
        message: unreadFeedback.message,
        data: {
          id: unreadFeedback.data?.queueId || unreadFeedback.data?.id,
          jobId: unreadFeedback.data?.jobId,
          ...unreadFeedback.data,
        },
      });
      setShowFeedbackModal(true);
    }
  }, [enableAutoFeedback, socketNotifications, showFeedbackModal, showMunicipalModal, hasSkippedFeedback]);

  const roleNotifications = filterNotificationsByRole(socketNotifications, userRole);
  const baseGovNotifications = roleNotifications.map((n: any) => ({
    id: n.id,
    title: n.title || getNotificationTitle(n.type),
    description: n.message || '',
    date: formatNotificationDate(n.createdAt),
    type: getNotificationType(n.type),
    isRead: n.read,
    category: getNotificationCategory(n.type, n.read, userRole, n.data),
  }));

  const unreadCountForRole = (userRole === 'DRIVE' || userRole === 'CAREU')
    ? roleNotifications.filter((n: any) => !n.read).length
    : unreadCount;

  const loadedUnread = baseGovNotifications.filter((n: any) => !n.isRead).length;
  const missingUnread = Math.max(0, unreadCountForRole - loadedUnread);
  const govNotifications = missingUnread > 0
    ? [
        ...baseGovNotifications,
        ...Array.from({ length: missingUnread }, (_, i) => ({
          id: `_phantom_${i}`,
          title: '',
          description: '',
          date: '',
          type: 'info' as const,
          isRead: false,
          category: 'general' as const,
        })),
      ]
    : baseGovNotifications;

  const handleNotificationClick = async (govNotif: any) => {
    if (typeof govNotif.id === 'string' && govNotif.id.startsWith('_phantom_')) return;

    const original = roleNotifications.find((n: any) => n.id === govNotif.id);
    if (!original) return;

    const notifForModal = {
      id: original.id,
      type: original.type?.toLowerCase() || 'info',
      originalType: original.type,
      title: original.title,
      message: original.message,
      timestamp: formatNotificationDate(original.createdAt),
      isRead: original.read,
      data: {
        id: original.data?.queueId || original.data?.id,
        jobId: original.data?.jobId,
        ...original.data,
      },
    };

    if (original.type === 'FEEDBACK_REQUEST') {
      setSelectedNotification(notifForModal);
      setShowFeedbackModal(true);
      return;
    }

    if (!original.read) {
      try {
        await markAsRead(original.id);
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    if (INFORMATIONAL_TYPES.includes(original.type)) {
      return;
    }

    setSelectedNotification(notifForModal);
    setIsModalOpen(true);
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
    setSelectedNotification(null);
  };

  const handleSubmitFeedback = async () => {
    if (selectedNotification) {
      try {
        await markAsRead(selectedNotification.id);
      } catch (error) {
        console.error('Error marking feedback notification as read:', error);
      }
    }
    const jobId = selectedNotification?.data?.jobId;
    setShowFeedbackModal(false);
    setSelectedNotification(null);
    if (enableMunicipalRating && jobId) {
      setMunicipalJobId(jobId);
      setShowMunicipalModal(true);
    }
  };

  const handleSkipFeedback = () => {
    setHasSkippedFeedback(true);
  };

  const rawName = user?.firstName || user?.displayName || '';
  const targetFullName = rawName ? `${rawName} ${lastName}`.trim() : (lastName || '');
  const { displayedText } = useTypewriter(targetFullName, 45, 120);

  return (
    <>
      <UserHeader
        user={{
          firstName: displayedText || rawName,
          lastName: '',
          pictureUrl: user?.pictureUrl ?? undefined,
        }}
        notifications={locked ? [] : govNotifications}
        onToggleSidebar={locked ? undefined : onToggleSidebar}
        onMarkAllRead={() => {
          markAllAsRead();
        }}
        onNotificationClick={locked ? undefined : handleNotificationClick}
      />

      <NotificationDetailModal
        isOpen={isModalOpen}
        notification={selectedNotification}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedNotification(null);
        }}
        userRole={userRole}
        onActionSuccess={async () => {
          if (selectedNotification) {
            try {
              await markAsRead(selectedNotification.id);
            } catch (error) {
              console.error('Error marking as read from modal:', error);
            }
          }
        }}
      />

      {showFeedbackModal && selectedNotification && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={handleCloseFeedback}
          onSubmit={handleSubmitFeedback}
          onSkip={handleSkipFeedback}
          volunteer={selectedNotification.data?.volunteer || {}}
          careu={selectedNotification.data?.careu}
          jobId={selectedNotification.data?.jobId}
        />
      )}

      {enableMunicipalRating && showMunicipalModal && municipalJobId && (
        <MunicipalRatingModal
          isOpen={showMunicipalModal}
          onClose={() => {
            setShowMunicipalModal(false);
            setMunicipalJobId(null);
          }}
          onSubmit={() => {
            setShowMunicipalModal(false);
            setMunicipalJobId(null);
          }}
          onSkip={() => {
            setShowMunicipalModal(false);
            setMunicipalJobId(null);
          }}
          jobId={municipalJobId}
        />
      )}
    </>
  );
}
