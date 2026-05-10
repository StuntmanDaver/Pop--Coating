# **Product Requirements Document**

# **Pops Industrial Coatings CRM \+ Production Tracking System**

## **1\. Product Overview**

### **Product Name**

Pops Industrial Coatings CRM

### **Product Type**

Web-based CRM and Production Tracking System with QR-based job tracking.

### **Primary Goal**

Create a centralized system that manages:

• customer relationships  
 • job quoting and management  
 • shop floor production tracking  
 • inventory usage  
 • employee accountability  
 • real production analytics

The system will use **QR-coded job packets** to track jobs as they move through the powder coating workflow.

Every physical job packet becomes the **digital tracking key** for that job.

---

# **2\. Problems This System Solves**

Powder coating shops typically struggle with:

• losing track of jobs on the floor  
 • poor communication between office and shop  
 • no accurate timing data for production stages  
 • no accountability for job movement  
 • manual paperwork with no digital record  
 • inventory usage not tied to jobs  
 • no visibility into bottlenecks

This system solves those by creating:

• **QR tracked job packets**  
 • **scan-based job movement**  
 • **employee-linked activity logs**  
 • **real production timing data**

---

# **3\. Target Users**

### **Front Office Staff**

Responsibilities:  
 • create jobs  
 • manage customers  
 • generate quotes  
 • print job packets  
 • manage job intake

### **Shop Floor Employees**

Responsibilities:

• scan job packets  
 • move jobs between stages  
 • record production actions

### **Shop Managers**

Responsibilities:

• monitor job progress  
 • view production analytics  
 • track employee activity  
 • manage inventory

---

# **4\. Core System Architecture**

System Type:  
 Web-based SaaS style application.

### **Frontend**

React / NextJS / React Native Web (optional)

### **Backend**

Node.js API

### **Database**

PostgreSQL

### **QR Generation**

Server-side QR generation per job packet.

### **QR Scanning**

Web camera scanner (tablet or workstation).

---

# **5\. Core Modules**

The system consists of **two main layers**:

### **CRM Layer**

Handles customer and job management.

### **Production Layer**

Handles QR tracking, shop floor workflow, and inventory.

---

# **6\. CRM Module Requirements**

## **Companies**

Stores customer companies.

Fields

id  
name  
address  
city  
state  
zip  
phone  
email  
notes  
created\_at  
---

## **Contacts**

Stores contacts associated with companies.

id  
company\_id  
first\_name  
last\_name  
email  
phone  
role  
notes  
created\_at  
---

## **Jobs**

Represents each powder coating job.

Fields

id  
job\_number  
company\_id  
contact\_id  
job\_name  
description  
part\_count  
color  
coating\_type  
due\_date  
status  
priority  
notes  
created\_at  
updated\_at

Statuses include:

draft  
scheduled  
received  
prep  
coating  
curing  
inspection  
completed  
picked\_up  
---

## **Quotes**

Stores customer quotes.

id  
company\_id  
job\_id  
quote\_number  
total\_price  
status  
sent\_at  
approved\_at  
created\_at

Statuses:

draft  
sent  
approved  
rejected  
expired  
---

## **Activities / Notes**

Tracks communication and actions.

id  
entity\_type  
entity\_id  
user\_id  
activity\_type  
notes  
created\_at  
---

## **Users / Employees**

Stores system users.

id  
name  
email  
role  
password\_hash  
is\_active  
created\_at

Roles

admin  
office  
shop\_employee  
manager  
---

# **7\. QR Job Packet System**

## **Overview**

Each job will generate a **physical job packet sheet** containing:

• job info  
 • instructions  
 • QR code

This packet travels with the job throughout production.

---

## **Packet Creation**

When a job is created:

The system automatically generates:

• unique job ID  
 • unique QR code  
 • printable packet

Example Job ID:

JOB-2026-00124  
---

## **QR Code Structure**

QR codes link to a secure internal route:

