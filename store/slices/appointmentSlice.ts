import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Appointment, AppointmentState, AppointmentFormData } from '../../types';

const initialState: AppointmentState = {
  appointments: [],
  selectedAppointment: null,
  loading: false,
  error: null,
};

// Fetch appointments for owner
export const fetchOwnerAppointments = createAsyncThunk(
  'appointments/fetchOwnerAppointments',
  async (ownerId: string, { rejectWithValue }) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('ownerId', '==', ownerId)
      );
      const querySnapshot = await getDocs(q);
      
      const appointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          petId: data.petId,
          petName: data.petName,
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          vetId: data.vetId,
          vetName: data.vetName,
          dateTime: data.dateTime,
          duration: data.duration,
          status: data.status,
          reason: data.reason,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      // Sort by dateTime descending (client-side)
      appointments.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
      
      return appointments;
    } catch (error: any) {
      console.error('fetchOwnerAppointments error:', error);
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

// Fetch appointments for vet
export const fetchVetAppointments = createAsyncThunk(
  'appointments/fetchVetAppointments',
  async (vetId: string, { rejectWithValue }) => {
    try {
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('vetId', '==', vetId)
      );
      const querySnapshot = await getDocs(q);
      
      const appointments: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        appointments.push({
          id: doc.id,
          petId: data.petId,
          petName: data.petName,
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          vetId: data.vetId,
          vetName: data.vetName,
          dateTime: data.dateTime,
          duration: data.duration,
          status: data.status,
          reason: data.reason,
          notes: data.notes,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      // Sort by dateTime ascending (client-side)
      appointments.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
      
      return appointments;
    } catch (error: any) {
      console.error('fetchVetAppointments error:', error);
      return rejectWithValue(error.message || 'Failed to fetch appointments');
    }
  }
);

// Create new appointment
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async ({
    ownerId,
    ownerName,
    petId,
    petName,
    vetId,
    vetName,
    appointmentData,
  }: {
    ownerId: string;
    ownerName: string;
    petId: string;
    petName: string;
    vetId: string;
    vetName: string;
    appointmentData: AppointmentFormData;
  }) => {
    const now = new Date().toISOString();
    const appointmentDoc = {
      petId,
      petName,
      ownerId,
      ownerName,
      vetId,
      vetName,
      dateTime: appointmentData.dateTime,
      duration: appointmentData.duration,
      status: 'pending' as const,
      reason: appointmentData.reason || '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'appointments'), appointmentDoc);
    
    return {
      id: docRef.id,
      ...appointmentDoc,
    };
  }
);

// Update appointment
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({
    appointmentId,
    updates,
  }: {
    appointmentId: string;
    updates: Partial<Appointment>;
  }) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(appointmentRef, updateData);
    
    return { appointmentId, updates: updateData };
  }
);

// Cancel appointment
export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async (appointmentId: string) => {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
    
    return appointmentId;
  }
);

// Delete appointment
export const deleteAppointment = createAsyncThunk(
  'appointments/deleteAppointment',
  async (appointmentId: string) => {
    await deleteDoc(doc(db, 'appointments', appointmentId));
    return appointmentId;
  }
);

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    setSelectedAppointment: (state, action: PayloadAction<Appointment | null>) => {
      state.selectedAppointment = action.payload;
    },
    clearAppointmentError: (state) => {
      state.error = null;
    },
    clearAppointments: (state) => {
      state.appointments = [];
      state.selectedAppointment = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch owner appointments
    builder
      .addCase(fetchOwnerAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchOwnerAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      });

    // Fetch vet appointments
    builder
      .addCase(fetchVetAppointments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVetAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchVetAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch appointments';
      });

    // Create appointment
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments.unshift(action.payload);
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create appointment';
      });

    // Update appointment
    builder
      .addCase(updateAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.appointments.findIndex(
          (app) => app.id === action.payload.appointmentId
        );
        if (index !== -1) {
          state.appointments[index] = {
            ...state.appointments[index],
            ...action.payload.updates,
          };
        }
        if (state.selectedAppointment?.id === action.payload.appointmentId) {
          state.selectedAppointment = {
            ...state.selectedAppointment,
            ...action.payload.updates,
          };
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update appointment';
      });

    // Cancel appointment
    builder
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        const index = state.appointments.findIndex(
          (app) => app.id === action.payload
        );
        if (index !== -1) {
          state.appointments[index].status = 'cancelled';
        }
      });

    // Delete appointment
    builder
      .addCase(deleteAppointment.fulfilled, (state, action) => {
        state.appointments = state.appointments.filter(
          (app) => app.id !== action.payload
        );
        if (state.selectedAppointment?.id === action.payload) {
          state.selectedAppointment = null;
        }
      });
  },
});

export const {
  setSelectedAppointment,
  clearAppointmentError,
  clearAppointments,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
