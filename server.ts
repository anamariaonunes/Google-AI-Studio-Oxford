import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import JSZip from "jszip";
// @ts-ignore
import { PDFParse } from "pdf-parse";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON limit to handle base64 files
app.use(express.json({ limit: "50mb" }));

// Pre-create the data folder for mock/test persistence
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MEETINGS_FILE_PATH = path.join(DATA_DIR, "meetings.json");

// Helper: robust PPTX text extraction using jszip
async function extractTextFromPptx(buffer: Buffer): Promise<string> {
  try {
    const zip = await JSZip.loadAsync(buffer);
    let fullText = "";
    
    // Find slide and notes paths
    const slidePaths = Object.keys(zip.files).filter(
      (p) => p.startsWith("ppt/slides/slide") && p.endsWith(".xml")
    );
    
    // Natural sort by slide number: slide1.xml, slide2.xml, ..., slide10.xml
    slidePaths.sort((a, b) => {
      const matchA = a.match(/\d+/);
      const matchB = b.match(/\d+/);
      const numA = matchA ? parseInt(matchA[0]) : 0;
      const numB = matchB ? parseInt(matchB[0]) : 0;
      return numA - numB;
    });

    for (let i = 0; i < slidePaths.length; i++) {
      const slidePath = slidePaths[i];
      const slideNum = slidePath.match(/\d+/)?.[0] || String(i + 1);
      const slideXml = await zip.files[slidePath].async("string");

      // Extract text content inside <a:t>...</a:t> tags
      let slideText = "";
      const regex = /<a:t>([^<]*)<\/a:t>/g;
      let match;
      while ((match = regex.exec(slideXml)) !== null) {
        slideText += match[1] + " ";
      }

      // Extract associated speaker notes if they exist
      let notesText = "";
      const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
      if (zip.files[notesPath]) {
        const notesXml = await zip.files[notesPath].async("string");
        let notesMatch;
        while ((notesMatch = regex.exec(notesXml)) !== null) {
          notesText += notesMatch[1] + " ";
        }
      } else {
        // Fallback checks
        const fallbackPath = `ppt/notesSlides/notesSlide${i + 1}.xml`;
        if (zip.files[fallbackPath]) {
          const notesXml = await zip.files[fallbackPath].async("string");
          let notesMatch;
          while ((notesMatch = regex.exec(notesXml)) !== null) {
            notesText += notesMatch[1] + " ";
          }
        }
      }

      fullText += `--- SLIDE ${slideNum} ---\n`;
      fullText += `Title/Body: ${slideText.trim() || "(No slide text)"}\n`;
      if (notesText.trim()) {
        fullText += `Speaker Notes: ${notesText.trim()}\n`;
      }
      fullText += `\n`;
    }
    
    return fullText.trim() || "Empty PPTX presentation text content.";
  } catch (err: any) {
    throw new Error(`Failed to parse PPTX slider format: ${err.message}`);
  }
}

// Helper: robust PDF text extraction using pdf-parse
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return textResult.text || "Empty PDF document text content.";
  } catch (err: any) {
    throw new Error(`Failed to parse PDF document format: ${err.message}`);
  }
}

