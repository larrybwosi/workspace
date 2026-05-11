import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { apiClient } from '@repo/api-client';

export default function QRScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  if (!permission) {
    return (
      <View className="flex-1 bg-discord-base items-center justify-center">
        <ActivityIndicator size="large" color="#5865F2" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-discord-base items-center justify-center p-6">
        <MaterialIcons name="camera-alt" size={64} color="#949BA4" />
        <Text className="text-discord-header text-xl font-bold mt-4 text-center">Camera Access Required</Text>
<<<<<<< HEAD
        <Text className="text-discord-muted text-center mt-2 mb-8">
          We need your permission to scan QR codes for desktop login.
        </Text>
=======
        <Text className="text-discord-muted text-center mt-2 mb-8">We need your permission to scan QR codes for desktop login.</Text>
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
        <TouchableOpacity onPress={requestPermission} className="bg-discord-blurple px-8 py-3 rounded-lg">
          <Text className="text-white font-bold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setSessionId(data);
    setScanned(true);
    setShowConfirm(true);
  };

  const handleAuthorize = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/device/qr/authorize', { sessionId });
      Alert.alert('Success', 'Login authorized successfully!');
      router.back();
    } catch (error: any) {
      console.error('Authorization failed', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to authorize login. The QR code might have expired.'
      );
      setScanned(false);
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setScanned(false);
    setShowConfirm(false);
    setSessionId(null);
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />

      <View className="absolute top-12 left-4 z-10">
<<<<<<< HEAD
        <TouchableOpacity className="bg-black/50 p-2 rounded-full" onPress={() => router.back()}>
=======
        <TouchableOpacity
          className="bg-black/50 p-2 rounded-full"
          onPress={() => router.back()}
        >
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        <View className="w-64 h-64 border-2 border-discord-blurple rounded-3xl" />
<<<<<<< HEAD
        <Text className="text-white font-bold mt-8 bg-black/50 px-4 py-2 rounded-full">Scan QR code on desktop</Text>
      </View>

      <Modal visible={showConfirm} transparent={true} animationType="slide">
=======
        <Text className="text-white font-bold mt-8 bg-black/50 px-4 py-2 rounded-full">
           Scan QR code on desktop
        </Text>
      </View>

      <Modal
        visible={showConfirm}
        transparent={true}
        animationType="slide"
      >
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-discord-base rounded-t-3xl p-8 items-center">
            <View className="w-20 h-20 rounded-full bg-discord-blurple/10 items-center justify-center mb-4">
              <MaterialIcons name="laptop-mac" size={48} color="#5865F2" />
            </View>
            <Text className="text-discord-header text-2xl font-bold mb-2">Authorize Login?</Text>
            <Text className="text-discord-muted text-center mb-8">
              Are you trying to log in to Skyrme on a desktop device?
            </Text>

            <View className="flex-row gap-4 w-full">
              <TouchableOpacity
                className="flex-1 bg-discord-tertiary p-4 rounded-xl items-center"
                onPress={handleCancel}
                disabled={loading}
              >
                <Text className="text-discord-header font-bold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-discord-blurple p-4 rounded-xl items-center"
                onPress={handleAuthorize}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Yes, Log Me In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
