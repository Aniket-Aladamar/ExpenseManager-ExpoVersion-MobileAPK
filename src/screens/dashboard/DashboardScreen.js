import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Card from '../../components/common/Card';
import BudgetNotification from '../../components/common/BudgetNotification';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/categories';
import { checkBudgetStatus } from '../../utils/budgetNotifications';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    totalExpenses: 0,
    reimbursable: 0,
    categoryBreakdown: [],
    lastMonthTotal: 0,
    monthlyChange: 0,
    averagePerDay: 0,
    topCategory: null,
  });

  const fetchExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all expenses for the user
      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expensesData = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });

      setExpenses(expensesData);
      calculateStats(expensesData);
      
      // Check budget status
      checkBudgets();
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    setLoading(false);
  };

  const checkBudgets = async () => {
    if (!user) return;
    const status = await checkBudgetStatus(user.uid);
    if (status.warnings.length > 0) {
      setBudgetWarnings(status.warnings);
      setShowNotifications(true);
    }
  };

  const calculateStats = (expensesData) => {
    // Filter expenses for this month only for the stats
    const startDate = startOfMonth(new Date());
    const endDate = endOfMonth(new Date());
    
    const thisMonthExpenses = expensesData.filter(exp => {
      const expenseDate = getDateFromExpense(exp);
      return expenseDate >= startDate && expenseDate <= endDate;
    });

    // Last month calculations
    const lastMonthStart = startOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const lastMonthEnd = endOfMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    
    const lastMonthExpenses = expensesData.filter(exp => {
      const expenseDate = getDateFromExpense(exp);
      return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd;
    });

    const totalThisMonth = thisMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const monthlyChange = lastMonthTotal > 0 
      ? ((totalThisMonth - lastMonthTotal) / lastMonthTotal * 100) 
      : 0;

    const daysInMonth = new Date().getDate();
    const averagePerDay = daysInMonth > 0 ? totalThisMonth / daysInMonth : 0;

    const reimbursable = expensesData
      .filter((exp) => exp.type === 'reimbursable')
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown (all time)
    const categoryTotals = {};
    expensesData.forEach((exp) => {
      if (categoryTotals[exp.category]) {
        categoryTotals[exp.category] += exp.amount;
      } else {
        categoryTotals[exp.category] = exp.amount;
      }
    });

    const categoryBreakdown = Object.keys(categoryTotals).map((catId) => {
      const category = EXPENSE_CATEGORIES.find((c) => c.id === catId);
      return {
        name: category?.label || catId,
        amount: categoryTotals[catId],
        color: category?.color || colors.categoryOther,
        legendFontColor: colors.text,
        legendFontSize: 12,
      };
    });

    // Find top category
    const topCategory = categoryBreakdown.length > 0 
      ? categoryBreakdown.reduce((max, cat) => cat.amount > max.amount ? cat : max)
      : null;

    setStats({
      totalThisMonth,
      totalExpenses: expensesData.length,
      reimbursable,
      categoryBreakdown,
      lastMonthTotal,
      monthlyChange,
      averagePerDay,
      topCategory,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  // Refresh dashboard when screen comes into focus
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

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchExpenses} />}>
      
      {/* Budget Notifications */}
      {showNotifications && budgetWarnings.length > 0 && (
        <BudgetNotification
          warnings={budgetWarnings}
          onDismiss={() => setShowNotifications(false)}
          onViewDetails={() => navigation.navigate('Profile')}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.displayName || 'User'}!</Text>
        <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>₹{stats.totalThisMonth.toFixed(2)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryAmount}>{stats.totalExpenses}</Text>
        </Card>
      </View>

      <Card style={styles.summaryCardFull}>
        <Text style={styles.summaryLabel}>Reimbursable</Text>
        <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
          ₹{stats.reimbursable.toFixed(2)}
        </Text>
      </Card>

      {/* Insights Section */}
      <Card style={styles.insightsCard}>
        <Text style={styles.insightsTitle}>📊 Monthly Insights</Text>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>vs Last Month:</Text>
          <Text style={[
            styles.insightValue,
            { color: stats.monthlyChange > 0 ? colors.error : colors.success }
          ]}>
            {stats.monthlyChange > 0 ? '↑' : '↓'} {Math.abs(stats.monthlyChange).toFixed(1)}%
          </Text>
        </View>
        <View style={styles.insightRow}>
          <Text style={styles.insightLabel}>Daily Average:</Text>
          <Text style={styles.insightValue}>₹{stats.averagePerDay.toFixed(2)}</Text>
        </View>
        {stats.topCategory && (
          <View style={styles.insightRow}>
            <Text style={styles.insightLabel}>Top Category:</Text>
            <Text style={styles.insightValue}>{stats.topCategory.name} (₹{stats.topCategory.amount.toFixed(2)})</Text>
          </View>
        )}
      </Card>

      {/* Category Breakdown */}
      {stats.categoryBreakdown.length > 0 && (
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Category Breakdown</Text>
          <PieChart
            data={stats.categoryBreakdown}
            width={width - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </Card>
      )}

      {/* Recent Expenses */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {expenses.slice(0, 5).map((expense) => {
          const category = EXPENSE_CATEGORIES.find((c) => c.id === expense.category);
          return (
            <Card key={expense.id} style={styles.expenseCard}>
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
                  <View>
                    <Text style={styles.expenseVendor}>{expense.vendor}</Text>
                    <Text style={styles.expenseDate}>
                      {format(getDateFromExpense(expense), 'MMM dd, yyyy')}
                    </Text>
                    {expense.receiptUrl && (
                      <TouchableOpacity onPress={() => setSelectedImage(expense.receiptUrl)}>
                        <Text style={styles.viewReceipt}>📎 View Receipt</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <Text style={styles.expenseAmount}>₹{expense.amount.toFixed(2)}</Text>
                  {expense.receiptUrl && (
                    <TouchableOpacity 
                      style={styles.thumbnailContainer}
                      onPress={() => setSelectedImage(expense.receiptUrl)}>
                      <Image 
                        source={{ uri: expense.receiptUrl }} 
                        style={styles.thumbnail}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddExpense')}>
          <Text style={styles.actionButtonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    ...typography.h2,
    color: colors.text,
  },
  date: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.md,
  },
  summaryCardFull: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  summaryAmount: {
    ...typography.h3,
    color: colors.primary,
  },
  insightsCard: {
    margin: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary + '08',
  },
  insightsTitle: {
    ...typography.h6,
    color: colors.text,
    marginBottom: spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  insightLabel: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  insightValue: {
    ...typography.subtitle1,
    color: colors.text,
    fontWeight: '600',
  },
  chartCard: {
    margin: spacing.lg,
    padding: spacing.md,
  },
  chartTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.md,
  },
  recentSection: {
    padding: spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
  },
  viewAll: {
    ...typography.body2,
    color: colors.primary,
  },
  expenseCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  expenseVendor: {
    ...typography.subtitle1,
    color: colors.text,
  },
  expenseDate: {
    ...typography.caption,
    color: colors.textSecondary,
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
  quickActions: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionButtonText: {
    ...typography.button,
    color: colors.surface,
    textTransform: 'none',
  },
});

export default DashboardScreen;
