import { ColumnAnalysis } from '@/types';

export interface DatasetValidationResult {
  isValid: boolean;
  isCustomerDataset: boolean;
  score: number;
  reasons: string[];
  signals: {
    hasCustomerId: boolean;
    hasTarget: boolean;
    hasBehavior: boolean;
    hasTime: boolean;
  };
  suggestions: string[];
}

export function validateDataset(
  columns: string[],
  columnAnalysis: ColumnAnalysis[],
  rowCount: number
): DatasetValidationResult {
  const signals = {
    hasCustomerId: false,
    hasTarget: false,
    hasBehavior: false,
    hasTime: false,
  };
  const reasons: string[] = [];

  // Check for customer ID patterns - REQUIRED for valid customer dataset
  const customerIdPatterns = ['id', 'user', 'customer', 'client', 'member', 'account'];
  const hasCustomerIdColumn = columnAnalysis.some(col => {
    const lowerName = col.name.toLowerCase();
    return customerIdPatterns.some(pattern => lowerName.includes(pattern));
  });
  signals.hasCustomerId = hasCustomerIdColumn;

  // Target requires customer ID - customer churn datasets need both
  const metadataPatterns = ['variable', 'type', 'category', 'status', 'label', 'name', 'description', 'code', 'group', 'unit', 'size', 'grp', 'rme', 'industry'];
  signals.hasTarget = columnAnalysis.some(col => {
    // Must have customer ID first - otherwise this isn't customer-level data
    if (!hasCustomerIdColumn) return false;
    if (col.uniqueValues !== undefined && col.uniqueValues >= 2 && col.uniqueValues <= 10) {
      const lowerName = col.name.toLowerCase();
      const isMetaData = metadataPatterns.some(p => lowerName.includes(p));
      if (isMetaData) return false;
      const isLikelyTarget = customerIdPatterns.every(p => !lowerName.includes(p));
      return isLikelyTarget;
    }
    return false;
  });

  // Check for behavioral columns (numeric with variance, but NOT high-cardinality aggregates)
  // High-cardinality numeric columns (>1000 unique) are likely measures/aggregates, not behavioral
  // Also exclude generic measure column names like "value", "amount", "total", "sum"
  const measurePatterns = ['value', 'amount', 'total', 'sum', 'count', 'quantity', 'size'];
  signals.hasBehavior = columnAnalysis.some(col => {
    if (col.type === 'numeric' && col.variance !== undefined && col.variance > 0) {
      // Exclude high-cardinality columns - these are aggregate measures, not customer behavior
      if (col.uniqueValues !== undefined && col.uniqueValues > 100) {
        return false;
      }
      const lowerName = col.name.toLowerCase();
      // Exclude measure-like column names
      if (measurePatterns.some(p => lowerName === p || lowerName.includes(p))) {
        return false;
      }
      const isLikelyBehavior = customerIdPatterns.every(p => !lowerName.includes(p));
      return isLikelyBehavior;
    }
    return false;
  });

  // Time patterns for date column detection
  const timePatterns = ['date', 'time', 'created', 'updated', 'signup', 'active', 'last'];

  // Check for time-based columns - must be proper date/datetime, not just numeric year columns
  // Single year columns in aggregate datasets should not count as customer time data
  signals.hasTime = columnAnalysis.some(col => {
    const lowerName = col.name.toLowerCase();
    // Must have date/datetime in name OR be typed as date
    const hasDatePattern = col.type === 'date' ||
      timePatterns.some(pattern => lowerName.includes(pattern)) ||
      (lowerName.includes('year') && lowerName.includes('month'));
    // Exclude standalone year columns in aggregate datasets
    const isStandaloneYear = lowerName === 'year' && col.type === 'numeric';
    return hasDatePattern && !isStandaloneYear;
  });

  let score = 0;
  if (signals.hasCustomerId) score += 1;
  if (signals.hasTarget) score += 1;
  if (signals.hasBehavior) score += 1;
  if (signals.hasTime) score += 1;

  if (!signals.hasCustomerId) {
    reasons.push('No identifiable customer/user ID column detected');
  }
  if (!signals.hasTarget) {
    reasons.push('No clear target variable (churn, purchase, retention) detected');
  }
  if (!signals.hasBehavior) {
    reasons.push('No behavioral metrics (usage, transactions, engagement) detected');
  }
  if (!signals.hasTime) {
    reasons.push('No time-based column (dates, signup, activity) detected');
  }

  if (rowCount < 100) {
    reasons.push(`Dataset too small: ${rowCount} rows (minimum 100)`);
  }

  const isCustomerDataset = score >= 2 && hasCustomerIdColumn;
  const isValid = hasCustomerIdColumn && score >= 2 && rowCount >= 100;

  const suggestions: string[] = [];
  if (!isValid) {
    if (!signals.hasCustomerId) {
      suggestions.push('Include a customer/user ID column (e.g., customer_id, user_id)');
    }
    if (!signals.hasTarget) {
      suggestions.push('Include a target column with binary/categorical values (e.g., churn, converted)');
    }
    if (!signals.hasBehavior) {
      suggestions.push('Include behavioral metrics (e.g., visits, transactions, session_time)');
    }
    if (!signals.hasTime) {
      suggestions.push('Include time-based columns (e.g., signup_date, last_active)');
    }
    if (rowCount < 100) {
      suggestions.push(`Increase dataset size to at least 100 rows (currently ${rowCount})`);
    }
  }

  return {
    isValid,
    isCustomerDataset,
    score,
    reasons,
    signals,
    suggestions,
  };
}

export function mergeValidationIntoUpload(
  uploadResult: Record<string, unknown>,
  validation: DatasetValidationResult
): Record<string, unknown> {
  return {
    ...uploadResult,
    datasetValidation: validation,
  };
}