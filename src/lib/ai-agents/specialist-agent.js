/**
 * Information Specialist Agent
 *
 * Constitutional Requirements:
 * - Edge Runtime compatibility
 * - XAI Grok for analysis and filtering
 * - Type-safe development
 *
 * Task: T024 - Implement Information Specialist agent
 */
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
import { generateText } from 'ai';
import { aiProviders } from '../ai-clients/providers.js';
/**
 * Information Specialist Agent
 * Uses XAI Grok for intelligent filtering and ranking of recommendations
 */
var InformationSpecialistAgent = /** @class */ (function () {
  function InformationSpecialistAgent() {
    this.agentType = 'specialist';
  }
  /**
   * Filter and rank recommendations based on user preferences
   */
  InformationSpecialistAgent.prototype.processRecommendations = function (input) {
    return __awaiter(this, void 0, void 0, function () {
      var startTime,
        client,
        systemPrompt,
        userPrompt,
        result,
        processingTime,
        processedInfo,
        error_1;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            startTime = Date.now();
            _b.label = 1;
          case 1:
            _b.trys.push([1, 3, , 4]);
            client = aiProviders.getClientForAgent(this.agentType);
            if (!client) {
              throw new Error('XAI Grok client not available for specialist agent');
            }
            console.log(
              '[Specialist Agent] Processing recommendations for workflow '.concat(input.workflowId)
            );
            systemPrompt = this.buildSystemPrompt();
            userPrompt = this.buildUserPrompt(input);
            return [
              4 /*yield*/,
              generateText({
                model: client.client(client.model),
                system: systemPrompt,
                prompt: userPrompt,
                temperature: 0.4, // Balanced for reasoning and consistency
              }),
            ];
          case 2:
            result = _b.sent();
            processingTime = Date.now() - startTime;
            processedInfo = this.parseSpecialistResponse(result.text, input);
            console.log('[Specialist Agent] Completed processing in '.concat(processingTime, 'ms'));
            return [
              2 /*return*/,
              __assign(
                __assign(__assign({}, processedInfo), { processingTime: processingTime }),
                ((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) && {
                  tokensUsed: result.usage.totalTokens,
                }
              ),
            ];
          case 3:
            error_1 = _b.sent();
            console.error(
              '[Specialist Agent] Failed for workflow '.concat(input.workflowId, ':'),
              error_1
            );
            throw new Error(
              'Recommendation processing failed: '.concat(
                error_1 instanceof Error ? error_1.message : 'Unknown error'
              )
            );
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Build system prompt for recommendation processing
   */
  InformationSpecialistAgent.prototype.buildSystemPrompt = function () {
    return 'You are an expert travel recommendation specialist with deep knowledge of traveler preferences and destination matching.\n\nYour role is to analyze gathered travel information against specific traveler preferences and provide intelligent filtering, ranking, and recommendations.\n\nKey responsibilities:\n1. Score and rank recommendations based on alignment with traveler preferences\n2. Filter out options that don\'t match traveler style or requirements\n3. Provide clear reasoning for recommendations and exclusions\n4. Suggest alternatives for filtered options when appropriate\n5. Consider practical factors like timing, logistics, and budget alignment\n\nScoring Criteria:\n- 90-100: Perfect match, highly recommended\n- 75-89: Great match, recommended\n- 60-74: Good match, consider including\n- 45-59: Moderate match, backup option\n- 0-44: Poor match, likely exclude\n\nOutput Format (JSON):\n{\n  "rankedRecommendations": {\n    "accommodations": [\n      {\n        "id": "unique_id",\n        "name": "Accommodation Name",\n        "score": 85,\n        "reasoning": "Why this scores well",\n        "matchedPreferences": ["preference1", "preference2"]\n      }\n    ],\n    "restaurants": [\n      {\n        "id": "unique_id", \n        "name": "Restaurant Name",\n        "score": 92,\n        "reasoning": "Why this is recommended",\n        "matchedPreferences": ["preference1", "preference2"]\n      }\n    ],\n    "activities": [\n      {\n        "id": "unique_id",\n        "name": "Activity Name", \n        "score": 88,\n        "reasoning": "Why this fits their interests",\n        "matchedPreferences": ["preference1", "preference2"],\n        "recommendedDay": 2\n      }\n    ]\n  },\n  "filteredOptions": {\n    "removed": [\n      {\n        "type": "accommodation|restaurant|activity",\n        "name": "Option Name",\n        "reason": "Why it was filtered out"\n      }\n    ],\n    "alternatives": [\n      {\n        "type": "accommodation|restaurant|activity",\n        "suggestion": "Alternative suggestion",\n        "reasoning": "Why this is a better fit"\n      }\n    ]\n  }\n}\n\nProvide thoughtful analysis and clear reasoning for all recommendations.';
  };
  /**
   * Build user prompt with architecture, gathered info, and preferences
   */
  InformationSpecialistAgent.prototype.buildUserPrompt = function (input) {
    return 'Analyze and rank the gathered travel recommendations based on these specific traveler preferences:\n\nUSER PREFERENCES:\n- Primary Interests: '
      .concat(input.userPreferences.interests.join(', '), '\n- Things to Avoid: ')
      .concat(
        input.userPreferences.avoidances.join(', ') || 'None specified',
        '\n- Travel Experience: '
      )
      .concat(input.userPreferences.travelExperience, '\n- Trip Vibe: ')
      .concat(input.userPreferences.tripVibe, '\n\nTRIP ARCHITECTURE:\n- Total Days: ')
      .concat(input.architecture.itineraryStructure.totalDays, '\n- Trip Style: ')
      .concat(input.architecture.planningContext.tripStyle, '\n- Budget Strategy: ')
      .concat(input.architecture.planningContext.budgetStrategy, '\n- Experience Goals: ')
      .concat(input.architecture.planningContext.experienceGoals.join(', '), '\n\nTRAVEL PHASES:\n')
      .concat(
        input.architecture.itineraryStructure.travelPhases
          .map(function (phase, i) {
            var _a;
            return 'Phase '
              .concat(i + 1, ': ')
              .concat(phase.focus, ' (Days ')
              .concat(
                ((_a = phase.days) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'N/A',
                ')'
              );
          })
          .join('\n'),
        '\n\nGATHERED ACCOMMODATIONS:\n'
      )
      .concat(
        input.gatheredInfo.accommodations
          .map(function (acc, i) {
            return ''
              .concat(i + 1, '. ')
              .concat(acc.name, ' (')
              .concat(acc.type, ', ')
              .concat(acc.priceRange, ', Rating: ')
              .concat(acc.rating, ') - ')
              .concat(acc.location);
          })
          .join('\n'),
        '\n\nGATHERED RESTAURANTS:\n'
      )
      .concat(
        input.gatheredInfo.restaurants
          .map(function (rest, i) {
            return ''
              .concat(i + 1, '. ')
              .concat(rest.name, ' (')
              .concat(rest.cuisine, ', ')
              .concat(rest.priceRange, ', Rating: ')
              .concat(rest.rating, ') - ')
              .concat(rest.location);
          })
          .join('\n'),
        '\n\nGATHERED ACTIVITIES:\n'
      )
      .concat(
        input.gatheredInfo.activities
          .map(function (act, i) {
            return ''
              .concat(i + 1, '. ')
              .concat(act.name, ' (')
              .concat(act.type, ', ')
              .concat(act.cost, ', Rating: ')
              .concat(act.rating, ') - ')
              .concat(act.description);
          })
          .join('\n'),
        "\n\nPlease analyze each recommendation and:\n1. Score how well it matches the traveler's specific preferences and trip goals\n2. Provide clear reasoning for the scoring\n3. Identify which preferences each recommendation satisfies\n4. Filter out poorly matching options with explanations\n5. Suggest better alternatives where appropriate\n6. For activities, recommend which day they would be best scheduled\n\nFocus on creating a personalized experience that truly matches what this traveler is looking for."
      );
  };
  /**
   * Parse AI response into structured specialist output
   */
  InformationSpecialistAgent.prototype.parseSpecialistResponse = function (responseText, input) {
    try {
      // Try to parse JSON response
      var jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        var parsed = JSON.parse(jsonMatch[0]);
        if (parsed.rankedRecommendations && parsed.filteredOptions) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('[Specialist Agent] JSON parsing failed, using fallback processing');
    }
    // Fallback: Create basic ranking based on simple heuristics
    return this.createFallbackRanking(input);
  };
  /**
   * Create fallback ranking when AI response parsing fails
   */
  InformationSpecialistAgent.prototype.createFallbackRanking = function (input) {
    var interests = input.userPreferences.interests.map(function (i) {
      return i.toLowerCase();
    });
    return {
      rankedRecommendations: {
        accommodations: input.gatheredInfo.accommodations.map(function (acc, i) {
          return {
            id: 'acc_'.concat(i),
            name: acc.name,
            score: Math.min(95, 60 + acc.rating * 10 + Math.random() * 20),
            reasoning: ''.concat(acc.type, ' accommodation with good rating and amenities'),
            matchedPreferences: [input.architecture.planningContext.tripStyle],
          };
        }),
        restaurants: input.gatheredInfo.restaurants.map(function (rest, i) {
          return {
            id: 'rest_'.concat(i),
            name: rest.name,
            score: Math.min(95, 65 + rest.rating * 8 + Math.random() * 15),
            reasoning: ''.concat(rest.cuisine, ' restaurant matching dining preferences'),
            matchedPreferences: ['dining preferences'],
          };
        }),
        activities: input.gatheredInfo.activities.map(function (act, i) {
          var matchScore = interests.some(function (interest) {
            return (
              act.name.toLowerCase().includes(interest) ||
              act.description.toLowerCase().includes(interest)
            );
          })
            ? 25
            : 0;
          return {
            id: 'act_'.concat(i),
            name: act.name,
            score: Math.min(95, 50 + matchScore + act.rating * 10 + Math.random() * 10),
            reasoning: ''.concat(act.type, ' activity aligned with interests'),
            matchedPreferences: interests.filter(function (interest) {
              return (
                act.name.toLowerCase().includes(interest) ||
                act.description.toLowerCase().includes(interest)
              );
            }),
            recommendedDay:
              Math.floor(Math.random() * input.architecture.itineraryStructure.totalDays) + 1,
          };
        }),
      },
      filteredOptions: {
        removed: [],
        alternatives: [
          {
            type: 'activity',
            suggestion: 'Consider additional local experiences',
            reasoning: 'Based on your interests, look for more local cultural activities',
          },
        ],
      },
    };
  };
  return InformationSpecialistAgent;
})();
export { InformationSpecialistAgent };
/**
 * Singleton instance for specialist agent
 */
export var specialistAgent = new InformationSpecialistAgent();
