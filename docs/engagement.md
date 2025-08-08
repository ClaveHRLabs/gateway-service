# Engagement Service API (Gateway Prefix: /eng)

Base path at gateway: /eng/api
Auth: Bearer token required.

Standard response envelope (see docs/README.md)

## Recognitions
- POST /eng/api/recognitions { ...recognition }
- GET /eng/api/recognitions
- GET /eng/api/recognitions/:id
- PUT /eng/api/recognitions/:id { ...partial }
- DELETE /eng/api/recognitions/:id
- POST /eng/api/recognitions/:id/like
- GET /eng/api/recognitions/:id/likes
- GET /eng/api/recognitions/:id/comments
- PUT /eng/api/recognitions/:id/comments/:commentId
- DELETE /eng/api/recognitions/:id/comments/:commentId
- POST /eng/api/recognitions/badges
- GET /eng/api/recognitions/badges
- GET /eng/api/recognitions/leaders
- GET /eng/api/recognitions/metrics

## Wellness
- GET /eng/api/wellness
- POST /eng/api/wellness { ...program }
- GET /eng/api/wellness/active
- GET /eng/api/wellness/:id
- PUT /eng/api/wellness/:id { ...partial }
- DELETE /eng/api/wellness/:id
- GET /eng/api/wellness/:id/statistics
- GET /eng/api/wellness/:id/activities
- POST /eng/api/wellness/:id/activities { ...activity }
- PUT /eng/api/wellness/activities/:activityId { ...partial }
- DELETE /eng/api/wellness/activities/:activityId
- POST /eng/api/wellness/activities/:activityId/complete
- POST /eng/api/wellness/activities/complete-multiple { activityIds: uuid[] }
- GET /eng/api/wellness/:id/participants
- POST /eng/api/wellness/:id/participants { employeeId: uuid }
- DELETE /eng/api/wellness/:id/participants { employeeId: uuid }
- GET /eng/api/wellness/me
- GET /eng/api/wellness/progress

## Events
- GET /eng/api/events
- POST /eng/api/events { ...event }
- GET /eng/api/events/upcoming
- GET /eng/api/events/calendar
- GET /eng/api/events/resources
- GET /eng/api/events/:id
- PUT /eng/api/events/:id { ...partial }
- DELETE /eng/api/events/:id
- GET /eng/api/events/:id/registrations
- POST /eng/api/events/:id/register
- DELETE /eng/api/events/:id/register
- GET /eng/api/events/:id/is-registered
- PUT /eng/api/events/registrations/:registrationId/status { status }
- POST /eng/api/events/registrations/bulk-status { registrationIds: uuid[], status }
- GET /eng/api/events/me

## Suggestions
- GET /eng/api/suggestions
- POST /eng/api/suggestions { ...suggestion }
- GET /eng/api/suggestions/trending
- GET /eng/api/suggestions/metrics
- GET /eng/api/suggestions/:id
- PUT /eng/api/suggestions/:id { ...partial }
- DELETE /eng/api/suggestions/:id
- PUT /eng/api/suggestions/:id/status { status }
- POST /eng/api/suggestions/:id/vote
- DELETE /eng/api/suggestions/:id/vote
- GET /eng/api/suggestions/:id/has-voted
- GET /eng/api/suggestions/:id/responses
- POST /eng/api/suggestions/:id/responses { content }
- PUT /eng/api/suggestions/responses/:responseId { content }
- DELETE /eng/api/suggestions/responses/:responseId

## Metrics
- GET /eng/api/metrics
- POST /eng/api/metrics { name, value, timestamp? }
- GET /eng/api/metrics/dashboard
- GET /eng/api/metrics/timeseries?name=...
- GET /eng/api/metrics/departments
- GET /eng/api/metrics/overall
- POST /eng/api/metrics/calculate-overall
- DELETE /eng/api/metrics

## Retention
- GET /eng/api/retention
- GET /eng/api/retention/factors
- GET /eng/api/retention/distribution
- GET /eng/api/retention/:employeeId
- POST /eng/api/retention/:employeeId/calculate
- DELETE /eng/api/retention/:employeeId

## Dashboards
- GET /eng/api/dashboards
- POST /eng/api/dashboards { ...dashboard }
- GET /eng/api/dashboards/default
- GET /eng/api/dashboards/summary
- POST /eng/api/dashboards/snapshot
- GET /eng/api/dashboards/:id
- PUT /eng/api/dashboards/:id/default
- DELETE /eng/api/dashboards/:id
