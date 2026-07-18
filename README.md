# Puzzles

> A tile-based collection of standalone puzzle <br/>
> [Live - Puzzles](https://puzzles.ryan-brock.com/)

---

## 📚 Table of Contents

- [What's My Purpose?](#-whats-my-purpose)
- [How to Use](#-how-to-use)
- [Adding a New Puzzle](#-adding-a-new-puzzle)
- [Technologies](#-technologies)
- [Getting Started (Local Setup)](#-getting-started-local-setup)
  - [Run Locally](#run-locally)
  - [Test](#test)
  - [GitHub Hooks](#github-hooks)
  - [Build](#build)
  - [Deploy](#deploy)

---

## 🧠 What's My Purpose?

To showcase and play the various puzzzles I've ran across in life and chosen to implement

---

## 🚦 How to Use

- `Tile Grid` - The home page shows categories of puzzles, each containing one or more selectable tiles
- `Tile` - Click a tile to open and play that puzzle
- `Logo` - Click the `Puzzles` logo in the header to return to the tile grid

---

## 🧩 Adding a New Puzzle

See [`.github/skills/add-puzzle/SKILL.md`](.github/skills/add-puzzle/SKILL.md) for the full step-by-step (component scaffold, registering it in `app.ts`/`app.html`, adding the tile to `constants/categories.ts`).

---

## 🛠 Technologies

- Framework: `Angular 22`
- Testing: `Vitest`
- Deployment: `GitHub Pages`

---

## 🚀 Getting Started (Local Setup)

* Install [node](https://nodejs.org/en)
* Clone [repo](https://github.com/rbrock44/puzzles)

---

### Run Locally

```
npm install
npm start
```

---

### Test

- Unit
    - `ng test` || `npm run test`
- Integration
    - `ng e2e` || `npm run e2e`

---

### Github Hooks

- Build
    - Trigger: On Push to Main
    - Action(s): Builds application then kicks off gh page action to deploy build output

---

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

---

### Deploy

Run `npm run prod` to build and deploy the project. Make sure to be on `master` and that it is up to date before running the command. It's really meant to be a CI/CD action

---
