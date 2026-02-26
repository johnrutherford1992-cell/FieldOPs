// ============================================================
// Claude AI System Prompts for JHA & Toolbox Talk Generation
// These prompts are sent to the Claude API to generate
// tailored safety documents based on field selections
// ============================================================

import type { SelectedTask, WeatherConditions, EquipmentItem } from "./types";

export function buildJHAPrompt(
  projectName: string,
  date: string,
  tasks: SelectedTask[],
  weather: WeatherConditions,
  equipment: EquipmentItem[],
  crewSize: number,
  siteNotes: string
): string {
  const taskList = tasks
    .map(
      (t) =>
        `- CSI ${t.csiDivision}: ${t.activity} > ${t.task}`
    )
    .join("\n");

  const equipList = equipment.map((e) => `- ${e.name} (${e.category})`).join("\n");

  return `You are a construction safety expert generating a Job Hazard Analysis (JHA) for a commercial construction project.

PROJECT: ${projectName}
DATE: ${date}
WEATHER: ${weather.conditions}, ${weather.temperature}°${weather.temperatureUnit}
CREW SIZE: ${crewSize} workers
${siteNotes ? `SITE NOTES: ${siteNotes}` : ""}

PLANNED TASKS TODAY:
${taskList}

EQUIPMENT IN USE:
${equipList || "No heavy equipment selected"}

Generate a detailed, professional JHA document in HTML format. Structure it as follows:

1. SCOPE OF WORK — Brief summary of today's planned activities and locations.

2. TASK ANALYSIS TABLE — For each task, create a row with:
   - Task Step (numbered, specific action)
   - Hazards (lettered, using OSHA Focus Four: Falls, Struck-By, Caught-In/Between, Electrocution, plus trade-specific hazards)
   - Control Measures (following hierarchy: Elimination → Substitution → Engineering Controls → Administrative Controls → PPE)

3. EQUIPMENT HAZARDS — Specific hazards and controls for each piece of equipment in use today.

4. WEATHER CONSIDERATIONS — Hazards specific to today's weather conditions (heat stress, cold exposure, wet surfaces, wind, etc.)

5. REQUIRED PPE — Checklist of required personal protective equipment based on today's tasks.

6. EMERGENCY INFORMATION — Standard emergency procedures reminder.

Format the output as clean HTML with:
- Use <h2> for section headers
- Use <table> with proper thead/tbody for the task analysis
- Use <ul> for lists
- Apply classes: "jha-section" for sections, "jha-table" for tables
- Keep language direct and actionable — this will be read aloud to field crews
- Be specific to the actual tasks selected, not generic boilerplate
- Reference specific OSHA standards where applicable (29 CFR 1926)`;
}

export function buildToolboxTalkPrompt(
  projectName: string,
  date: string,
  tasks: SelectedTask[],
  weather: WeatherConditions,
  equipment: EquipmentItem[]
): string {
  const taskList = tasks
    .map((t) => `${t.activity} > ${t.task}`)
    .join(", ");

  const equipList = equipment.map((e) => e.name).join(", ");

  // Determine the highest-risk activity for the title
  return `You are a construction safety trainer creating a 5-minute Toolbox Talk for a field crew.

PROJECT: ${projectName}
DATE: ${date}
WEATHER: ${weather.conditions}, ${weather.temperature}°${weather.temperatureUnit}
TODAY'S ACTIVITIES: ${taskList}
EQUIPMENT: ${equipList || "Standard hand tools"}

Generate a concise, engaging Toolbox Talk in HTML format. Structure it as:

1. TITLE — A clear, attention-grabbing title tied to today's highest-risk activity.

2. WHY THIS MATTERS — One paragraph explaining why this topic is critical today, using a real-world incident or statistic.

3. KEY POINTS (3-4 bullets) — Specific, actionable safety points relevant to today's work:
   - What to watch for
   - How to protect yourself
   - What to do if something goes wrong

4. DISCUSSION QUESTIONS (2-3) — Questions the foreman can ask the crew to confirm understanding.

5. TODAY'S FOCUS — A single, memorable takeaway sentence for the day.

Format as clean HTML with:
- Use <h2> for section headers
- Use <p> for paragraphs, <ul><li> for bullet points
- Apply class "toolbox-section" to each section div
- Keep it conversational — this is spoken aloud, not a formal document
- Total read time should be approximately 5 minutes
- Reference today's specific tasks and conditions, not generic safety talk`;
}

// ============================================================
// Mock JHA output for when no API key is configured
// ============================================================

