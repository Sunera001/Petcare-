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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { fetchPetRecords } from '../../store/slices/recordSlice';

export default function PetMedicalRecordsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { petId, petName } = useLocalSearchParams<{ petId: string; petName: string }>();

  const { records, loading } = useSelector((state: RootState) => state.records);

  useEffect(() => {
    if (petId) {
      dispatch(fetchPetRecords(petId));
    }
  }, [petId]);

  const onRefresh = () => {
    if (petId) {
      dispatch(fetchPetRecords(petId));
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medical Records</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Pet Info Banner */}
      <View style={styles.petBanner}>
        <View style={styles.petIcon}>
          <Ionicons name="paw" size={24} color="#0EA5E9" />
        </View>
        <View>
          <Text style={styles.petNameText}>{petName}</Text>
          <Text style={styles.recordCountText}>{records.length} medical records</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} colors={['#0EA5E9']} />
        }
      >
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No medical records</Text>
            <Text style={styles.emptySubtitle}>
              Medical records will appear here after vet visits
            </Text>
          </View>
        ) : (
          records.map((record) => (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              onPress={() =>
                router.push(`/(owner)/medical-record-detail?recordId=${record.id}`)
              }
            >
              <View style={styles.recordHeader}>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#0EA5E9" />
                  <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                </View>
                <View style={styles.vetBadge}>
                  <Ionicons name="medical" size={14} color="#6B7280" />
                  <Text style={styles.vetText}>Dr. {record.vetName}</Text>
                </View>
              </View>

              <View style={styles.recordBody}>
                <View style={styles.diagnosisRow}>
                  <Text style={styles.diagnosisLabel}>Diagnosis:</Text>
                  <Text style={styles.diagnosisText} numberOfLines={2}>
                    {record.diagnosis}
                  </Text>
                </View>

                <View style={styles.treatmentRow}>
                  <Text style={styles.treatmentLabel}>Treatment:</Text>
                  <Text style={styles.treatmentText} numberOfLines={2}>
                    {record.treatment}
                  </Text>
                </View>

                {record.prescription && (
                  <View style={styles.prescriptionTag}>
                    <Ionicons name="medical-outline" size={14} color="#0EA5E9" />
                    <Text style={styles.prescriptionText}>Prescription included</Text>
                  </View>
                )}

                {record.vaccinations && record.vaccinations.length > 0 && (
                  <View style={styles.vaccinationTag}>
                    <Ionicons name="shield-checkmark" size={14} color="#0EA5E9" />
                    <Text style={styles.vaccinationText}>
                      {record.vaccinations.length} vaccination(s)
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.recordFooter}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  petBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E0F2FE',
    padding: 16,
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  recordCountText: {
    fontSize: 13,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  vetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vetText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  recordBody: {
    gap: 10,
  },
  diagnosisRow: {
    gap: 4,
  },
  diagnosisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  diagnosisText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  treatmentRow: {
    gap: 4,
  },
  treatmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  treatmentText: {
    fontSize: 14,
    color: '#374151',
  },
  prescriptionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  prescriptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0EA5E9',
  },
  vaccinationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  vaccinationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0EA5E9',
  },
  recordFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
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
});