// Default preloaded meetings to start beautiful, executive-ready
const initialMeetings = [
  {
    id: "q4-strategy-review",
    title: "Q4 Strategy Review",
    createdAt: "2026-10-24T10:00:00Z",
    lastUpdated: "2026-10-24T12:00:00Z",
    status: "Completed",
    files: [
      {
        id: "file-1",
        name: "Strategy_Q4_Final.pdf",
        size: 2600000,
        type: "pdf",
        status: "Completed",
        extractedText: "Q4 Strategy: Focus on stabilizing market share in the EMEA region and expanding Project Horizon. Target regional growth vector in middle market by Q4. Objective: Achieve customer retention ARR of 4.2M."
      },
      {
        id: "file-2",
        name: "Growth_Deck_v3.pptx",
        size: 16800000,
        type: "pptx",
        status: "Completed",
        extractedText: "Slide 1: Q4 Growth Outlook. We plan to focus on Northern Logistics partnership agreement. \nSlide 2: Execution plan. Focus on Apex 7 supply chain optimizations."
      }
    ],
    intelligence: {
      key_takeaways: [
        "The EMEA region stabilization is our primary near-term revenue preservation driver.",
        "Delays in Apex 7 hardware dispatch represent a high-severity risk that could slip Q4 revenue.",
        "Setup of regional buffer stock in Rotterdam is confirmed as the target mitigation strategy.",
        "Northern Logistics was approved as the key carrier client-facing partner."
      ],
      meeting_summary: [
        "Synthesize regional EMEA Q4 performance metrics and align timeline deliverables for Project Horizon.",
        "Apex 7 hardware supply constraints are identified as the major blocker to meeting early Q4 delivery timelines.",
        "Strategic actions focus heavily on Rotterdam storage capacity setup and Dave's sales enablement outreach."
      ],
      decisions: [
        { "decision": "Authorize Northern Logistics partner agreement", "owner": "Jan (Executive Office)", "deadline": "2026-10-28" }
      ],
      risks_concerns: [
        {
          "risk": "Supply Chain Congestion for Apex 7 Hardware",
          "impact": "Could delay hardware dispatch by up to 3 weeks, slowing Q4 revenue realization.",
          "severity": "High",
          "mitigation": "Pre-order critical components by late October and setup a regional buffer stock in Rotterdam."
        },
        {
          "risk": "Competitor expansion in EMEA middle market",
          "impact": "Pressure on standard subscription margins during winter renewals.",
          "severity": "Medium",
          "mitigation": "Release targeted bundle packages and prioritize top accounts for direct Q4 check-ins."
        }
      ],
      talking_points: {
        "internal": [
          "Emphasize the supply chain buffer stock setup and review lead times daily.",
          "Align technical teams around final testing timelines for Apex 7 dispatch."
        ],
        "stakeholder_client": [
          "Present the stable EMEA market figures to reassure stakeholders.",
          "Advertise custom bundle opportunities for Project Horizon mid-market subscribers."
        ],
        "leadership": [
          "ARR goal remains focused on $4.2M milestone specifically driven by renewal expansion.",
          "Confirm completion of Northern Logistics agreement terms."
        ]
      },
      next_steps: [
        {
          "action_item": "Staffing confirmation at Rotterdam with fallback shipping handlers",
          "owner": "Logistics Team",
          "deadline": "2026-11-10",
          "priority": "High"
        },
        {
          "action_item": "Schedule Rotterdam warehouse audit",
          "owner": "Logistics Team",
          "deadline": "2026-11-05",
          "priority": "Medium"
        }
      ],
      open_questions: [
        "Will Rotterdam labor capacity hold during the late November peak season?",
        "Are additional APAC supply routes validated if terminal logs slow down?"
      ],
      follow_up_message: "Thanks for attending our strategic briefing. We successfully aligned on the Rotterdam buffer stock mitigation for our Apex 7 hardware, keeping our $4.2M ARR Q4 objective on track. Please review the detailed action items below and ensure your assigned deadlines are fully met."
    }
  },
  {
    id: "product-roadmap-sync",
    title: "Product Roadmap Sync",
    createdAt: "2026-10-20T14:30:00Z",
    lastUpdated: "2026-10-20T17:00:00Z",
    status: "Processing",
    files: [
      {
        id: "file-3",
        name: "Roadmap_2027_Draft.pdf",
        size: 3200000,
        type: "pdf",
        status: "Completed",
        extractedText: "2027 Roadmap focus: Integrating AI-powered suggestions into central system. Target release date: Q1 2027. Requires API key coordination."
      }
    ]
  },
  {
    id: "client-renewal-meeting",
    title: "Client Renewal Meeting",
    createdAt: "2026-10-18T09:15:00Z",
    lastUpdated: "2026-10-22T11:00:00Z",
    status: "Completed",
    files: [
      {
        id: "file-4",
        name: "Client_Feedback_Summary.pdf",
        size: 1400000,
        type: "pdf",
        status: "Completed",
        extractedText: "Client is extremely satisfied but requested multi-user collaboration tools and lower latency. Expected renewals are high priority."
      }
    ],
    intelligence: {
      key_takeaways: [
        "Client renewal discussion confirmed highly positive overall account health.",
        "Key client feedback revolves around collaboration capacity and requesting multi-tenant security layers."
      ],
      meeting_summary: [
        "Evaluate client feedback metrics and map expansion paths ahead of the Q4 renewal window.",
        "Multi-tenant security isolation remains the primary open technical question prior to complete contract execution."
      ],
      decisions: [
        { "decision": "Approve pricing lock for the premium subscription tier", "owner": "Dave", "deadline": "2026-10-31" }
      ],
      risks_concerns: [
        {
          "risk": "Delay in Multi-tenant Security deployment",
          "impact": "Client might delay secondary account expansion.",
          "severity": "Low",
          "mitigation": "Leverage existing database-level column validation schemas for quick implementation."
        }
      ],
      talking_points: {
        "internal": [
          "Double check existing tenancy separation rules.",
          "Align account managers for contract signing next Friday."
        ],
        "stakeholder_client": [
          "Share the secure multi-tenancy timeline to affirm commitment.",
          "Confirm renewal pricing tier is locked."
        ],
        "leadership": [
          "Retention remains at 100% of major software clients.",
          "Product roadmap is well-aligned with security requirements."
        ]
      },
      next_steps: [
        {
          "action_item": "Deliver updated contract draft with client-specific SLA targets",
          "owner": "Dave",
          "deadline": "2026-10-31",
          "priority": "High"
        }
      ],
      open_questions: [
        "Are there separate performance metrics required for regional network speed?",
        "Do we require third-party penetration reports before execution?"
      ],
      follow_up_message: "Thank you for joining our sync. We are pleased to confirm that client sentiment is exceptionally strong, and renewals are targeted for completion next week. Please review the multi-tenant architecture milestone task assignments."
    }
  },
  {
    id: "operations-planning",
    title: "Operations Planning",
    createdAt: "2026-10-15T11:00:00Z",
    lastUpdated: "2026-10-16T15:00:00Z",
    status: "Completed",
    files: [
      {
        id: "file-5",
        name: "Ops_Inventory_Spreadsheet.pdf",
        size: 1210000,
        type: "pdf",
        status: "Completed",
        extractedText: "Operations inventory details: Logistics hubs have warehouse capacity at 85%. Buffer stocks look good."
      }
    ],
    intelligence: {
      key_takeaways: [
        "Warehouse capacities overall stand at 85% utilization across major logistics hubs.",
        "Rotterdam and Munich setups are verified as fully capable of housing Q4 inventory spikes."
      ],
      meeting_summary: [
        "Conduct space capacity review for logistics buffers and analyze holiday labor requirements.",
        "The primary threat is holiday labor crunch at Rotterdam hub, which requires pro-active operator bookings."
      ],
      decisions: [
        { "decision": "Setup Rotterdam and Munich as primary Q4 buffer storage warehouses", "owner": "Logistics Team", "deadline": "2026-11-05" }
      ],
      risks_concerns: [
        {
          "risk": "Rotterdam holiday labor crunch",
          "impact": "Slight loading slowdowns from late November to late December.",
          "severity": "Medium",
          "mitigation": "Book contract operators well in advance of November peak."
        }
      ],
      talking_points: {
        "internal": [
          "Monitor regional storage utilization rates regularly.",
          "Ensure secondary staff are trained on terminal dispatch logs."
        ],
        "stakeholder_client": [
          "Confirm storage buffers are built out to minimize delivery risks."
        ],
        "leadership": [
          "Logistics networks are resilient and structured for holiday peak demand."
        ]
      },
      next_steps: [
        {
          "action_item": "Staffing confirmation at Rotterdam with 3 fallback shippers",
          "owner": "Logistics Team",
          "deadline": "2026-11-10",
          "priority": "High"
        }
      ],
      open_questions: [
        "What are the fallback routes if European terminal ports experience blockages?"
      ],
      follow_up_message: "Our operations session succeeded in confirming Q4 capacity targets. All key logistics centers are stable to handle anticipated surges. We must prioritize hiring supplementary support staff at Rotterdam before mid-November."
    }
  }
];