/app/scan/packet/{packet\_token}

Example

/app/scan/packet/9f2a8k31

The token references the job packet record.

---

## **Job Packet Contents**

Printable sheet includes:

• Company name  
 • Job name  
 • Job number  
 • Parts description  
 • Coating color  
 • Due date  
 • Special instructions  
 • QR code  
 • Stage checklist

Optional:

• bin labels  
 • pallet labels  
 • rack labels

---

# **8\. Production Workflow**

The system tracks jobs through stages.

Standard stages:

Received  
Prep  
Coating  
Curing  
Inspection  
Completed  
Picked Up / Delivered

Each stage change occurs via **QR scan event**.

---

# **9\. QR Scan Behavior**

When a QR code is scanned:

The system must:

1. Identify the job  
2. Identify the employee  
3. Identify the workstation  
4. Record timestamp  
5. Show job status  
6. Allow next stage movement

---

# **10\. Employee Scan Flow**

### **Preferred Method (MVP)**

Employee logs into scanner page.

Then:

scan QR

System already knows:

• employee ID  
 • workstation

Employee selects next action.

Example:

Move to Prep  
Move to Coating  
Move to Curing  
Add Note  
Put On Hold  
---

### **Optional Later Feature**

Employee badge scanning.

Flow:

scan job QR  
scan employee badge  
record both  
---

# **11\. Job Status History**

Every job movement must create a permanent record.

Table:

job\_status\_history

Fields

id  
job\_id  
from\_status  
to\_status  
employee\_id  
workstation\_id  
scanned\_at  
notes  
duration\_seconds

The system calculates duration in previous stage.

This enables full production analytics.

---

# **12\. Web Scanner Interface**

The scanner page must be optimized for shop use.

Accessible from:

• shop tablet  
 • workstation computer  
 • receiving desk

---

## **Scanner Page Layout**

Header

Employee: John  
Station: Prep Station 1

Main area

Camera QR scanner

After scan

Job: ACME Railing Parts  
Current Status: Received

Buttons

Start Prep  
Add Note  
Put On Hold  
---

## **Error Handling**

System must detect:

• invalid QR codes  
 • job already completed  
 • wrong stage transitions

---

# **13\. Workstations**

Workstations identify where scans occur.

Examples

Receiving  
Prep Station  
Coating Booth 1  
Coating Booth 2  
Curing Oven  
QC Inspection  
Shipping

Table

workstations

Fields

id  
name  
stage\_type  
location\_notes  
is\_active  
---

# **14\. Inventory System**

The system must track two inventory categories.

### **Raw Materials**

Examples

powder colors  
hooks  
masking tape  
chemicals  
labels  
boxes  
---

### **Job Related Inventory**

Tracks:

parts received  
parts completed  
damaged parts  
rework  
---

## **Inventory Tables**

### **inventory\_items**

id  
name  
sku  
category  
unit\_type  
quantity\_on\_hand  
reorder\_level  
location  
qr\_value  
---

### **inventory\_movements**

id  
inventory\_item\_id  
job\_id  
employee\_id  
movement\_type  
quantity  
notes  
created\_at  
---

### **job\_inventory\_usage**

Tracks materials used per job.

Example:

• powder color used  
 • pounds consumed  
 • scrap count

---

# **15\. Receiving Workflow**

When jobs arrive:

1. Office creates job  
2. Job packet printed  
3. Packet attached to parts  
4. Receiving scans packet

System records:

status → Received  
timestamp  
employee  
part count

Optional

• damage notes  
 • intake photos

---

# **16\. Production Analytics**

Because scans contain timestamps, the system calculates:

• time in prep  
 • time in coating  
 • time in curing  
 • total production time  
 • stage bottlenecks

Managers can answer:

• where is a job now  
 • who moved it last  
 • how long has it been waiting

---

# **17\. Employee Dashboard**

Employee view shows:

• assigned workstation  
 • jobs scanned today  
 • active jobs at station  
 • recent scans

