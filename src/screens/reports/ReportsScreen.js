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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect } from '@react-navigation/native';
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

  // Refresh reports when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchExpenses();
      }
      return () => {};
    }, [])
  );

  // Helper function to convert Firestore date to JS Date
  const getDateFromExpense = (expense) => {
    if (!expense.date) return new Date();
    if (expense.date.toDate && typeof expense.date.toDate === 'function') {
      return expense.date.toDate();
    }
    if (expense.date instanceof Date) {
      return expense.date;
    }
    // If it's a timestamp number
    if (typeof expense.date === 'number') {
      return new Date(expense.date);
    }
    // If it's a string
    if (typeof expense.date === 'string') {
      return new Date(expense.date);
    }
    return new Date();
  };

  const generatePDFReport = async (isClaimReport = false) => {
    try {
      const expensesToInclude = isClaimReport 
        ? expenses.filter(e => e.type === 'reimbursable')
        : expenses;

      if (expensesToInclude.length === 0) {
        Alert.alert('No Expenses', isClaimReport ? 'No reimbursable expenses found.' : 'No expenses found.');
        return;
      }

      const reportTitle = isClaimReport ? 'Claim Report' : 'Expense Report';
      const totalAmount = expensesToInclude.reduce((sum, exp) => sum + exp.amount, 0);

      // Convert images to base64
      const expensesWithImages = await Promise.all(
        expensesToInclude.map(async (expense) => {
          if (expense.receiptUrl && expense.receiptUrl.startsWith('file://')) {
            try {
              const base64 = await FileSystem.readAsStringAsync(expense.receiptUrl, {
                encoding: FileSystem.EncodingType.Base64,
              });
              return {
                ...expense,
                receiptBase64: `data:image/jpeg;base64,${base64}`
              };
            } catch (error) {
              console.log('Error reading image:', error);
              return expense;
            }
          }
          return expense;
        })
      );

      // Create HTML content for PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${reportTitle}</title>
          <style>
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              border-bottom: 3px solid #3B82F6;
              padding-bottom: 20px;
            }
            h1 {
              color: #3B82F6;
              margin: 0;
              font-size: 32px;
            }
            .date {
              color: #666;
              margin-top: 10px;
              font-size: 14px;
            }
            .summary {
              background: #f0f9ff;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              font-size: 16px;
            }
            .summary-label {
              font-weight: bold;
            }
            .summary-total {
              font-size: 24px;
              color: #3B82F6;
              font-weight: bold;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #3B82F6;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: #3B82F6;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .amount {
              font-weight: bold;
              color: #059669;
            }
            .category {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              background: #e0e7ff;
              color: #3730a3;
            }
            .receipt-image {
              max-width: 150px;
              max-height: 150px;
              border-radius: 8px;
              margin-top: 10px;
              border: 2px solid #e5e7eb;
            }
            .expense-item {
              margin-bottom: 30px;
              padding: 20px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: #f9fafb;
            }
            .expense-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 ${reportTitle}</h1>
            <p class="date">Generated on ${format(new Date(), 'MMMM dd, yyyy - hh:mm a')}</p>
          </div>

          <div class="summary">
            <div class="summary-row">
              <span class="summary-label">${isClaimReport ? 'Reimbursable Items:' : 'Total Expenses:'}</span>
              <span>${expensesWithImages.length}</span>
            </div>
            ${isClaimReport ? `
            <div class="summary-row">
              <span class="summary-label">Items with Receipts:</span>
              <span>${expensesWithImages.filter(e => e.receiptUrl).length}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Items with GST:</span>
              <span>${expensesWithImages.filter(e => e.hasGST).length}</span>
            </div>
            ` : `
            <div class="summary-row">
              <span class="summary-label">Personal:</span>
              <span>₹${stats.personal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Business:</span>
              <span>₹${stats.business.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Reimbursable:</span>
              <span>₹${stats.reimbursable.toFixed(2)}</span>
            </div>
            `}
            <div class="summary-total">
              <div class="summary-row">
                <span>${isClaimReport ? 'Total Claim Amount:' : 'Total Amount:'}</span>
                <span>₹${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <h2>Expense Details${isClaimReport ? ' (Reimbursable Only)' : ''}</h2>
          ${expensesWithImages.map(expense => {
            const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
            const expenseDate = getDateFromExpense(expense);
            return `
              <div class="expense-item">
                <div class="expense-header">
                  <div>
                    <strong>${expense.vendor}</strong>
                    <br/>
                    <span class="category">${category?.label || expense.category}</span>
                    <span style="margin-left: 10px; color: #666;">${expense.type}</span>
                  </div>
                  <div style="text-align: right;">
                    <strong style="font-size: 20px; color: #059669;">₹${expense.amount.toFixed(2)}</strong>
                    <br/>
                    <span style="color: #666;">${format(expenseDate, 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                ${expense.description ? `<p style="margin: 10px 0; color: #666;"><strong>Description:</strong> ${expense.description}</p>` : ''}
                ${expense.hasGST ? `<p style="margin: 10px 0; color: #666;"><strong>GST Amount:</strong> ₹${(expense.gstAmount || 0).toFixed(2)}</p>` : ''}
                ${expense.receiptBase64 ? `
                  <div style="margin-top: 15px;">
                    <p style="margin: 5px 0; color: #3B82F6;"><strong>📎 Receipt Attached</strong></p>
                    <img src="${expense.receiptBase64}" class="receipt-image" />
                  </div>
                ` : expense.receiptUrl ? `
                  <div style="margin-top: 15px;">
                    <p style="margin: 5px 0; color: #3B82F6;"><strong>📎 Receipt Attached (Unable to load image)</strong></p>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}

          ${!isClaimReport ? `
          <h2 style="margin-top: 40px;">Category Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(stats.categoryBreakdown).map(catId => {
                const category = EXPENSE_CATEGORIES.find(c => c.id === catId);
                const amount = stats.categoryBreakdown[catId];
                const percentage = ((amount / stats.total) * 100).toFixed(1);
                return `
                  <tr>
                    <td><span class="category">${category?.label || catId}</span></td>
                    <td class="amount">₹${amount.toFixed(2)}</td>
                    <td>${percentage}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="footer">
            <p>This report was generated by Expense Manager App</p>
            <p>${isClaimReport ? 'Please submit this report for reimbursement claim' : 'Thank you for using Expense Manager'}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      } else {
        Alert.alert('Success', `PDF saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    }
  };

  const exportToExcel = async () => {
    try {
      // Create CSV format (can be opened in Excel)
      let csv = 'Date,Description,Category,Type,Amount,GST\n';
      
      expenses.forEach(expense => {
        const category = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
        const expenseDate = getDateFromExpense(expense);
        const date = format(expenseDate, 'yyyy-MM-dd');
        const description = (expense.description || '').replace(/,/g, ';');
        const categoryName = category?.label || expense.category;
        const type = expense.type;
        const amount = expense.amount.toFixed(2);
        const gst = expense.gst ? 'Yes' : 'No';
        
        csv += `${date},${description},${categoryName},${type},${amount},${gst}\n`;
      });

      // Save to file
      const fileUri = FileSystem.documentDirectory + `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv);

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Success', `CSV file saved to: ${fileUri}`);
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const shareReport = async () => {
    try {
      // Generate PDF and share via email/other apps
      await generatePDFReport(false);
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'Failed to share report. Please try again.');
    }
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
          <Text style={styles.summaryAmount}>₹{stats.total.toFixed(2)}</Text>
        </Card>

        <View style={styles.summaryRow}>
          <Card style={styles.smallCard}>
            <Text style={styles.summaryLabel}>Personal</Text>
            <Text style={[styles.summaryAmount, styles.smallAmount]}>
              ₹{stats.personal.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.smallCard}>
            <Text style={styles.summaryLabel}>Business</Text>
            <Text style={[styles.summaryAmount, styles.smallAmount]}>
              ₹{stats.business.toFixed(2)}
            </Text>
          </Card>
        </View>

        <Card style={[styles.summaryCard, { backgroundColor: colors.secondary + '10' }]}>
          <Text style={styles.summaryLabel}>Reimbursable</Text>
          <Text style={[styles.summaryAmount, { color: colors.secondary }]}>
            ₹{stats.reimbursable.toFixed(2)}
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
                  <Text style={styles.categoryAmount}>₹{amount.toFixed(2)}</Text>
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
            onPress={() => generatePDFReport(false)}
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
            <Text style={styles.claimAmount}>₹{stats.reimbursable.toFixed(2)}</Text>
          </View>
          <View style={styles.claimRow}>
            <Text style={styles.claimLabel}>Number of Items:</Text>
            <Text style={styles.claimAmount}>
              {expenses.filter((e) => e.type === 'reimbursable').length}
            </Text>
          </View>
          <Button
            title="Generate Claim Report"
            onPress={() => generatePDFReport(true)}
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
