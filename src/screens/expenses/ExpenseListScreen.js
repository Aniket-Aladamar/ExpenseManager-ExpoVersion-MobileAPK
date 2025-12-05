import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Card from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const ExpenseListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, personal, business, reimbursable
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      if (filter !== 'all') {
        q = query(
          collection(db, 'expenses'),
          where('userId', '==', user.uid),
          where('type', '==', filter),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const expensesData = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });

      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, filter]);

  // Refresh expenses when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchExpenses();
      }
      return () => {};
    }, [])
  );

  // Helper function to safely get date
  const getDateFromExpense = (expense) => {
    if (!expense.date) return new Date();
    if (expense.date.toDate && typeof expense.date.toDate === 'function') {
      return expense.date.toDate();
    }
    if (expense.date instanceof Date) {
      return expense.date;
    }
    if (typeof expense.date === 'number') {
      return new Date(expense.date);
    }
    if (typeof expense.date === 'string') {
      return new Date(expense.date);
    }
    return new Date();
  };

  const handleDelete = (expenseId) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'expenses', expenseId));
              fetchExpenses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  const renderExpense = ({ item }) => {
    const category = EXPENSE_CATEGORIES.find((c) => c.id === item.category);

    return (
      <Card style={styles.expenseCard}>
        <View style={styles.expenseRow}>
          <View style={styles.expenseLeft}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: category?.color + '20' },
              ]}>
              <Text style={styles.categoryEmoji}>
                {category?.id === 'food' && '🍽️'}
                {category?.id === 'travel' && '✈️'}
                {category?.id === 'utilities' && '⚡'}
                {category?.id === 'office' && '💼'}
                {category?.id === 'healthcare' && '🏥'}
                {category?.id === 'entertainment' && '🎬'}
                {category?.id === 'shopping' && '🛒'}
                {category?.id === 'transport' && '🚗'}
                {category?.id === 'education' && '📚'}
                {!category && '📌'}
              </Text>
            </View>
            <View style={styles.expenseInfo}>
              <Text style={styles.expenseVendor}>{item.vendor}</Text>
              <Text style={styles.expenseCategory}>{category?.label}</Text>
              <Text style={styles.expenseDate}>
                {format(getDateFromExpense(item), 'MMM dd, yyyy')}
              </Text>
              {item.receiptUrl && (
                <TouchableOpacity onPress={() => setSelectedImage(item.receiptUrl)}>
                  <Text style={styles.viewReceipt}>📎 View Receipt</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.expenseRight}>
            <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
            {item.receiptUrl && (
              <TouchableOpacity 
                style={styles.thumbnailContainer}
                onPress={() => setSelectedImage(item.receiptUrl)}>
                <Image 
                  source={{ uri: item.receiptUrl }} 
                  style={styles.thumbnail}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}>
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'personal' && styles.filterTabActive]}
          onPress={() => setFilter('personal')}>
          <Text
            style={[
              styles.filterText,
              filter === 'personal' && styles.filterTextActive,
            ]}>
            Personal
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'business' && styles.filterTabActive]}
          onPress={() => setFilter('business')}>
          <Text
            style={[
              styles.filterText,
              filter === 'business' && styles.filterTextActive,
            ]}>
            Business
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'reimbursable' && styles.filterTabActive]}
          onPress={() => setFilter('reimbursable')}>
          <Text
            style={[
              styles.filterText,
              filter === 'reimbursable' && styles.filterTextActive,
            ]}>
            Reimbursable
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchExpenses} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
            <Text style={styles.emptySubtext}>Add your first expense to get started</Text>
          </View>
        }
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalCloseArea}
            onPress={() => setSelectedImage(null)}>
            <View style={styles.modalContent}>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullImage}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSelectedImage(null)}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.surface,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.lg,
  },
  expenseCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  expenseLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 24,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseVendor: {
    ...typography.subtitle1,
    color: colors.text,
  },
  expenseCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  expenseDate: {
    ...typography.caption,
    color: colors.textLight,
    marginTop: 2,
  },
  viewReceipt: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    ...typography.h6,
    color: colors.text,
  },
  thumbnailContainer: {
    marginTop: spacing.xs,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  typeTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: spacing.xs,
  },
  typeText: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  deleteText: {
    ...typography.caption,
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.h6,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.body2,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  closeButtonText: {
    ...typography.button,
    color: colors.surface,
  },
});

export default ExpenseListScreen;
