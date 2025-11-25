import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on user role
  if (user.role === 'vet') {
    return <Redirect href="/(vet)/dashboard" />;
  }

  return <Redirect href="/(owner)/home" />;
}
