## Sequence diagram: "Hang a 20 kg shelf"

Use case: a DIY beginner wants to hang a shelf. The app asks for the wall type, checks safety, matches products only from our catalogue and shows where to find them in the store.

```mermaid
sequenceDiagram
  autonumber
  actor C as Customer
  participant UI as Baumarkt Buddy app
  participant S as Safety checker agent
  participant P as Planner agent (AI)
  participant K as Catalogue agent
  participant DB as product_catalogue.csv
  participant G as Store guide agent
  participant M as store_map.csv

  C->>UI: "I want to hang a 20 kg shelf"
  UI->>S: Check scope (electrics, gas, structural?)
  S-->>UI: OK, supported project

  UI->>P: Interpret request
  P-->>UI: Project = shelf, load = 20 kg, wall type missing
  UI->>C: Which wall type? (solid / drywall / not sure)
  C->>UI: Answer

  alt Wall type "not sure"
    UI->>S: Wall type unknown
    S-->>UI: Block fixings and drilling advice
    UI-->>C: "Check the wall first" + ask store staff / freestanding shelf
  else Solid wall or drywall
    UI->>P: Wall type confirmed
    P->>K: Needed: board, brackets, wall plugs, screws
    K->>DB: Find products for wall type with max load ≥ 20 kg
    DB-->>K: Candidate products (IDs, price, load)
    K->>S: Validate products

    alt Validation fails (load too low, wrong wall type, needs a professional)
      S-->>UI: Block item and give reason
      UI-->>C: Safe alternative or "hire a professional"
    else All checks pass
      S-->>K: Approved
      K->>G: Approved product IDs
      G->>M: Look up aisle and shelf
      M-->>G: Aisle and shelf numbers
      G-->>UI: Shopping list with store route
      UI-->>C: Shopping list, route, step-by-step guide (mock data labelled)
      C->>UI: Ticks items off while shopping
    end
  end
```

**Key rule:** The AI only interprets the request. Products, loads and safety decisions always come from the catalogue and the safety checker. If anything is unknown, the app stops rather than guessing.
