import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const styles = [baseStyles.button];

    // Size
    if (size === 'small') styles.push(baseStyles.small);
    if (size === 'large') styles.push(baseStyles.large);

    // Variant
    if (variant === 'primary') styles.push(baseStyles.primary);
    if (variant === 'secondary') styles.push(baseStyles.secondary);
    if (variant === 'outline') styles.push(baseStyles.outline);
    if (variant === 'ghost') styles.push(baseStyles.ghost);

    // State
    if (disabled || loading) styles.push(baseStyles.disabled);

    return styles;
  };

  const getTextStyle = () => {
    const styles = [baseStyles.text];

    if (variant === 'outline' || variant === 'ghost') {
      styles.push(baseStyles.outlineText);
    }

    return styles;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.surface}
        />
      ) : (
        <View style={baseStyles.content}>
          {icon && <View style={baseStyles.icon}>{icon}</View>}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    ...typography.button,
    color: colors.surface,
    textTransform: 'none',
  },
  outlineText: {
    color: colors.primary,
  },
});

export default Button;
