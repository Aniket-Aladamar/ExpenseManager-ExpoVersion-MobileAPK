import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const BudgetNotification = ({ warnings, onDismiss, onViewDetails }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {warnings.map((warning, index) => (
          <View
            key={index}
            style={[
              styles.notification,
              warning.severity === 'high' ? styles.notificationHigh : styles.notificationMedium,
            ]}>
            <View style={styles.notificationContent}>
              <Text style={styles.message}>{warning.message}</Text>
              <Text style={styles.details}>{warning.details}</Text>
            </View>
            {onViewDetails && (
              <TouchableOpacity onPress={onViewDetails} style={styles.actionButton}>
                <Text style={styles.actionText}>View</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minWidth: 280,
    maxWidth: 320,
  },
  notificationHigh: {
    backgroundColor: colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  notificationMedium: {
    backgroundColor: colors.warning + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  notificationContent: {
    flex: 1,
  },
  message: {
    ...typography.subtitle2,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  details: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary + '20',
    borderRadius: 4,
  },
  actionText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: spacing.md,
  },
  closeText: {
    fontSize: 20,
    color: colors.textLight,
  },
});

export default BudgetNotification;
