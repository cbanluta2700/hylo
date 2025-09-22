# Hylo Travel AI Development Guidelines

Auto-generated from all feature plans. Last updated: [DATE]

## Constitutional Principles (NON-NEGOTIABLE)

All development must comply with the Hylo Travel AI Constitution v1.0.0:

1. **Edge-First Architecture**: Vercel Edge Runtime only, no Node.js built-ins
2. **Component Composition Pattern**: BaseFormProps interface, unidirectional data flow
3. **User Experience Consistency**: Design tokens `bg-form-box (#ece8de)`, `rounded-[36px]`
4. **Code-Deploy-Debug Flow**: Rapid implementation → deployment → production testing
5. **Type-Safe Development**: TypeScript strict + Zod validation at API boundaries

## Active Technologies

- **Frontend**: React 18.3.1 + TypeScript 5.5.3 + Vite + Tailwind CSS 3.4.1
- **Forms**: React Hook Form 7.62.0 + Zod 3.25.76 validation
- **Icons**: Lucide React 0.344.0
- **Backend**: Vercel Edge Functions (Edge Runtime only)
- **Workflows**: Inngest 3.41.0 for async processing
- **Testing**: Vitest 3.2.4 + React Testing Library (deployment-focused)

## Project Structure

```
hylo/
├── src/                           # Frontend React application
│   ├── components/               # React components (composition pattern)
│   │   ├── TripDetails/         # Form component group
│   │   │   ├── index.tsx        # Parent component with state
│   │   │   ├── types.ts         # Shared interfaces (BaseFormProps)
│   │   │   └── [Form].tsx       # Individual form components
│   │   └── [Feature]/           # Feature-specific components
│   ├── hooks/                   # Custom React hooks
│   ├── schemas/                 # Zod validation schemas
│   ├── types/                   # TypeScript type definitions
│   └── utils/                   # Shared utilities
├── api/                         # Vercel Edge Functions
│   └── [endpoint]/              # Individual API endpoints
└── tests/                       # Test files (integration-focused)
```

## Development Commands

### Frontend Development

```bash
npm run dev                      # Start Vite development server
npm run build                    # Build for production
npm run type-check              # TypeScript validation
```

### Testing (Constitutional: deployment-focused)

```bash
npm run test                     # Run Vitest tests
npm run test:coverage           # Test coverage report
```

### Deployment (Constitutional: Code-Deploy-Debug)

```bash
npm run deploy                   # Deploy to Vercel staging
npm run deploy:prod            # Deploy to production
```

## Code Style

[LANGUAGE-SPECIFIC, ONLY FOR LANGUAGES IN USE]

## Recent Changes

[LAST 3 FEATURES AND WHAT THEY ADDED]

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
