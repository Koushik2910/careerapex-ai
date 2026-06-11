# CareerApex Test Cases — Phase 3

---

## MODULE: DASHBOARD

### TC-DASH-001
**Title:** Dashboard loads with no sessions  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** No sessions saved in ChromaDB  
**Steps:**
1. Navigate to http://localhost:3000/dashboard
2. Observe page load
3. Check KPI cards, quick actions, recent sessions  

**Expected:** Page loads, KPI cards show 0 values, recent sessions shows empty state with CTA  

---

### TC-DASH-002
**Title:** Dashboard reflects saved session data  
**Priority:** P0 | **Severity:** High  
**Preconditions:** One session saved via /memory/save with match_score=85  
**Steps:**
1. Navigate to /dashboard
2. Check "Latest Match Score" KPI  

**Expected:** Shows 85/100, score ring animates to correct fill  

---

### TC-DASH-003
**Title:** Quick action cards navigate to correct pages  
**Priority:** P1 | **Severity:** Medium  
**Steps:**
1. Click "Analyse Resume" card → expect /analyse
2. Click "Mock Interview" card → expect /interview
3. Click "Voice Interview" card → expect /voice
4. Click "Salary Negotiation" card → expect /negotiate  

**Expected:** Each card navigates to its correct route  

---

### TC-DASH-004
**Title:** Dashboard renders without horizontal scroll  
**Priority:** P2 | **Severity:** Low  
**Steps:** Open dashboard at 1280px viewport width  
**Expected:** No horizontal scrollbar, all content visible  

---

## MODULE: RESUME ANALYSIS (ANALYSE)

### TC-ANA-001
**Title:** Upload valid PDF resume successfully  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Backend running on port 8001  
**Test Data:** Valid PDF resume file ≤ 2MB  
**Steps:**
1. Navigate to /analyse
2. Click "Upload Resume" zone
3. Select valid PDF
4. Wait for upload  

**Expected:** Green checkmark shown, filename displayed, chunks count > 0, session_id generated  

---

### TC-ANA-002
**Title:** Upload valid DOCX resume  
**Priority:** P0 | **Severity:** High  
**Test Data:** Valid DOCX resume file  
**Steps:** Same as TC-ANA-001 with .docx file  
**Expected:** Same success response  

---

### TC-ANA-003
**Title:** JD upload disabled until resume uploaded  
**Priority:** P0 | **Severity:** High  
**Steps:**
1. Navigate to /analyse
2. Observe JD upload zone without uploading resume  

**Expected:** JD zone shows opacity 0.5, cursor not-allowed, clicking does nothing  

---

### TC-ANA-004
**Title:** Run gap analysis after both uploads  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Resume and JD both uploaded  
**Steps:**
1. Click "Run Gap Analysis"
2. Wait for response  

**Expected:** 
- Overall match score displayed (0-100)
- At least 1 skill gap shown
- Strengths list non-empty
- Recommendations list non-empty
- Summary paragraph shown  

---

### TC-ANA-005
**Title:** Upload non-supported file type  
**Priority:** P1 | **Severity:** High  
**Test Data:** file.txt or file.exe  
**Steps:** Try to upload .txt file  
**Expected:** File input rejects (accept=".pdf,.docx,.doc"), file not uploaded  

---

### TC-ANA-006
**Title:** Run analysis before uploading JD  
**Priority:** P1 | **Severity:** High  
**Steps:**
1. Upload only resume
2. Force-click Run Gap Analysis (disabled button)  

**Expected:** Button disabled, no API call made  

---

### TC-ANA-007
**Title:** Reset clears all state  
**Priority:** P1 | **Severity:** Medium  
**Preconditions:** Resume uploaded (done state)  
**Steps:** Click "Reset" button  
**Expected:** Both upload zones return to idle, session_id cleared, results cleared  

---

### TC-ANA-008
**Title:** Error state shown when backend down  
**Priority:** P1 | **Severity:** High  
**Preconditions:** Backend server stopped  
**Steps:** Upload resume  
**Expected:** Error state shown in upload zone (red border, error message)  

