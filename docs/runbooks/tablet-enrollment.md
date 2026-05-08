# Tablet Enrollment Runbook

## Prerequisites

- Workstation has been created in `/settings/workstations`.
- The returned enrollment URL is copied directly from the settings screen and treated like a password.
- Tablet has camera permission available for Safari or the chosen browser.

## Enrollment

- Open the enrollment URL on the workstation tablet.
- Confirm the tablet redirects to the scanner flow for the correct workstation.
- Verify `/scan` shows the workstation name and employee picker.
- Have a shop employee enter the test PIN and claim the workstation.
- Confirm heartbeat remains active for at least two intervals.

## Recovery

- If the tablet is stale or claimed by the wrong employee, use “Switch user” from the scanner UI.
- If the tablet cannot recover, deactivate or recreate the workstation in settings and enroll again.
- Never share raw device tokens in chat, tickets, or screenshots.
