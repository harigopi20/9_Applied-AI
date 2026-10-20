# Baumarkt-Buddy diagrams

These diagrams summarize the product flow and prototype architecture described in the [requirements specification](../docs/requirements-specification.md). The prototype uses mock catalogue and store data; it is not connected to a retailer's live systems.

## Customer journey

```mermaid
sequenceDiagram
  actor Customer
  participant App as Mobile web app
  participant Plan as Planning service
  participant Catalogue as Mock catalogue and store map
  participant AI as AI model
  Customer->>App: Select store and describe project
  App->>Plan: Submit project and optional dimensions
  Plan->>Catalogue: Load eligible products and locations
  Catalogue-->>Plan: Catalogue entries, prices and aisle data
  Plan->>AI: Project, catalogue and safety rules
  AI-->>Plan: Proposed items, quantities and guidance
  Plan->>Plan: Validate products, sizes and safety
  alt Required detail is missing
    Plan-->>App: Ask a focused clarification question
    App-->>Customer: Request missing project detail
    Customer->>App: Provide answer or skip
    App->>Plan: Continue planning
  else Plan is valid
    Plan-->>App: Validated list and any applicable warning
    App-->>Customer: Show list, alternatives and aisle locations
  end
  Customer->>App: Swap items, tick off or share list
```

## Prototype architecture and safety boundary

```mermaid
flowchart LR
  Customer([Customer in store]) --> UI[Mobile web app]
  UI -->|Project text and dimensions| Planner[Project planning service]
  UI -.->|Optional project photo| Vision[Photo identification]
  Catalogue[(Mock product catalogue and store map)] --> Planner
  Catalogue --> Vision
  Planner --> Model[AI model]
  Vision --> Model
  Rules[Project templates and safety rules] --> Planner
  Rules --> Model
  Model --> Validator{Validate response}
  Validator -->|Known products, valid sizes and safe scope| Result[Shopping list, locations and guidance]
  Validator -->|Missing information| Clarify[Ask a clarification question]
  Validator -->|Risky work| Warning[Recommend a qualified professional]
  Validator -->|Invalid output| Retry[Retry or use a predefined template]
  Result --> UI
  Clarify --> UI
  Warning --> UI
  Retry --> UI
```

The model may propose catalogue product identifiers, but the application must resolve them against the catalogue and display catalogue-sourced names and prices. Electrical, gas and load-bearing work must trigger a professional referral rather than step-by-step instructions. Invalid model output must not be shown as a completed plan.

## MVP boundary

```mermaid
flowchart TB
  subgraph MVP["Prototype scope"]
    Input[Text project description]
    Questions[Up to 3 clarifying questions]
    Catalogue[One mock store and limited catalogue]
    List[Materials, tools and estimated quantities]
    Swap[Cheaper or premium alternatives]
    Save[Session list, check-off and share/export]
    Input --> Questions --> List
    Catalogue --> List
    List --> Swap
    List --> Save
  end
  subgraph Later["Possible later releases"]
    Photo[Photo-based suggestions]
    Route[Map with aisle route]
    Live[Live stock, price and store data]
    Cart[Retailer cart or click-and-collect]
  end
  MVP -. Possible extension .-> Later
```

The requirements identify photo suggestions and routed store maps as could-have features. Live stock, checkout, accounts and multiple stores are out of scope for the MVP. The current sample data and aisle positions are fictional.
