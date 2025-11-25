import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { createMedicalRecord } from '../../store/slices/recordSlice';
import { Vaccination } from '../../types';

export default function CreateMedicalRecordScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { appointmentId, petId, petName, ownerId, ownerName } = useLocalSearchParams<{
    appointmentId?: string;
    petId: string;
    petName: string;
    ownerId?: string;
    ownerName?: string;
  }>();

  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.records);

  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [vaccinationName, setVaccinationName] = useState('');
  const [vaccinationDate, setVaccinationDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!diagnosis.trim()) {
      newErrors.diagnosis = 'Diagnosis is required';
    }
    if (!treatment.trim()) {
      newErrors.treatment = 'Treatment is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddVaccination = () => {
    if (!vaccinationName.trim() || !vaccinationDate.trim()) {
      Alert.alert('Error', 'Please fill in vaccination name and date');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(vaccinationDate)) {
      Alert.alert('Error', 'Invalid date format (use YYYY-MM-DD)');
      return;
    }

    if (nextDueDate && !dateRegex.test(nextDueDate)) {
      Alert.alert('Error', 'Invalid next due date format (use YYYY-MM-DD)');
      return;
    }

    const vaccination: Vaccination = {
      name: vaccinationName,
      date: vaccinationDate,
      nextDueDate: nextDueDate || undefined,
      batchNumber: batchNumber || undefined,
    };

    setVaccinations([...vaccinations, vaccination]);
    setVaccinationName('');
    setVaccinationDate('');
    setNextDueDate('');
    setBatchNumber('');
    setShowVaccinationForm(false);
  };

  const handleRemoveVaccination = (index: number) => {
    setVaccinations(vaccinations.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      await dispatch(
        createMedicalRecord({
          vetId: user.uid,
          vetName: user.fullName,
          petId: petId as string,
          petName: petName as string,
          appointmentId: appointmentId as string | undefined,
          recordData: {
            petId: petId as string,
            diagnosis,
            treatment,
            prescription,
            vaccinations,
            notes,
          },
        })
      ).unwrap();

      Alert.alert('Success', 'Medical record created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to create medical record');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Medical Record</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Patient Info */}
          <View style={styles.patientBanner}>
            <View style={styles.petIcon}>
              <Ionicons name="paw" size={24} color="#0EA5E9" />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{petName}</Text>
              {ownerName && (
                <View style={styles.ownerRow}>
                  <Ionicons name="person-outline" size={14} color="#6B7280" />
                  <Text style={styles.ownerText}>Owner: {ownerName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Diagnosis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.diagnosis && styles.inputError]}
              placeholder="Enter diagnosis..."
              value={diagnosis}
              onChangeText={(text) => {
                setDiagnosis(text);
                if (errors.diagnosis) setErrors({ ...errors, diagnosis: undefined });
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.diagnosis && <Text style={styles.errorText}>{errors.diagnosis}</Text>}
          </View>

          {/* Treatment */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Treatment *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.treatment && styles.inputError]}
              placeholder="Describe treatment plan..."
              value={treatment}
              onChangeText={(text) => {
                setTreatment(text);
                if (errors.treatment) setErrors({ ...errors, treatment: undefined });
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.treatment && <Text style={styles.errorText}>{errors.treatment}</Text>}
          </View>

          {/* Prescription */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prescription (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter medications and dosage..."
              value={prescription}
              onChangeText={setPrescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Vaccinations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vaccinations</Text>
              <TouchableOpacity onPress={() => setShowVaccinationForm(!showVaccinationForm)}>
                <Ionicons
                  name={showVaccinationForm ? 'close-circle' : 'add-circle'}
                  size={24}
                  color="#0EA5E9"
                />
              </TouchableOpacity>
            </View>

            {showVaccinationForm && (
              <View style={styles.vaccinationForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Vaccine name *"
                  value={vaccinationName}
                  onChangeText={setVaccinationName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Date (YYYY-MM-DD) *"
                  value={vaccinationDate}
                  onChangeText={setVaccinationDate}
                  maxLength={10}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Next due date (YYYY-MM-DD)"
                  value={nextDueDate}
                  onChangeText={setNextDueDate}
                  maxLength={10}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Batch number"
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                />
                <TouchableOpacity style={styles.addVaccinationButton} onPress={handleAddVaccination}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.addVaccinationText}>Add Vaccination</Text>
                </TouchableOpacity>
              </View>
            )}

            {vaccinations.length > 0 && (
              <View style={styles.vaccinationList}>
                {vaccinations.map((vac, index) => (
                  <View key={index} style={styles.vaccinationCard}>
                    <View style={styles.vaccinationInfo}>
                      <Text style={styles.vaccinationName}>{vac.name}</Text>
                      <Text style={styles.vaccinationDate}>Date: {vac.date}</Text>
                      {vac.nextDueDate && (
                        <Text style={styles.vaccinationNextDue}>Next due: {vac.nextDueDate}</Text>
                      )}
                      {vac.batchNumber && (
                        <Text style={styles.vaccinationBatch}>Batch: {vac.batchNumber}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveVaccination(index)}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes or observations..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Creating...' : 'Create Medical Record'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E0F2FE',
    padding: 16,
    marginBottom: 16,
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 4,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  vaccinationForm: {
    gap: 12,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  addVaccinationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0EA5E9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addVaccinationText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  vaccinationList: {
    marginTop: 12,
    gap: 12,
  },
  vaccinationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  vaccinationInfo: {
    flex: 1,
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
    marginTop: 2,
  },
  vaccinationBatch: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
