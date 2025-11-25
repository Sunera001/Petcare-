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
  Image,
  ActivityIndicator,
  ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { addPet, updatePet } from '../../store/slices/petSlice';
import { PetFormData } from '../../types';
import { pickImage, uploadPetImage } from '../../utils/imageUtils';
import PetImage from '../../components/PetImage';

export default function RegisterPetScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { loading } = useSelector((state: RootState) => state.pets);

  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: 'dog',
    breed: '',
    dateOfBirth: '',
    gender: 'male',
    microchipId: '',
    medicalNotes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PetFormData, string>>>({});
  const [petImageUri, setPetImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const speciesOptions: Array<{ value: PetFormData['species']; label: string; icon: string }> = [
    { value: 'dog', label: 'Dog', icon: 'paw' },
    { value: 'cat', label: 'Cat', icon: 'paw' },
    { value: 'bird', label: 'Bird', icon: 'egg' },
    { value: 'rabbit', label: 'Rabbit', icon: 'paw' },
    { value: 'other', label: 'Other', icon: 'help-circle' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PetFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required';
    }
    if (!formData.breed.trim()) {
      newErrors.breed = 'Breed is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.dateOfBirth)) {
        newErrors.dateOfBirth = 'Invalid date format (use YYYY-MM-DD)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePicker = async () => {
    try {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 0) return; // Cancel
            const source = buttonIndex === 1 ? 'camera' : 'gallery';
            const imageUri = await pickImage(source);
            if (imageUri) {
              setPetImageUri(imageUri);
            }
          }
        );
      } else {
        Alert.alert(
          'Select Image',
          'Choose an option',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Take Photo',
              onPress: async () => {
                const imageUri = await pickImage('camera');
                if (imageUri) {
                  setPetImageUri(imageUri);
                }
              },
            },
            {
              text: 'Choose from Gallery',
              onPress: async () => {
                const imageUri = await pickImage('gallery');
                if (imageUri) {
                  setPetImageUri(imageUri);
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick image');
    }
  };

  const handleRemoveImage = () => {
    setPetImageUri(null);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      setUploadingImage(true);
      
      // Create pet first (without photo URL - we'll add it after upload)
      const petDataWithoutPhoto = { ...formData };
      delete petDataWithoutPhoto.photoUrl;
      const newPet = await dispatch(addPet({ ownerId: user.uid, petData: petDataWithoutPhoto })).unwrap();
      
      // Upload image if selected and update pet with photo URL
      if (petImageUri && newPet.id) {
        try {
          const photoUrl = await uploadPetImage(newPet.id, petImageUri);
          // Update pet with photo URL
          await dispatch(updatePet({ 
            petId: newPet.id, 
            petData: { photoUrl } 
          })).unwrap();
        } catch (uploadError: any) {
          console.error('Image upload error:', uploadError);
          Alert.alert('Warning', 'Pet created but image upload failed. You can add the image later.');
        }
      }
      
      Alert.alert('Success', 'Pet registered successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to register pet');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register New Pet</Text>
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
        {/* Pet Avatar/Image */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleImagePicker}
            disabled={uploadingImage}
          >
            {petImageUri ? (
              <Image source={{ uri: petImageUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="camera" size={32} color="#0EA5E9" />
                <Text style={styles.avatarPlaceholderText}>Add Photo</Text>
              </View>
            )}
            {petImageUri && (
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
            <View style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to add pet photo</Text>
        </View>

        {/* Pet Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Pet Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter pet name"
            value={formData.name}
            onChangeText={(text) => {
              setFormData({ ...formData, name: text });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Species */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Species *</Text>
          <View style={styles.speciesGrid}>
            {speciesOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.speciesCard,
                  formData.species === option.value && styles.speciesCardActive
                ]}
                onPress={() => setFormData({ ...formData, species: option.value })}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={formData.species === option.value ? '#0EA5E9' : '#6B7280'} 
                />
                <Text style={[
                  styles.speciesLabel,
                  formData.species === option.value && styles.speciesLabelActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Breed */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Breed *</Text>
          <TextInput
            style={[styles.input, errors.breed && styles.inputError]}
            placeholder="Enter breed"
            value={formData.breed}
            onChangeText={(text) => {
              setFormData({ ...formData, breed: text });
              if (errors.breed) setErrors({ ...errors, breed: undefined });
            }}
          />
          {errors.breed && <Text style={styles.errorText}>{errors.breed}</Text>}
        </View>

        {/* Date of Birth */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth * (YYYY-MM-DD)</Text>
          <View style={styles.dateInputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#6B7280" style={styles.dateIcon} />
            <TextInput
              style={[styles.dateInput, errors.dateOfBirth && styles.inputError]}
              placeholder="2020-01-15"
              value={formData.dateOfBirth}
              onChangeText={(text) => {
                setFormData({ ...formData, dateOfBirth: text });
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
              }}
              maxLength={10}
            />
          </View>
          {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
        </View>

        {/* Gender */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'male' && styles.genderButtonActive
              ]}
              onPress={() => setFormData({ ...formData, gender: 'male' })}
            >
              <Ionicons 
                name="male" 
                size={20} 
                color={formData.gender === 'male' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                styles.genderText,
                formData.gender === 'male' && styles.genderTextActive
              ]}>
                Male
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'female' && styles.genderButtonActive
              ]}
              onPress={() => setFormData({ ...formData, gender: 'female' })}
            >
              <Ionicons 
                name="female" 
                size={20} 
                color={formData.gender === 'female' ? '#FFFFFF' : '#6B7280'} 
              />
              <Text style={[
                styles.genderText,
                formData.gender === 'female' && styles.genderTextActive
              ]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Microchip ID */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Microchip ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter microchip ID"
            value={formData.microchipId}
            onChangeText={(text) => setFormData({ ...formData, microchipId: text })}
          />
        </View>

        {/* Medical Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Medical Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any allergies, conditions, or notes"
            value={formData.medicalNotes}
            onChangeText={(text) => setFormData({ ...formData, medicalNotes: text })}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (loading || uploadingImage) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>
              {loading ? 'Registering...' : 'Register Pet'}
            </Text>
          )}
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
    padding: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
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
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speciesCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  speciesCardActive: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  speciesLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  speciesLabelActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dateIcon: {
    marginRight: 8,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
  },
  genderButtonActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  genderText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#BAE6FD',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatarHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
});
