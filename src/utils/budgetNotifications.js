import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EXPENSE_CATEGORIES } from '../constants/categories';

/**
 * Check if any budgets are exceeded or near limit
 */
export const checkBudgetStatus = async (userId) => {
  try {
    // Fetch budgets
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId)
    );
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const budgets = budgetsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (budgets.length === 0) {
      return { exceeded: [], nearLimit: [], warnings: [] };
    }

    // Fetch current month expenses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    
    const spending = {};
    expensesSnapshot.docs.forEach(doc => {
      const expense = doc.data();
      const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      
      if (expenseDate >= startOfMonth) {
        const category = expense.category;
        spending[category] = (spending[category] || 0) + parseFloat(expense.amount);
      }
    });

    // Check each budget
    const exceeded = [];
    const nearLimit = [];
    const warnings = [];

    budgets.forEach(budget => {
      const spent = spending[budget.category] || 0;
      const percentage = (spent / budget.amount) * 100;
      const category = EXPENSE_CATEGORIES.find(c => c.id === budget.category);

      if (spent > budget.amount) {
        exceeded.push({
          category: category?.label || budget.category,
          spent,
          budget: budget.amount,
          over: spent - budget.amount,
          percentage,
        });
      } else if (percentage >= 80) {
        nearLimit.push({
          category: category?.label || budget.category,
          spent,
          budget: budget.amount,
          remaining: budget.amount - spent,
          percentage,
        });
      }
    });

    // Generate warning messages
    exceeded.forEach(item => {
      warnings.push({
        type: 'exceeded',
        severity: 'high',
        message: `🚨 ${item.category} budget exceeded by ₹${item.over.toFixed(2)}!`,
        details: `Spent: ₹${item.spent.toFixed(2)} / Budget: ₹${item.budget.toFixed(2)}`,
      });
    });

    nearLimit.forEach(item => {
      warnings.push({
        type: 'nearLimit',
        severity: 'medium',
        message: `⚠️ ${item.category} budget at ${item.percentage.toFixed(0)}%`,
        details: `Only ₹${item.remaining.toFixed(2)} remaining`,
      });
    });

    return { exceeded, nearLimit, warnings };
  } catch (error) {
    console.error('Error checking budget status:', error);
    return { exceeded: [], nearLimit: [], warnings: [] };
  }
};

/**
 * Check if adding an expense will exceed budget
 */
export const checkExpenseAgainstBudget = async (userId, category, amount) => {
  try {
    // Fetch budget for this category
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      where('category', '==', category)
    );
    const budgetsSnapshot = await getDocs(budgetsQuery);
    
    if (budgetsSnapshot.empty) {
      return { hasBudget: false, willExceed: false };
    }

    const budget = budgetsSnapshot.docs[0].data();

    // Calculate current month spending
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      where('category', '==', category)
    );
    const expensesSnapshot = await getDocs(expensesQuery);
    
    let currentSpending = 0;
    expensesSnapshot.docs.forEach(doc => {
      const expense = doc.data();
      const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date);
      
      if (expenseDate >= startOfMonth) {
        currentSpending += parseFloat(expense.amount);
      }
    });

    const newTotal = currentSpending + parseFloat(amount);
    const willExceed = newTotal > budget.amount;
    const categoryData = EXPENSE_CATEGORIES.find(c => c.id === category);

    return {
      hasBudget: true,
      willExceed,
      currentSpending,
      budgetAmount: budget.amount,
      newTotal,
      overAmount: willExceed ? newTotal - budget.amount : 0,
      percentage: (newTotal / budget.amount) * 100,
      categoryName: categoryData?.label || category,
    };
  } catch (error) {
    console.error('Error checking expense against budget:', error);
    return { hasBudget: false, willExceed: false };
  }
};
