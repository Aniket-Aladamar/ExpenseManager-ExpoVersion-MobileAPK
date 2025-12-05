import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Card from '../../components/common/Card';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalThisMonth: 0,
    totalExpenses: 0,
    reimbursable: 0,
    categoryBreakdown: [],
  });

  const fetchExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const q = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid),
        where('date', '>=', startDate.toISOString()),
        where('date', '<=', endDate.toISOString()),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const expensesData = [];
      querySnapshot.forEach((doc) => {
        expensesData.push({ id: doc.id, ...doc.data() });
      });

      setExpenses(expensesData);
      calculateStats(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    setLoading(false);
  };

  const calculateStats = (expensesData) => {
    const totalThisMonth = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const reimbursable = expensesData
      .filter((exp) => exp.type === 'reimbursable')
      .reduce((sum, exp) => sum + exp.amount, 0);

    // Category breakdown
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

    setStats({
      totalThisMonth,
      totalExpenses: expensesData.length,
      reimbursable,
      categoryBreakdown,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.displayName || 'User'}!</Text>
        <Text style={styles.date}>{format(new Date(), 'MMMM yyyy')}</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={styles.summaryAmount}>${stats.totalThisMonth.toFixed(2)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryAmount}>{stats.totalExpenses}</Text>
        </Card>
      </View>

      <Card style={styles.summaryCardFull}>
        <Text style={styles.summaryLabel}>Reimbursable</Text>
        <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
          ${stats.reimbursable.toFixed(2)}
        </Text>
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
                      {format(new Date(expense.date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
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
  expenseAmount: {
    ...typography.h6,
    color: colors.text,
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
