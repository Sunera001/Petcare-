import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../../store/slices/authSlice';
import { fetchVetAppointments } from '../../store/slices/appointmentSlice';
import { fetchVetRecords } from '../../store/slices/recordSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { AppDispatch, RootState } from '../../store';
import NotificationModal from '../../components/NotificationModal';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function VetDashboardScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { appointments } = useSelector((state: RootState) => state.appointments);
  const { records } = useSelector((state: RootState) => state.records);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchVetAppointments(user.uid));
      dispatch(fetchVetRecords(user.uid));
      dispatch(fetchNotifications(user.uid));
    }
  }, [user, dispatch]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter((app) => {
    const appDate = new Date(app.dateTime);
    return appDate >= today && appDate < tomorrow && app.status !== 'cancelled';
  });

  // Get upcoming appointments (not cancelled)
  const upcomingAppointments = appointments.filter((app) => {
    const appDate = new Date(app.dateTime);
    return appDate >= today && app.status !== 'cancelled';
  });

  // Filter appointments based on search
  const filteredAppointments = upcomingAppointments.filter((app) =>
    searchQuery.trim() === '' ||
    app.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate unique patients from medical records
  const uniquePetIds = new Set(records.map((record) => record.petId));
  const totalPatients = uniquePetIds.size;

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    await dispatch(logout());
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#0EA5E9" />
          </View>
          <View>
            <Text style={styles.greetingText}>Welcome back</Text>
            <Text style={styles.userNameText}>Dr. {user?.fullName || 'Doctor'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients, appointments..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="calendar" size={20} color="#0EA5E9" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{upcomingAppointments.length}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="people" size={20} color="#0EA5E9" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statValue}>{totalPatients}</Text>
                <Text style={styles.statLabel}>Total Patients</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(vet)/patient-records')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="folder-open" size={28} color="#0EA5E9" />
              </View>
              <Text style={styles.serviceLabel}>Patient Records</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(vet)/select-patient')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="document-text" size={28} color="#0EA5E9" />
              </View>
              <Text style={styles.serviceLabel}>New Record</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(vet)/schedule')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="calendar" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.serviceLabel}>Appointments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.serviceCard, styles.disabledCard]}
              disabled
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="stats-chart" size={28} color="#9CA3AF" />
              </View>
              <Text style={[styles.serviceLabel, { color: '#9CA3AF' }]}>Reports</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {filteredAppointments.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(vet)/schedule')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <Text style={styles.emptySubtitle}>Your schedule is clear</Text>
            </View>
          ) : (
            filteredAppointments.slice(0, 3).map((appointment) => {
              const appointmentDate = new Date(appointment.dateTime);
              const dateStr = appointmentDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = appointmentDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCardSmall}
                  onPress={() => router.push(`/(vet)/appointment-detail?appointmentId=${appointment.id}`)}
                >
                  <View style={styles.appointmentLeft}>
                    <View style={styles.appointmentDateBox}>
                      <Text style={styles.appointmentMonth}>{dateStr.split(' ')[0]}</Text>
                      <Text style={styles.appointmentDay}>{dateStr.split(' ')[1]}</Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.appointmentPet}>{appointment.petName}</Text>
                      <Text style={styles.appointmentOwner}>Owner: {appointment.ownerName}</Text>
                      <Text style={styles.appointmentTimeText}>{timeStr}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.appointmentStatus,
                      {
                        backgroundColor:
                          appointment.status === 'confirmed'
                            ? '#BAE6FD'
                            : appointment.status === 'pending'
                            ? '#FEF3C7'
                            : '#F3F4F6',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appointmentStatusText,
                        {
                          color:
                            appointment.status === 'confirmed'
                              ? '#0EA5E9'
                              : appointment.status === 'pending'
                              ? '#F59E0B'
                              : '#6B7280',
                        },
                      ]}
                    >
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <NotificationModal 
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="home" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navLabelActive}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(vet)/schedule')}
        >
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(vet)/patient-records')}
        >
          <Ionicons name="folder-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(vet)/profile')}
        >
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  appointmentCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#eeeeeeff',
    borderRadius: 12,
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceCard: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  disabledCard: {
    opacity: 0.5,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  appointmentInfo: {
    flex: 1,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  petIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  ownerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusTextSmall: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navIconActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  appointmentCardSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appointmentDateBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  appointmentMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
    textTransform: 'uppercase',
  },
  appointmentDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentPet: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentOwner: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  appointmentTimeText: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  appointmentStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});