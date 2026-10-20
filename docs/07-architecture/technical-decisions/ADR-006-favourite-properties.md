# Stable private property bookmarks

Status: specified design, implementation unverified.

Decision: favourite_properties relates user_profiles to properties with UUID PK and unique pair. PUT/DELETE desired state, no toggle. Persistence independent of listing turnover/availability; visibility gate prevents hidden-content leaks.

Consequences: tests and issue acceptance must reference this behavior; record any approved change here and update affected PRDs/workflows/data/API/acceptance together.
