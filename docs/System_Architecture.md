# System Architecture Document

## 1. Overview
The Smart Queue Management System (SQMS) is a cloud-native platform designed to digitize the queuing process. This document outlines the architecture, data flow, and components of the system.

## 2. Architecture Components

### 2.1 Frontend (Next.js & React)
*   **User Portal:** A responsive web application where end-users can reserve a queue spot, view real-time status, and receive notifications.
*   **Admin Dashboard:** A web interface for staff/administrators to manage active queues, assign counters, and view analytics.
*   **Deployment:** Globally deployed via Vercel for CDN-level performance.

### 2.2 Backend & Infrastructure (Supabase)
*   **Database:** PostgreSQL for robust relational data storage.
*   **Authentication:** Supabase Auth for managing user sessions and Role-Based Access Control (RBAC).
*   **Real-time:** Supabase Real-time (WebSockets) to sync queue status instantly across all connected clients.
*   **Edge Functions:** Serverless functions executed globally to handle complex logic, API interactions, or scheduled tasks securely.

## 3. Data Flow
1.  **User Action:** A user reserves a ticket via the User Portal.
2.  **API Request:** Next.js sends an authenticated request to Supabase API.
3.  **Database Write:** A new record is created in the `Tickets` table.
4.  **Real-time Sync:** Supabase broadcasts the change to all subscribed clients (User Portal, Admin Dashboard).
5.  **UI Update:** React components re-render to display the updated queue position without a page refresh.

## 4. Scalability & Availability
*   **Serverless-first:** Leveraging Vercel and Supabase eliminates the need to manage infrastructure. Both scale automatically based on traffic.
*   **Edge delivery:** Static assets and SSR pages are cached at the edge, reducing latency.
