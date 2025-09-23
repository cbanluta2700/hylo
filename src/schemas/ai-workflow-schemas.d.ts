/**
 * AI Workflow Validation Schemas
 *
 * Zod schemas for AI workflow data validation
 * Constitutional Requirement: Type-Safe Development with Zod validation at API boundaries
 */
import { z } from 'zod';
/**
 * Main Travel Form Data Validation Schema
 */
export declare const TravelFormDataSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    location: z.ZodString;
    departDate: z.ZodEffects<z.ZodString, string, string>;
    returnDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    flexibleDates: z.ZodBoolean;
    plannedDays: z.ZodOptional<z.ZodNumber>;
    adults: z.ZodNumber;
    children: z.ZodNumber;
    childrenAges: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    budget: z.ZodEffects<z.ZodObject<{
        total: z.ZodNumber;
        currency: z.ZodString;
        breakdown: z.ZodObject<{
            accommodation: z.ZodNumber;
            food: z.ZodNumber;
            activities: z.ZodNumber;
            transportation: z.ZodNumber;
            shopping: z.ZodNumber;
            emergency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        }, {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        }>;
        flexibility: z.ZodEnum<["strict", "flexible", "very-flexible"]>;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }>, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }>;
    travelStyle: z.ZodObject<{
        pace: z.ZodEnum<["slow", "moderate", "fast"]>;
        accommodationType: z.ZodEnum<["budget", "mid-range", "luxury", "mixed"]>;
        diningPreferences: z.ZodEnum<["local", "international", "mixed"]>;
        activityLevel: z.ZodEnum<["low", "moderate", "high"]>;
        culturalImmersion: z.ZodEnum<["minimal", "moderate", "deep"]>;
    }, "strip", z.ZodTypeAny, {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    }, {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    }>;
    interests: z.ZodArray<z.ZodString, "many">;
    avoidances: z.ZodArray<z.ZodString, "many">;
    dietaryRestrictions: z.ZodArray<z.ZodString, "many">;
    accessibility: z.ZodArray<z.ZodString, "many">;
    tripVibe: z.ZodString;
    travelExperience: z.ZodEnum<["first-time", "experienced", "expert"]>;
    dinnerChoice: z.ZodEnum<["fine-dining", "local-spots", "street-food", "mixed"]>;
    nickname: z.ZodOptional<z.ZodString>;
    additionalServices: z.ZodObject<{
        carRental: z.ZodBoolean;
        travel_insurance: z.ZodBoolean;
        tours: z.ZodBoolean;
        airport_transfers: z.ZodBoolean;
        spa_wellness: z.ZodBoolean;
        adventure_activities: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    }, {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    }>;
    sessionId: z.ZodOptional<z.ZodString>;
    formVersion: z.ZodString;
    submittedAt: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}>, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}>, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}>, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}>;
/**
 * Workflow Request Schema (for API endpoints)
 */
