import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#f7f4ed',
          borderTopColor: '#eceae4',
          borderTopWidth: 1,
          overflow: 'visible',
        },
        tabBarActiveTintColor: '#1c1c1c',
        tabBarInactiveTintColor: '#5f5f5d',
        tabBarLabelStyle: {
          fontFamily: 'DMSans_400Regular',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tab_progress'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="chart.line.uptrend.xyaxis" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab_profile'),
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarButton: () => (
            <Pressable
              onPress={() => router.push('/log/camera')}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#1c1c1c',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 6,
                flex: 1,
              }}
            >
              <MaterialIcons name="camera-alt" size={26} color="#fcfbf8" />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
