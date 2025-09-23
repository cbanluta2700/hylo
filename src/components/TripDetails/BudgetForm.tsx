// src/components/TripDetails/BudgetForm.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  BaseFormProps,
  Currency,
  BudgetMode,
  currencySymbols,
  MAX_BUDGET,
  BUDGET_STEP,
} from './types';

const BudgetForm: React.FC<BaseFormProps> = ({ formData, onFormChange }) => {
  const [budgetRange, setBudgetRange] = useState(formData.budget || 5000);

  // T016: Connect budgetMode to FormData for proper state management
  const budgetMode = formData.budgetMode || 'total';

  useEffect(() => {
    setBudgetRange(formData.budget || 5000);
  }, [formData.budget]);

  const handleBudgetChange = useCallback(
    (value: number) => {
      setBudgetRange(value);
      onFormChange({ budget: value });
    },
    [onFormChange]
  );

  // T016: Enhanced budget mode handler with FormData sync
  const handleBudgetModeChange = useCallback(
    (checked: boolean) => {
      const newMode: BudgetMode = checked ? 'per-person' : 'total';
      onFormChange({ budgetMode: newMode });
    },
    [onFormChange]
  );

  const getCurrencySymbol = useCallback(() => {
    return currencySymbols[formData.currency || 'USD'];
  }, [formData.currency]);

  // T016: Enhanced budget display with per-person calculations
  const getBudgetDisplay = useCallback(() => {
    const symbol = getCurrencySymbol();
    const totalTravelers = Number(formData.adults || 1) + Number(formData.children || 0);

    if (budgetMode === 'per-person' && totalTravelers > 0) {
      // Show the same amount as total budget, not divided by travelers
      if (Number(budgetRange) >= MAX_BUDGET) {
        return `${symbol}10,000+`;
      }
      return `${symbol}${Number(budgetRange).toLocaleString()}`;
    } else {
      if (Number(budgetRange) >= MAX_BUDGET) {
        return `${symbol}10,000+`;
      }
      return `${symbol}${Number(budgetRange).toLocaleString()}`;
    }
  }, [budgetRange, getCurrencySymbol, budgetMode, formData.adults, formData.children]);

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-primary uppercase tracking-wide font-raleway">
          BUDGET
        </h3>
      </div>

      {/* Budget Flexibility Toggle */}
      <div className="flex items-center mb-6">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={formData.flexibleBudget || false}
            onChange={(e) => onFormChange({ flexibleBudget: e.target.checked })}
            className="sr-only peer"
            aria-label="Toggle budget flexibility"
          />
          <div
            className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 mr-3 ${
              formData.flexibleBudget
                ? 'bg-primary border-primary after:bg-white after:border-[#ece8de] after:border'
                : 'bg-[#ece8de] border-primary border-2 after:bg-primary after:border-[#ece8de] after:border-2'
            }`}
          ></div>
          <span className="text-primary font-bold font-raleway text-sm">
            I'm not sure or my budget is flexible
          </span>
        </label>
      </div>

      {/* Budget Display and Slider - Hidden when flexible */}
      {!formData.flexibleBudget && (
        <>
          {/* Budget Display */}
          <div className="text-center mb-6">
            <div className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-2xl inline-block font-raleway">
              {getBudgetDisplay()}
            </div>
          </div>

          {/* Budget Slider */}
          <div className="space-y-4">
            <div className="slider-container">
              <input
                type="range"
                min="0"
                max={MAX_BUDGET}
                step={BUDGET_STEP}
                value={Number(budgetRange)}
                onChange={(e) => handleBudgetChange(parseInt(e.target.value))}
                onInput={(e) => handleBudgetChange(parseInt((e.target as HTMLInputElement).value))}
                className="w-full slider-primary"
                aria-label="Budget range"
                aria-valuemin={0}
                aria-valuemax={MAX_BUDGET}
                aria-valuenow={Number(budgetRange)}
              />
            </div>
            <div
              className="flex justify-between text-base font-bold font-raleway px-3"
              style={{ color: '#406170' }}
            >
              <span>{currencySymbols[formData.currency || 'USD']}0</span>
              <span>{currencySymbols[formData.currency || 'USD']}10,000+</span>
            </div>
          </div>
        </>
      )}

      {/* Currency and Budget Mode Row */}
      {!formData.flexibleBudget && (
        <div className="flex items-center justify-between gap-6 mt-6">
          {/* Currency Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={formData.currency || 'USD'}
              onChange={(e) => onFormChange({ currency: e.target.value as Currency })}
              className="px-4 py-2 border-3 border-primary rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-[#ece8de] text-primary font-bold font-raleway text-base"
              aria-label="Select currency"
            >
              <option value="USD" className="font-bold font-raleway text-sm">
                $ USD
              </option>
              <option value="EUR" className="font-bold font-raleway text-sm">
                € EUR
              </option>
              <option value="GBP" className="font-bold font-raleway text-sm">
                £ GBP
              </option>
              <option value="CAD" className="font-bold font-raleway text-sm">
                C$ CAD
              </option>
              <option value="AUD" className="font-bold font-raleway text-sm">
                A$ AUD
              </option>
            </select>
          </div>

          {/* Budget Mode Switch */}
          <div className="flex items-center space-x-4">
            <span
              className="text-primary font-bold font-raleway text-sm"
              aria-current={budgetMode === 'total' ? 'true' : 'false'}
            >
              Total trip budget
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={budgetMode === 'per-person'}
                onChange={(e) => handleBudgetModeChange(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle budget mode"
              />
              <div
                className={`w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 bg-[#ece8de] border-primary border-2 after:bg-primary after:border-[#ece8de] after:border-2`}
              ></div>
            </label>
            <span
              className="text-primary font-bold font-raleway text-sm"
              aria-current={budgetMode === 'per-person' ? 'true' : 'false'}
            >
              Per-person budget
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetForm;
