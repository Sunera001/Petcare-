import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchVetAppointments } from '../../store/slices/appointmentSlice';

export default function VetScheduleScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { appointments, loading } = useSelector((state: RootState) => state.appointments);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      dispatch(fetchVetAppointments(user.uid));
    }
  }, [user]);

  const onRefresh = () => {
    if (user) {
      dispatch(fetchVetAppointments(user.uid));
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#0EA5E9';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  // Filter appointments
  let filteredAppointments = appointments;

  if (selectedFilter !== 'all') {
    filteredAppointments = filteredAppointments.filter(
      (app) => app.status === selectedFilter
    );
  }

  if (searchQuery) {
    filteredAppointments = filteredAppointments.filter(
      (app) =>
        app.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const upcomingAppointments = filteredAppointments.filter(
    (app) =>
      (app.status === 'pending' || app.status === 'confirmed') &&
      new Date(app.dateTime) >= new Date()
  );

  const pastAppointments = filteredAppointments.filter(
    (app) =>
      app.status === 'completed' ||
      app.status === 'cancelled' ||
      new Date(app.dateTime) < new Date()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients, pets..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'all' && styles.filterTextActive,
            ]}
          >
            All ({appointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'pending' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('pending')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'pending' && styles.filterTextActive,
            ]}
          >
            Pending ({appointments.filter((a) => a.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'confirmed' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('confirmed')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'confirmed' && styles.filterTextActive,
            ]}
          >
            Confirmed ({appointments.filter((a) => a.status === 'confirmed').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, selectedFilter === 'completed' && styles.filterTabActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              selectedFilter === 'completed' && styles.filterTextActive,
            ]}
          >
            Completed ({appointments.filter((a) => a.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0EA5E9']} />
        }
      >
        {/* Upcoming Appointments */}
        {upcomingAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming ({upcomingAppointments.length})</Text>

            {upcomingAppointments.map((appointment) => {
              const { dateStr, timeStr } = formatDateTime(appointment.dateTime);
              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() =>
                    router.push(`/(vet)/appointment-detail?appointmentId=${appointment.id}`)
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={16} color="#0EA5E9" />
                      <Text style={styles.timeText}>{timeStr}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(appointment.status)}20` },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(appointment.status) as any}
                        size={14}
                        color={getStatusColor(appointment.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(appointment.status) },
                        ]}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.petRow}>
                      <View style={styles.petIcon}>
                        <Ionicons name="paw" size={20} color="#0EA5E9" />
                      </View>
                      <View style={styles.petInfo}>
                        <Text style={styles.petName}>{appointment.petName}</Text>
                        <Text style={styles.ownerName}>Owner: {appointment.ownerName}</Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{dateStr}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="hourglass-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{appointment.duration} min</Text>
                      </View>
                    </View>

                    {appointment.reason && (
                      <Text style={styles.reasonText} numberOfLines={2}>
                        {appointment.reason}
                      </Text>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past ({pastAppointments.length})</Text>

            {pastAppointments.map((appointment) => {
              const { dateStr, timeStr } = formatDateTime(appointment.dateTime);
              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, styles.pastCard]}
                  onPress={() =>
                    router.push(`/(vet)/appointment-detail?appointmentId=${appointment.id}`)
                  }
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.timeContainer}>
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text style={[styles.timeText, { color: '#9CA3AF' }]}>{timeStr}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(appointment.status)}20` },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(appointment.status) as any}
                        size={14}
                        color={getStatusColor(appointment.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(appointment.status) },
                        ]}
                      >
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.petRow}>
                      <View style={[styles.petIcon, { backgroundColor: '#F3F4F6' }]}>
                        <Ionicons name="paw" size={20} color="#9CA3AF" />
                      </View>
                      <View style={styles.petInfo}>
                        <Text style={styles.petName}>{appointment.petName}</Text>
                        <Text style={styles.ownerName}>Owner: {appointment.ownerName}</Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={14} color="#9CA3AF" />
                        <Text style={[styles.detailText, { color: '#9CA3AF' }]}>
                          {dateStr}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {filteredAppointments.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No appointments found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term'
                : 'You have no appointments scheduled'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(vet)/dashboard')}
        >
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="calendar" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navLabelActive}>Schedule</Text>
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  filterContainer: {
    marginTop: 16,
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pastCard: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    gap: 10,
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ownerName: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
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
});
