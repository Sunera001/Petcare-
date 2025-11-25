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
  Image,
  ActivityIndicator,
  ActionSheetIOS
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { updatePet, deletePet } from '../../store/slices/petSlice';
import { fetchPetRecords } from '../../store/slices/recordSlice';
import { PetFormData } from '../../types';
import { pickImage, uploadPetImage, deletePetImage } from '../../utils/imageUtils';
import PetImage from '../../components/PetImage';

export default function PetProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { petId } = useLocalSearchParams<{ petId: string }>();
  
  const { pets, loading } = useSelector((state: RootState) => state.pets);
  const { records } = useSelector((state: RootState) => state.records);
  const pet = pets.find(p => p.id === petId);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PetFormData>({
    name: pet?.name || '',
    species: pet?.species || 'dog',
    breed: pet?.breed || '',
    dateOfBirth: pet?.dateOfBirth || '',
    gender: pet?.gender || 'male',
    microchipId: pet?.microchipId || '',
    medicalNotes: pet?.medicalNotes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PetFormData, string>>>({});
  const [petImageUri, setPetImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  // Fetch pet records on mount
  useEffect(() => {
    if (petId) {
      dispatch(fetchPetRecords(petId));
    }
  }, [petId, dispatch]);

  // Calculate record count for this pet
  const petRecordCount = records.filter(r => r.petId === petId).length;

  // Update petImageUri when pet changes
  useEffect(() => {
    if (pet?.photoUrl) {
      setPetImageUri(pet.photoUrl);
      setImageChanged(false);
    } else {
      setPetImageUri(null);
      setImageChanged(false);
    }
  }, [pet?.photoUrl]);

  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pet Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Pet not found</Text>
        </View>
      </SafeAreaView>
    );
  }

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
              setImageChanged(true);
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
                  setImageChanged(true);
                }
              },
            },
            {
              text: 'Choose from Gallery',
              onPress: async () => {
                const imageUri = await pickImage('gallery');
                if (imageUri) {
                  setPetImageUri(imageUri);
                  setImageChanged(true);
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

  const handleRemoveImage = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Delete old image from storage if it exists
            if (pet?.photoUrl) {
              try {
                await deletePetImage(pet.photoUrl);
              } catch (error) {
                console.error('Error deleting old image:', error);
              }
            }
            setPetImageUri(null);
            setImageChanged(true);
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setUploadingImage(true);
      
      let photoUrl = pet?.photoUrl || null;
      
      // Handle image changes
      if (imageChanged) {
        if (petImageUri) {
          // Delete old image if it exists
          if (pet?.photoUrl && pet.photoUrl !== petImageUri) {
            try {
              await deletePetImage(pet.photoUrl);
            } catch (error) {
              console.error('Error deleting old image:', error);
            }
          }
          
          // Upload new image
          try {
            photoUrl = await uploadPetImage(pet.id, petImageUri);
          } catch (uploadError: any) {
            Alert.alert('Warning', 'Failed to upload image. Pet information updated but image was not saved.');
          }
        } else {
          // Image was removed
          if (pet?.photoUrl) {
            try {
              await deletePetImage(pet.photoUrl);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          }
          photoUrl = null;
        }
      }
      
      // Update pet with form data and photo URL
      await dispatch(updatePet({ 
        petId: pet.id, 
        petData: { ...formData, photoUrl: photoUrl || undefined } 
      })).unwrap();
      
      setImageChanged(false);
      Alert.alert('Success', 'Pet information updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to update pet');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deletePet(pet.id)).unwrap();
              Alert.alert('Success', 'Pet deleted successfully', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error || 'Failed to delete pet');
            }
          },
        },
      ]
    );
  };

  const getSpeciesIcon = (species: string) => {
    const option = speciesOptions.find(opt => opt.value === species);
    return option?.icon || 'paw';
  };

  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }
    
    return years > 0 ? `${years} year${years > 1 ? 's' : ''} old` : 'Less than 1 year old';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              setFormData({
                name: pet.name,
                species: pet.species,
                breed: pet.breed,
                dateOfBirth: pet.dateOfBirth,
                gender: pet.gender,
                microchipId: pet.microchipId || '',
                medicalNotes: pet.medicalNotes || '',
              });
              setErrors({});
              setPetImageUri(pet.photoUrl || null);
              setImageChanged(false);
              setIsEditing(false);
            } else {
              setIsEditing(true);
            }
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
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
        {/* Pet Avatar */}
        <View style={styles.avatarSection}>
          {isEditing ? (
            <TouchableOpacity 
              style={styles.avatarContainerEdit}
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
              {uploadingImage && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <PetImage 
                photoUrl={pet.photoUrl} 
                species={pet.species} 
                size={100}
              />
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed}</Text>
              <Text style={styles.petAge}>{calculateAge(pet.dateOfBirth)}</Text>
            </>
          )}
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          {/* Name */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
              />
            ) : (
              <Text style={styles.infoValue}>{pet.name}</Text>
            )}
          </View>
          {errors.name && <Text style={styles.errorTextInline}>{errors.name}</Text>}

          {/* Species */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Species</Text>
            {isEditing ? (
              <View style={styles.speciesGridSmall}>
                {speciesOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.speciesChip,
                      formData.species === option.value && styles.speciesChipActive
                    ]}
                    onPress={() => setFormData({ ...formData, species: option.value })}
                  >
                    <Text style={[
                      styles.speciesChipText,
                      formData.species === option.value && styles.speciesChipTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={[styles.infoValue, styles.capitalize]}>{pet.species}</Text>
            )}
          </View>

          {/* Breed */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Breed</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.breed && styles.inputError]}
                value={formData.breed}
                onChangeText={(text) => {
                  setFormData({ ...formData, breed: text });
                  if (errors.breed) setErrors({ ...errors, breed: undefined });
                }}
              />
            ) : (
              <Text style={styles.infoValue}>{pet.breed}</Text>
            )}
          </View>
          {errors.breed && <Text style={styles.errorTextInline}>{errors.breed}</Text>}

          {/* Date of Birth */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date of Birth</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, errors.dateOfBirth && styles.inputError]}
                value={formData.dateOfBirth}
                onChangeText={(text) => {
                  setFormData({ ...formData, dateOfBirth: text });
                  if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
                }}
                placeholder="YYYY-MM-DD"
                maxLength={10}
              />
            ) : (
              <Text style={styles.infoValue}>{pet.dateOfBirth}</Text>
            )}
          </View>
          {errors.dateOfBirth && <Text style={styles.errorTextInline}>{errors.dateOfBirth}</Text>}

          {/* Gender */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender</Text>
            {isEditing ? (
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderChip,
                    formData.gender === 'male' && styles.genderChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'male' })}
                >
                  <Text style={[
                    styles.genderChipText,
                    formData.gender === 'male' && styles.genderChipTextActive
                  ]}>
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderChip,
                    formData.gender === 'female' && styles.genderChipActive
                  ]}
                  onPress={() => setFormData({ ...formData, gender: 'female' })}
                >
                  <Text style={[
                    styles.genderChipText,
                    formData.gender === 'female' && styles.genderChipTextActive
                  ]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={[styles.infoValue, styles.capitalize]}>{pet.gender}</Text>
            )}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>

          {/* Microchip ID */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Microchip ID</Text>
            {isEditing ? (
              <TextInput
                style={styles.input}
                value={formData.microchipId}
                onChangeText={(text) => setFormData({ ...formData, microchipId: text })}
                placeholder="Optional"
              />
            ) : (
              <Text style={styles.infoValue}>{pet.microchipId || 'Not set'}</Text>
            )}
          </View>

          {/* Medical Notes */}
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>Medical Notes</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.medicalNotes}
                onChangeText={(text) => setFormData({ ...formData, medicalNotes: text })}
                placeholder="Any allergies, conditions, or notes"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            ) : (
              <Text style={styles.notesValue}>{pet.medicalNotes || 'No notes'}</Text>
            )}
          </View>
        </View>

        {/* Medical History Section */}
        {!isEditing && (
          <View style={styles.section}>
            <View style={styles.medicalHeader}>
              <Text style={styles.sectionTitle}>Medical History</Text>
              {petRecordCount > 0 && (
                <View style={styles.recordCountBadge}>
                  <Text style={styles.recordCountText}>{petRecordCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.viewRecordsButton}
              onPress={() =>
                router.push({
                  pathname: '/(owner)/pet-medical-records',
                  params: { petId: pet.id, petName: pet.name },
                })
              }
            >
              <Ionicons name="document-text" size={20} color="#0EA5E9" />
              <Text style={styles.viewRecordsText}>
                {petRecordCount > 0 ? `View ${petRecordCount} Record${petRecordCount !== 1 ? 's' : ''}` : 'View Medical Records'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#0EA5E9" />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {isEditing ? (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteButtonText}>Delete Pet</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(owner)/home')}
        >
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="paw" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.navLabelActive}>My Pets</Text>
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
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Increased to account for bottom navigation bar
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  petAge: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoColumn: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  notesValue: {
    fontSize: 14,
    color: '#374151',
    marginTop: 8,
    lineHeight: 20,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  textArea: {
    textAlign: 'left',
    minHeight: 80,
    paddingTop: 8,
    marginTop: 8,
    marginLeft: 0,
  },
  errorTextInline: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 12,
  },
  speciesGridSmall: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-end',
  },
  speciesChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  speciesChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0EA5E9',
  },
  speciesChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  speciesChipTextActive: {
    color: '#0EA5E9',
    fontWeight: '600',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  genderChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0EA5E9',
  },
  genderChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  medicalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recordCountBadge: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewRecordsText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0EA5E9',
    marginLeft: 12,
  },
  saveButton: {
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
  avatarContainerEdit: {
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
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
});
