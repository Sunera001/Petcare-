import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  ownerId: string;
  ownerName?: string;
}

export default function SelectPatientScreen() {
  const router = useRouter();
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllPets();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPets(pets);
    } else {
      const filtered = pets.filter(
        (pet) =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.ownerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPets(filtered);
    }
  }, [searchQuery, pets]);

  const fetchAllPets = async () => {
    try {
      console.log('Fetching all pets...');
      const petsRef = collection(db, 'pets');
      const q = query(petsRef);
      const querySnapshot = await getDocs(q);
      
      const fetchedPets: Pet[] = [];
      
      // First, get all pets
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedPets.push({
          id: doc.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          ownerId: data.ownerId,
        });
      });

      // Then fetch owner names
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const ownerMap = new Map();
      
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === 'owner') {
          ownerMap.set(doc.id, data.fullName);
        }
      });

      // Add owner names to pets
      fetchedPets.forEach((pet) => {
        pet.ownerName = ownerMap.get(pet.ownerId) || 'Unknown Owner';
      });

      console.log('Fetched pets:', fetchedPets.length);
      setPets(fetchedPets);
      setFilteredPets(fetchedPets);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPet = (pet: Pet) => {
    router.push(
      `/(vet)/create-medical-record?petId=${pet.id}&petName=${pet.name}&ownerId=${pet.ownerId}&ownerName=${pet.ownerName}`
    );
  };

  const getSpeciesIcon = (species: string) => {
    switch (species.toLowerCase()) {
      case 'dog':
        return 'dog';
      case 'cat':
        return 'cat';
      case 'bird':
        return 'bird';
      case 'fish':
        return 'fish';
      default:
        return 'paw';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Patient</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by pet name, species, breed, or owner..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingText}>Loading patients...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredPets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="paw-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No patients found' : 'No patients registered'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Patients will appear here once owners register their pets'}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {filteredPets.length} {filteredPets.length === 1 ? 'patient' : 'patients'} found
              </Text>

              {filteredPets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  onPress={() => handleSelectPet(pet)}
                >
                  <View style={styles.petIconContainer}>
                    <Ionicons name={getSpeciesIcon(pet.species)} size={28} color="#0EA5E9" />
                  </View>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <View style={styles.petDetails}>
                      <Text style={styles.petSpecies}>
                        {pet.species.charAt(0).toUpperCase() + pet.species.slice(1)} • {pet.breed}
                      </Text>
                    </View>
                    <View style={styles.ownerInfo}>
                      <Ionicons name="person-outline" size={14} color="#6B7280" />
                      <Text style={styles.ownerName}>{pet.ownerName}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}
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
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  petIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  petDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 14,
    color: '#6B7280',
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ownerName: {
    fontSize: 13,
    color: '#6B7280',
  },
});
