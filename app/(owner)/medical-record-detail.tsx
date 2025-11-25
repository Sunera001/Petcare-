import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';

export default function MedicalRecordDetailScreen() {
  const router = useRouter();
  const { recordId } = useLocalSearchParams<{ recordId: string }>();

  const { records } = useSelector((state: RootState) => state.records);
  const record = records.find((r) => r.id === recordId);

  if (!record) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Medical Record</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Record not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
        <Text style={styles.headerTitle}>Medical Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date & Vet Info */}
        <View style={styles.section}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={20} color="#0EA5E9" />
            <Text style={styles.dateText}>{formatDate(record.date)}</Text>
          </View>
          <View style={styles.vetRow}>
            <View style={styles.vetAvatar}>
              <Ionicons name="medical" size={24} color="#0EA5E9" />
            </View>
            <View>
              <Text style={styles.vetLabel}>Veterinarian</Text>
              <Text style={styles.vetName}>Dr. {record.vetName}</Text>
            </View>
          </View>
        </View>

        {/* Pet Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.petRow}>
            <View style={styles.petAvatar}>
              <Ionicons name="paw" size={20} color="#0EA5E9" />
            </View>
            <Text style={styles.petName}>{record.petName}</Text>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <Text style={styles.contentText}>{record.diagnosis}</Text>
        </View>

        {/* Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment</Text>
          <Text style={styles.contentText}>{record.treatment}</Text>
        </View>

        {/* Prescription */}
        {record.prescription && (
          <View style={styles.section}>
            <View style={styles.prescriptionHeader}>
              <Ionicons name="medical-outline" size={20} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>Prescription</Text>
            </View>
            <Text style={styles.contentText}>{record.prescription}</Text>
          </View>
        )}

        {/* Vaccinations */}
        {record.vaccinations && record.vaccinations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.vaccinationHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#0EA5E9" />
              <Text style={styles.sectionTitle}>Vaccinations</Text>
            </View>
            {record.vaccinations.map((vac, index) => (
              <View key={index} style={styles.vaccinationCard}>
                <View style={styles.vaccinationInfo}>
                  <Text style={styles.vaccinationName}>{vac.name}</Text>
                  <Text style={styles.vaccinationDate}>
                    Administered: {formatDate(vac.date)}
                  </Text>
                  {vac.nextDueDate && (
                    <Text style={styles.vaccinationNextDue}>
                      Next due: {formatDate(vac.nextDueDate)}
                    </Text>
                  )}
                  {vac.batchNumber && (
                    <Text style={styles.vaccinationBatch}>Batch: {vac.batchNumber}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        {record.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{record.notes}</Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  vetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vetLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  contentText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vaccinationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vaccinationCard: {
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  vaccinationInfo: {
    gap: 4,
  },
  vaccinationName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vaccinationDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  vaccinationNextDue: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  vaccinationBatch: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notesText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
