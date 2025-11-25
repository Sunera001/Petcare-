import React, { useEffect, useState } from 'react';
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
import { AppDispatch, RootState } from '../../store';
import { fetchPets } from '../../store/slices/petSlice';
import { fetchPetRecords } from '../../store/slices/recordSlice';

interface VaccinationWithPet {
  id: string;
  name: string;
  date: string;
  nextDueDate?: string;
  batchNumber?: string;
  petId: string;
  petName: string;
  recordId: string;
}

export default function VaccinationsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets } = useSelector((state: RootState) => state.pets);
  const { records, loading } = useSelector((state: RootState) => state.records);

  const [allVaccinations, setAllVaccinations] = useState<VaccinationWithPet[]>([]);

  useEffect(() => {
    if (user) {
      dispatch(fetchPets(user.uid));
    }
  }, [user]);

  useEffect(() => {
    // Fetch records for all pets
    pets.forEach((pet) => {
      dispatch(fetchPetRecords(pet.id));
    });
  }, [pets]);

  useEffect(() => {
    // Compile all vaccinations from all records
    const vaccinations: VaccinationWithPet[] = [];
    
    records.forEach((record) => {
      if (record.vaccinations && record.vaccinations.length > 0) {
        record.vaccinations.forEach((vac, index) => {
          vaccinations.push({
            id: `${record.id}-${index}`,
            name: vac.name,
            date: vac.date,
            nextDueDate: vac.nextDueDate,
            batchNumber: vac.batchNumber,
            petId: record.petId,
            petName: record.petName,
            recordId: record.id,
          });
        });
      }
    });

    // Sort by date (most recent first)
    vaccinations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setAllVaccinations(vaccinations);
  }, [records]);

  const onRefresh = () => {
    if (user) {
      dispatch(fetchPets(user.uid));
    }
    pets.forEach((pet) => {
      dispatch(fetchPetRecords(pet.id));
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = (nextDueDateString?: string) => {
    if (!nextDueDateString) return false;
    const nextDue = new Date(nextDueDateString);
    return nextDue < new Date();
  };

  const isDueSoon = (nextDueDateString?: string) => {
    if (!nextDueDateString) return false;
    const nextDue = new Date(nextDueDateString);
    const today = new Date();
    const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 0 && daysUntilDue <= 30;
  };

  const upcomingVaccinations = allVaccinations.filter(
    (vac) => vac.nextDueDate && !isOverdue(vac.nextDueDate)
  );

  const overdueVaccinations = allVaccinations.filter(
    (vac) => vac.nextDueDate && isOverdue(vac.nextDueDate)
  );

  const completedVaccinations = allVaccinations.filter(
    (vac) => !vac.nextDueDate || new Date(vac.date) < new Date()
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccinations</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="alert-circle" size={24} color="#F59E0B" />
          <Text style={styles.summaryNumber}>{overdueVaccinations.length}</Text>
          <Text style={styles.summaryLabel}>Overdue</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#BAE6FD' }]}>
          <Ionicons name="time" size={24} color="#0EA5E9" />
          <Text style={styles.summaryNumber}>{upcomingVaccinations.length}</Text>
          <Text style={styles.summaryLabel}>Upcoming</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: '#BAE6FD' }]}>
          <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
          <Text style={styles.summaryNumber}>{completedVaccinations.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0EA5E9']} />
        }
      >
        {allVaccinations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="shield-checkmark-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No vaccination records</Text>
            <Text style={styles.emptySubtitle}>
              Vaccination records will appear here after vet visits
            </Text>
          </View>
        ) : (
          <>
            {/* Overdue Vaccinations */}
            {overdueVaccinations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                    Overdue ({overdueVaccinations.length})
                  </Text>
                </View>

                {overdueVaccinations.map((vac) => (
                  <TouchableOpacity
                    key={vac.id}
                    style={[styles.vaccinationCard, styles.overdueCard]}
                    onPress={() =>
                      router.push(`/(owner)/medical-record-detail?recordId=${vac.recordId}`)
                    }
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.petBadge}>
                        <Ionicons name="paw" size={14} color="#0EA5E9" />
                        <Text style={styles.petBadgeText}>{vac.petName}</Text>
                      </View>
                      <View style={styles.overdueTag}>
                        <Text style={styles.overdueText}>OVERDUE</Text>
                      </View>
                    </View>

                    <Text style={styles.vaccinationName}>{vac.name}</Text>

                    <View style={styles.dateRow}>
                      <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Last Given</Text>
                        <Text style={styles.dateValue}>{formatDate(vac.date)}</Text>
                      </View>
                      {vac.nextDueDate && (
                        <View style={styles.dateItem}>
                          <Text style={styles.dateLabel}>Due Date</Text>
                          <Text style={[styles.dateValue, { color: '#EF4444' }]}>
                            {formatDate(vac.nextDueDate)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {vac.batchNumber && (
                      <Text style={styles.batchText}>Batch: {vac.batchNumber}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Upcoming Vaccinations */}
            {upcomingVaccinations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color="#0EA5E9" />
                  <Text style={[styles.sectionTitle, { color: '#0EA5E9' }]}>
                    Upcoming ({upcomingVaccinations.length})
                  </Text>
                </View>

                {upcomingVaccinations.map((vac) => (
                  <TouchableOpacity
                    key={vac.id}
                    style={[
                      styles.vaccinationCard,
                      isDueSoon(vac.nextDueDate) && styles.dueSoonCard,
                    ]}
                    onPress={() =>
                      router.push(`/(owner)/medical-record-detail?recordId=${vac.recordId}`)
                    }
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.petBadge}>
                        <Ionicons name="paw" size={14} color="#0EA5E9" />
                        <Text style={styles.petBadgeText}>{vac.petName}</Text>
                      </View>
                      {isDueSoon(vac.nextDueDate) && (
                        <View style={styles.dueSoonTag}>
                          <Text style={styles.dueSoonText}>DUE SOON</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.vaccinationName}>{vac.name}</Text>

                    <View style={styles.dateRow}>
                      <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Last Given</Text>
                        <Text style={styles.dateValue}>{formatDate(vac.date)}</Text>
                      </View>
                      {vac.nextDueDate && (
                        <View style={styles.dateItem}>
                          <Text style={styles.dateLabel}>Next Due</Text>
                          <Text style={[styles.dateValue, { color: '#0EA5E9' }]}>
                            {formatDate(vac.nextDueDate)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {vac.batchNumber && (
                      <Text style={styles.batchText}>Batch: {vac.batchNumber}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Completed Vaccinations */}
            {completedVaccinations.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
                  <Text style={styles.sectionTitle}>
                    All Records ({completedVaccinations.length})
                  </Text>
                </View>

                {completedVaccinations.map((vac) => (
                  <TouchableOpacity
                    key={vac.id}
                    style={styles.vaccinationCard}
                    onPress={() =>
                      router.push(`/(owner)/medical-record-detail?recordId=${vac.recordId}`)
                    }
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.petBadge}>
                        <Ionicons name="paw" size={14} color="#0EA5E9" />
                        <Text style={styles.petBadgeText}>{vac.petName}</Text>
                      </View>
                    </View>

                    <Text style={styles.vaccinationName}>{vac.name}</Text>

                    <View style={styles.dateRow}>
                      <View style={styles.dateItem}>
                        <Text style={styles.dateLabel}>Given On</Text>
                        <Text style={styles.dateValue}>{formatDate(vac.date)}</Text>
                      </View>
                    </View>

                    {vac.batchNumber && (
                      <Text style={styles.batchText}>Batch: {vac.batchNumber}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  vaccinationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overdueCard: {
    borderColor: '#FEF2F2',
    backgroundColor: '#FEF2F2',
  },
  dueSoonCard: {
    borderColor: '#E0F2FE',
    backgroundColor: '#E0F2FE',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  petBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  overdueTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  dueSoonTag: {
    backgroundColor: '#BAE6FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dueSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0EA5E9',
    letterSpacing: 0.5,
  },
  vaccinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  batchText: {
    fontSize: 12,
    color: '#9CA3AF',
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
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
  },
});
