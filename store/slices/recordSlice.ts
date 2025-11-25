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
  orderBy 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { MedicalRecord, RecordState, RecordFormData } from '../../types';

const initialState: RecordState = {
  records: [],
  selectedRecord: null,
  loading: false,
  error: null,
};

// Fetch medical records for a pet
export const fetchPetRecords = createAsyncThunk(
  'records/fetchPetRecords',
  async (petId: string, { rejectWithValue }) => {
    try {
      const recordsRef = collection(db, 'medicalRecords');
      const q = query(
        recordsRef,
        where('petId', '==', petId)
      );
      const querySnapshot = await getDocs(q);
      
      const records: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          petId: data.petId,
          petName: data.petName,
          vetId: data.vetId,
          vetName: data.vetName,
          appointmentId: data.appointmentId,
          date: data.date,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescription: data.prescription,
          vaccinations: data.vaccinations,
          notes: data.notes,
          attachments: data.attachments,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      // Sort by date descending (client-side)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return records;
    } catch (error: any) {
      console.error('fetchPetRecords error:', error);
      return rejectWithValue(error.message || 'Failed to fetch records');
    }
  }
);

// Fetch medical records created by vet
export const fetchVetRecords = createAsyncThunk(
  'records/fetchVetRecords',
  async (vetId: string, { rejectWithValue }) => {
    try {
      const recordsRef = collection(db, 'medicalRecords');
      const q = query(
        recordsRef,
        where('vetId', '==', vetId)
      );
      const querySnapshot = await getDocs(q);
      
      const records: MedicalRecord[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          id: doc.id,
          petId: data.petId,
          petName: data.petName,
          vetId: data.vetId,
          vetName: data.vetName,
          appointmentId: data.appointmentId,
          date: data.date,
          diagnosis: data.diagnosis,
          treatment: data.treatment,
          prescription: data.prescription,
          vaccinations: data.vaccinations,
          notes: data.notes,
          attachments: data.attachments,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      // Sort by date descending (client-side)
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return records;
    } catch (error: any) {
      console.error('fetchVetRecords error:', error);
      return rejectWithValue(error.message || 'Failed to fetch records');
    }
  }
);

// Create new medical record
export const createMedicalRecord = createAsyncThunk(
  'records/createMedicalRecord',
  async ({
    vetId,
    vetName,
    petId,
    petName,
    appointmentId,
    recordData,
  }: {
    vetId: string;
    vetName: string;
    petId: string;
    petName: string;
    appointmentId?: string;
    recordData: RecordFormData;
  }) => {
    const now = new Date().toISOString();
    const recordDoc = {
      petId,
      petName,
      vetId,
      vetName,
      appointmentId: appointmentId || null,
      date: now,
      diagnosis: recordData.diagnosis,
      treatment: recordData.treatment,
      prescription: recordData.prescription || '',
      vaccinations: recordData.vaccinations || [],
      notes: recordData.notes || '',
      attachments: [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'medicalRecords'), recordDoc);
    
    return {
      id: docRef.id,
      ...recordDoc,
    };
  }
);

// Update medical record
export const updateMedicalRecord = createAsyncThunk(
  'records/updateMedicalRecord',
  async ({
    recordId,
    updates,
  }: {
    recordId: string;
    updates: Partial<MedicalRecord>;
  }) => {
    const recordRef = doc(db, 'medicalRecords', recordId);
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await updateDoc(recordRef, updateData);
    
    return { recordId, updates: updateData };
  }
);

// Delete medical record
export const deleteMedicalRecord = createAsyncThunk(
  'records/deleteMedicalRecord',
  async (recordId: string) => {
    await deleteDoc(doc(db, 'medicalRecords', recordId));
    return recordId;
  }
);

const recordSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    setSelectedRecord: (state, action: PayloadAction<MedicalRecord | null>) => {
      state.selectedRecord = action.payload;
    },
    clearRecordError: (state) => {
      state.error = null;
    },
    clearRecords: (state) => {
      state.records = [];
      state.selectedRecord = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch pet records
    builder
      .addCase(fetchPetRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPetRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchPetRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch records';
      });

    // Fetch vet records
    builder
      .addCase(fetchVetRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVetRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchVetRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch records';
      });

    // Create medical record
    builder
      .addCase(createMedicalRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMedicalRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.records.unshift(action.payload);
      })
      .addCase(createMedicalRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create record';
      });

    // Update medical record
    builder
      .addCase(updateMedicalRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMedicalRecord.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.records.findIndex(
          (record) => record.id === action.payload.recordId
        );
        if (index !== -1) {
          state.records[index] = {
            ...state.records[index],
            ...action.payload.updates,
          };
        }
        if (state.selectedRecord?.id === action.payload.recordId) {
          state.selectedRecord = {
            ...state.selectedRecord,
            ...action.payload.updates,
          };
        }
      })
      .addCase(updateMedicalRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update record';
      });

    // Delete medical record
    builder
      .addCase(deleteMedicalRecord.fulfilled, (state, action) => {
        state.records = state.records.filter(
          (record) => record.id !== action.payload
        );
        if (state.selectedRecord?.id === action.payload) {
          state.selectedRecord = null;
        }
      });
  },
});

export const {
  setSelectedRecord,
  clearRecordError,
  clearRecords,
} = recordSlice.actions;

export default recordSlice.reducer;
