import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 64,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f0edef',
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2a3439',
        tabBarInactiveTintColor: '#566166',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="workspaces"
        options={{
          title: 'Workspaces',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="grid-view" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="channels"
        options={{
          title: 'Channels',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat-bubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dms"
        options={{
          title: 'DMs',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="alternate-email" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
