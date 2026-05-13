import React from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../lib/nativewind';

export default function RiderProfileScreen() {
  return (
    <View className="flex-1 bg-background">
      {/* Map Background Placeholder */}
      <View className="flex-1 bg-surface-container-highest">
        <Image
          source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=37.78825,-122.4324&zoom=13&size=600x600&key=STATIC_MAP_PLACEHOLDER' }}
          className="flex-1"
          resizeMode="cover"
        />
      </View>

      {/* Top Controls */}
      <SafeAreaView className="absolute top-0 left-0 p-4">
        <TouchableOpacity className="w-12 h-12 bg-surface-container-low rounded-full items-center justify-center shadow-md">
          <MaterialIcons name="menu" size={24} color="#323235" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Profile Card */}
      <View className="absolute bottom-0 left-0 right-0 p-4 pb-10">
        <View className="bg-surface-container-low rounded-3xl p-6 shadow-lg">
          {/* Driver Info */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center gap-4">
              <Image source={{ uri: 'https://i.pravatar.cc/150?u=michael' }} className="w-16 h-16 rounded-full" />
              <View>
                <Text className="font-headline text-xl text-on-surface">Michael</Text>
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="star" size={16} color="#ec6337" />
                  <Text className="font-body text-on-surface-variant">4.8</Text>
                </View>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity className="w-11 h-11 bg-primary-container rounded-full items-center justify-center">
                <MaterialIcons name="chat" size={20} color="#5a5e6c" />
              </TouchableOpacity>
              <TouchableOpacity className="w-11 h-11 bg-primary-container rounded-full items-center justify-center">
                <MaterialIcons name="phone" size={20} color="#5a5e6c" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Car Info */}
          <View className="flex-row items-center justify-between mb-8">
            <View>
              <Text className="font-label text-on-surface-variant uppercase text-[10px] tracking-widest mb-1">
                CAR MODEL
              </Text>
              <Text className="font-headline text-lg text-on-surface">Toyota Camry</Text>
            </View>
            <View className="items-end">
              <Text className="font-label text-on-surface-variant uppercase text-[10px] tracking-widest mb-1">
                PLATE NUMBER
              </Text>
              <Text className="font-headline text-lg text-on-surface">ABC 123</Text>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity className="bg-primary h-16 rounded-2xl items-center justify-center shadow-sm active:opacity-90">
            <Text className="font-headline text-white text-lg tracking-wider">START</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
