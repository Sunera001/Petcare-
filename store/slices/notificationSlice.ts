import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../services/firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'reminder' | 'record' | 'general';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string; // appointmentId, recordId, etc.
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Fetch notifications for a user
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (userId: string, { rejectWithValue }) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          read: data.read || false,
          relatedId: data.relatedId || undefined,
          createdAt: data.createdAt,
        });
      });
      
      // Sort by createdAt descending (client-side)
      notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return notifications;
    } catch (error: any) {
      console.error('fetchNotifications error:', error);
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
      });
      return notificationId;
    } catch (error: any) {
      console.error('markNotificationAsRead error:', error);
      return rejectWithValue(error.message || 'Failed to mark notification as read');
    }
  }
);

// Mark all notifications as read
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notifications: NotificationState };
      const unreadNotifications = state.notifications.notifications.filter(n => !n.read);
      
      const updatePromises = unreadNotifications.map((notification) => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
      return unreadNotifications.map(n => n.id);
    } catch (error: any) {
      console.error('markAllNotificationsAsRead error:', error);
      return rejectWithValue(error.message || 'Failed to mark all notifications as read');
    }
  }
);

// Create a notification (for admin/system use)
export const createNotification = createAsyncThunk(
  'notifications/create',
  async ({
    userId,
    type,
    title,
    message,
    relatedId,
  }: {
    userId: string;
    type: 'appointment' | 'reminder' | 'record' | 'general';
    title: string;
    message: string;
    relatedId?: string;
  }, { rejectWithValue }) => {
    try {
      const now = new Date().toISOString();
      const notificationDoc = {
        userId,
        type,
        title,
        message,
        read: false,
        relatedId: relatedId || undefined,
        createdAt: now,
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationDoc);
      
      return {
        id: docRef.id,
        ...notificationDoc,
      } as Notification;
    } catch (error: any) {
      console.error('createNotification error:', error);
      return rejectWithValue(error.message || 'Failed to create notification');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Mark as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        action.payload.forEach((notificationId) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.read = true;
          }
        });
        state.unreadCount = 0;
      });

    // Create notification
    builder
      .addCase(createNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      });
  },
});

export const { clearNotifications, clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
