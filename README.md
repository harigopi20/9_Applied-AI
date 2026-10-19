# Baumarkt-Buddy 🛠️
*AI shopping and project assistant for DIY stores – MBA Applied AI group project*

## What is it?
Baumarkt-Buddy is a mobile web app that helps DIY-store customers plan small home projects.
A customer types a project (e.g. "hang a 20 kg shelf") or takes a photo of a part, and gets:
- a **shopping list** of the right products
- a **store map** with the route to each aisle and shelf
- a **step-by-step guide** for the job

For risky work (electrics, gas, load-bearing walls) the app shows a **"hire a professional"** warning.

## Why this idea?
Real customer problem, our own sample data, low GDPR risk, buildable in 2 weeks, and a clear B2B customer (the DIY store).

## How it works
The AI only recommends products from our own catalogue. Every answer is checked
(product exists, sizes match, safety rules) before the customer sees it.
See [diagrams](diagrams/baumarkt-buddy-diagrams.md) for details.

## Repository structure
| Folder | Content |
|---|---|
| `docs/` | Requirements, research, meeting notes, references |
| `data/` | Product catalogue (CSV) and store map |
| `diagrams/` | Architecture and planning diagrams |
| `app/` | App code and AI prompts |
| `tests/` | Test cases and results |
| `pitch/` | Pitch deck and demo video link |

## Team
| Role | Member |
|---|---|
| Project lead & Product Owner | @st854d2gpb-create |
| App builder | tbd |
| Data & research | @shallykwatra19 |
| Quality & responsible AI | @harigopi20 |
| Business & design | @saraschoenhoefer-maker |

## Timeline
2-week MVP sprint starting 19 Oct 2026 → final pitch.

## Limitations
Sample catalogue (70 products), invented prices and aisle positions, no live stock data.
