interface CustomUser { avatar?: string; banner?: string; name: string; image?: string; id: string; }
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSession, signOut } from '../../lib/auth';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <ScrollView>
        {/* Banner Section */}
        <View className="h-32 bg-discord-blurple">
          {(session.user as CustomUser).banner && <Image source={{ uri: (session.user as CustomUser).banner }} className="w-full h-full" />}
        </View>

        {/* Avatar and Identity Section */}
        <View className="px-4 -mt-12 items-start mb-6">
          <View className="w-24 h-24 rounded-full bg-discord-tertiary p-1 overflow-hidden border-4 border-discord-base">
            {(session.user as CustomUser).avatar || session.user.image ? (
              <Image
                source={{ uri: ((session.user as CustomUser).avatar || session.user.image) || undefined }}
                className="w-full h-full rounded-full"
              />
            ) : (
              <View className="w-full h-full rounded-full items-center justify-center bg-discord-blurple">
                <Text className="text-3xl font-bold text-white">{session.user.name?.charAt(0)}</Text>
              </View>
            )}
            <View className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-discord-green border-4 border-discord-base" />
          </View>
          <Text className="text-discord-header text-2xl font-bold mt-2">{session.user.name}</Text>
          <Text className="text-discord-muted">#{session.user.id.slice(0, 4)}</Text>
        </View>

        {/* Menu Items */}
        <View className="px-4 gap-2">
          <ProfileItem
            icon="edit"
            label="Edit Profile"
            onPress={() => router.push({ pathname: '/settings/profile' })}
          />
          <ProfileItem icon="notifications" label="Notifications" onPress={() => {}} />
          <ProfileItem icon="security" label="Privacy & Safety" onPress={() => {}} />
          <ProfileItem icon="qr-code-scanner" label="Scan QR Code" onPress={() => router.push('/auth/qr-scanner')} />
          <ProfileItem icon="logout" label="Log Out" color="#F23F43" onPress={handleLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileItem({
  icon,
  label,
  onPress,
  color,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity className="flex-row items-center p-4 bg-discord-sidebar/50 rounded-xl" onPress={onPress}>
      <MaterialIcons name={icon} size={24} color={color || '#949BA4'} />
      <Text className={`ml-4 flex-1 font-medium ${color ? 'text-red-500' : 'text-discord-header'}`}>{label}</Text>
      <MaterialIcons name="chevron-right" size={24} color="#949BA4" />
    </TouchableOpacity>
  );
}
