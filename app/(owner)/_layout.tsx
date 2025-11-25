import { Stack } from 'expo-router';

export default function OwnerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="home" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
