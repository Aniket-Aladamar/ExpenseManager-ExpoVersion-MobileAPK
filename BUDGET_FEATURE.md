# Monthly Budget Feature

## Overview
The Monthly Budget feature allows you to set spending limits for different expense categories and track your progress throughout the month.

## Features

### 1. **Set Category Budgets**
- Create budgets for any expense category (Food, Travel, Utilities, etc.)
- Set custom budget amounts in INR (₹)
- One budget per category
- Edit or delete existing budgets

### 2. **Real-time Tracking**
- Visual progress bars showing spending vs. budget
- Color-coded indicators:
  - 🟢 **Green**: Under 80% of budget (healthy spending)
  - 🟡 **Yellow**: 80-100% of budget (approaching limit)
  - 🔴 **Red**: Over 100% of budget (exceeded!)

### 3. **Monthly Reset**
- Budgets track spending for the current month only
- Automatically resets at the start of each month
- Budget limits carry forward, but spending resets to ₹0

## How to Use

### Adding a Budget
1. Go to **Profile** screen
2. Tap **Monthly Budget** 💰
3. Select a category from the horizontal scroll
4. Enter your budget amount
5. Tap **Add Budget**

### Editing a Budget
1. Open **Monthly Budget** modal
2. Find the budget you want to edit
3. Tap the edit icon (✏️)
4. Update the amount
5. Tap **Update**

### Deleting a Budget
1. Open **Monthly Budget** modal
2. Find the budget you want to delete
3. Tap the delete icon (🗑️)
4. Confirm deletion

## Data Storage

Budgets are stored in Firestore under the `budgets` collection:
```javascript
{
  userId: string,
  category: string,
  amount: number,
  createdAt: timestamp
}
```

**Important**: You need to add Firestore security rules for the `budgets` collection (see FIRESTORE_RULES_SETUP.md).

## Budget Calculations

The app calculates spending by:
1. Fetching all expenses for the current user
2. Filtering expenses from the current month
3. Summing amounts by category
4. Comparing against budget limits

### Example
- **Budget**: Food & Dining = ₹5,000
- **Spent**: ₹3,750 (from expenses added this month)
- **Progress**: 75% (Green indicator)
- **Remaining**: ₹1,250

## Visual Indicators

| Percentage | Color | Status |
|------------|-------|--------|
| 0-80% | Green | Healthy |
| 80-100% | Yellow | Warning |
| 100%+ | Red | Over Budget |

## Tips for Effective Budgeting

1. **Start Conservative**: Set realistic budgets based on past spending
2. **Review Regularly**: Check your budget progress weekly
3. **Adjust as Needed**: Edit budgets if you find them too high/low
4. **Use Categories**: Separate budgets help identify problem areas
5. **Track Consistently**: Add expenses promptly for accurate tracking

## Technical Notes

- **Auto-refresh**: Budget progress updates when you open the modal
- **Month Calculation**: Uses device's local timezone
- **Performance**: Fetches all expenses but filters client-side
- **Offline Support**: Requires internet connection to load budgets

## Future Enhancements (Coming Soon)

- 📱 Push notifications when approaching budget limits
- 📊 Budget vs. actual spending charts
- 📅 Year-over-year budget comparisons
- 🎯 Budget recommendations based on spending patterns
- 💡 Smart alerts for unusual spending
