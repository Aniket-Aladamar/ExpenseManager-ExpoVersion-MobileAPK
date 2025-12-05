import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const ProfileScreen = ({ navigation }) => {
  const { user, userData, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          const result = await logout();
          if (!result.success) {
            Alert.alert('Error', result.error);
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'budget',
      title: 'Monthly Budget',
      icon: '💰',
      onPress: () => Alert.alert('Coming Soon', 'Budget settings coming soon!'),
    },
    {
      id: 'currency',
      title: 'Currency',
      icon: '💱',
      onPress: () => Alert.alert('Coming Soon', 'Currency settings coming soon!'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon!'),
    },
    {
      id: 'categories',
      title: 'Manage Categories',
      icon: '🏷️',
      onPress: () => Alert.alert('Coming Soon', 'Category management coming soon!'),
    },
    {
      id: 'backup',
      title: 'Backup & Sync',
      icon: '☁️',
      onPress: () => Alert.alert('Coming Soon', 'Backup settings coming soon!'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: '🔒',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        {menuItems.map((item) => (
          <Card key={item.id} style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>2024.12.05</Text>
          </View>
        </Card>
      </View>

      <View style={styles.logoutContainer}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ for smart expense management</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.surface,
  },
  name: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  menuCard: {
    marginBottom: spacing.sm,
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  menuTitle: {
    ...typography.body1,
    color: colors.text,
  },
  menuArrow: {
    ...typography.h4,
    color: colors.textLight,
  },
  infoCard: {
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body2,
    color: colors.text,
  },
  logoutContainer: {
    padding: spacing.lg,
  },
  logoutButton: {
    borderColor: colors.error,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
  },
});

export default ProfileScreen;
