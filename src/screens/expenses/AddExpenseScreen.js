import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES, EXPENSE_TYPES } from '../../constants/categories';

const ExpenseSchema = Yup.object().shape({
  vendor: Yup.string().required('Vendor name is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  date: Yup.date().required('Date is required'),
  category: Yup.string().required('Category is required'),
  type: Yup.string().required('Expense type is required'),
});

const AddExpenseScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const formik = useFormik({
    initialValues: {
      vendor: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      type: 'personal',
      description: '',
      hasGST: false,
      gstAmount: '',
    },
    validationSchema: ExpenseSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        let receiptUri = null;

        // Store receipt URI locally (no upload to Firebase Storage)
        if (selectedImage || uploadedFile) {
          const fileToUpload = selectedImage || uploadedFile;
          receiptUri = fileToUpload.uri; // Just store the local URI
        }

        // Add expense to Firestore
        await addDoc(collection(db, 'expenses'), {
          userId: user.uid,
          vendor: values.vendor,
          amount: parseFloat(values.amount),
          date: new Date(values.date),
          category: values.category,
          type: values.type,
          description: values.description,
          hasGST: values.hasGST,
          gstAmount: values.hasGST ? parseFloat(values.gstAmount || 0) : 0,
          receiptUrl: receiptUri, // Local URI instead of cloud URL
          createdAt: new Date(),
        });

        Alert.alert('Success', 'Expense added successfully!');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding expense:', error);
        Alert.alert('Error', 'Failed to add expense. Please try again.');
      }
      setLoading(false);
    },
  });

  const handleCameraLaunch = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setUploadedFile(null);
    }
  };

  const handleImagePicker = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Media library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setUploadedFile(null);
    }
  };

  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });

      if (result.canceled === false && result.assets && result.assets[0]) {
        setUploadedFile(result.assets[0]);
        setSelectedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add New Expense</Text>

        {/* Upload Options */}
        <Card style={styles.uploadCard}>
          <Text style={styles.sectionTitle}>Upload Receipt</Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleCameraLaunch}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentPicker}>
              <Text style={styles.uploadIcon}>📄</Text>
              <Text style={styles.uploadText}>File</Text>
            </TouchableOpacity>
          </View>

          {(selectedImage || uploadedFile) && (
            <View style={styles.previewContainer}>
              {selectedImage && (
                <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
              )}
              {uploadedFile && (
                <Text style={styles.fileName}>📎 {uploadedFile.name}</Text>
              )}
            </View>
          )}
        </Card>

        {/* Expense Details */}
        <Card style={styles.formCard}>
          <Input
            label="Vendor Name *"
            placeholder="Enter vendor name"
            value={formik.values.vendor}
            onChangeText={formik.handleChange('vendor')}
            error={formik.touched.vendor && formik.errors.vendor}
          />

          <Input
            label="Amount *"
            placeholder="0.00"
            value={formik.values.amount}
            onChangeText={formik.handleChange('amount')}
            error={formik.touched.amount && formik.errors.amount}
            keyboardType="decimal-pad"
          />

          <Input
            label="Date *"
            placeholder="YYYY-MM-DD"
            value={formik.values.date}
            onChangeText={formik.handleChange('date')}
            error={formik.touched.date && formik.errors.date}
          />

          {/* Category Selection */}
          <Text style={styles.label}>Category *</Text>
          <View style={styles.categoryGrid}>
            {EXPENSE_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  formik.values.category === category.id && {
                    backgroundColor: category.color,
                  },
                ]}
                onPress={() => formik.setFieldValue('category', category.id)}>
                <Text
                  style={[
                    styles.categoryText,
                    formik.values.category === category.id && styles.categoryTextSelected,
                  ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formik.touched.category && formik.errors.category && (
            <Text style={styles.errorText}>{formik.errors.category}</Text>
          )}

          {/* Expense Type */}
          <Text style={styles.label}>Expense Type *</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formik.values.type === 'personal' && styles.typeButtonSelected,
              ]}
              onPress={() => formik.setFieldValue('type', 'personal')}>
              <Text
                style={[
                  styles.typeButtonText,
                  formik.values.type === 'personal' && styles.typeButtonTextSelected,
                ]}>
                Personal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formik.values.type === 'business' && styles.typeButtonSelected,
              ]}
              onPress={() => formik.setFieldValue('type', 'business')}>
              <Text
                style={[
                  styles.typeButtonText,
                  formik.values.type === 'business' && styles.typeButtonTextSelected,
                ]}>
                Business
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formik.values.type === 'reimbursable' && styles.typeButtonSelected,
              ]}
              onPress={() => formik.setFieldValue('type', 'reimbursable')}>
              <Text
                style={[
                  styles.typeButtonText,
                  formik.values.type === 'reimbursable' && styles.typeButtonTextSelected,
                ]}>
                Reimbursable
              </Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Description (Optional)"
            placeholder="Add notes or description"
            value={formik.values.description}
            onChangeText={formik.handleChange('description')}
            multiline
            numberOfLines={3}
          />

          {/* GST Section */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => formik.setFieldValue('hasGST', !formik.values.hasGST)}>
            <View
              style={[styles.checkbox, formik.values.hasGST && styles.checkboxChecked]}>
              {formik.values.hasGST && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Include GST Information</Text>
          </TouchableOpacity>

          {formik.values.hasGST && (
            <Input
              label="GST Amount"
              placeholder="0.00"
              value={formik.values.gstAmount}
              onChangeText={formik.handleChange('gstAmount')}
              keyboardType="decimal-pad"
            />
          )}
        </Card>

        <Button
          title="Add Expense"
          onPress={formik.handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  uploadCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  uploadButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  uploadButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  uploadText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  previewContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  fileName: {
    ...typography.body2,
    color: colors.text,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    width: '100%',
  },
  formCard: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.subtitle2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.divider,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.divider,
    marginRight: spacing.sm,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    ...typography.body2,
    color: colors.text,
  },
  typeButtonTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...typography.body2,
    color: colors.text,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginBottom: spacing.xl,
  },
});

export default AddExpenseScreen;
