import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Pet, PetState, PetFormData } from '../../types';

const initialState: PetState = {
  pets: [],
  selectedPet: null,
  loading: false,
  error: null,
};

// Fetch pets for a specific owner
export const fetchPets = createAsyncThunk(
  'pets/fetchPets',
  async (ownerId: string, { rejectWithValue }) => {
    try {
      const q = query(
        collection(db, 'pets'),
        where('ownerId', '==', ownerId)
      );
      const querySnapshot = await getDocs(q);
      const pets: Pet[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        pets.push({
          id: doc.id,
          ...data,
          dateOfBirth: data.dateOfBirth?.toDate?.()?.toISOString() || data.dateOfBirth,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as Pet);
      });
      
      return pets;
    } catch (error: any) {
      console.error('fetchPets error:', error);
      return rejectWithValue(error.message || 'Failed to fetch pets');
    }
  }
);

// Add a new pet
export const addPet = createAsyncThunk(
  'pets/addPet',
  async ({ ownerId, petData }: { ownerId: string; petData: PetFormData }, { rejectWithValue }) => {
    try {
      const now = new Date();
      const petDoc = {
        ...petData,
        ownerId,
        dateOfBirth: petData.dateOfBirth,
        photoUrl: petData.photoUrl || null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'pets'), petDoc);
      
      return {
        id: docRef.id,
        ...petDoc,
      } as Pet;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add pet');
    }
  }
);

// Update pet
export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async ({ petId, petData }: { petId: string; petData: Partial<PetFormData> }, { rejectWithValue }) => {
    try {
      const petRef = doc(db, 'pets', petId);
      const updateData: any = {
        ...petData,
        updatedAt: new Date().toISOString(),
      };
      
      // Handle photoUrl explicitly - set to null if undefined to allow deletion
      if (petData.photoUrl !== undefined) {
        updateData.photoUrl = petData.photoUrl || null;
      }
      
      await updateDoc(petRef, updateData);
      
      return { petId, petData: updateData };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update pet');
    }
  }
);

// Delete pet
export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (petId: string, { rejectWithValue }) => {
    try {
      await deleteDoc(doc(db, 'pets', petId));
      return petId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete pet');
    }
  }
);

const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    setSelectedPet: (state, action: PayloadAction<Pet | null>) => {
      state.selectedPet = action.payload;
    },
    clearPetError: (state) => {
      state.error = null;
    },
    clearPets: (state) => {
      state.pets = [];
      state.selectedPet = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch pets
    builder
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = action.payload;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add pet
    builder
      .addCase(addPet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPet.fulfilled, (state, action) => {
        state.loading = false;
        state.pets.unshift(action.payload);
      })
      .addCase(addPet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update pet
    builder
      .addCase(updatePet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        state.loading = false;
        const { petId, petData } = action.payload;
        const index = state.pets.findIndex(p => p.id === petId);
        if (index !== -1) {
          state.pets[index] = { ...state.pets[index], ...petData };
        }
        if (state.selectedPet?.id === petId) {
          state.selectedPet = { ...state.selectedPet, ...petData };
        }
      })
      .addCase(updatePet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Delete pet
    builder
      .addCase(deletePet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePet.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = state.pets.filter(p => p.id !== action.payload);
        if (state.selectedPet?.id === action.payload) {
          state.selectedPet = null;
        }
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedPet, clearPetError, clearPets } = petSlice.actions;
export default petSlice.reducer;
