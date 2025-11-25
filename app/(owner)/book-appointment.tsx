import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PetImage from '../../components/PetImage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { AppDispatch, RootState } from '../../store';
import { createAppointment } from '../../store/slices/appointmentSlice';
import { fetchPets } from '../../store/slices/petSlice';

export default function BookAppointmentScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { pets } = useSelector((state: RootState) => state.pets);
  const { loading } = useSelector((state: RootState) => state.appointments);

  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [vets, setVets] = useState<Array<{ id: string; name: string; specialization: string }>>([]);
  const [loadingVets, setLoadingVets] = useState(true);
  const [selectedVetId, setSelectedVetId] = useState('');

  useEffect(() => {
    if (user && pets.length === 0) {
      dispatch(fetchPets(user.uid));
    }
    fetchVeterinarians();
  }, [user]);

  const fetchVeterinarians = async () => {
    try {
      setLoadingVets(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'vet'));
      const querySnapshot = await getDocs(q);
      
      const vetList: Array<{ id: string; name: string; specialization: string }> = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vetList.push({
          id: doc.id,
          name: data.fullName || 'Unknown Vet',
          specialization: data.specialization || 'General Practice',
        });
      });
      
      setVets(vetList);
    } catch (error) {
      console.error('Error fetching vets:', error);
      Alert.alert('Error', 'Failed to load veterinarians');
    } finally {
      setLoadingVets(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedPetId) {
      newErrors.pet = 'Please select a pet';
    }
    if (!selectedVetId) {
      newErrors.vet = 'Please select a veterinarian';
    }
    if (!appointmentDate) {
      newErrors.date = 'Please select a date';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(appointmentDate)) {
        newErrors.date = 'Invalid date format (use YYYY-MM-DD)';
      }
    }
    if (!appointmentTime) {
      newErrors.time = 'Please select a time';
    } else {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(appointmentTime)) {
        newErrors.time = 'Invalid time format (use HH:MM)';
      }
    }
    if (!duration || parseInt(duration) < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    const selectedPet = pets.find((p) => p.id === selectedPetId);
    const selectedVet = vets.find((v) => v.id === selectedVetId);

    if (!selectedPet || !selectedVet) return;

    const dateTime = `${appointmentDate}T${appointmentTime}:00`;

    try {
      await dispatch(
        createAppointment({
          ownerId: user.uid,
          ownerName: user.fullName,
          petId: selectedPet.id,
          petName: selectedPet.name,
          vetId: selectedVet.id,
          vetName: selectedVet.name,
          appointmentData: {
            petId: selectedPet.id,
            vetId: selectedVet.id,
            dateTime,
            duration: parseInt(duration),
            reason,
          },
        })
      ).unwrap();

      Alert.alert('Success', 'Appointment booked successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to book appointment');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
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
          {/* Select Pet */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Pet *</Text>
            {pets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="paw-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No pets registered</Text>
                <TouchableOpacity
                  style={styles.addPetButton}
                  onPress={() => router.push('/(owner)/register-pet')}
                >
                  <Text style={styles.addPetButtonText}>Add Pet First</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petCard,
                      selectedPetId === pet.id && styles.petCardSelected,
                    ]}
                    onPress={() => {
                      setSelectedPetId(pet.id);
                      if (errors.pet) {
                        const { pet: _, ...rest } = errors;
                        setErrors(rest);
                      }
                    }}
                  >
                    <PetImage 
                      photoUrl={pet.photoUrl} 
                      species={pet.species} 
                      size={50}
                      style={styles.petAvatar}
                    />
                    <View style={styles.petInfo}>
                      <Text style={[styles.petName, selectedPetId === pet.id && styles.petNameSelected]}>
                        {pet.name}
                      </Text>
                      <Text style={styles.petBreed}>
                        {pet.breed} • {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)}
                      </Text>
                    </View>
                    {selectedPetId === pet.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
            {errors.pet && <Text style={styles.errorText}>{errors.pet}</Text>}
          </View>

          {/* Select Veterinarian */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Veterinarian *</Text>
            {loadingVets ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#0EA5E9" />
                <Text style={styles.loadingText}>Loading veterinarians...</Text>
              </View>
            ) : vets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={32} color="#9CA3AF" />
                <Text style={styles.emptyText}>No veterinarians available</Text>
              </View>
            ) : (
              vets.map((vet) => (
              <TouchableOpacity
                key={vet.id}
                style={[
                  styles.vetCard,
                  selectedVetId === vet.id && styles.vetCardSelected,
                ]}
                onPress={() => {
                  setSelectedVetId(vet.id);
                  if (errors.vet) {
                    const { vet: _, ...rest } = errors;
                    setErrors(rest);
                  }
                }}
              >
                <View style={styles.vetAvatar}>
                  <Ionicons name="medical" size={20} color={selectedVetId === vet.id ? '#0EA5E9' : '#6B7280'} />
                </View>
                <View style={styles.vetInfo}>
                  <Text style={[styles.vetName, selectedVetId === vet.id && styles.vetNameSelected]}>
                    {vet.name}
                  </Text>
                  <Text style={styles.vetSpecialization}>{vet.specialization}</Text>
                </View>
                {selectedVetId === vet.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#0EA5E9" />
                )}
              </TouchableOpacity>
            ))
            )}
            {errors.vet && <Text style={styles.errorText}>{errors.vet}</Text>}
          </View>

          {/* Date and Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time *</Text>
            
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.date && styles.inputError]}
                    placeholder="2025-12-25"
                    value={appointmentDate}
                    onChangeText={(text) => {
                      setAppointmentDate(text);
                      if (errors.date) {
                        const { date: _, ...rest } = errors;
                        setErrors(rest);
                      }
                    }}
                    maxLength={10}
                  />
                </View>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>

              <View style={styles.formColumn}>
                <Text style={styles.label}>Time (HH:MM)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, errors.time && styles.inputError]}
                    placeholder="14:30"
                    value={appointmentTime}
                    onChangeText={(text) => {
                      setAppointmentTime(text);
                      if (errors.time) {
                        const { time: _, ...rest } = errors;
                        setErrors(rest);
                      }
                    }}
                    maxLength={5}
                  />
                </View>
                {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration (minutes) *</Text>
              <View style={styles.durationButtons}>
                {['15', '30', '45', '60'].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationButton,
                      duration === dur && styles.durationButtonSelected,
                    ]}
                    onPress={() => setDuration(dur)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        duration === dur && styles.durationTextSelected,
                      ]}
                    >
                      {dur} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.duration && <Text style={styles.errorText}>{errors.duration}</Text>}
            </View>
          </View>

          {/* Reason */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the reason for your visit"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || pets.length === 0}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Booking...' : 'Book Appointment'}
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  petCardSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  petNameSelected: {
    color: '#0EA5E9',
  },
  petBreed: {
    fontSize: 13,
    color: '#6B7280',
  },
  vetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
  },
  vetCardSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  vetAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vetInfo: {
    flex: 1,
  },
  vetName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  vetNameSelected: {
    color: '#0EA5E9',
  },
  vetSpecialization: {
    fontSize: 13,
    color: '#6B7280',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formColumn: {
    flex: 1,
  },
  formGroup: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  durationTextSelected: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 16,
  },
  addPetButton: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addPetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
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
