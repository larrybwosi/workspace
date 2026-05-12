import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useSession } from '../../lib/auth';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEligibleAssets } from '@repo/api-client';
import axios from 'axios';
import { getBaseURL } from '../../lib/env';

export default function ProfileSettings() {
  const { data: session } = (useSession as any)();
  const { data: assets, isLoading: assetsLoading } = useEligibleAssets();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const [avatar, setAvatar] = useState(session?.user?.avatar || session?.user?.image);
  const [banner, setBanner] = useState(session?.user?.banner);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const baseURL = getBaseURL();
      await axios.post(`${baseURL}/api/users/me`, {
        avatar,
        banner,
      });
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!session) return null;

  return (
    <SafeAreaView className="flex-1 bg-discord-base">
      <View className="h-14 flex-row items-center px-4 border-b border-discord-tertiary">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="close" size={24} color="#DBDEE1" />
        </TouchableOpacity>
        <Text className="text-discord-header font-bold text-lg flex-1">Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator size="small" color="#5865F2" />
          ) : (
            <Text className="text-discord-blurple font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Preview */}
        <View className="m-4 rounded-xl bg-discord-tertiary overflow-hidden">
          <View style={{ height: 100, backgroundColor: '#5865F2' }}>
            {banner && <Image source={{ uri: banner }} className="w-full h-full" />}
          </View>
          <View className="px-4 -mt-8 pb-4">
            <View className="w-20 h-20 rounded-full bg-discord-tertiary p-1 border-4 border-discord-tertiary">
              <Image
                source={{ uri: avatar || 'https://via.placeholder.com/150' }}
                className="w-full h-full rounded-full"
              />
            </View>
            <Text className="text-discord-header text-xl font-bold mt-2">{session.user.name}</Text>
          </View>
        </View>

        <View className="px-4 mt-4">
          <Text className="text-discord-muted font-bold text-xs mb-4 uppercase">Select Custom Assets</Text>

          {assetsLoading ? (
            <ActivityIndicator />
          ) : (
            <View>
              <Text className="text-discord-header font-medium mb-2">Avatars</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
                {assets?.profileAssets
                  ?.filter((a: any) => a.type === 'avatar')
                  .map((asset: any) => (
                    <TouchableOpacity
                      key={asset.id}
                      onPress={() => setAvatar(asset.url)}
                      className={`mr-3 rounded-full p-1 ${avatar === asset.url ? 'border-2 border-discord-blurple' : ''}`}
                    >
                      <Image source={{ uri: asset.url }} className="w-16 h-16 rounded-full" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <Text className="text-discord-header font-medium mb-2">Banners</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                {assets?.profileAssets
                  ?.filter((a: any) => a.type === 'banner')
                  .map((asset: any) => (
                    <TouchableOpacity
                      key={asset.id}
                      onPress={() => setBanner(asset.url)}
                      className={`mr-3 rounded-lg overflow-hidden ${banner === asset.url ? 'border-2 border-discord-blurple' : ''}`}
                    >
                      <Image source={{ uri: asset.url }} className="w-24 h-12" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
