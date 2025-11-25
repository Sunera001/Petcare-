// User Types
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'owner' | 'vet';
  phoneNumber?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Pet Types
export interface Pet {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  microchipId?: string;
  photoUrl?: string;
  ownerId: string;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PetState {
  pets: Pet[];
  selectedPet: Pet | null;
  loading: boolean;
  error: string | null;
}

// Appointment Types
export interface Appointment {
  id: string;
  petId: string;
  petName: string;
  ownerId: string;
  ownerName: string;
  vetId: string;
  vetName: string;
  dateTime: string;
  duration: number; // in minutes
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
}

// Medical Record Types
export interface Vaccination {
  name: string;
  date: string;
  nextDueDate?: string;
  batchNumber?: string;
}

export interface MedicalRecord {
  id: string;
  petId: string;
  petName: string;
  vetId: string;
  vetName: string;
  appointmentId?: string;
  date: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  vaccinations?: Vaccination[];
  notes?: string;
  attachments?: string[]; // URLs to files
  createdAt: string;
  updatedAt: string;
}

export interface RecordState {
  records: MedicalRecord[];
  selectedRecord: MedicalRecord | null;
  loading: boolean;
  error: string | null;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  fullName: string;
  role: 'owner' | 'vet';
  phoneNumber?: string;
}

export interface PetFormData {
  name: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  microchipId?: string;
  medicalNotes?: string;
  photoUrl?: string;
}

export interface AppointmentFormData {
  petId: string;
  vetId: string;
  dateTime: string;
  duration: number;
  reason?: string;
}

export interface RecordFormData {
  petId: string;
  diagnosis: string;
  treatment: string;
  prescription?: string;
  vaccinations?: Vaccination[];
  notes?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'appointment' | 'reminder' | 'record' | 'general';
  title: string;
  message: string;
  read: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Error Types
export interface FirebaseError {
  code: string;
  message: string;
}