export declare const WorkflowRequestSchema: z.ZodObject<{
    sessionId: z.ZodString;
    formData: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
        location: z.ZodString;
        departDate: z.ZodEffects<z.ZodString, string, string>;
        returnDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        flexibleDates: z.ZodBoolean;
        plannedDays: z.ZodOptional<z.ZodNumber>;
        adults: z.ZodNumber;
        children: z.ZodNumber;
        childrenAges: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        budget: z.ZodEffects<z.ZodObject<{
            total: z.ZodNumber;
            currency: z.ZodString;
            breakdown: z.ZodObject<{
                accommodation: z.ZodNumber;
                food: z.ZodNumber;
                activities: z.ZodNumber;
                transportation: z.ZodNumber;
                shopping: z.ZodNumber;
                emergency: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            }, {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            }>;
            flexibility: z.ZodEnum<["strict", "flexible", "very-flexible"]>;
        }, "strip", z.ZodTypeAny, {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        }, {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        }>, {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        }, {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        }>;
        travelStyle: z.ZodObject<{
            pace: z.ZodEnum<["slow", "moderate", "fast"]>;
            accommodationType: z.ZodEnum<["budget", "mid-range", "luxury", "mixed"]>;
            diningPreferences: z.ZodEnum<["local", "international", "mixed"]>;
            activityLevel: z.ZodEnum<["low", "moderate", "high"]>;
            culturalImmersion: z.ZodEnum<["minimal", "moderate", "deep"]>;
        }, "strip", z.ZodTypeAny, {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        }, {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        }>;
        interests: z.ZodArray<z.ZodString, "many">;
        avoidances: z.ZodArray<z.ZodString, "many">;
        dietaryRestrictions: z.ZodArray<z.ZodString, "many">;
        accessibility: z.ZodArray<z.ZodString, "many">;
        tripVibe: z.ZodString;
        travelExperience: z.ZodEnum<["first-time", "experienced", "expert"]>;
        dinnerChoice: z.ZodEnum<["fine-dining", "local-spots", "street-food", "mixed"]>;
        nickname: z.ZodOptional<z.ZodString>;
        additionalServices: z.ZodObject<{
            carRental: z.ZodBoolean;
            travel_insurance: z.ZodBoolean;
            tours: z.ZodBoolean;
            airport_transfers: z.ZodBoolean;
            spa_wellness: z.ZodBoolean;
            adventure_activities: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        }, {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        }>;
        sessionId: z.ZodOptional<z.ZodString>;
        formVersion: z.ZodString;
        submittedAt: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    }, "strip", z.ZodTypeAny, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }>, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }>, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }>, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }, {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    }>;
}, "strip", z.ZodTypeAny, {
    formData?: {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    };
    sessionId?: string;
}, {
    formData?: {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    };
    sessionId?: string;
}>;
/**
 * Form Section Schemas (for incremental validation)
 */