// Inline migration utility for legacy structures from prior checkpoints
function migrateIntelligence(intel: any): any {
  if (!intel) return undefined;
  if (Array.isArray(intel.key_takeaways) && Array.isArray(intel.risks_concerns)) {
    return intel;
  }

  const legacySummary = intel.meeting_summary || {};
  const executiveSummary = Array.isArray(legacySummary.executive_summary) ? legacySummary.executive_summary : [];
  const importantConclusions = Array.isArray(legacySummary.important_conclusions) ? legacySummary.important_conclusions : [];

  const key_takeaways = executiveSummary.length > 0 ? executiveSummary.slice(0, 5) : ["General agenda context synced successfully."];
  const meeting_summary = [
    legacySummary.main_purpose || "Evaluate performance, alignments and critical resources.",
    ...importantConclusions
  ].filter(Boolean);

  const decisions = importantConclusions.map((conclusion: string) => ({
    decision: conclusion,
    owner: "Not specified",
    deadline: "Not specified"
  }));
  if (decisions.length === 0) {
    decisions.push({ decision: "Confirm current project scope is acceptable", owner: "Project Lead", deadline: "Not specified" });
  }

  const legacyRisks = Array.isArray(intel.risk_identification) ? intel.risk_identification : [];
  const risks_concerns = legacyRisks.map((risk: any) => ({
    risk: risk.risk || "Operational risk element",
    impact: risk.impact || "General operational impact",
    severity: risk.severity || "Medium",
    mitigation: risk.mitigation || "Ongoing regular assessment review"
  }));
  if (risks_concerns.length === 0) {
    risks_concerns.push({
      risk: "Operational timeline delays",
      impact: "May slip milestones slightly",
      severity: "Low",
      mitigation: "Strictly track progress weekly"
    });
  }

  const legacyPoints = intel.key_talking_points || {};
  const talking_points = {
    internal: Array.isArray(legacyPoints.internal) ? legacyPoints.internal : ["Review lead times regularly."],
    stakeholder_client: Array.isArray(legacyPoints.stakeholder_or_client_facing) ? legacyPoints.stakeholder_or_client_facing : ["Confirm timeline is fully on track."],
    leadership: Array.isArray(legacyPoints.leadership_level) ? legacyPoints.leadership_level : ["ARR and retention milestones are stable."]
  };

  const legacySteps = Array.isArray(intel.next_steps) ? intel.next_steps : [];
  const next_steps = legacySteps.map((step: any) => ({
    action_item: step.action_item || "Action item task",
    owner: step.owner || "Not specified",
    deadline: step.deadline || "Not specified",
    priority: step.priority || "Medium"
  }));
  if (next_steps.length === 0) {
    next_steps.push({
      action_item: "Conduct subsequent progress audit check-in",
      owner: "Executive Team",
      deadline: "Not specified",
      priority: "Medium"
    });
  }

  return {
    key_takeaways,
    meeting_summary,
    decisions,
    risks_concerns,
    talking_points,
    next_steps,
    open_questions: ["Are additional resource configurations required?"],
    follow_up_message: "We aligned successfully on our core objective metrics. Please review the detailed action items below and ensure timelines are fully respected."
  };
}

