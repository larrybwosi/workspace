import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { signUp } from "../lib/auth";
import { useRouter, Link } from "expo-router";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        Alert.alert("Sign Up Failed", error.message || "An unknown error occurred");
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
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-white">
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-3xl font-bold mb-2">Create Account</Text>
        <Text className="text-gray-500 mb-8 text-center">Join us and start collaborating with your team</Text>

        <TextInput
          className="w-full h-12 border border-gray-300 rounded-lg px-4 mb-4"
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

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
          onPress={handleSignUp}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-lg">
            {loading ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View className="flex-row mt-6">
          <Text className="text-gray-600">Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text className="text-blue-600 font-semibold">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
