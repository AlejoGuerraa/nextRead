import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';

const logo = require('../../assets/logo.png');
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home: ['home', 'home-outline'],
  Search: ['search', 'search-outline'],
  Discover: ['albums', 'albums-outline'],
  Notifications: ['notifications', 'notifications-outline'],
  Profile: ['person', 'person-outline'],
};

export default function MainTabs() {
  const { profile } = useAuth();
  const unread = Array.isArray(profile?.notificaciones)
    ? profile.notificaciones.filter((n) => !n.leido).length
    : 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.sky,
        tabBarInactiveTintColor: colors.whiteMuted,
        tabBarStyle: styles.bar,
        tabBarIcon: ({ focused, color }) => {
          if (route.name === 'Discover') {
            return (
              <View style={[styles.middle, focused && styles.middleActive]}>
                <Image source={logo} style={{ width: 30, height: 30 }} resizeMode="contain" />
              </View>
            );
          }
          const [on, off] = ICONS[route.name];
          return (
            <View>
              <Ionicons name={focused ? on : off} size={25} color={color} />
              {route.name === 'Notifications' && unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.header,
    borderTopWidth: 0,
    paddingTop: 6,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.rose,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  middle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.panelLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    borderWidth: 3,
    borderColor: colors.header,
  },
  middleActive: { backgroundColor: colors.primaryLight },
});