---

## MODULE: SKILL GAP ANALYSIS (GAPS)

### TC-GAP-001
**Title:** Load gap analysis for valid session  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Session test-session-001 with resume+JD uploaded  
**Steps:**
1. Navigate to /gaps
2. Enter session_id
3. Click Analyse  

**Expected:** Bar chart renders, gap list populates, KPI cards show correct values  

---

### TC-GAP-002
**Title:** Bar chart tooltip shows full skill name  
**Priority:** P2 | **Severity:** Low  
**Steps:** Hover over bar chart bar  
**Expected:** Tooltip shows full skill name (not truncated)  

---

### TC-GAP-003
**Title:** Progress bars animate on load  
**Priority:** P2 | **Severity:** Low  
**Steps:** Load gap results  
**Expected:** Progress bars animate from 0 to correct width  

---

### TC-GAP-004
**Title:** Priority badges show correct colors  
**Priority:** P1 | **Severity:** Medium  
**Steps:** Load results with high/medium/low priority gaps  
**Expected:** High=red, Medium=amber, Low=green  

---

### TC-GAP-005
**Title:** Non-existent session shows error  
**Priority:** P1 | **Severity:** High  
**Test Data:** session_id = "nonexistent-xyz"  
**Steps:** Enter non-existent session_id and click Analyse  
**Expected:** Error message shown: "Analysis failed..."  

---

## MODULE: MOCK INTERVIEW

### TC-INT-001
**Title:** Start standard interview with valid session  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Resume uploaded for test-session-001  
**Steps:**
1. Navigate to /interview
2. Enter session_id = test-session-001
3. Select Standard Interview
4. Click Start Interview  

**Expected:** AI sends first question with typing animation, chat UI displayed  

---

### TC-INT-002
**Title:** Send answer and receive AI feedback  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Interview started (TC-INT-001)  
**Steps:**
1. Type answer in textarea
2. Press Enter  

**Expected:** User message shown right-aligned, AI response shown with typing animation  

---

### TC-INT-003
**Title:** Start Resume Defense Mode  
**Priority:** P1 | **Severity:** High  
**Steps:**
1. Select "Resume Defense Mode"
2. Enter session_id
3. Click "Start Defense Mode"  

**Expected:** AI opens with aggressive challenge to a resume claim, red mode badge shown  

---

### TC-INT-004
**Title:** Empty answer not sent  
**Priority:** P1 | **Severity:** Medium  
**Steps:**
1. Start interview
2. Click send with empty textarea  

**Expected:** Send button disabled when input empty, no API call  

---

### TC-INT-005
**Title:** Shift+Enter creates new line  
**Priority:** P2 | **Severity:** Low  
**Steps:** Press Shift+Enter in textarea  
**Expected:** New line added, message not sent  

---

### TC-INT-006
**Title:** New Session resets chat  
**Priority:** P1 | **Severity:** Medium  
**Preconditions:** Active interview session  
**Steps:** Click "New Session"  
**Expected:** Chat cleared, mode selection shown, session_id cleared  

---

### TC-INT-007
**Title:** Start interview without session_id  
**Priority:** P1 | **Severity:** High  
**Steps:** Leave session_id blank, click Start Interview  
**Expected:** Auto-generates session_id, starts interview (may fail if no resume for that session)  

---

## MODULE: VOICE INTERVIEW

### TC-VOI-001
**Title:** Voice interview page loads in Chrome  
**Priority:** P0 | **Severity:** Critical  
**Steps:** Navigate to /voice in Chrome  
**Expected:** Setup screen shown, not the "Voice not supported" error  

---

### TC-VOI-002
**Title:** Start voice interview and AI speaks first question  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Resume uploaded, Chrome browser, mic available  
**Steps:**
1. Enter session_id
2. Click Start Voice Interview
3. Allow microphone  

**Expected:** Status changes to "AI Speaking", question shown in card, voice output heard  

---

