import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert } from "react-native";
import { signIn } from "../lib/auth";
import { useRouter } from "expo-router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message || "An unknown error occurred");
      } else {
        router.replace("/");
      }
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-6 bg-white">
      <Text className="text-3xl font-bold mb-8">Login</Text>

      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-6"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className={`w-full h-12 rounded-lg items-center justify-center ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-lg">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
