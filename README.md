# Onchain To-Do

[![CI](https://github.com/ioiokot01/base-todo/actions/workflows/ci.yml/badge.svg)](https://github.com/ioiokot01/base-todo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636.svg)
![Chain](https://img.shields.io/badge/Base-Sepolia-0052ff.svg)

A personal **on-chain to-do list** for the [Base](https://base.org) ecosystem.
Every wallet has its own independent list and can add, edit, toggle, and delete
tasks — all stored on-chain.

Project 4 in a learning series (after the Onchain Guestbook, TipJar, and MiniNFT).
New concepts: **per-user storage** (`mapping(address => Task[])`), full **CRUD**,
and **gas-friendly deletion** with swap-and-pop.

## Stack

- [Hardhat 2](https://hardhat.org) — compile, test, deploy
- Solidity `0.8.24`
- Target chain: Base Sepolia (testnet)

## Getting started

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Contract

`contracts/TodoList.sol`

| Function | Description |
| --- | --- |
| `addTask(string text)` | Add a task to your list |
| `editTask(uint256 index, string text)` | Edit a task's text |
| `toggleTask(uint256 index)` | Flip done / not done |
| `deleteTask(uint256 index)` | Delete a task (swap-and-pop) |
| `getTasks(address owner)` | All tasks for an owner |
| `getMyTasks()` | The caller's tasks |
| `taskCount(address owner)` | Number of tasks |

Each task has a stable, non-reused `id` (unique per owner). Emits `TaskAdded`,
`TaskEdited`, `TaskToggled`, `TaskDeleted`.

> Note: deletion uses swap-and-pop, so array **order is not preserved** — the UI
> reads the full list after each change.

## Deploy

```bash
cp .env.example .env   # then fill in PRIVATE_KEY (testnet wallet only)
npm run deploy
```

## Roadmap

- [x] TodoList contract + tests
- [x] Deploy to Base Sepolia
- [x] Frontend (add / edit / toggle / delete)

## Deployments

| Network | Address |
| --- | --- |
| Base Sepolia | [`0xe89b6312DB066C3E5Ae5B507d94f135Fd2D4259f`](https://sepolia.basescan.org/address/0xe89b6312DB066C3E5Ae5B507d94f135Fd2D4259f) |

## Security notes

- No funds are handled — the contract only stores text tasks per wallet.
- Each wallet can only modify its own tasks (keyed by `msg.sender`).
- Secrets (`.env`, private keys) are git-ignored and never committed.
- All development targets a **testnet** — no real funds.

## License

MIT
