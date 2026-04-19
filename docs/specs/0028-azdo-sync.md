# Spec 0028: Azure DevOps sync

- **Status:** draft
- **Phase:** F3
- **Owner:** Rodolfo
- **Depends on:** —
- **Relevant ADRs:** —

## Why
Assigned work items feed into the timeline.

## Scope

### In
- Azure DevOps PAT
- WIQL query `[State] <> 'Closed' AND [Assigned To] = @Me`

### Out
- Creating work items via Coxinha → F4+

## Open questions
- Auth: does AAD OAuth (spec 0024) also grant AzDO access, or does
  AzDO need its own PAT?
