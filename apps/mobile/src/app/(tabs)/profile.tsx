import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSession, signOut } from '../../lib/auth';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function Profile() {
  const { data: session } = (useSession as any)();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl font-bold mb-4">You are not logged in</Text>
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-lg"
          onPress={() => router.push('/login')}
        >
          <Text className="text-white font-bold">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 pt-16 items-center bg-white border-b border-surface-container">
        <View className="w-24 h-24 rounded-full bg-surface-container items-center justify-center mb-4 overflow-hidden border-4 border-primary/10">
          {session.user.image ? (
            <Image source={{ uri: session.user.image }} className="w-full h-full" />
          ) : (
            <Text className="text-3xl font-bold text-on-surface">{session.user.name?.charAt(0)}</Text>
          )}
        </View>
        <Text className="text-2xl font-bold text-on-surface">{session.user.name}</Text>
        <Text className="text-on-surface-variant mb-6">{session.user.email}</Text>

        <TouchableOpacity
          className="flex-row items-center bg-surface-container-low px-4 py-2 rounded-full"
          onPress={() => {/* TODO: Edit profile */}}
        >
          <MaterialIcons name="edit" size={16} color="#5f5e5e" />
          <Text className="ml-2 font-semibold text-on-surface">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View className="p-4">
        <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-4 ml-2">Account</Text>

        <TouchableOpacity className="flex-row items-center p-4 bg-white rounded-xl mb-2 border border-surface-container">
          <MaterialIcons name="notifications-none" size={24} color="#5f5e5e" />
          <Text className="ml-4 flex-1 font-medium">Notifications</Text>
          <MaterialIcons name="chevron-right" size={24} color="#5f5e5e" />
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center p-4 bg-white rounded-xl mb-2 border border-surface-container">
          <MaterialIcons name="security" size={24} color="#5f5e5e" />
          <Text className="ml-4 flex-1 font-medium">Privacy & Security</Text>
          <MaterialIcons name="chevron-right" size={24} color="#5f5e5e" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center p-4 bg-white rounded-xl mb-8 border border-surface-container"
          onPress={handleLogout}
        >
          <MaterialIcons name="logout" size={24} color="#ef4444" />
          <Text className="ml-4 flex-1 font-medium text-red-500">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
