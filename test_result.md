backend:
  - task: "Login & Authentication API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Initial test setup - needs testing"

  - task: "Notifications API - List notifications with category field"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "GET /api/notifications endpoint needs testing for category field inclusion"

  - task: "Notifications API - Mark single notification as read"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "PATCH /api/notifications/{notification_id}/read endpoint needs testing"

  - task: "Notifications API - Mark all notifications as read"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "POST /api/notifications/read-all endpoint needs testing"

  - task: "Notifications API - Get unread count"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "GET /api/notifications/unread-count endpoint needs testing"

  - task: "Activity Timeline API"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "GET /api/history/timeline endpoint needs testing for order events, payment events, support tickets"

  - task: "Referral & Rewards API - Get referral info"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "GET /api/referral/me endpoint needs testing for code, link, stats, rewards_available, leaderboard_position, next_milestone"

  - task: "Referral & Rewards API - Simulate referral click"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "POST /api/referral/simulate-click endpoint needs testing to verify stats update"

frontend:
  - task: "Frontend Integration"
    implemented: false
    working: "NA"
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not required for this review"

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "Login & Authentication API"
    - "Notifications API - List notifications with category field"
    - "Notifications API - Mark single notification as read"
    - "Notifications API - Mark all notifications as read"
    - "Notifications API - Get unread count"
    - "Activity Timeline API"
    - "Referral & Rewards API - Get referral info"
    - "Referral & Rewards API - Simulate referral click"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Starting backend API testing for HostingIn dashboard features as per review request. Focus on notifications, activity timeline, and referral APIs."