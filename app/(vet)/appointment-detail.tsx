import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppDispatch, RootState } from '../../store';
import { updateAppointment } from '../../store/slices/appointmentSlice';

export default function VetAppointmentDetailScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();

  const { appointments, loading } = useSelector((state: RootState) => state.appointments);
  const appointment = appointments.find((app) => app.id === appointmentId);

  const [notes, setNotes] = useState(appointment?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Appointment not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#0EA5E9';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  const handleStatusUpdate = async (newStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await dispatch(
        updateAppointment({
          appointmentId: appointment.id,
          updates: { status: newStatus },
        })
      ).unwrap();
      Alert.alert('Success', `Appointment status updated to ${newStatus}`);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to update status');
    }
  };

  const handleSaveNotes = async () => {
    try {
      await dispatch(
        updateAppointment({
          appointmentId: appointment.id,
          updates: { notes },
        })
      ).unwrap();
      Alert.alert('Success', 'Notes saved successfully');
      setIsEditingNotes(false);
    } catch (error: any) {
      Alert.alert('Error', error || 'Failed to save notes');
    }
  };

  const { dateStr, timeStr } = formatDateTime(appointment.dateTime);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
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
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusBadgeLarge,
                { backgroundColor: `${getStatusColor(appointment.status)}20` },
              ]}
            >
              <Ionicons
                name={getStatusIcon(appointment.status) as any}
                size={24}
                color={getStatusColor(appointment.status)}
              />
              <Text
                style={[
                  styles.statusTextLarge,
                  { color: getStatusColor(appointment.status) },
                ]}
              >
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Patient Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoRow}>
              <View style={styles.petAvatar}>
                <Ionicons name="paw" size={32} color="#0EA5E9" />
              </View>
              <View style={styles.petDetails}>
                <Text style={styles.petName}>{appointment.petName}</Text>
                <Text style={styles.ownerName}>Owner: {appointment.ownerName}</Text>
              </View>
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{dateStr}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{timeStr}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="hourglass-outline" size={20} color="#6B7280" />
              <Text style={styles.detailText}>{appointment.duration} minutes</Text>
            </View>
          </View>

          {/* Reason */}
          {appointment.reason && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reason for Visit</Text>
              <Text style={styles.reasonText}>{appointment.reason}</Text>
            </View>
          )}

          {/* Vet Notes */}
          <View style={styles.section}>
            <View style={styles.notesTitleRow}>
              <Text style={styles.sectionTitle}>Vet Notes</Text>
              {!isEditingNotes && (
                <TouchableOpacity onPress={() => setIsEditingNotes(true)}>
                  <Ionicons name="create-outline" size={20} color="#0EA5E9" />
                </TouchableOpacity>
              )}
            </View>
            {isEditingNotes ? (
              <>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about this appointment..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    style={styles.cancelNotesButton}
                    onPress={() => {
                      setNotes(appointment.notes || '');
                      setIsEditingNotes(false);
                    }}
                  >
                    <Text style={styles.cancelNotesText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveNotesButton}
                    onPress={handleSaveNotes}
                    disabled={loading}
                  >
                    <Text style={styles.saveNotesText}>Save Notes</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.notesText}>
                {appointment.notes || 'No notes added yet'}
              </Text>
            )}
          </View>

          {/* Status Actions */}
          {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Status</Text>
              <View style={styles.statusActions}>
                {appointment.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.statusButton, styles.confirmButton]}
                    onPress={() => handleStatusUpdate('confirmed')}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.statusButtonText}>Confirm</Text>
                  </TouchableOpacity>
                )}
                {appointment.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.statusButton, styles.completeButton]}
                    onPress={() => handleStatusUpdate('completed')}
                    disabled={loading}
                  >
                    <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.statusButtonText}>Mark Complete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.statusButton, styles.cancelButton]}
                  onPress={() => handleStatusUpdate('cancelled')}
                  disabled={loading}
                >
                  <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.statusButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Create Medical Record */}
          {appointment.status === 'completed' && (
            <TouchableOpacity 
              style={styles.medicalRecordButton}
              onPress={() => router.push(`/(vet)/create-medical-record?appointmentId=${appointment.id}&petId=${appointment.petId}&petName=${appointment.petName}`)}
            >
              <Ionicons name="document-text" size={20} color="#0EA5E9" />
              <Text style={styles.medicalRecordText}>Create Medical Record</Text>
            </TouchableOpacity>
          )}
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
  statusSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ownerName: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
  },
  reasonText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  notesTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 120,
    fontSize: 15,
    color: '#1F2937',
    textAlignVertical: 'top',
  },
  notesActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelNotesButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelNotesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveNotesButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
  },
  saveNotesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notesText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButton: {
    backgroundColor: '#0EA5E9',
  },
  completeButton: {
    backgroundColor: '#6B7280',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  medicalRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 8,
  },
  medicalRecordText: {
    fontSize: 16,
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
});