### TC-VOI-003
**Title:** Status transitions correctly  
**Priority:** P1 | **Severity:** High  
**Steps:** Complete one full turn  
**Expected:** idle → processing → ai-speaking → listening → processing → ai-speaking  

---

### TC-VOI-004
**Title:** End Session stops speech  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Voice interview active, AI speaking  
**Steps:** Click "End Session"  
**Expected:** Speech stops immediately, setup screen shown, no further API calls  

---

### TC-VOI-005
**Title:** Navigate away stops speech  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** Voice interview active  
**Steps:** Click "Dashboard" in sidebar  
**Expected:** Speech synthesis cancelled, no audio continues on new page  

---

### TC-VOI-006
**Title:** Voice not supported shows correct message  
**Priority:** P1 | **Severity:** Medium  
**Steps:** Open /voice in Firefox  
**Expected:** "Voice not supported" empty state shown with browser recommendation  

---

### TC-VOI-007
**Title:** Live transcript updates while speaking  
**Priority:** P1 | **Severity:** High  
**Steps:** Start interview, speak answer  
**Expected:** Transcript card appears, text updates in real-time as user speaks  

---

## MODULE: INTERVIEW DEBRIEF

### TC-DEB-001
**Title:** Load debrief for session with saved scores  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** 2+ answer scores saved via /tracker/save  
**Steps:**
1. Navigate to /debrief
2. Enter session_id
3. Click Load  

**Expected:** Score rings animate, chart renders, weakest/strongest sections populated  

---

### TC-DEB-002
**Title:** Score rings display correct values  
**Priority:** P1 | **Severity:** High  
**Steps:** Load debrief with known avg_score=70  
**Expected:** Ring shows "70", fills to 70% of circumference  

---

### TC-DEB-003
**Title:** Generate cover letter  
**Priority:** P1 | **Severity:** High  
**Preconditions:** Session has resume + JD uploaded  
**Steps:** Click "Generate" in Cover Letter section  
**Expected:** Cover letter text rendered, "Copy to clipboard" button appears  

---

### TC-DEB-004
**Title:** Copy cover letter to clipboard  
**Priority:** P2 | **Severity:** Low  
**Preconditions:** Cover letter generated  
**Steps:** Click "Copy to clipboard"  
**Expected:** Button shows checkmark + "Copied" for 2 seconds  

---

### TC-DEB-005
**Title:** Expand feedback for weak answer  
**Priority:** P1 | **Severity:** Medium  
**Steps:** Click "Feedback" chevron on a weak answer  
**Expected:** Feedback text revealed below question preview  

---

### TC-DEB-006
**Title:** Load debrief with no scores  
**Priority:** P1 | **Severity:** High  
**Test Data:** Session with no /tracker/save calls  
**Steps:** Enter session_id with no saved scores  
**Expected:** Empty state message shown, rings show 0  

---

## MODULE: CAREER MEMORY

### TC-MEM-001
**Title:** Memory page loads session list  
**Priority:** P0 | **Severity:** Critical  
**Preconditions:** At least 1 session saved  
**Steps:** Navigate to /memory  
**Expected:** Session list shown in left panel with filename, date, score  

---

### TC-MEM-002
**Title:** Click session shows detail panel  
**Priority:** P1 | **Severity:** High  
**Steps:** Click any session in left panel  
**Expected:** Right panel shows match score, questions count, strengths badges, gap badges  

---

### TC-MEM-003
**Title:** Progress summary shown when 2+ sessions exist  
**Priority:** P1 | **Severity:** High  
**Preconditions:** 2+ sessions saved  
**Steps:** Navigate to /memory  
**Expected:** Progress card shown with delta value and trend  

---

### TC-MEM-004
**Title:** Empty state when no sessions  
**Priority:** P1 | **Severity:** Medium  
**Preconditions:** No sessions in ChromaDB  
**Steps:** Navigate to /memory  
**Expected:** Empty state with Brain icon and descriptive message  

---

## MODULE: SALARY NEGOTIATION