Manager dashboard shows:

• jobs by stage  
 • overdue jobs  
 • jobs stuck in stage  
 • output per employee

---

# **18\. Alerts System**

Alerts must trigger for:

job stuck too long  
stage skipped  
duplicate scans  
wrong station scans  
low inventory  
missing paperwork

Examples

Job in curing \> 5 hours  
Powder Black Matte below reorder level  
Job skipped prep stage  
---

# **19\. Reporting**

Key reports:

### **Production Reports**

• average turnaround time  
 • stage duration  
 • bottleneck detection

### **Employee Reports**

• scans per employee  
 • output by workstation

### **Inventory Reports**

• usage per job  
 • low stock alerts

---

# **20\. Printing System**

Job packets must include:

logo  
job number  
customer  
due date  
part count  
coating spec  
QR code  
notes  
stage checklist

Future features:

• rack labels  
 • bin labels  
 • pallet labels  
 • inventory QR labels

---

# **21\. Database Additions**

Additional tables required beyond CRM:

job\_packets  
job\_status\_history  
scan\_events  
workstations  
inventory\_items  
inventory\_movements  
job\_inventory\_usage  
---

# **22\. MVP Scope**

The initial version should only include:

1. Create job  
2. Generate QR code  
3. Print packet  
4. Scan packet  
5. Move job between stages  
6. Record employee \+ timestamp  
7. Show job timeline

Inventory and analytics can be added after.

---

# **23\. Development Roadmap**

### **Week 1**

Core CRM

• companies  
 • contacts  
 • jobs  
 • quotes  
 • activities  
 • users

---

### **Week 2**

QR Tracking MVP

• job IDs  
 • QR generation  
 • job packet printing  
 • web scanner page  
 • job movement tracking  
 • job timeline

---

### **Week 3**

Inventory \+ Workstations

• inventory database  
 • workstation setup  
 • job material usage

---

### **Week 4**

Analytics \+ Alerts

• stage timing reports  
 • stuck job alerts  
 • employee reports  
 • inventory alerts

---

# **24\. Expected Outcomes**

When implemented, the system will provide:

• full job lifecycle tracking  
 • complete job movement history  
 • employee accountability  
 • real production timing data  
 • inventory visibility  
 • cleaner workflow from intake to delivery

This transforms the shop from a manual workflow into a **data-driven production operation system**.

# **25\. Customer Portal — Overview**

### **Goal**

Allow customers to:

• track their jobs in real time  
 • view status and progress  
 • see timelines and updates  
 • reduce inbound calls/emails  
 • improve transparency and trust

This turns your system into a **customer-facing experience**, not just internal ops.

---

# **26\. Customer Portal Core Features**

### **1\. Customer Login System**

Customers must be able to securely access their data.

#### **Authentication Options**

**Option A (MVP \- Recommended)**  
 • Email \+ password login  
 • Linked to `company_id`

**Option B (Later)**  
 • Magic link login (passwordless)  
 • One-time secure access links per job

---

### **Customer User Table (New)**

customer\_users  
id  
company\_id  
contact\_id  
email  
password\_hash  
role  
is\_active  
last\_login\_at  
created\_at

Roles:

admin  
viewer  
accounting  
---

# **27\. Customer Dashboard**

### **Main View**

When a customer logs in, they see:

• Active jobs  
 • Completed jobs  
 • Jobs in progress  
 • Overdue jobs

---

### **Dashboard Sections**

#### **Active Jobs**

Shows:

• Job Name  
 • Job Number  
 • Status  
 • Due Date  
 • Progress Bar

---

#### **Example Status Display**

ACME Railings Batch \#42  
Status: Coating  
Progress: \[██████░░░░\]  
Due: April 25  
---

#### **Completed Jobs**

• Filterable history  
 • searchable  
 • downloadable details

---

# **28\. Job Tracking Page (Customer View)**

This is the **core feature**.

When a customer clicks a job:

