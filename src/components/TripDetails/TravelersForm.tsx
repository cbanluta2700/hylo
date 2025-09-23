// src/components/TripDetails/TravelersForm.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Minus, ChevronDown } from 'lucide-react';
import { BaseFormProps, MIN_ADULTS, MIN_CHILDREN, MAX_CHILD_AGE, UNSELECTED_AGE } from './types';

const TravelersForm: React.FC<BaseFormProps> = ({ formData, onFormChange }) => {
  const [adults, setAdults] = useState(formData.adults || 2);
  const [children, setChildren] = useState(formData.children || 0);
  const [childrenAges, setChildrenAges] = useState<number[]>(formData.childrenAges || []);

  useEffect(() => {
    setAdults(formData.adults || 2);
    setChildren(formData.children || 0);
    setChildrenAges(formData.childrenAges || []);
  }, [formData]);

  const adjustAdults = useCallback(
    (increment: boolean) => {
      const currentAdults = Number(adults);
      const newAdults = increment ? currentAdults + 1 : Math.max(MIN_ADULTS, currentAdults - 1);
      setAdults(newAdults);
      onFormChange({ adults: newAdults });
    },
    [adults, onFormChange]
  );

  const adjustChildren = useCallback(
    (increment: boolean) => {
      const currentChildren = Number(children);
      const newChildren = increment
        ? currentChildren + 1
        : Math.max(MIN_CHILDREN, currentChildren - 1);
      setChildren(newChildren);

      const newAges = [...childrenAges];
      if (increment) {
        newAges.push(UNSELECTED_AGE);
      } else if (newAges.length > newChildren) {
        newAges.splice(newChildren);
      }

      setChildrenAges(newAges);
      onFormChange({ children: newChildren, childrenAges: newAges });
    },
    [children, childrenAges, onFormChange]
  );

  const updateChildAge = useCallback(
    (index: number, age: number) => {
      const newAges = [...childrenAges];
      while (newAges.length <= index) {
        newAges.push(UNSELECTED_AGE);
      }
      newAges[index] = age;
      setChildrenAges(newAges);
      onFormChange({ childrenAges: newAges });
    },
    [childrenAges, onFormChange]
  );

  const totalTravelers = Number(adults) + Number(children);

  // Check if any child age is unselected
  const hasUnselectedAges =
    Number(children) > 0 &&
    (childrenAges.length < Number(children) ||
      childrenAges
        .slice(0, Number(children))
        .some((age) => age === UNSELECTED_AGE || age === undefined));

  return (
    <div className="bg-form-box rounded-[36px] p-6 border-3 border-gray-200">
      <h3 className="text-xl font-bold text-primary uppercase tracking-wide mb-4 font-raleway">
        TRAVELERS
      </h3>
      <div className="space-y-4">
        {/* Adults Counter */}
        <div className="flex items-center justify-between">
          <span className="text-primary font-bold font-raleway text-base">Adults</span>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => adjustAdults(false)}
              disabled={Number(adults) <= MIN_ADULTS}
              className="w-8 h-8 rounded-full border-3 border-primary bg-white hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease adults"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-bold w-8 text-center text-primary font-raleway">
              {adults}
            </span>
            <button
              onClick={() => adjustAdults(true)}
              className="w-8 h-8 rounded-full border-3 border-primary bg-white hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-200"
              aria-label="Increase adults"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Children Counter */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-primary font-bold font-raleway text-base">Children</span>
            <div className="text-sm text-primary/70 font-bold font-raleway">Ages 0-17</div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => adjustChildren(false)}
              disabled={Number(children) <= MIN_CHILDREN}
              className="w-8 h-8 rounded-full border-3 border-primary bg-white hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Decrease children"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-xl font-bold w-8 text-center text-primary font-raleway">
              {children}
            </span>
            <button
              onClick={() => adjustChildren(true)}
              className="w-8 h-8 rounded-full border-3 border-primary bg-white hover:bg-primary/10 text-primary flex items-center justify-center transition-all duration-200"
              aria-label="Increase children"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Total Travelers Display - Centered with thick border */}
        <div className="text-center border-4 border-primary p-4 font-raleway font-bold mt-3 rounded-[20px] bg-primary/5">
          <span className="text-primary text-lg">Total travelers: {totalTravelers}</span>
        </div>
      </div>

      {/* Children Ages */}
      {Number(children) > 0 && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: Number(children) }, (_, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-primary font-bold font-raleway text-lg">Child {index + 1}</span>
              <div className="relative">
                <select
                  value={
                    childrenAges[index] === UNSELECTED_AGE || childrenAges[index] === undefined
                      ? ''
                      : childrenAges[index]
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      updateChildAge(index, UNSELECTED_AGE);
                    } else {
                      updateChildAge(index, parseInt(value));
                    }
                  }}
                  className={`px-3 py-2 pr-8 border-3 rounded-[10px] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 bg-[#ece8de] text-primary font-bold font-raleway text-base appearance-none min-w-[140px] ${
                    childrenAges[index] === UNSELECTED_AGE || childrenAges[index] === undefined
                      ? 'border-red-500'
                      : 'border-primary'
                  }`}
                  aria-label={`Age for child ${index + 1}`}
                >
                  <option value="" className="font-bold font-raleway text-base">
                    Select age
                  </option>
                  <option value={0} className="font-bold font-raleway text-base">
                    Under 1
                  </option>
                  {Array.from({ length: MAX_CHILD_AGE }, (_, age) => age + 1).map((age) => (
                    <option key={age} value={age} className="font-bold font-raleway text-base">
                      {age} {age === 1 ? 'year' : 'years'} old
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
              </div>
            </div>
          ))}
          {hasUnselectedAges && (
            <p className="text-red-500 font-bold font-raleway text-sm mt-2">
              Please select ages for all children
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TravelersForm;
