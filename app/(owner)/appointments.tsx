import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PetImage from '../../components/PetImage';
import { AppDispatch, RootState } from '../../store';
import { fetchOwnerAppointments } from '../../store/slices/appointmentSlice';

export default function AppointmentsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { appointments, loading } = useSelector((state: RootState) => state.appointments);
  const { pets } = useSelector((state: RootState) => state.pets);

  useEffect(() => {
    if (user) {
      dispatch(fetchOwnerAppointments(user.uid));
    }
  }, [user]);

  const onRefresh = () => {
    if (user) {
      dispatch(fetchOwnerAppointments(user.uid));
    }
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

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return { dateStr, timeStr };
  };

  const upcomingAppointments = appointments.filter(
    (app) => app.status !== 'completed' && app.status !== 'cancelled' && new Date(app.dateTime) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (app) => app.status === 'completed' || app.status === 'cancelled' || new Date(app.dateTime) < new Date()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(owner)/book-appointment')}
        >
          <Ionicons name="add" size={24} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0EA5E9']} />
        }
      >
        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Upcoming ({upcomingAppointments.length})
          </Text>

          {upcomingAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <Text style={styles.emptySubtitle}>Book your first appointment</Text>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => router.push('/(owner)/book-appointment')}
              >
                <Ionicons name="add-circle" size={20} color="#0EA5E9" />
                <Text style={styles.bookButtonText}>Book Appointment</Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingAppointments.map((appointment) => {
              const { dateStr, timeStr } = formatDateTime(appointment.dateTime);
              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={styles.appointmentCard}
                  onPress={() =>
                    router.push(`/(owner)/appointment-detail?appointmentId=${appointment.id}`)
                  }
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.petInfo}>
                      {(() => {
                        const pet = pets.find(p => p.id === appointment.petId);
                        return (
                          <PetImage 
                            photoUrl={pet?.photoUrl} 
                            species={pet?.species || 'dog'} 
                            size={50}
                            style={styles.petAvatar}
                          />
                        );
                      })()}
                      <View>
                        <Text style={styles.petName}>{appointment.petName}</Text>
                        <Text style={styles.vetName}>Dr. {appointment.vetName}</Text>
                      </View>
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
                        style={[styles.statusText, { color: getStatusColor(appointment.status) }]}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>{dateStr}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#6B7280" />
                      <Text style={styles.detailText}>
                        {timeStr} ({appointment.duration} min)
                      </Text>
                    </View>
                  </View>

                  {appointment.reason && (
                    <Text style={styles.reason} numberOfLines={2}>
                      {appointment.reason}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past ({pastAppointments.length})</Text>

            {pastAppointments.map((appointment) => {
              const { dateStr, timeStr } = formatDateTime(appointment.dateTime);
              return (
                <TouchableOpacity
                  key={appointment.id}
                  style={[styles.appointmentCard, styles.pastAppointmentCard]}
                  onPress={() =>
                    router.push(`/(owner)/appointment-detail?appointmentId=${appointment.id}`)
                  }
                >
                  <View style={styles.appointmentHeader}>
                    <View style={styles.petInfo}>
                      {(() => {
                        const pet = pets.find(p => p.id === appointment.petId);
                        return (
                          <PetImage 
                            photoUrl={pet?.photoUrl} 
                            species={pet?.species || 'dog'} 
                            size={50}
                            style={[styles.petAvatar, styles.pastPetAvatar]}
                          />
                        );
                      })()}
                      <View>
                        <Text style={styles.petName}>{appointment.petName}</Text>
                        <Text style={styles.vetName}>Dr. {appointment.vetName}</Text>
                      </View>
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
                        style={[styles.statusText, { color: getStatusColor(appointment.status) }]}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.appointmentDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                      <Text style={[styles.detailText, styles.pastText]}>{dateStr}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                      <Text style={[styles.detailText, styles.pastText]}>{timeStr}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(owner)/home')}>
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => {
            if (pets.length > 0) {
              router.push(`/(owner)/pet-profile?petId=${pets[0].id}`);
            } else {
              router.push('/(owner)/register-pet');
            }
          }}
        >
          <Ionicons name="paw-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>My Pets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="calendar" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navLabelActive}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(owner)/profile')}>
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
  addButton: {
    width: 40,
    height: 40,
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pastAppointmentCard: {
    opacity: 0.7,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pastPetAvatar: {
    backgroundColor: '#F3F4F6',
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  vetName: {
    fontSize: 13,
    color: '#6B7280',
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
  appointmentDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  pastText: {
    color: '#9CA3AF',
  },
  reason: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 24,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0EA5E9',
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