### TC-NEG-001
**Title:** Generate negotiation script  
**Priority:** P0 | **Severity:** Critical  
**Test Data:** current_offer=18, target=26, role="AI Engineer", company="Thomson Reuters"  
**Steps:**
1. Navigate to /negotiate
2. Fill form
3. Click Generate Script  

**Expected:** Multi-section strategy text rendered with opening script, leverage points, counter-offer script  

---

### TC-NEG-002
**Title:** Copy script to clipboard  
**Priority:** P2 | **Severity:** Low  
**Preconditions:** Script generated  
**Steps:** Click "Copy" button  
**Expected:** Clipboard updated, button shows "Copied" state  

---

### TC-NEG-003
**Title:** Start salary roleplay  
**Priority:** P1 | **Severity:** High  
**Steps:** Switch to Roleplay tab, fill form, click Start Roleplay  
**Expected:** AI makes opening HR call in character, chat UI shown  

---

### TC-NEG-004
**Title:** Send negotiation message in roleplay  
**Priority:** P1 | **Severity:** High  
**Preconditions:** Roleplay started  
**Steps:** Type negotiation message, press Enter  
**Expected:** AI responds in HR character  

---

### TC-NEG-005
**Title:** Form accepts decimal offer values  
**Priority:** P2 | **Severity:** Low  
**Test Data:** current_offer=18.5, target=26.75  
**Steps:** Enter decimal values and generate script  
**Expected:** Script generated successfully with decimal values  

---

## MODULE: LINKEDIN OPTIMIZER

### TC-LIN-001
**Title:** Generate optimized headline and about  
**Priority:** P1 | **Severity:** High  
**Preconditions:** Resume uploaded for session  
**Steps:**
1. Navigate to /linkedin
2. Enter session_id, headline, about
3. Click Optimize Profile  

**Expected:** Profile strength score shown, optimized headline visible, keywords added listed  

---

### TC-LIN-002
**Title:** Original vs Optimized comparison visible  
**Priority:** P1 | **Severity:** Medium  
**Steps:** Expand Headline section after optimization  
**Expected:** Red "Original" section + Green "Optimized" section both visible  

---

### TC-LIN-003
**Title:** Generate 5 headline variants  
**Priority:** P1 | **Severity:** High  
**Steps:** Switch to Headline Generator, fill form, click Generate  
**Expected:** 5 headline variants shown, each with Copy button  

---

### TC-LIN-004
**Title:** Copy individual headline  
**Priority:** P2 | **Severity:** Low  
**Steps:** Click Copy on headline variant 3  
**Expected:** Clipboard updated, that specific button shows "Copied"  

---

## MODULE: CAREER ROADMAP

### TC-ROA-001
**Title:** Generate 3-month roadmap  
**Priority:** P1 | **Severity:** High  
**Preconditions:** Resume uploaded for session  
**Test Data:** session=test-session-001, role="AI Engineer", timeframe="3 months"  
**Steps:**
1. Navigate to /roadmap
2. Fill form
3. Click Generate  

**Expected:** Weekly roadmap items rendered, progress bar shown at 0%  

---

### TC-ROA-002
**Title:** Mark week as complete  
**Priority:** P2 | **Severity:** Medium  
**Preconditions:** Roadmap generated  
**Steps:** Click circle checkbox on Week 1  
**Expected:** Circle becomes green checkmark, progress bar updates  

---

### TC-ROA-003
**Title:** Expand week shows tasks and resources  
**Priority:** P1 | **Severity:** Medium  
**Steps:** Click on Week 2 header  
**Expected:** Tasks and Resources sections expand below  

---

### TC-ROA-004
**Title:** Progress percentage tracks completed weeks  
**Priority:** P2 | **Severity:** Low  
**Steps:** Mark 3 of 12 weeks complete  
**Expected:** Progress shows 25%, bar fills to 25%  

---

### TC-ROA-005
**Title:** Empty state shown before generation  
**Priority:** P2 | **Severity:** Low  
**Steps:** Navigate to /roadmap without generating  
**Expected:** Empty state with Map icon and instructions shown  