export function generateMockJHA(
  projectName: string,
  date: string,
  tasks: SelectedTask[],
  weather: WeatherConditions,
  crewSize: number
): string {
  const taskRows = tasks
    .map(
      (t, i) => `
    <tr>
      <td>${i + 1}. ${t.task}</td>
      <td>
        a) Falls from elevation<br>
        b) Struck-by falling objects<br>
        c) Caught-in/between materials
      </td>
      <td>
        a) Install guardrails, use fall arrest; inspect before each shift<br>
        b) Establish exclusion zones below; tool tethering; hard hats required<br>
        c) Lockout/tagout procedures; maintain safe clearances
      </td>
    </tr>`
    )
    .join("");

  return `
<div class="jha-document">
  <div class="jha-section">
    <h2>1. Scope of Work</h2>
    <p>Today's work at <strong>${projectName}</strong> involves ${tasks.length} task${tasks.length > 1 ? "s" : ""}. Weather conditions: ${weather.conditions}, ${weather.temperature}°${weather.temperatureUnit}. Crew size: ${crewSize} workers.</p>
    <p><em>Date: ${date}</em></p>
  </div>

  <div class="jha-section">
    <h2>2. Task Hazard Analysis</h2>
    <table class="jha-table">
      <thead>
        <tr>
          <th>Task Step</th>
          <th>Hazards Identified</th>
          <th>Control Measures</th>
        </tr>
      </thead>
      <tbody>
        ${taskRows}
      </tbody>
    </table>
  </div>

  <div class="jha-section">
    <h2>3. Weather Considerations</h2>
    <ul>
      <li><strong>${weather.conditions} conditions:</strong> ${weather.temperature > 85 ? "Monitor for heat stress. Mandatory hydration breaks every 30 minutes. Shade stations required." : weather.temperature < 40 ? "Cold stress protocols in effect. Warm-up breaks required. Monitor for frostbite on exposed skin." : "Standard weather protocols. Monitor conditions throughout the day."}</li>
      ${weather.conditions === "Rain" ? "<li><strong>Wet surfaces:</strong> Extra caution on walking surfaces. No work on elevated surfaces without non-slip measures.</li>" : ""}
      ${weather.conditions === "Wind" ? "<li><strong>High wind:</strong> Secure all loose materials. No crane operations if sustained winds exceed 25 mph.</li>" : ""}
    </ul>
  </div>

  <div class="jha-section">
    <h2>4. Required PPE</h2>
    <ul>
      <li>Hard hat (ANSI Z89.1 Type I, Class E)</li>
      <li>Safety glasses (ANSI Z87.1)</li>
      <li>High-visibility vest (ANSI/ISEA 107 Class 2)</li>
      <li>Steel-toe boots (ASTM F2413)</li>
      <li>Work gloves appropriate for task</li>
      <li>Fall protection harness (when working above 6 feet)</li>
      <li>Hearing protection (when noise exceeds 85 dB)</li>
    </ul>
  </div>

  <div class="jha-section">
    <h2>5. Emergency Procedures</h2>
    <ul>
      <li><strong>Medical emergency:</strong> Call 911, then notify superintendent immediately</li>
      <li><strong>Fire:</strong> Evacuate area, call 911, use fire extinguisher only if trained and safe</li>
      <li><strong>Severe weather:</strong> Cease all outdoor work, move to designated shelter area</li>
      <li><strong>First aid station:</strong> Located in the field trailer</li>
    </ul>
  </div>

  <p class="jha-note"><em>This JHA is a demonstration. Connect your Claude API key in Settings to generate tailored, AI-powered analysis.</em></p>
</div>`;
}

export function generateMockToolboxTalk(
  tasks: SelectedTask[],
  weather: WeatherConditions
): string {
  const primaryTask = tasks[0];
  const topicTitle = primaryTask
    ? `Working Safely: ${primaryTask.activity}`
    : "General Site Safety";

  return `
<div class="toolbox-document">
  <div class="toolbox-section">
    <h2>${topicTitle}</h2>
    <p class="toolbox-subtitle">5-Minute Safety Briefing</p>
  </div>

  <div class="toolbox-section">
    <h2>Why This Matters Today</h2>
    <p>Today we're performing ${primaryTask?.activity || "construction activities"} work. According to OSHA, ${primaryTask?.activity?.toLowerCase().includes("concrete") ? "concrete operations account for a significant number of construction injuries each year, including crush injuries, chemical burns, and fall hazards" : primaryTask?.activity?.toLowerCase().includes("steel") ? "structural steel erection is one of the highest-risk activities in construction, with falls accounting for 69% of fatalities in this trade" : "the Focus Four hazards — falls, struck-by, caught-in/between, and electrocution — account for over 60% of construction fatalities"}. Taking 5 minutes now to discuss today's hazards can prevent a life-altering injury.</p>
  </div>

  <div class="toolbox-section">
    <h2>Key Points</h2>
    <ul>
      <li><strong>Know your surroundings:</strong> Before starting work, survey your area for overhead hazards, floor openings, and energized equipment. Today's weather is ${weather.conditions.toLowerCase()} — ${weather.temperature > 85 ? "stay hydrated and watch for signs of heat exhaustion" : weather.temperature < 40 ? "watch for ice and keep extremities covered" : "standard conditions, but stay alert"}.</li>
      <li><strong>Inspect your tools and PPE:</strong> Every shift starts with a visual inspection. Check harness webbing for cuts, hard hats for cracks, and all power tools for damaged cords or guards.</li>
      <li><strong>Communicate:</strong> If you see an unsafe condition, stop work and report it. No task is so urgent that we can't take time to do it safely. Use the buddy system for high-risk tasks.</li>
      <li><strong>Follow the plan:</strong> Today's JHA outlines specific controls for each task. If conditions change from what's described, stop and reassess before continuing.</li>
    </ul>
  </div>

  <div class="toolbox-section">
    <h2>Discussion Questions</h2>
    <ul>
      <li>What is the highest-risk task you'll perform today, and what's your plan to mitigate it?</li>
      <li>Where is the nearest first aid kit and fire extinguisher to your work area?</li>
      <li>If you notice a coworker not wearing proper PPE, what should you do?</li>
    </ul>
  </div>

  <div class="toolbox-section">
    <h2>Today's Focus</h2>
    <p class="toolbox-focus"><strong>"If it doesn't feel safe, it isn't. Stop, reassess, and ask."</strong></p>
  </div>

  <p class="toolbox-note"><em>This Toolbox Talk is a demonstration. Connect your Claude API key in Settings for AI-tailored safety briefings.</em></p>
</div>`;
}
