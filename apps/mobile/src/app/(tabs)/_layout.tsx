import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1F22' : '#E3E5E8',
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#949BA4',
        tabBarActiveBackgroundColor: isDark ? '#313338' : '#FFFFFF',
      }}
    >
      <Tabs.Screen
        name="workspaces"
        options={{
          title: 'Servers',
          tabBarIcon: ({ color }) => <MaterialIcons name="grid-view" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          href: null, // Hidden from tabs, accessed via Drawer/Sidebar
        }}
      />
      <Tabs.Screen
        name="dms"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MaterialIcons name="chat" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
