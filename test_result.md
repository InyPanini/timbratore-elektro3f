#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build Employee Attendance App for ELEKTRO 3F SRLS with: JWT auth, admin/employee roles, GPS tracking, shift management, multi-language support, monthly reports with digital signatures, PDF export, and admin dashboard"

backend:
  - task: "User Authentication (Login)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Login tested with curl - admin account info@elektro3f.it works"

  - task: "User Registration"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Registration tested with curl - creates employee accounts"

  - task: "Admin Account Seeding"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Admin accounts created on startup: info@elektro3f.it, elektro3fbz@gmail.com"

  - task: "Password Reset (MOCKED)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Implemented MOCKED reset code generation"
      - working: true
        agent: "testing"
        comment: "MOCKED password reset working correctly - generates reset code and allows password change"

  - task: "Shift Actions (Start/End/Pause)"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Shift start tested with curl - GPS coordinates saved"

  - task: "Shift Status and History"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Current status and history endpoints implemented"
      - working: true
        agent: "testing"
        comment: "All shift endpoints working: current-status, today, history, daily-summary all return correct data"

  - task: "Monthly Report Generation"
    implemented: true
    working: false
    file: "server.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Monthly report generation with daily summaries"
      - working: false
        agent: "testing"
        comment: "CRITICAL: MongoDB ObjectId serialization error - ValueError: ObjectId object is not iterable. Backend returns 500 error when generating monthly reports"

  - task: "Employee Signature"
    implemented: true
    working: false
    file: "server.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Sign monthly report endpoint implemented"
      - working: false
        agent: "testing"
        comment: "Cannot test - depends on Monthly Report Generation which is failing due to ObjectId serialization error"

  - task: "Admin Counter-signature"
    implemented: true
    working: false
    file: "server.py"
    stuck_count: 1
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Counter-sign endpoint for admin"
      - working: false
        agent: "testing"
        comment: "Cannot test - depends on Monthly Report Generation which is failing due to ObjectId serialization error"

  - task: "Admin Employee Management"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Get all employees, shifts, locations endpoints"
      - working: true
        agent: "testing"
        comment: "All admin endpoints working: employees list, employee shifts, employee locations, unsigned reports, today activity"

  - task: "Profile Update with Picture"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: NA
        agent: "main"
        comment: "Profile update with base64 profile picture"
      - working: true
        agent: "testing"
        comment: "Profile endpoints working: get profile, update profile (name, language, picture), change password all successful"

frontend:
  - task: "Login Screen"
    implemented: true
    working: NA
    file: "app/login.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Login with email/password, forgot password link"

  - task: "Registration Screen"
    implemented: true
    working: NA
    file: "app/register.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Employee registration form"

  - task: "Dashboard with Shift Controls"
    implemented: true
    working: NA
    file: "app/dashboard.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Start/End/Pause buttons, GPS capture, mandatory notes modal"

  - task: "Hamburger Menu Navigation"
    implemented: true
    working: NA
    file: "src/components/HamburgerMenu.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Top-right hamburger menu with all navigation options"

  - task: "Multi-language Support"
    implemented: true
    working: NA
    file: "src/i18n/index.ts"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Italian, English, French, German, Arabic, Moroccan Darija with RTL"

  - task: "History Screen"
    implemented: true
    working: NA
    file: "app/history.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Shift history with daily summaries and PDF export"

  - task: "Reports Screen with Signature"
    implemented: true
    working: NA
    file: "app/reports.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Monthly report view, signature pad, PDF generation"

  - task: "Profile Screen"
    implemented: true
    working: NA
    file: "app/profile.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Profile picture upload, language change, password change"

  - task: "Admin Employees List"
    implemented: true
    working: NA
    file: "app/admin/employees.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "List all employees with shift/location links"

  - task: "Admin Signatures Screen"
    implemented: true
    working: NA
    file: "app/admin/signatures.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Pending reports with counter-sign functionality"

  - task: "Admin Activity Screen"
    implemented: true
    working: NA
    file: "app/admin/activity.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "Today's activity across all employees"

  - task: "Admin Employee Locations Map"
    implemented: true
    working: NA
    file: "app/admin/employee-locations.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: NA
        agent: "main"
        comment: "OpenStreetMap with location markers"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Monthly Report Generation"
    - "Employee Signature"
    - "Admin Counter-signature"
  stuck_tasks:
    - "Monthly Report Generation"
    - "Employee Signature"
    - "Admin Counter-signature"
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Initial implementation complete. Need to test all backend endpoints and frontend flows. Please test authentication, shift management, and monthly report workflows."
  - agent: "testing"
    message: "Backend testing completed. CRITICAL ISSUE: Monthly Report Generation failing with MongoDB ObjectId serialization error. All other endpoints working correctly. Authentication, shift management, user profiles, and admin functions all pass tests. Monthly reports, employee signatures, and admin counter-signatures blocked by ObjectId serialization bug."