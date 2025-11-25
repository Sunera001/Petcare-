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
import { fetchVetRecords } from '../../store/slices/recordSlice';
import { fetchPets } from '../../store/slices/petSlice';
import PetImage from '../../components/PetImage';
import { Pet } from '../../types';

export default function PatientRecordsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { records, loading } = useSelector((state: RootState) => state.records);

  const [searchQuery, setSearchQuery] = useState('');
  const [petData, setPetData] = useState<{ [petId: string]: Pet }>({});

  // Fetch individual pets from Firestore
  useEffect(() => {
    const fetchPetsData = async () => {
      // Filter out empty or invalid pet IDs
      const uniquePetIds = [...new Set(records.map(r => r.petId))].filter(id => id && id.trim() !== '');
      console.log('Fetching pet data for IDs:', uniquePetIds);
      const petsMap: { [petId: string]: Pet } = {};

      for (const petId of uniquePetIds) {
        try {
          const { getDoc, doc } = await import('firebase/firestore');
          const { db } = await import('../../services/firebase');
          
          const petDoc = await getDoc(doc(db, 'pets', petId));
          if (petDoc.exists()) {
            const pet = { id: petDoc.id, ...petDoc.data() } as Pet;
            petsMap[petId] = pet;
            console.log('Fetched pet:', pet.name, 'Photo:', pet.photoUrl ? 'Yes' : 'No');
          }
        } catch (error) {
          console.error('Error fetching pet:', petId, error);
        }
      }

      setPetData(petsMap);
      console.log('Total pets fetched:', Object.keys(petsMap).length);
    };

    if (records.length > 0) {
      fetchPetsData();
    }
  }, [records]);

  useEffect(() => {
    if (user) {
      dispatch(fetchVetRecords(user.uid));
    }
  }, [user]);

  // Helper function to get pet info by petId
  const getPetInfo = (petId: string) => {
    return petData[petId];
  };

  const onRefresh = () => {
    if (user) {
      dispatch(fetchVetRecords(user.uid));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filter records by search query
  const filteredRecords = searchQuery
    ? records.filter(
        (record) =>
          record.petName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.treatment.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : records;

  // Group records by pet
  const recordsByPet: { [petId: string]: typeof records } = {};
  filteredRecords.forEach((record) => {
    if (!recordsByPet[record.petId]) {
      recordsByPet[record.petId] = [];
    }
    recordsByPet[record.petId].push(record);
  });

  const patients = Object.keys(recordsByPet);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by pet name, diagnosis..."
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

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="paw" size={24} color="#0EA5E9" />
          <Text style={styles.summaryNumber}>{patients.length}</Text>
          <Text style={styles.summaryLabel}>Patients</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="document-text" size={24} color="#0EA5E9" />
          <Text style={styles.summaryNumber}>{filteredRecords.length}</Text>
          <Text style={styles.summaryLabel}>Records</Text>
        </View>

        <View style={styles.summaryCard}>
          <Ionicons name="shield-checkmark" size={24} color="#F59E0B" />
          <Text style={styles.summaryNumber}>
            {filteredRecords.reduce(
              (sum, r) => sum + (r.vaccinations?.length || 0),
              0
            )}
          </Text>
          <Text style={styles.summaryLabel}>Vaccines</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0EA5E9']} />
        }
      >
        {patients.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No records found' : 'No patient records yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term'
                : 'Medical records will appear here'}
            </Text>
          </View>
        ) : (
          patients.map((petId) => {
            const petRecords = recordsByPet[petId];
            const latestRecord = petRecords[0];
            const petInfo = getPetInfo(petId);

            return (
              <View key={petId} style={styles.patientCard}>
                <View style={styles.patientHeader}>
                  <PetImage 
                    photoUrl={petInfo?.photoUrl} 
                    species={petInfo?.species || 'dog'} 
                    size={48}
                  />
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{latestRecord.petName}</Text>
                    <Text style={styles.recordCount}>
                      {petRecords.length} record{petRecords.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={styles.vaccineBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#F59E0B" />
                    <Text style={styles.vaccineCount}>
                      {petRecords.reduce((sum, r) => sum + (r.vaccinations?.length || 0), 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.recordsList}>
                  {petRecords.map((record) => (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.recordItem}
                      onPress={() =>
                        router.push(`/(vet)/record-detail?recordId=${record.id}`)
                      }
                    >
                      <View style={styles.recordDate}>
                        <Ionicons name="calendar-outline" size={14} color="#0EA5E9" />
                        <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                      </View>

                      <Text style={styles.diagnosisText} numberOfLines={1}>
                        {record.diagnosis}
                      </Text>

                      <View style={styles.recordTags}>
                        {record.prescription && (
                          <View style={styles.prescriptionTag}>
                            <Ionicons name="medical-outline" size={12} color="#0EA5E9" />
                            <Text style={styles.tagText}>Rx</Text>
                          </View>
                        )}
                        {record.vaccinations && record.vaccinations.length > 0 && (
                          <View style={styles.vaccineTag}>
                            <Ionicons name="shield-checkmark" size={12} color="#F59E0B" />
                            <Text style={styles.tagText}>{record.vaccinations.length}</Text>
                          </View>
                        )}
                      </View>

                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9CA3AF"
                        style={styles.chevron}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(vet)/schedule')}
        >
          <Ionicons name="calendar-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Schedule</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="folder" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navLabelActive}>Records</Text>
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
    gap: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  recordCount: {
    fontSize: 13,
    color: '#6B7280',
  },
  vaccineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  vaccineCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  recordsList: {
    gap: 8,
  },
  recordItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    position: 'relative',
  },
  recordDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  diagnosisText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  recordTags: {
    flexDirection: 'row',
    gap: 6,
  },
  prescriptionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vaccineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  chevron: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -8,
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
