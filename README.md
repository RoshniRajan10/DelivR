# TrackMate - Real-Time Delivery Tracking & Chat System

A real-time delivery tracking application with live location sharing and instant messaging between delivery personnel and customers using WebSocket technology.

Deployed on Railway with secure WebSocket (WSS) connections.

---

# Overview

TrackMate enables:

- Live delivery tracking (1-second location updates)
- Instant two-way chat between customer and delivery personnel
- Dynamic customer-delivery boy pairing
- Secure and scalable cloud deployment

---

# Features

- Real-time location tracking (updates every second)
- Instant bidirectional messaging
- Dynamic pairing & re-pairing system
- Cloud deployed on Railway
- Secure WebSocket (WSS)
- Multiple concurrent delivery/customer pairs
- Sub-100ms message latency
- Auto-reconnection handling

---

# Tech Stack

| Component         | Technology               |
| ----------------- | ------------------------ |
| Backend           | Node.js                  |
| WebSocket Library | ws                       |
| Protocol          | WebSocket (WSS - Secure) |
| Deployment        | Railway                  |
| Package Manager   | npm                      |

---

# Prerequisites

- Node.js v18 or higher
- npm or yarn
- Railway account (for deployment)

---

# Local Development

## Step 1 – Start the Server (Terminal 1)

npm start

## Step 2 – Connect Delivery Boy (Terminal 2)

node src/tcp-sockets/delivery-boy.js DB001

## Step 3 – Connect Customer (Terminal 3)

node src/tcp-sockets/customer.js C001

## Step 4 – Pair Them (Terminal 4)

node src/tcp-sockets/pair.js C001 DB001

# Installation

## Clone the Repository

git clone <your-repository-url>
cd <project-folder>

## Install Dependencies

npm install

## Create .env File

SERVER_URL=wss://your-app.up.railway.app

# Railway Deployment

## Step 1 – Install Railway CLI

npm install -g @railway/cli

## Step 2 – Login

railway login

## Step 3 – Initialize Project

railway init

## Step 4 – Deploy

railway up

## Step 5 – Get Deployment URL

railway domain

## Step 6 – Update .env for Production

SERVER_URL=wss://your-app.up.railway.app

## Step 7 – Connect Clients to Production

### Delivery Boy

node src/tcp-sockets/delivery-boy.js DB001

### Customer

node src/tcp-sockets/customer.js C001

### Pair them

node src/tcp-sockets/pair.js C001 DB001

# NPM Scripts

Add this to your package.json:
"scripts": {
"start": "node src/tcp-sockets/server.js",
"delivery": "node src/tcp-sockets/delivery-boy.js",
"customer": "node src/tcp-sockets/customer.js",
"pair": "node src/tcp-sockets/pair.js"
}
