# DIMS User Guide
## Comprehensive User Manual for All Roles

**Version:** 1.0  
**Date:** December 2025

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Officer Guide](#officer-guide)
3. [Manager Guide](#manager-guide)
4. [Farmer Guide](#farmer-guide)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements
- **Web Browser:** Chrome, Firefox, Safari, or Edge (latest version)
- **Internet Connection:** Stable broadband or mobile data
- **Screen Resolution:** Minimum 1280x720 (responsive design supports mobile)

### Accessing the System
1. Navigate to: **https://agri-twins.emergent.host**
2. Enter your email and password
3. Click "Sign in"

### First Login
- You will be automatically redirected to your role-specific homepage
- Update your profile information if needed
- Familiarize yourself with the navigation menu

### User Credentials (Demo)
- **Officer:** officer@dims9.com / officer123
- **Manager:** manager@dims9.com / manager123
- **Farmer:** farmer@dims9.com / farmer123

---

## Officer Guide

### Dashboard Overview

Upon login, officers see the **Cooperative Overview** page displaying all cooperatives in a grid format.

#### Key Elements:
- **Header:** Shows your name, role, and avatar
- **Quick Actions:** Analytics, Admin Tools, ISO Compliance
- **Cooperative Cards:** Each shows:
  - Cooperative name and location
  - Product type
  - Status badge (Active/Pending/At Risk)
  - Key metrics (Production, Quality %, Loss %)
  - Open issues count

### Managing Multiple Cooperatives

#### Viewing Cooperative Details
1. Click on any cooperative card
2. View detailed dashboard with:
   - Production trends (line chart)
   - Quality distribution (bar chart)
   - Loss analysis
   - Recent issues list

#### Comparing Performance
1. Click **"Analytics"** button
2. View comparative charts:
   - Production by cooperative
   - Quality grade distribution
   - Average loss percentages
   - Issue distribution by type

### Issue Management

#### Viewing All Issues
1. Click **"Issues"** in navigation or quick actions
2. See all issues across cooperatives with:
   - Severity indicators (Low/Medium/High/Critical)
   - Category (Quality/Environmental/Safety)
   - Status (Open/In Progress/Closed)
   - Assigned manager

#### Filtering Issues
- **By Status:** Select from dropdown (All/Open/In Progress/Closed)
- **By Cooperative:** Filter to specific cooperative
- **By Category:** Quality, Environmental, or Safety

#### Creating New Issues
1. Click **"Add Issue"** button
2. Fill in:
   - Select cooperative
   - Choose category and severity
   - Enter description (be specific, include ISO clause if applicable)
   - Document corrective action
   - Assign to manager (optional)
3. Click **"Create Issue"**

#### Editing Issues
1. Click **"Edit"** button on any issue card
2. Update fields as needed
3. Change status if progressing
4. Click **"Update Issue"**

### User Administration

#### Accessing Admin Tools
1. Click **"Admin Tools"** from dashboard
2. Select **"User Management"** tab

#### Creating New Users
1. Click **"Add User"** button
2. Enter:
   - Name
   - Email address
   - Password
   - Role (Officer/Manager/Farmer)
   - Cooperative assignment (for managers and farmers)
3. Click **"Create User"**

#### Editing Users
1. Click **"Edit"** button next to user
2. Update information
3. Change password if needed (leave blank to keep current)
4. Reassign cooperative if necessary
5. Click **"Update User"**

#### Deleting Users
1. Click **"Delete"** button next to user
2. Confirm deletion
3. Note: You cannot delete your own account

### ISO Compliance Monitoring

#### Viewing Overall Compliance
1. Navigate to **"ISO Compliance"** page
2. See:
   - Overall compliance score (percentage)
   - Individual scores for ISO 9001, 14001, 45001
   - Radar chart showing performance across standards
   - Issue statistics (Total, Closed, In Progress)

#### Detailed Standard Review
1. Click on tabs: **ISO 9001**, **ISO 14001**, or **ISO 45001**
2. For each standard, view:
   - Compliance score
   - Key requirements
   - Benefits of compliance
   - Implementation steps
   - Related issues from your cooperatives

### System Maintenance

#### Reinitializing Sample Data
1. Go to **Admin Tools** → **System Tools** tab
2. Click **"Reinitialize Sample Data"**
3. Confirm action
4. System will reset all data to demo state

#### Fixing Manager Account Issues
1. If a manager reports login/data access problems
2. Go to **Admin Tools** → **System Tools**
3. Click **"Fix Manager Cooperative"**
4. This reassigns manager to a valid cooperative

---

## Manager Guide

### Dashboard Overview

Managers see their **Cooperative Home** page with personalized KPIs.

#### Key Elements:
- **Header:** Shows cooperative name, country, product
- **Avatar:** Your profile picture (top right)
- **Quick Actions:** Data Entry, Issues, Analytics
- **KPI Cards:**
  - Total Production (kg)
  - Average Quality (Grade A %)
  - Post-Harvest Loss (%)
  - Open Issues count
- **Charts:**
  - Production trend over time
  - Quality distribution by grade

### Logging Production Data

#### Creating New Entry
1. Click **"Data Entry"** from home or navigation
2. Fill in the form:
   - **Date:** Select harvest date
   - **Total Production:** Enter in kg
   - **Grade A %:** Percentage of premium quality
   - **Grade B %:** Mid-grade percentage
   - **Post-Harvest Loss %:** Calculate from spoilage
   - **Post-Harvest Loss (kg):** Absolute loss amount
   - **Energy Use:** Select Low/Medium/High
3. **If there's a quality issue:**
   - Check "Has Nonconformity"
   - Describe the issue
   - Document corrective action taken
4. Click **"Submit Entry"**

#### Best Practices for Data Entry
- Log data daily or weekly consistently
- Be accurate with measurements
- Document issues when they occur
- Include details in nonconformity descriptions
- Follow up on corrective actions

### Viewing Historical Data

#### Accessing Data Entries
1. Click **"Data Entries"** or **"My History"**
2. See all past production logs with:
   - Date
   - Production amount
   - Quality grades
   - Loss percentages
   - Issues (if any)

#### Editing Entries
1. Click **"Edit"** button on any entry
2. Update values as needed
3. Click **"Update Entry"**

#### Deleting Entries
1. Click **"Delete"** button on entry
2. Confirm deletion
3. Use carefully - deletion is permanent

### Managing ISO Issues

#### Viewing Issues
1. Navigate to **"Issues Management"**
2. See all issues for your cooperative
3. Issues color-coded by severity:
   - 🔴 Critical - Red
   - 🟠 High - Orange
   - 🟡 Medium - Yellow
   - 🟢 Low - Green

#### Creating New Issue
1. Click **"Add Issue"** button
2. Fill in:
   - Date of occurrence
   - Category (Quality/Environmental/Safety)
   - Severity level
   - Detailed description (include ISO clause reference)
   - Corrective action plan
   - Assigned person (email)
3. Click **"Create Issue"**

#### Updating Issue Status
1. Find the issue card
2. Click appropriate status button:
   - **"Start Working"** - Changes from Open to In Progress
   - **"Mark as Closed"** - Closes the issue
   - **"Reopen Issue"** - Reopens if problem recurs

#### Editing Issues
1. Click **"Edit"** button on issue
2. Update description, corrective action, or assignment
3. Click **"Update Issue"**

### Using the What-If Simulator

#### Purpose
Model the financial impact of reducing post-harvest losses.

#### How to Use
1. Navigate to **"Simulator"** or **"What-If"**
2. Current production data pre-filled
3. Adjust sliders:
   - **Loss Reduction Target:** How much to reduce loss (e.g., 20%)
   - **Investment Amount:** Cost of intervention (e.g., $5,000)
4. View results:
   - Projected production increase
   - Additional revenue
   - ROI percentage
   - Payback period
5. Use insights for decision-making and investment proposals

### ISO Compliance Review

#### Checking Your Score
1. Go to **"ISO Compliance"** page
2. View your cooperative's overall score
3. See breakdown by standard:
   - ISO 9001 (Quality)
   - ISO 14001 (Environment)
   - ISO 45001 (Safety)

#### Understanding Requirements
1. Click on each standard tab
2. Read:
   - Key requirements
   - Benefits
   - Implementation steps
3. Review related issues from your cooperative
4. Use as guide for improvement actions

---

## Farmer Guide

### Dashboard Overview

Farmers see a **personal performance dashboard** with simple, actionable information.

#### Key Elements:
- **Header:** Farmer Portal title, cooperative name
- **Avatar:** Your profile picture
- **Quick Actions:**
  - 🟢 **Log Production** - Record harvest
  - 👥 **Community** - Access community hub
  - 📦 **My History** - View past entries

#### Statistics Cards
1. **Total Production** - Your harvest amount (last 7 entries)
2. **Avg Quality** - Your Grade A percentage
3. **Avg Loss** - Your post-harvest loss (target: below 5%)

### Recording Your Harvest

#### Logging Production
1. Click **"Log Production"** button
2. Fill in simple form:
   - Date of harvest
   - Total amount (kg)
   - Quality grade percentages
   - Any losses
   - Issues encountered
3. Click **"Submit"**

#### Tips for Accurate Logging
- Measure immediately after harvest
- Sort by quality before weighing
- Record any damage or spoilage
- Note weather or other factors affecting quality

### Training & Guidelines

The dashboard shows two training sections:

#### Quality Standards (ISO 9001)
- Sort produce by size and color
- Remove damaged items
- Store in clean containers
- Label with date and grade

#### Post-Harvest Best Practices
- Harvest early morning for freshness
- Handle gently to prevent bruising
- Cool produce quickly
- Clean and sanitize storage areas

#### Accessing Full Guidelines
- Click **"View Full ISO Guidelines"** button
- Opens complete ISO Compliance Center
- Detailed standards and procedures

### Market Information

View current prices by quality grade:
- **Grade A:** $3.50/kg (highest quality)
- **Grade B:** $2.80/kg (good quality)
- **Grade C:** $2.00/kg (acceptable quality)

**💡 Quality Tip:** Improving from Grade B to A increases earnings by 25%!

### Upcoming Tasks

Stays informed about:
- Training sessions (dates and times)
- Certification audits
- Safety briefings
- Important announcements

### Community Hub

Access by clicking **"Community"** button.

#### Cooperative Overview
See how your cooperative is performing:
- Total number of farmers
- Average quality percentage
- Total production

#### Announcements
Stay updated with:
- Training workshops
- Cooperative achievements
- New guidelines
- Important dates

#### Best Practices Library

Three categories of tips:

**1. Quality Management** (Blue cards)
- Harvest at optimal maturity
- Use clean containers
- Sort immediately
- Keep detailed records

**2. Loss Prevention** (Green cards)
- Handle produce gently
- Store in cool areas
- Check daily for spoilage
- Use proper ventilation

**3. Safety First** (Red cards)
- Wear protective equipment
- Keep areas clean
- Report hazards immediately
- Follow chemical procedures

#### Performance Comparison

Anonymous comparison with regional averages:
- Your cooperative's quality vs. region
- Loss percentage vs. region
- Progress bars showing performance

#### Training Schedule

Upcoming sessions with:
- Date and time
- Topic (e.g., "ISO 9001 Quality Management")
- Location
- Availability status

---

## Common Tasks

### Changing Your Password
1. Contact your project officer or manager
2. They can reset your password via User Management
3. You'll receive new credentials

### Reporting Technical Issues
1. Note the error message or behavior
2. Document what you were trying to do
3. Contact system administrator
4. Provide screenshots if possible

### Exporting Data
*(Future feature - currently in development)*
- Dashboard data can be screenshot
- Charts can be right-click → Save Image

### Accessing from Mobile
1. Open web browser on phone/tablet
2. Navigate to application URL
3. Login as normal
4. Interface adapts to screen size
5. All features available

---

## Troubleshooting

### Login Issues

**Problem:** "Invalid credentials" error
- **Solution:** Check email and password spelling
- **Solution:** Ensure caps lock is off
- **Solution:** Contact officer to verify account exists

**Problem:** Page doesn't load after login
- **Solution:** Check internet connection
- **Solution:** Clear browser cache and cookies
- **Solution:** Try different browser

### Data Entry Issues

**Problem:** Form won't submit
- **Solution:** Ensure all required fields are filled (marked with *)
- **Solution:** Check that percentages add up correctly
- **Solution:** Verify date is not in future

**Problem:** Can't see my cooperative's data
- **Solution:** Verify you're assigned to a cooperative (managers/farmers)
- **Solution:** Contact officer to check cooperative assignment

### Performance Issues

**Problem:** Page loads slowly
- **Solution:** Check internet speed
- **Solution:** Close other browser tabs
- **Solution:** Clear browser cache

**Problem:** Charts don't display
- **Solution:** Ensure JavaScript is enabled
- **Solution:** Update browser to latest version
- **Solution:** Disable browser extensions temporarily

### Display Issues

**Problem:** Layout looks broken
- **Solution:** Zoom to 100% (Ctrl+0 or Cmd+0)
- **Solution:** Increase window size
- **Solution:** Try different browser

**Problem:** Text too small to read
- **Solution:** Use browser zoom (Ctrl/Cmd + Plus)
- **Solution:** Adjust browser font size settings

---

## Tips for Success

### For Officers
1. Review cooperative performance weekly
2. Follow up on high-severity issues within 24 hours
3. Recognize top-performing cooperatives
4. Share best practices across cooperatives
5. Keep user accounts organized

### For Managers
1. Log production data consistently (daily or weekly)
2. Document issues as they occur, not retrospectively
3. Include detailed corrective actions
4. Close issues only after verifying resolution
5. Use the simulator before major investments

### For Farmers
1. Record harvests immediately for accuracy
2. Review training materials regularly
3. Check community announcements weekly
4. Attend scheduled training sessions
5. Share your own tips in community discussions

---

## Contact & Support

For technical support or questions about the system:
- **Email:** support@dims.com
- **Phone:** +1-XXX-XXX-XXXX
- **Hours:** Monday-Friday, 9 AM - 5 PM

For role-specific questions:
- **Officers:** Contact system administrator
- **Managers:** Contact your MOGD project officer
- **Farmers:** Contact your cooperative manager

---

## Appendix: Keyboard Shortcuts

- **Tab** - Move to next field
- **Shift+Tab** - Move to previous field
- **Enter** - Submit form (when in form)
- **Esc** - Close dialog/modal
- **Ctrl/Cmd + F** - Search page
- **Ctrl/Cmd + Plus** - Zoom in
- **Ctrl/Cmd + Minus** - Zoom out
- **Ctrl/Cmd + 0** - Reset zoom

---

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Next Review:** June 2026
