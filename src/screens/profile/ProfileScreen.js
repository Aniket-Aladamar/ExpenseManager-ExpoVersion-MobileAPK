import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const ProfileScreen = ({ navigation }) => {
  const { user, userData, logout } = useAuth();
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('usd');
  const [toCurrency, setToCurrency] = useState('inr');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currencies, setCurrencies] = useState({});
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(null); // 'from' or 'to'
  
  // Budget state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgets, setBudgets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [monthlySpending, setMonthlySpending] = useState({});

  useEffect(() => {
    fetchCurrencyList();
    fetchBudgets();
    fetchMonthlySpending();
  }, []);

  const fetchCurrencyList = async () => {
    try {
      const response = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies.min.json'
      );
      const data = await response.json();
      setCurrencies(data);
    } catch (error) {
      // Fallback to Cloudflare
      try {
        const response = await fetch(
          'https://latest.currency-api.pages.dev/v1/currencies.json'
        );
        const data = await response.json();
        setCurrencies(data);
      } catch (fallbackError) {
        console.error('Error fetching currencies:', fallbackError);
      }
    }
  };

  const convertCurrency = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Try primary API
      const response = await fetch(
        `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency}.json`
      );
      const data = await response.json();
      const rate = data[fromCurrency][toCurrency];
      const result = parseFloat(amount) * rate;
      setConvertedAmount(result.toFixed(2));
    } catch (error) {
      // Fallback to Cloudflare
      try {
        const response = await fetch(
          `https://latest.currency-api.pages.dev/v1/currencies/${fromCurrency}.json`
        );
        const data = await response.json();
        const rate = data[fromCurrency][toCurrency];
        const result = parseFloat(amount) * rate;
        setConvertedAmount(result.toFixed(2));
      } catch (fallbackError) {
        Alert.alert('Error', 'Failed to convert currency. Please try again.');
      }
    }
    setLoading(false);
  };

  // Budget functions
  const fetchBudgets = async () => {
    try {
      const q = query(
        collection(db, 'budgets'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const budgetData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBudgets(budgetData);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const fetchMonthlySpending = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      
      const spending = {};
      querySnapshot.docs.forEach(doc => {
        const expense = doc.data();
        const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
        
        if (expenseDate >= startOfMonth) {
          const category = expense.category;
          spending[category] = (spending[category] || 0) + parseFloat(expense.amount);
        }
      });
      
      setMonthlySpending(spending);
    } catch (error) {
      console.error('Error fetching monthly spending:', error);
    }
  };

  const saveBudget = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    setBudgetLoading(true);
    try {
      if (editingBudgetId) {
        // Update existing budget
        await updateDoc(doc(db, 'budgets', editingBudgetId), {
          amount: parseFloat(budgetAmount),
        });
        Alert.alert('Success', 'Budget updated successfully');
      } else {
        // Check if budget already exists for this category
        const existing = budgets.find(b => b.category === selectedCategory);
        if (existing) {
          Alert.alert('Error', 'Budget already exists for this category. Please edit it instead.');
          setBudgetLoading(false);
          return;
        }
        
        // Create new budget
        await addDoc(collection(db, 'budgets'), {
          userId: user.uid,
          category: selectedCategory,
          amount: parseFloat(budgetAmount),
          createdAt: new Date(),
        });
        Alert.alert('Success', 'Budget created successfully');
      }
      
      await fetchBudgets();
      resetBudgetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    }
    setBudgetLoading(false);
  };

  const deleteBudget = async (budgetId) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'budgets', budgetId));
              await fetchBudgets();
              Alert.alert('Success', 'Budget deleted successfully');
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          },
        },
      ]
    );
  };

  const editBudget = (budget) => {
    setSelectedCategory(budget.category);
    setBudgetAmount(budget.amount.toString());
    setEditingBudgetId(budget.id);
  };

  const resetBudgetForm = () => {
    setSelectedCategory('');
    setBudgetAmount('');
    setEditingBudgetId(null);
  };

  const getBudgetProgress = (category) => {
    const budget = budgets.find(b => b.category === category);
    const spent = monthlySpending[category] || 0;
    if (!budget) return null;
    
    const percentage = (spent / budget.amount) * 100;
    return {
      spent,
      budget: budget.amount,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.amount,
    };
  };

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
      onPress: () => setShowBudgetModal(true),
    },
    {
      id: 'currency',
      title: 'Currency Converter',
      icon: '💱',
      onPress: () => setShowCurrencyConverter(true),
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

      {/* Monthly Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowBudgetModal(false);
          resetBudgetForm();
        }}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.budgetModalContent}>
            <Text style={styles.modalTitle}>💰 Monthly Budget</Text>
            
            {/* Budget Form */}
            <View style={styles.budgetForm}>
              <Text style={styles.sectionTitle}>
                {editingBudgetId ? 'Edit Budget' : 'Add New Budget'}
              </Text>
              
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id && styles.categoryChipSelected,
                      editingBudgetId && styles.categoryChipDisabled,
                    ]}
                    onPress={() => !editingBudgetId && setSelectedCategory(category.id)}
                    disabled={editingBudgetId}>
                    <Text style={[
                      styles.categoryChipText,
                      selectedCategory === category.id && styles.categoryChipTextSelected,
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Budget Amount (₹)</Text>
              <TextInput
                style={styles.input}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
                placeholder="Enter budget amount"
              />

              <View style={styles.buttonRow}>
                <Button
                  title={budgetLoading ? "Saving..." : editingBudgetId ? "Update" : "Add Budget"}
                  onPress={saveBudget}
                  disabled={budgetLoading}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                {editingBudgetId && (
                  <Button
                    title="Cancel"
                    onPress={resetBudgetForm}
                    variant="outline"
                    style={{ flex: 1, marginLeft: spacing.sm }}
                  />
                )}
              </View>
            </View>

            {/* Budget List */}
            <View style={styles.budgetList}>
              <Text style={styles.sectionTitle}>Your Budgets</Text>
              
              {budgets.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No budgets set yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add a budget to track your spending</Text>
                </View>
              ) : (
                budgets.map((budget) => {
                  const progress = getBudgetProgress(budget.category);
                  const categoryData = EXPENSE_CATEGORIES.find(c => c.id === budget.category);
                  return (
                    <Card key={budget.id} style={styles.budgetCard}>
                      <View style={styles.budgetHeader}>
                        <View style={styles.budgetInfo}>
                          <Text style={styles.budgetCategory}>
                            {categoryData?.label || budget.category}
                          </Text>
                          <Text style={styles.budgetAmountText}>
                            ₹{progress?.spent.toFixed(2) || '0.00'} / ₹{budget.amount.toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.budgetActions}>
                          <TouchableOpacity
                            onPress={() => editBudget(budget)}
                            style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => deleteBudget(budget.id)}
                            style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {progress && (
                        <>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progress.percentage}%`,
                                  backgroundColor: progress.isOverBudget
                                    ? colors.error
                                    : progress.percentage > 80
                                    ? colors.warning
                                    : colors.success,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            style={[
                              styles.progressText,
                              progress.isOverBudget && styles.overBudgetText,
                            ]}>
                            {progress.percentage.toFixed(1)}% used
                            {progress.isOverBudget && ' - Over budget!'}
                          </Text>
                        </>
                      )}
                    </Card>
                  );
                })
              )}
            </View>

            <Button
              title="Close"
              onPress={() => {
                setShowBudgetModal(false);
                resetBudgetForm();
              }}
              variant="outline"
              style={styles.closeButton}
            />
          </ScrollView>
        </View>
      </Modal>

      {/* Currency Converter Modal */}
      <Modal
        visible={showCurrencyConverter}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurrencyConverter(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💱 Currency Converter</Text>
            
            <View style={styles.converterSection}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="Enter amount"
              />

              <Text style={styles.label}>From</Text>
              <TouchableOpacity 
                style={styles.currencyButton}
                onPress={() => setShowCurrencyPicker('from')}>
                <Text style={styles.currencyButtonText}>
                  {fromCurrency.toUpperCase()} - {currencies[fromCurrency] || 'Select Currency'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>To</Text>
              <TouchableOpacity 
                style={styles.currencyButton}
                onPress={() => setShowCurrencyPicker('to')}>
                <Text style={styles.currencyButtonText}>
                  {toCurrency.toUpperCase()} - {currencies[toCurrency] || 'Select Currency'}
                </Text>
              </TouchableOpacity>

              <Button
                title={loading ? "Converting..." : "Convert"}
                onPress={convertCurrency}
                disabled={loading}
                style={styles.convertButton}
              />

              {convertedAmount && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultLabel}>Result:</Text>
                  <Text style={styles.resultAmount}>
                    {amount} {fromCurrency.toUpperCase()} = {convertedAmount} {toCurrency.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Button
              title="Close"
              onPress={() => {
                setShowCurrencyConverter(false);
                setConvertedAmount(null);
              }}
              variant="outline"
              style={styles.closeButton}
            />
          </View>
        </View>
      </Modal>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurrencyPicker(null)}>
        <View style={styles.modalContainer}>
          <View style={styles.pickerContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            <FlatList
              data={Object.keys(currencies)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyItem}
                  onPress={() => {
                    if (showCurrencyPicker === 'from') {
                      setFromCurrency(item);
                    } else {
                      setToCurrency(item);
                    }
                    setShowCurrencyPicker(null);
                    setConvertedAmount(null);
                  }}>
                  <Text style={styles.currencyCode}>{item.toUpperCase()}</Text>
                  <Text style={styles.currencyName}>{currencies[item]}</Text>
                </TouchableOpacity>
              )}
            />
            <Button
              title="Cancel"
              onPress={() => setShowCurrencyPicker(null)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
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
    fontWeight: 'bold',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '80%',
  },
  pickerContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '90%',
    height: '80%',
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  converterSection: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.subtitle1,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    ...typography.body1,
    color: colors.text,
    backgroundColor: colors.background,
  },
  currencyButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  currencyButtonText: {
    ...typography.body1,
    color: colors.text,
  },
  convertButton: {
    marginTop: spacing.lg,
  },
  resultContainer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    alignItems: 'center',
  },
  resultLabel: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  resultAmount: {
    ...typography.h5,
    color: colors.primary,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: spacing.md,
  },
  currencyItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyCode: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: 'bold',
  },
  currencyName: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  // Budget Modal Styles
  budgetModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    width: '90%',
    maxHeight: '90%',
    alignSelf: 'center',
    marginTop: '10%',
  },
  budgetForm: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 12,
  },
  categoryScroll: {
    marginVertical: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipDisabled: {
    opacity: 0.6,
  },
  categoryChipText: {
    ...typography.body2,
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  budgetList: {
    marginBottom: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.subtitle1,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptyStateSubtext: {
    ...typography.caption,
    color: colors.textLight,
  },
  budgetCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  budgetAmountText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  budgetActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  actionButtonText: {
    fontSize: 18,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  overBudgetText: {
    color: colors.error,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