export declare const FormSectionSchemas: {
    readonly tripDetails: z.ZodEffects<z.ZodEffects<z.ZodObject<{
        location: z.ZodString;
        departDate: z.ZodEffects<z.ZodString, string, string>;
        returnDate: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
        flexibleDates: z.ZodBoolean;
        plannedDays: z.ZodOptional<z.ZodNumber>;
        adults: z.ZodNumber;
        children: z.ZodNumber;
        childrenAges: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    }, "strip", z.ZodTypeAny, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }>, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }>, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }, {
        location?: string;
        children?: number;
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
    }>;
    readonly budget: z.ZodEffects<z.ZodObject<{
        total: z.ZodNumber;
        currency: z.ZodString;
        breakdown: z.ZodObject<{
            accommodation: z.ZodNumber;
            food: z.ZodNumber;
            activities: z.ZodNumber;
            transportation: z.ZodNumber;
            shopping: z.ZodNumber;
            emergency: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        }, {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        }>;
        flexibility: z.ZodEnum<["strict", "flexible", "very-flexible"]>;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }>, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }, {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    }>;
    readonly travelStyle: z.ZodObject<{
        pace: z.ZodEnum<["slow", "moderate", "fast"]>;
        accommodationType: z.ZodEnum<["budget", "mid-range", "luxury", "mixed"]>;
        diningPreferences: z.ZodEnum<["local", "international", "mixed"]>;
        activityLevel: z.ZodEnum<["low", "moderate", "high"]>;
        culturalImmersion: z.ZodEnum<["minimal", "moderate", "deep"]>;
    }, "strip", z.ZodTypeAny, {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    }, {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    }>;
    readonly preferences: z.ZodObject<{
        interests: z.ZodArray<z.ZodString, "many">;
        avoidances: z.ZodArray<z.ZodString, "many">;
        dietaryRestrictions: z.ZodArray<z.ZodString, "many">;
        accessibility: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        accessibility?: string[];
        interests?: string[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
    }, {
        accessibility?: string[];
        interests?: string[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
    }>;
};
/**
 * Validation Error Types
 */
export type ValidationError = z.ZodError;
export type TravelFormDataType = z.infer<typeof TravelFormDataSchema>;
export type WorkflowRequestType = z.infer<typeof WorkflowRequestSchema>;
/**
 * Validation Helper Functions
 */
export declare function validateFormSection(section: keyof typeof FormSectionSchemas, data: any): z.SafeParseReturnType<{
    total?: number;
    currency?: string;
    breakdown?: {
        accommodation?: number;
        food?: number;
        activities?: number;
        transportation?: number;
        shopping?: number;
        emergency?: number;
    };
    flexibility?: "strict" | "flexible" | "very-flexible";
}, {
    total?: number;
    currency?: string;
    breakdown?: {
        accommodation?: number;
        food?: number;
        activities?: number;
        transportation?: number;
        shopping?: number;
        emergency?: number;
    };
    flexibility?: "strict" | "flexible" | "very-flexible";
}> | z.SafeParseReturnType<{
    pace?: "slow" | "moderate" | "fast";
    accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
    diningPreferences?: "local" | "mixed" | "international";
    activityLevel?: "moderate" | "low" | "high";
    culturalImmersion?: "minimal" | "moderate" | "deep";
}, {
    pace?: "slow" | "moderate" | "fast";
    accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
    diningPreferences?: "local" | "mixed" | "international";
    activityLevel?: "moderate" | "low" | "high";
    culturalImmersion?: "minimal" | "moderate" | "deep";
}> | z.SafeParseReturnType<{
    location?: string;
    children?: number;
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
}, {
    location?: string;
    children?: number;
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
}> | z.SafeParseReturnType<{
    accessibility?: string[];
    interests?: string[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
}, {
    accessibility?: string[];
    interests?: string[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
}>;
export declare function validateTravelFormData(data: any): z.SafeParseReturnType<{
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}, {
    location?: string;
    children?: number;
    accessibility?: string[];
    budget?: {
        total?: number;
        currency?: string;
        breakdown?: {
            accommodation?: number;
            food?: number;
            activities?: number;
            transportation?: number;
            shopping?: number;
            emergency?: number;
        };
        flexibility?: "strict" | "flexible" | "very-flexible";
    };
    sessionId?: string;
    interests?: string[];
    travelStyle?: {
        pace?: "slow" | "moderate" | "fast";
        accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
        diningPreferences?: "local" | "mixed" | "international";
        activityLevel?: "moderate" | "low" | "high";
        culturalImmersion?: "minimal" | "moderate" | "deep";
    };
    departDate?: string;
    returnDate?: string;
    flexibleDates?: boolean;
    plannedDays?: number;
    adults?: number;
    childrenAges?: number[];
    avoidances?: string[];
    dietaryRestrictions?: string[];
    tripVibe?: string;
    travelExperience?: "first-time" | "experienced" | "expert";
    dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
    nickname?: string;
    additionalServices?: {
        carRental?: boolean;
        travel_insurance?: boolean;
        tours?: boolean;
        airport_transfers?: boolean;
        spa_wellness?: boolean;
        adventure_activities?: boolean;
    };
    formVersion?: string;
    submittedAt?: string;
}>;
export declare function validateWorkflowRequest(data: any): z.SafeParseReturnType<{
    formData?: {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    };
    sessionId?: string;
}, {
    formData?: {
        location?: string;
        children?: number;
        accessibility?: string[];
        budget?: {
            total?: number;
            currency?: string;
            breakdown?: {
                accommodation?: number;
                food?: number;
                activities?: number;
                transportation?: number;
                shopping?: number;
                emergency?: number;
            };
            flexibility?: "strict" | "flexible" | "very-flexible";
        };
        sessionId?: string;
        interests?: string[];
        travelStyle?: {
            pace?: "slow" | "moderate" | "fast";
            accommodationType?: "budget" | "mid-range" | "luxury" | "mixed";
            diningPreferences?: "local" | "mixed" | "international";
            activityLevel?: "moderate" | "low" | "high";
            culturalImmersion?: "minimal" | "moderate" | "deep";
        };
        departDate?: string;
        returnDate?: string;
        flexibleDates?: boolean;
        plannedDays?: number;
        adults?: number;
        childrenAges?: number[];
        avoidances?: string[];
        dietaryRestrictions?: string[];
        tripVibe?: string;
        travelExperience?: "first-time" | "experienced" | "expert";
        dinnerChoice?: "mixed" | "fine-dining" | "local-spots" | "street-food";
        nickname?: string;
        additionalServices?: {
            carRental?: boolean;
            travel_insurance?: boolean;
            tours?: boolean;
            airport_transfers?: boolean;
            spa_wellness?: boolean;
            adventure_activities?: boolean;
        };
        formVersion?: string;
        submittedAt?: string;
    };
    sessionId?: string;
}>;
/**
 * Error Message Formatter
 */
export declare function formatValidationErrors(error: ValidationError): Record<string, string[]>;
