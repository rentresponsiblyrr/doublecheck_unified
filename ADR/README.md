# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for STR Certified's AI-powered vacation rental inspection platform.

## What are ADRs?

Architecture Decision Records (ADRs) are documents that capture important architectural decisions made during the development process. They provide:

- **Context**: The circumstances that led to the decision
- **Decision**: What was decided
- **Rationale**: Why the decision was made
- **Consequences**: The expected outcomes and trade-offs

## Index

- [ADR-0001](0001-adr-system-introduction.md) - Architecture Decision Records System Introduction (accepted)

## Status Summary

- **Proposed**: 0
- **Accepted**: 1
- **Rejected**: 0
- **Superseded**: 0

## For AI Agents

When making significant architectural decisions, please:

1. **Create an ADR** using the provided template
2. **Link to your decision logger entry** for traceability
3. **Reference related ADRs** if applicable
4. **Update the status** as the decision progresses

### Quick ADR Creation
```typescript
import { createSimpleADR } from '../src/lib/ai/adr-manager';

const adrId = await createSimpleADR(
  'Your Decision Title',
  'The specific decision made',
  'Why this decision was made',
  'The context that led to this decision'
);
```

### ADR Template Location
Use the [template.md](template.md) file as a starting point for new ADRs.

## Guidelines

### When to Create an ADR
- Technology stack decisions
- Architectural pattern choices
- Database schema changes
- API design decisions
- Security implementation choices
- Performance optimization strategies
- Integration architecture decisions
- Development workflow changes

### When NOT to Create an ADR
- Minor bug fixes
- Code style changes
- Documentation updates
- Small refactoring changes
- Temporary workarounds

### ADR Lifecycle
1. **Proposed** - Initial state when ADR is created
2. **Accepted** - Decision has been approved and implemented
3. **Rejected** - Decision was considered but not approved
4. **Superseded** - Decision has been replaced by a newer ADR

## Integration with AI Systems

This ADR system integrates with:
- **AI Decision Logger**: Tracks all AI decisions including ADR creation
- **Context Handoff System**: Provides ADR context to new AI agents
- **Learning Repository**: Builds knowledge from architectural decisions

## Maintenance

ADRs are:
- **Immutable** once accepted (create new ADRs to supersede)
- **Versioned** in git alongside code
- **Searchable** through the ADR manager system
- **Linked** to implementation changes

---
*This directory is managed by the ADR Management System.*
*Last updated: 2025-01-09*