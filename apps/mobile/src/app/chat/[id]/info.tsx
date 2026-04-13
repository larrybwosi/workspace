import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ThreadInfoPanel() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* TopAppBar */}
      <View className="h-16 flex-row items-center justify-between px-6 bg-[#f8f9fb] border-b border-surface-container">
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="grid-view" size={24} color="#5f5e5e" />
          <Text className="text-lg font-semibold text-[#2a3439]">Website / v3.0</Text>
        </View>
        <TouchableOpacity>
          <MaterialIcons name="info" size={24} color="#5f5e5e" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
        {/* Header Hero Section */}
        <View className="mb-6">
          <Text className="text-2xl font-headline font-bold tracking-tight text-on-surface">Thread Details</Text>
          <Text className="text-sm text-on-surface-variant font-body">Global Project Management Revision</Text>
        </View>

        {/* Main Info Card */}
        <View className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">MAIN INFO</Text>
            <View className="bg-secondary-container px-3 py-1 rounded-full">
              <Text className="text-on-secondary-container text-[10px] font-bold">Active</Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex-row items-center gap-4">
              <View className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB014_hMryIIUvnPpNffDPuf2V5DnKiGC71P49obUCUlXIZGbwjpQ2JWvFMF-yPekt0ZY0sgboOCdsMTBfFHhymmhwcd4zrNPXLMlklshwZ0TAUN7UacNwNqTVngnJrwRCvfx9e9EqqWGcJ0Gg7nVjAFP-u6reFffkrv_QlAhvxGyqXz2N0E5ulDARY-txGzr4rwSw-5Qb9rsZsHZ-YI_6QyZ377x89mTLnuYT6HBdMmq5a8KO0MnmQasQJMWv01cw5rRKJ63aWpXM' }}
                  className="w-full h-full"
                />
              </View>
              <View>
                <Text className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">CREATOR</Text>
                <Text className="text-sm font-semibold text-on-surface">Alex Rivera</Text>
              </View>
            </View>

            <View className="flex-row justify-between border-t border-outline-variant/10 pt-4">
              <View>
                <Text className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">DATE CREATED</Text>
                <Text className="text-sm font-semibold text-on-surface">Oct 24, 2023</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">LAST UPDATE</Text>
                <Text className="text-sm font-semibold text-on-surface">2h ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thread Activity Visualization */}
        <View className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10 mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">THREAD ACTIVITY</Text>
            <Text className="text-[10px] text-secondary font-bold">+12% vs last week</Text>
          </View>
          <View className="h-24 flex-row items-end justify-between gap-1">
            <View className="flex-1 bg-surface-container h-1/2 rounded-t-sm" />
            <View className="flex-1 bg-surface-container h-2/3 rounded-t-sm" />
            <View className="flex-1 bg-surface-container h-1/3 rounded-t-sm" />
            <View className="flex-1 bg-secondary h-3/4 rounded-t-sm" />
            <View className="flex-1 bg-secondary h-[95%] rounded-t-sm" />
            <View className="flex-1 bg-surface-container h-2/3 rounded-t-sm" />
            <View className="flex-1 bg-surface-container h-4/5 rounded-t-sm" />
            <View className="flex-1 bg-secondary h-1/2 rounded-t-sm" />
            <View className="flex-1 bg-secondary h-2/3 rounded-t-sm" />
            <View className="flex-1 bg-secondary h-4/5 rounded-t-sm" />
            <View className="flex-1 bg-primary h-[90%] rounded-t-sm" />
            <View className="flex-1 bg-primary h-3/4 rounded-t-sm" />
          </View>
          <View className="flex-row justify-between mt-2 px-1">
            <Text className="text-[8px] text-on-surface-variant font-bold">MON</Text>
            <Text className="text-[8px] text-on-surface-variant font-bold">WED</Text>
            <Text className="text-[8px] text-on-surface-variant font-bold">FRI</Text>
            <Text className="text-[8px] text-on-surface-variant font-bold">SUN</Text>
          </View>
        </View>

        {/* Linked Threads */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between px-1 mb-3">
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">LINKED THREADS</Text>
            <TouchableOpacity><Text className="text-xs font-bold text-secondary">View all</Text></TouchableOpacity>
          </View>
          <View className="gap-2">
            <TouchableOpacity className="bg-surface-container-lowest p-4 rounded-xl flex-row items-center justify-between border border-outline-variant/5">
              <View className="flex-row items-center gap-3">
                <View className="p-2 bg-surface-container rounded-lg">
                  <MaterialIcons name="link" size={18} color="#5a5e6c" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-on-surface">Q4 Infrastructure Audit</Text>
                  <Text className="text-[10px] text-on-surface-variant">32 messages • Finalized</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#717c82" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-surface-container-lowest p-4 rounded-xl flex-row items-center justify-between border border-outline-variant/5">
              <View className="flex-row items-center gap-3">
                <View className="p-2 bg-surface-container rounded-lg">
                  <MaterialIcons name="link" size={18} color="#5a5e6c" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-on-surface">Security Protocol v2</Text>
                  <Text className="text-[10px] text-on-surface-variant">12 messages • In progress</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#717c82" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Members Section */}
        <View className="mb-10">
          <View className="flex-row items-center justify-between px-1 mb-3">
            <Text className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">MEMBERS</Text>
            <TouchableOpacity><Text className="text-xs font-bold text-secondary">Add Participant</Text></TouchableOpacity>
          </View>
          <View className="bg-surface-container-lowest rounded-xl divide-y divide-outline-variant/10 overflow-hidden shadow-sm border border-outline-variant/5">
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full border-2 border-surface-container p-0.5">
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9HFlvAWLKXSr6fQnvbF3D3inbuI2n5AUCw49vLtjvnVxS7zDbzk9W65pdmkt14fSQyIsSvPfINwxCao6ztR2pJaH5OKCGlWvwx46mCGIM9wIceH8AKK2-xsF7T7ys47C9kkR3vRjqITC30HUxzg-ymHfSKImMswSROCGgYysdqj3_bwS_-4kwSw25g2AhliDQ3hcLrxQMg6SzEBmtdZ0B_Y27DWaSMu6KIUHMPFX4UoMET2icwOp7KjAMNSm0n4mrrpw07lXTV20' }}
                    className="w-full h-full rounded-full"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-on-surface">Sarah Jenkins</Text>
                  <Text className="text-[10px] text-on-surface-variant">Lead Designer</Text>
                </View>
              </View>
              <View className="bg-tertiary/10 px-2 py-0.5 rounded">
                <Text className="text-tertiary text-[10px] font-bold uppercase">ADMIN</Text>
              </View>
            </View>
            <View className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full border-2 border-surface-container p-0.5">
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBoX5h09DAOWFQEE8-X4l9FIVmddflfxbLuVt_SjCfbCxonTMRhCE02jarfWjNGbNBiF3aTaf-9w7laT_oUHAzsMrSDn3EKjw6C_KNYI2D7QpKNYdYr5CFD793CWXuwSHblgwW1kPw53t1qZncKy6fnJTJv-HxM_t-B0KCh7jxdj1GUbPMRmuV0Itrg33F-7WB4dujSKxdxmlg3yg6ZVhNHcoWmTrgeIMYePUph4pmpy20DFgRCvAFTRAIe8mnmCLxWr5tQnbO5Clg' }}
                    className="w-full h-full rounded-full"
                  />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-on-surface">Michael Chen</Text>
                  <Text className="text-[10px] text-on-surface-variant">Senior Developer</Text>
                </View>
              </View>
              <View className="bg-secondary/10 px-2 py-0.5 rounded">
                <Text className="text-secondary text-[10px] font-bold uppercase">EDITOR</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Close Action Button */}
      <TouchableOpacity
        className="absolute bottom-10 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        onPress={() => router.back()}
      >
        <MaterialIcons name="close" size={24} color="#f7f7ff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
