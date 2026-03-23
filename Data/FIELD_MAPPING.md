# Excel to Prisma Field Mapping

## Sales Activity Sheet → PipelineEntry Model

| Excel Column | Prisma Field | Type | Notes |
|--------------|--------------|------|-------|
| # | - | - | Row number, not imported |
| Prospect Name | prospectName | String | Required |
| Business Name | businessName | String? | |
| Partner | partner | String? | |
| Lead Staff (Client Manager) | leadStaff | String? | |
| Prospect Status | prospectStatus | String | Active, Await Research, Completed, Dead, On Hold |
| Date Last Contact | dateLastContact | DateTime? | **NEW** |
| Address | address | String? | **NEW** |
| Contact Phone # | contactPhone | String? | **NEW** |
| Email | email | String? | **NEW** |
| Industry | industry | String? | **NEW** |
| Existing Fee/$ Value | existingFeeValue | String? | **NEW** - text field (can be "nil") |
| Support Staff (Buddy) | supportStaff | String? | **NEW** |
| Relationship Type | relationshipType | String? | |
| Prospect Source | prospectSource | String? | |
| COI Involved | coiInvolved | String? | |
| Approach Date | approachDate | DateTime? | |
| Approach Style | approachStyle | String? | |
| Secure Meeting | secureMeeting | Boolean | Yes/No |
| Quiz Completed | quizCompleted | Boolean | **NEW** - Yes/No |
| Sales Style | salesStyle | String? | **NEW** |
| Meeting Theme | meetingTheme | String? | **NEW** |
| Meeting Date | meetingDate | DateTime? | **NEW** |
| Follow up Meeting | followUpMeeting | Boolean | **NEW** - Yes/No |
| F/Up Meeting Date | followUpMeetingDate | DateTime? | **NEW** |
| Ttl Needs Stage | totalNeedsStage | String? | **NEW** |
| Proposal Sent | proposalSent | Boolean | Yes/No |
| Proposal Value | proposalValue | Decimal | |
| Job Secured | jobSecured | Boolean | Yes/No |
| Date Secured | dateSecured | DateTime? | **NEW** |
| Work Days Elapsed | - | - | Calculated, not imported |
| Count If | - | - | Calculated, not imported |
| Campaign Days Elapsed Avg | - | - | Calculated, not imported |
| Total Needs Days Elapsed Avg | - | - | Calculated, not imported |
| Job Secured Value | jobSecuredValue | Decimal | |
| Additional Work Secured | additionalWorkSecured | Decimal | **NEW** |
| Comments / Next Move | comments | String? | |

## COI Development Sheet → CoiEntry Model

| Excel Column | Prisma Field | Type | Notes |
|--------------|--------------|------|-------|
| COI Name | coiName | String | Required |
| Email | email | String? | |
| Cell # | cell | String? | |
| Entity | entity | String? | |
| Position | position | String? | |
| Industry | industry | String? | |
| Other | other | String? | **NEW** |
| Lead Relationship Partner | leadRelationshipPartner | String? | |
| Relationship Support | relationshipSupport | String? | |
| Could We | couldWe | Int | **CHANGED** - now 1-5 scale |
| How Would We | howWouldWe | Int | **CHANGED** - now 1-5 scale |
| Will We | willWe | Int | **CHANGED** - now 1-5 scale |
| Test/ Review | testReview | Int | **CHANGED** - now 1-5 scale |
| Total Referrals | totalReferrals | Int | |
| Total Converted | totalConverted | Int | |
| Fee Value | feeValue | Decimal | |

## Lists Sheet → Reference Data

Used for dropdown validation:
- Relationship Type: Existing Client, New Prospect
- Approach Styles: Direct Contact, Pre Approach - Single, etc.
- Prospect Source: Social Media, Web Enquiry, Cold Target, etc.
- Meeting Theme: Lite Funda' Sales, Formal Risk Mgt, Planning Review, etc.
- Total Needs Stage: Introduction, Scope, N/A, etc.
- Partners: Mark, Jim, etc.
- Staff Support (Buddy): Steve, Dave, Annie, etc.
- Sales Style: Campaign, Total Needs, etc.
- Prospect Status: Active, Await Research, Completed, Dead, On Hold
- Centres of Influence: N/A, etc.