---

## **Job Detail View**

### **Top Section**

• Job Name  
 • Job Number  
 • Status  
 • Due Date  
 • Part Count  
 • Coating Type / Color

---

## **Visual Progress Tracker**

Show stages clearly:

Received → Prep → Coating → Curing → QC → Completed

Current stage is highlighted.

---

## **Timeline (Pulled from job\_status\_history)**

Example:

Received — Apr 20, 9:14 AM   
Prep Started — Apr 20, 11:02 AM   
Moved to Coating — Apr 21, 2:45 PM   
Currently in Curing  
---

## **Notes / Updates**

Display internal notes that are marked as **customer-visible**.

---

### **Add Field to Activities Table**

is\_customer\_visible BOOLEAN  
---

# **29\. Real-Time Status Updates**

The portal should reflect:

• live job status  
 • timestamps  
 • latest scan events

Optional (later):

• auto-refresh  
 • WebSocket updates

---

# **30\. Notifications (Optional but Powerful)**

Customers can receive:

• job received confirmation  
 • job completed notification  
 • delay alerts

---

### **Notification Methods**

• Email (MVP)  
 • SMS (later)  
 • Push (future app)

---

# **31\. Customer Job Search**

Customers should be able to:

• search by job number  
 • filter by status  
 • filter by date

---

# **32\. File & Document Access (Optional Phase 2\)**

Allow customers to:

• download invoices  
 • download quotes  
 • view job photos  
 • view inspection results

---

# **33\. Customer Permissions**

Customers must ONLY see:

• their company’s jobs  
 • their contacts  
 • their quotes

---

### **Access Rule**

jobs.company\_id \= customer\_user.company\_id  
---

# **34\. Public Job Tracking (Optional Feature)**

You can also allow **no-login tracking** via secure link.

---

## **Example Link**

/app/track/job/9f2a8k31

This is generated per job.

---

### **Use Case**

Customer receives link via email:  
 “Track your job here”

---

### **Security**

• tokenized access  
 • no sensitive data exposed  
 • expires optionally

---

# **35\. UI Requirements**

### **Customer Portal Design Goals**

• extremely simple  
 • mobile-friendly  
 • clean status visibility  
 • no clutter

---

### **Pages Required**

• Login Page  
 • Dashboard  
 • Job List  
 • Job Detail Page  
 • Account Settings

---

# **36\. API Requirements**

New endpoints:

### **Auth**

POST /api/customer/login  
GET /api/customer/me  
---

### **Jobs**

GET /api/customer/jobs  
GET /api/customer/jobs/:id  
---

### **Timeline**

GET /api/customer/jobs/:id/history  
---

# **37\. Database Additions**

Add:

customer\_users  
customer\_sessions (optional)  
job\_public\_tokens  
---

### **job\_public\_tokens**

id  
job\_id  
token  
expires\_at  
created\_at  
---

# **38\. MVP Scope for Customer Portal**

To launch fast, only build:

1. Customer login  
2. Job list view  
3. Job detail page  
4. Status \+ timeline  
5. Basic search

That alone is extremely valuable.

---

# **39\. Phase 2 Enhancements**

After MVP:

• notifications  
 • document downloads  
 • job photos  
 • public tracking links  
 • messaging system

---

# **40\. Business Impact**

Adding the customer portal will:

### **Reduce:**

• “Where is my job?” calls  
 • manual status updates  
 • front office workload

---

### **Increase:**

• professionalism  
 • transparency  
 • customer trust  
 • retention

---

### **Strategic Advantage**

Most coating shops DO NOT have this.

This makes your system:

→ not just a CRM  
 → not just a shop tracker

👉 but a **customer experience platform**

---

# **Final System Vision (Updated)**

With this addition, your platform becomes:

### **Internal**

• CRM  
 • production tracking  
 • inventory system  
 • employee tracking

### **External**

• customer job tracking portal  
 • live status visibility  
 • automated communication