// Load meetings from file or write initial
function loadMeetings(): any[] {
  try {
    if (fs.existsSync(MEETINGS_FILE_PATH)) {
      const data = fs.readFileSync(MEETINGS_FILE_PATH, "utf-8");
      const list = JSON.parse(data);
      let migrated = false;
      list.forEach((item: any) => {
        if (item.intelligence && (!item.intelligence.key_takeaways || !item.intelligence.risks_concerns)) {
          item.intelligence = migrateIntelligence(item.intelligence);
          migrated = true;
        }
      });
      if (migrated) {
        saveMeetings(list);
      }
      return list;
    }
  } catch (err) {
    console.error("Failed to read meetings persistence:", err);
  }
  // Fallback to initial meetings
  fs.writeFileSync(MEETINGS_FILE_PATH, JSON.stringify(initialMeetings, null, 2));
  return initialMeetings;
}

function saveMeetings(data: any[]) {
  try {
    fs.writeFileSync(MEETINGS_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write meetings persistence:", err);
  }
}

// Ensure database starts with defaults if not present
loadMeetings();

// --- Backend API Routes ---

// Get all meetings
app.get("/api/meetings", (req, res) => {
  const data = loadMeetings();
  res.json(data);
});

// Create empty draft batch
app.post("/api/meetings/create", (req, res) => {
  const { title } = req.body;
  const meetings = loadMeetings();
  
  const newBatch = {
    id: `batch-${Date.now()}`,
    title: title || `Untitled Briefing`,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    status: "Draft",
    files: [],
  };

  meetings.unshift(newBatch);
  saveMeetings(meetings);
  res.status(201).json(newBatch);
});

// Delete a meeting
app.delete("/api/meetings/:id", (req, res) => {
  const { id } = req.params;
  let meetings = loadMeetings();
  meetings = meetings.filter(m => m.id !== id);
  saveMeetings(meetings);
  res.json({ success: true });
});

// Route: Extract text from uploaded attachment
app.post("/api/meetings/:batchId/upload", async (req, res) => {
  const { batchId } = req.params;
  const { fileName, size, mimeType, base64Data } = req.body;

  if (!base64Data) {
    return res.status(400).json({ error: "Missing uploaded file content." });
  }

  const meetings = loadMeetings();
  const batchIndex = meetings.findIndex((m) => m.id === batchId);
  if (batchIndex === -1) {
    return res.status(404).json({ error: "Meeting batch not found." });
  }

  const batch = meetings[batchIndex];
  
  // Create dynamic file entry
  const fileId = `file-${Date.now()}`;
  const lowercaseName = fileName.toLowerCase();
  
  let fileType: "pdf" | "pptx" | "other" = "other";
  if (lowercaseName.endsWith(".pdf")) fileType = "pdf";
  else if (lowercaseName.endsWith(".pptx")) fileType = "pptx";

  const fileItem: {
    id: string;
    name: string;
    size: number;
    type: "pdf" | "pptx" | "other";
    status: "Extracting" | "Completed" | "Extraction Failed";
    extractedText: string;
  } = {
    id: fileId,
    name: fileName,
    size: size || 0,
    type: fileType,
    status: "Extracting",
    extractedText: "",
  };

  // Push to files and save momentarily with "Extracting" status
  batch.files.push(fileItem);
  batch.status = "Extracting";
  meetings[batchIndex] = batch;
  saveMeetings(meetings);

  // Parse Buffer
  const buffer = Buffer.from(base64Data, "base64");

  try {
    let text = "";
    if (fileType === "pdf") {
      text = await extractTextFromPdf(buffer);
    } else if (fileType === "pptx") {
      text = await extractTextFromPptx(buffer);
    } else {
      text = `Non-standard file content loaded. Raw metadata: Mime: ${mimeType}, Size: ${size} bytes.`;
    }

    // Update status to success
    fileItem.status = "Completed";
    fileItem.extractedText = text;

    // Check if other files are fully extracted before enabling processing stage.
    const allProcessed = batch.files.every(f => f.status !== "Extracting");
    if (allProcessed) {
      batch.status = "Processing";
    }
  } catch (err: any) {
    console.error("Extraction failed for file", fileName, ":", err);
    fileItem.status = "Extraction Failed";
    fileItem.extractedText = `Extraction Error: ${err.message || err}`;
    
    const allProcessed = batch.files.every(f => f.status !== "Extracting");
    if (allProcessed) {
      batch.status = "Extraction Failed";
    }
  }

  batch.lastUpdated = new Date().toISOString();
  meetings[batchIndex] = batch;
  saveMeetings(meetings);

  res.json({ success: true, file: fileItem, batch });
});

// Route: Analyze the batch using Gemini API
app.post("/api/meetings/:batchId/analyze", async (req, res) => {
  const { batchId } = req.params;
  const meetings = loadMeetings();
  const batchIndex = meetings.findIndex((m) => m.id === batchId);
  
  if (batchIndex === -1) {
    return res.status(404).json({ error: "Batch not found." });
  }

  const batch = meetings[batchIndex];
  
  // Ensure we have extracted some files
  if (batch.files.length === 0) {
    return res.status(400).json({ error: "Cannot analyze an empty batch. Please upload files first." });
  }

  // Combine extracted text contents of all files
  let aggregatedContent = `MEETING TITLE: ${batch.title}\n\n`;
  batch.files.forEach((f) => {
    aggregatedContent += `=== FILE REFERENCE: ${f.name} [Type: ${f.type}] ===\n`;
    aggregatedContent += `${f.extractedText}\n\n`;
  });

  batch.status = "Processing";
  saveMeetings(meetings);

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing on server. Please configure it in Settings.");
    }

    // Initialize modern @google/genai as instructed by skill
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          text: `You are a meeting intelligence assistant.

Your job is to transform meeting notes, transcripts, agendas, chat logs, or rough input into concise, decision-focused meeting intelligence.

Prioritize signal over completeness. Do not summarize everything. Surface only what matters most for decisions, risks, ownership, and follow-up.

CONTENT RULES
- Keep the full output compact. Use short, clear values. Prefer one-sentence strings.
- Do not include more than 5 key takeaways.
- Do not repeat the same point across sections.
- Do not include minor details, filler, greetings, or background chatter.
- Do not invent facts, decisions, risks, or details. Base everything on the provided input.

Input Content to Process:
${aggregatedContent}

Output structured JSON response matching the responseSchema precisely.`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meeting_intelligence_brief: {
              type: Type.OBJECT,
              properties: {
                key_takeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Prioritize signal over completeness. Keep key takeaways compact and actionable. Max 5."
                },
                meeting_summary: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Concise summary points of the material."
                },
                decisions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      decision: { type: Type.STRING },
                      owner: { type: Type.STRING, description: "Owner of the decision or 'Not specified'." },
                      deadline: { type: Type.STRING, description: "Deadline or 'Not specified'." }
                    },
                    required: ["decision", "owner", "deadline"]
                  }
                },
                risks_concerns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      risk: { type: Type.STRING },
                      impact: { type: Type.STRING },
                      severity: { type: Type.STRING, description: "Must be Low or Medium or High." },
                      mitigation: { type: Type.STRING }
                    },
                    required: ["risk", "impact", "severity", "mitigation"]
                  }
                },
                talking_points: {
                  type: Type.OBJECT,
                  properties: {
                    internal: { type: Type.ARRAY, items: { type: Type.STRING } },
                    stakeholder_client: { type: Type.ARRAY, items: { type: Type.STRING } },
                    leadership: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["internal", "stakeholder_client", "leadership"]
                },
                next_steps: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      action_item: { type: Type.STRING },
                      owner: { type: Type.STRING, description: "Owner of the action or 'Not specified'." },
                      deadline: { type: Type.STRING, description: "Deadline or 'Not specified'." },
                      priority: { type: Type.STRING, description: "Must be Low or Medium or High." }
                    },
                    required: ["action_item", "owner", "deadline", "priority"]
                  }
                },
                open_questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                follow_up_message: {
                  type: Type.STRING,
                  description: "A friendly, concise follow-up email/slack-style content highlighting the main purpose and outputs."
                }
              },
              required: [
                "key_takeaways",
                "meeting_summary",
                "decisions",
                "risks_concerns",
                "talking_points",
                "next_steps",
                "open_questions",
                "follow_up_message"
              ]
            }
          },
          required: ["meeting_intelligence_brief"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Empty response returned from the Gemini API.");
    }

    const jsonResult = JSON.parse(textOutput.trim());
    const jsonIntelligence = jsonResult.meeting_intelligence_brief;
    
    // Save to the meeting item
    batch.intelligence = jsonIntelligence;
    batch.status = "Completed";
    batch.lastUpdated = new Date().toISOString();
    
    meetings[batchIndex] = batch;
    saveMeetings(meetings);

    res.json({ success: true, intelligence: jsonIntelligence, batch });
  } catch (err: any) {
    console.error("Gemini Analysis failing:", err);
    batch.status = "Needs Review";
    saveMeetings(meetings);
    res.status(500).json({ error: `Analysis failed: ${err.message || err}` });
  }
});

// Implement standard Vite hot dev/prod server routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
