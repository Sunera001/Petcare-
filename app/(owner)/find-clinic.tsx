import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppDispatch, RootState } from '../../store';

interface Clinic {
  id: string;
  name: string;
  specialization?: string;
  email: string;
  phone?: string;
  address?: string;
  clinicName?: string;
  clinicAddress?: string;
}

export default function FindClinicScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { pets } = useSelector((state: RootState) => state.pets);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    // Filter clinics based on search query
    if (searchQuery.trim()) {
      const filtered = clinics.filter(
        (clinic) =>
          clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clinic.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clinic.clinicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clinic.clinicAddress?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClinics(filtered);
    } else {
      setFilteredClinics(clinics);
    }
  }, [searchQuery, clinics]);

  const fetchClinics = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'vet'));
      const querySnapshot = await getDocs(q);

      const clinicData: Clinic[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().fullName || 'Veterinary Clinic',
        specialization: doc.data().specialization,
        email: doc.data().email,
        phone: doc.data().phone,
        address: doc.data().address,
        clinicName: doc.data().clinicName,
        clinicAddress: doc.data().clinicAddress,
      }));

      setClinics(clinicData);
      setFilteredClinics(clinicData);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      Alert.alert('Error', 'Failed to load clinics');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'Phone number not available for this clinic');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleGetDirections = (address?: string) => {
    if (!address) {
      Alert.alert('No Address', 'Address not available for this clinic');
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Clinic</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchClinics}>
          <Ionicons name="refresh" size={24} color="#0EA5E9" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialization, location..."
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

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredClinics.length} {filteredClinics.length === 1 ? 'clinic' : 'clinics'} found
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading clinics...</Text>
          </View>
        ) : filteredClinics.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No clinics found' : 'No clinics available'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new clinics'}
            </Text>
          </View>
        ) : (
          filteredClinics.map((clinic) => (
            <View key={clinic.id} style={styles.clinicCard}>
              {/* Clinic Header */}
              <View style={styles.clinicHeader}>
                <View style={styles.clinicIcon}>
                  <Ionicons name="medical" size={28} color="#0EA5E9" />
                </View>
                <View style={styles.clinicInfo}>
                  <Text style={styles.clinicName}>
                    {clinic.clinicName || `Dr. ${clinic.name}'s Clinic`}
                  </Text>
                  <Text style={styles.doctorName}>Dr. {clinic.name}</Text>
                  {clinic.specialization && (
                    <View style={styles.specializationBadge}>
                      <Text style={styles.specializationText}>{clinic.specialization}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.contactSection}>
                {/* Address */}
                {(clinic.clinicAddress || clinic.address) && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => handleGetDirections(clinic.clinicAddress || clinic.address)}
                  >
                    <Ionicons name="location-outline" size={18} color="#6B7280" />
                    <Text style={styles.contactText} numberOfLines={2}>
                      {clinic.clinicAddress || clinic.address}
                    </Text>
                    <Ionicons name="navigate-outline" size={18} color="#0EA5E9" />
                  </TouchableOpacity>
                )}

                {/* Phone */}
                {clinic.phone && (
                  <TouchableOpacity
                    style={styles.contactRow}
                    onPress={() => handleCall(clinic.phone)}
                  >
                    <Ionicons name="call-outline" size={18} color="#6B7280" />
                    <Text style={styles.contactText}>{clinic.phone}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
                  </TouchableOpacity>
                )}

                {/* Email */}
                <TouchableOpacity
                  style={styles.contactRow}
                  onPress={() => handleEmail(clinic.email)}
                >
                  <Ionicons name="mail-outline" size={18} color="#6B7280" />
                  <Text style={styles.contactText}>{clinic.email}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => router.push('/(owner)/book-appointment')}
                >
                  <Ionicons name="calendar" size={18} color="#FFFFFF" />
                  <Text style={styles.bookButtonText}>Book Appointment</Text>
                </TouchableOpacity>

                {clinic.phone && (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(clinic.phone)}
                  >
                    <Ionicons name="call" size={18} color="#0EA5E9" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
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
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(owner)/appointments')}
        >
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Appointments</Text>
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
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
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
  resultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clinicHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  clinicIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clinicInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  specializationBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0EA5E9',
  },
  contactSection: {
    marginBottom: 16,
    gap: 10,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 10,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#0EA5E9',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
