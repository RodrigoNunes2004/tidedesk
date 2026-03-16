Rules for AI agents and developers working on the TideDesk SaaS platform.

These rules ensure:

consistent architecture

scalable code

responsive UI

multi-tenant safety

stable APIs

All contributions must follow these rules.

1. Core Architecture Rules

TideDesk uses a modular monolith architecture.

Do NOT mix business logic inside UI components or API routes.

Correct Layer Responsibilities
Layer	Responsibility
app	routing and page layout
components	UI components only
modules	business logic
lib	shared services and utilities
integrations	external APIs
jobs	background jobs
prisma	database schema
API Route Rule

API routes must remain thin controllers.

Example:

app/api/v1/bookings/route.ts

Allowed:

validate request
authenticate user
call service
return response

NOT allowed:

complex business logic
database queries across modules
analytics calculations

Instead:

bookingService.createBooking()
2. Multi-Tenant Safety Rules

TideDesk is a multi-tenant SaaS.

Every database query must include:

businessId

Example:

Correct:

prisma.booking.findMany({
  where: { businessId }
})

Incorrect:

prisma.booking.findMany()

Never expose cross-tenant data.

3. Database Rules (Prisma)

All new models must include:

id
createdAt
updatedAt
businessId (if tenant data)

Example:

model Lesson {
  id         String   @id @default(cuid())
  businessId String
  name       String
  price      Float
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
Index Rules

Indexes must exist for:

businessId
date
foreign keys

Example:

@@index([businessId])
@@index([businessId, date])
4. API Design Rules

All public APIs must live under:

/api/v1/

Example:

/api/v1/bookings
/api/v1/customers
/api/v1/payments

Future breaking changes require:

/api/v2/
Response Format

All APIs must return:

{
  success: boolean,
  data: object | null,
  error: string | null
}

Example:

{
  success: true,
  data: { bookings: [] },
  error: null
}
5. UI Component Rules

TideDesk uses:

React 19

Tailwind 4

shadcn/ui

Component Structure

Components must be reusable.

Example:

components/ui/
components/dashboard/
components/analytics/
components/bookings/

Avoid putting large components inside pages.

Maximum Component Size

Rule:

Max 300 lines per component

Split components if larger.

6. Responsive Design Rules

TideDesk must work on:

desktop

tablet

beach tablets

mobile phones

Use mobile-first design.

Required Breakpoints

Tailwind breakpoints must be used consistently.

Screen	Width
mobile	<640px
tablet	640–1024px
desktop	1024–1440px
wide	>1440px

Example:

grid-cols-1
md:grid-cols-2
lg:grid-cols-4
Touch Target Rule

All interactive elements must be at least:

44px × 44px

Required for:

tablets

phones

beach mode

Spacing Rules

Use consistent spacing scale.

Allowed:

p-2
p-4
p-6
p-8

Avoid arbitrary spacing.

7. Dashboard Layout Rules

Dashboard cards must follow this layout.

Desktop:

4 column grid

Tablet:

2 column grid

Mobile:

1 column stack

Example:

grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
8. Charts and Analytics Rules

Charts must use:

Recharts

All charts must support:

responsive container

Example:

<ResponsiveContainer width="100%" height={300}>

Charts must support:

30 days
90 days
custom range
9. Performance Rules

Avoid expensive database queries inside page loads.

For analytics use:

aggregated queries
cached results
daily analytics tables

If query takes >300ms:

Create cached version.

10. Weather API Rules

Stormglass API has strict limits.

Rules:

Always use weather cache
Never call API directly in UI

Allowed flow:

cron job
↓
cache refresh
↓
API endpoint
↓
UI
11. Cron Job Rules

Cron jobs must live in:

jobs/

Example:

jobs/weatherJob.ts
jobs/analyticsJob.ts
jobs/notificationsJob.ts

Never run cron logic inside UI routes.

12. Security Rules

Authentication must use:

NextAuth
JWT sessions

Protected API routes must verify:

session
role
businessId

Example roles:

OWNER
ADMIN
INSTRUCTOR
13. Role-Based UI Rules

Different roles must see different dashboards.

Instructor view:

today schedule
students
lesson notes

Owner view:

revenue
analytics
equipment

Never expose admin features to instructors.

14. Error Handling Rules

Errors must never expose internal details.

Bad:

Database error: column missing

Good:

Something went wrong. Please try again.
15. Accessibility Rules

All UI must support accessibility.

Required:

ARIA labels
keyboard navigation
focus states

Color contrast must meet WCAG standards.

16. Mobile & Beach Mode Rules

The /beach interface must prioritize:

large buttons
minimal typing
fast actions

Max steps for rental:

3 clicks

Example flow:

select equipment
assign customer
confirm
17. Code Quality Rules

All code must follow:

TypeScript strict mode

Avoid:

any

Prefer:

explicit types
18. Feature Implementation Rules

When implementing new features:

Always follow this order.

1 database schema
2 prisma migration
3 service logic
4 API route
5 UI component
6 dashboard integration
19. Documentation Rules

All major features require documentation in:

/docs/

Example:

WEATHER_ENGINE.md
ANALYTICS_SYSTEM.md
API_ACCESS.md
20. Code Stability Rule

Never break existing features.

Before implementing new code verify:

bookings
rentals
payments
weather
equipment

still function correctly.

Recommended Additional File Structure

I recommend creating this folder:

/docs

Example:

docs/

AGENT_RULES.md
ARCHITECTURE.md
ANALYTICS_SYSTEM.md
WEATHER_ENGINE.md
API_GUIDELINES.md