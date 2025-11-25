import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PetImage from '../../components/PetImage';
import { logout } from '../../store/slices/authSlice';
import { fetchPets } from '../../store/slices/petSlice';
import { fetchOwnerAppointments } from '../../store/slices/appointmentSlice';
import { fetchNotifications } from '../../store/slices/notificationSlice';
import { AppDispatch, RootState } from '../../store';
import NotificationModal from '../../components/NotificationModal';

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets, loading } = useSelector((state: RootState) => state.pets);
  const { appointments } = useSelector((state: RootState) => state.appointments);
  const { unreadCount } = useSelector((state: RootState) => state.notifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchPets(user.uid));
      dispatch(fetchOwnerAppointments(user.uid));
      dispatch(fetchNotifications(user.uid));
    }
  }, [user, dispatch]);

  // Filter pets based on search
  const filteredPets = pets.filter((pet) =>
    searchQuery.trim() === '' ||
    pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter upcoming appointments
  const upcomingAppointments = appointments.filter(
    (app) =>
      (app.status === 'pending' || app.status === 'confirmed') &&
      new Date(app.dateTime) >= new Date()
  );

  // Filter appointments based on search
  const filteredAppointments = upcomingAppointments.filter((app) =>
    searchQuery.trim() === '' ||
    app.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.vetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Text style={styles.userNameText}>{user?.fullName || 'Pet Owner'}</Text>
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
          placeholder="Search pets, appointments..."
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
        {/* My Pets Overview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Pets</Text>
            <Text style={styles.petCount}>{filteredPets.length} {filteredPets.length === 1 ? 'Pet' : 'Pets'}</Text>
          </View>
          
          {pets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="paw-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No pets registered</Text>
              <Text style={styles.emptySubtitle}>Add your first pet to get started</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/(owner)/register-pet')}
              >
                <Ionicons name="add-circle" size={20} color="#0EA5E9" />
                <Text style={styles.addButtonText}>Add Pet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {filteredPets.map((pet) => (
                <TouchableOpacity 
                  key={pet.id} 
                  style={styles.petCard}
                  onPress={() => router.push(`/(owner)/pet-profile?petId=${pet.id}`)}
                >
                  <PetImage 
                    photoUrl={pet.photoUrl} 
                    species={pet.species} 
                    size={60}
                    style={styles.petAvatar}
                  />
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petDetails}>
                      {pet.breed} • {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.addAnotherButton}
                onPress={() => router.push('/(owner)/register-pet')}
              >
                <Ionicons name="add-circle-outline" size={20} color="#0EA5E9" />
                <Text style={styles.addAnotherText}>Add Another Pet</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(owner)/book-appointment')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="calendar" size={28} color="#0EA5E9" />
              </View>
              <Text style={styles.serviceLabel}>Book Appointment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(owner)/appointments')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#BAE6FD' }]}>
                <Ionicons name="document-text" size={28} color="#0EA5E9" />
              </View>
              <Text style={styles.serviceLabel}>Appointments</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(owner)/vaccinations')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="medical" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.serviceLabel}>Vaccination</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => router.push('/(owner)/find-clinic')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="location" size={28} color="#EC4899" />
              </View>
              <Text style={styles.serviceLabel}>Find Clinic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {filteredAppointments.length > 0 && (
              <Text style={styles.petCount}>{filteredAppointments.length}</Text>
            )}
          </View>
          
          {filteredAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No upcoming appointments</Text>
              <Text style={styles.emptySubtitle}>Book an appointment for your pet</Text>
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
                  onPress={() =>
                    router.push(`/(owner)/appointment-detail?appointmentId=${appointment.id}`)
                  }
                >
                  <View style={styles.appointmentLeft}>
                    <View style={styles.appointmentDate}>
                      <Text style={styles.appointmentMonth}>{dateStr.split(' ')[0]}</Text>
                      <Text style={styles.appointmentDay}>{dateStr.split(' ')[1]}</Text>
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.appointmentPet}>{appointment.petName}</Text>
                      <Text style={styles.appointmentVet}>Dr. {appointment.vetName}</Text>
                      <Text style={styles.appointmentTime}>{timeStr}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.appointmentStatus,
                      {
                        backgroundColor:
                          appointment.status === 'confirmed' ? '#BAE6FD' : '#FEF3C7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.appointmentStatusText,
                        {
                          color: appointment.status === 'confirmed' ? '#0EA5E9' : '#F59E0B',
                        },
                      ]}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {filteredAppointments.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/(owner)/appointments')}
            >
              <Text style={styles.viewAllText}>View All Appointments</Text>
              <Ionicons name="chevron-forward" size={16} color="#0EA5E9" />
            </TouchableOpacity>
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
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(owner)/appointments')}
        >
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(owner)/profile')}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  petCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
  addAnotherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  serviceCard: {
    alignItems: 'center',
    width: '22%',
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
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  appointmentCardSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appointmentLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  appointmentDate: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    paddingVertical: 8,
  },
  appointmentMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0EA5E9',
    textTransform: 'uppercase',
  },
  appointmentDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  appointmentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  appointmentPet: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentVet: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  appointmentTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  appointmentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
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
