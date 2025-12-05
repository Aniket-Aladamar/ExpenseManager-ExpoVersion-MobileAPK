import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';

// Main Screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Signup" component={SignupScreen} />
  </Stack.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}>
    <Stack.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="AddExpense"
      component={AddExpenseScreen}
      options={{ title: 'Add Expense' }}
    />
    <Stack.Screen
      name="ExpenseList"
      component={ExpenseListScreen}
      options={{ title: 'All Expenses' }}
    />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}>
    <Stack.Screen
      name="ReportsMain"
      component={ReportsScreen}
      options={{ title: 'Reports' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.surface,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: colors.text,
      headerTitleStyle: {
        fontWeight: '600',
      },
    }}>
    <Stack.Screen
      name="ProfileMain"
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color }) => {
        let icon;

        if (route.name === 'Home') {
          icon = '📊';
        } else if (route.name === 'Reports') {
          icon = '📈';
        } else if (route.name === 'Profile') {
          icon = '👤';
        }

        return <Text style={{ fontSize: 24 }}>{icon}</Text>;
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopColor: colors.border,
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      headerShown: false,
    })}>
    <Tab.Screen name="Home" component={HomeStack} />
    <Tab.Screen name="Reports" component={ReportsStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
