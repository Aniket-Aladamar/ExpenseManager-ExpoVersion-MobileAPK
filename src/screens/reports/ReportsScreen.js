import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { EXPENSE_CATEGORIES } from '../../constants/categories';

const ReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('monthly'); // monthly, yearly, category
  const [stats, setStats] = useState({
    total: 0,
    personal: 0,
    business: 0,
    reimbursable: 0,
    categoryBreakdown: {},
  });

  const fetchExpenses = async () => {
    if (!user) return;

    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
    setLoading(false);
  };

  const calculateStats = (expensesData) => {
    const total = expensesData.reduce((sum, exp) => sum + exp.amount, 0);
    const personal = expensesData
      .filter((exp) => exp.type === 'personal')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const business = expensesData
      .filter((exp) => exp.type === 'business')
      .reduce((sum, exp) => sum + exp.amount, 0);
    const reimbursable = expensesData
      .filter((exp) => exp.type === 'reimbursable')
      .reduce((sum, exp) => sum + exp.amount, 0);

    const categoryBreakdown = {};
    expensesData.forEach((exp) => {
      if (categoryBreakdown[exp.category]) {
        categoryBreakdown[exp.category] += exp.amount;
      } else {
        categoryBreakdown[exp.category] = exp.amount;
      }
    });

    setStats({
      total,
      personal,
      business,
      reimbursable,
      categoryBreakdown,
    });
  };

  useEffect(() => {
    fetchExpenses();
  }, [user]);

  const generatePDFReport = () => {
    // This would integrate with a PDF library
    Alert.alert(
      'Generate Report',
      'PDF report generation will be implemented with react-native-pdf-lib or similar library.',
      [{ text: 'OK' }]
    );
  };

  const exportToExcel = () => {
    // This would integrate with an Excel export library
    Alert.alert(
      'Export to Excel',
      'Excel export will be implemented with appropriate library.',
      [{ text: 'OK' }]
    );
  };

  const shareReport = () => {
    Alert.alert(
      'Share Report',
      'Email sharing will be implemented with React Native Share or email intent.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports & Analytics</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>${stats.total.toFixed(2)}</Text>
        </Card>

        <View style={styles.summaryRow}>
          <Card style={styles.smallCard}>
            <Text style={styles.summaryLabel}>Personal</Text>
            <Text style={[styles.summaryAmount, styles.smallAmount]}>
              ${stats.personal.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.smallCard}>
            <Text style={styles.summaryLabel}>Business</Text>
            <Text style={[styles.summaryAmount, styles.smallAmount]}>
              ${stats.business.toFixed(2)}
            </Text>
          </Card>
        </View>

        <Card style={[styles.summaryCard, { backgroundColor: colors.secondary + '10' }]}>
          <Text style={styles.summaryLabel}>Reimbursable</Text>
          <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
            ${stats.reimbursable.toFixed(2)}
          </Text>
        </Card>
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        {Object.keys(stats.categoryBreakdown).map((catId) => {
          const category = EXPENSE_CATEGORIES.find((c) => c.id === catId);
          const amount = stats.categoryBreakdown[catId];
          const percentage = ((amount / stats.total) * 100).toFixed(1);

          return (
            <Card key={catId} style={styles.categoryCard}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: category?.color },
                    ]}
                  />
                  <Text style={styles.categoryName}>{category?.label || catId}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
                  <Text style={styles.categoryPercentage}>{percentage}%</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progress,
                    {
                      width: `${percentage}%`,
                      backgroundColor: category?.color,
                    },
                  ]}
                />
              </View>
            </Card>
          );
        })}
      </View>

      {/* Export Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Export & Share</Text>
        <Card style={styles.exportCard}>
          <Button
            title="Generate PDF Report"
            onPress={generatePDFReport}
            variant="outline"
            style={styles.exportButton}
          />
          <Button
            title="Export to Excel"
            onPress={exportToExcel}
            variant="outline"
            style={styles.exportButton}
          />
          <Button
            title="Share via Email"
            onPress={shareReport}
            variant="secondary"
            style={styles.exportButton}
          />
        </Card>
      </View>

      {/* Claim Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Claim Summary</Text>
        <Card style={styles.claimCard}>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Total Reimbursable Expenses:</Text>
            <Text style={styles.claimAmount}>${stats.reimbursable.toFixed(2)}</Text>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Number of Items:</Text>
            <Text style={styles.claimAmount}>
              {expenses.filter((e) => e.type === 'reimbursable').length}
            </Text>
          </View>
          <Button
            title="Generate Claim Report"
            onPress={generatePDFReport}
            style={styles.claimButton}
          />
        </Card>
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
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  summarySection: {
    paddingHorizontal: spacing.lg,
  },
  summaryCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  smallCard: {
    flex: 1,
    padding: spacing.md,
  },
  smallAmount: {
    fontSize: 20,
  },
  section: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h5,
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    ...typography.body2,
    color: colors.text,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    ...typography.subtitle1,
    color: colors.text,
  },
  categoryPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 3,
  },
  exportCard: {
    padding: spacing.md,
  },
  exportButton: {
    marginBottom: spacing.sm,
  },
  claimCard: {
    padding: spacing.md,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  claimLabel: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  claimAmount: {
    ...typography.subtitle1,
    color: colors.text,
  },
  claimButton: {
    marginTop: spacing.md,
  },
});

export default ReportsScreen;
