import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-blue-600">Skyrme Mobile</Text>
      <Text className="mt-2 text-gray-500">Welcome to the mobile app!</Text>

      <Link href="/login" className="mt-4 text-blue-500 underline">
        Go to Login
      </Link>
    </View>
  );
}
