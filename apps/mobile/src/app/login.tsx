import { useState } from "react";
import { Text, View, TouchableOpacity, Alert, ScrollView } from "react-native";
import { authClient } from "../lib/auth";
import { useRouter } from "expo-router";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSocialLogin = async (provider: "google" | "github" | "instagram") => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "skryme-auth://",
      });
<<<<<<< HEAD
<<<<<<< HEAD

      if (error) {
        Alert.alert("Login Failed", error.message || "An unknown error occurred");
      } else {
        router.replace("/");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
=======
    } catch {
      Alert.alert("Error", `Unable to login with ${provider}. Please try again.`);
>>>>>>> 50fd6ca5fff36015158cde7b8f0d1fcd6ce52064
=======
    } catch {
      Alert.alert("Error", `Unable to login with ${provider}. Please try again.`);
>>>>>>> 2162c4e4c246182311b63e68f6998e8baad44cc6
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
    <View className="flex-1 items-center justify-center p-6">
      <Text className="text-3xl font-bold mb-8">Login</Text>

      <View className="w-full flex-row justify-between mb-6">
        <TouchableOpacity
          className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center mr-2"
          onPress={() => handleSocialLogin("google")}
          disabled={loading}
        >
          <Text className="font-semibold">Google</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center mx-1"
          onPress={() => handleSocialLogin("github")}
          disabled={loading}
        >
          <Text className="font-semibold">GitHub</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 h-12 border border-gray-300 rounded-lg items-center justify-center ml-2"
          onPress={() => handleSocialLogin("instagram")}
          disabled={loading}
        >
          <Text className="font-semibold">Instagram</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row mt-6">
        <Text className="text-gray-600">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/signup" as any)}>
          <Text className="text-blue-600 font-semibold">Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
    </ScrollView>
  );
}
