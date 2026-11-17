const form = document.getElementById("waygoalForm");
const panels = [...document.querySelectorAll(".form-step")];
const sideSteps = [...document.querySelectorAll(".side-step")];
let currentStep = 0;
let currentProfile = {};
let tasks = [];

function showStep(index) {
  currentStep = index;
  panels.forEach((p, i) => p.classList.toggle("active", i === index));
  sideSteps.forEach((s, i) => s.classList.toggle("active", i === index));
  document.getElementById("backBtn").disabled = index === 0;
  document.getElementById("nextBtn").classList.toggle("hidden", index === 3);
  document.getElementById("generateBtn").classList.toggle("hidden", index !== 3);
  document.getElementById("stepCount").textContent = `Step ${index + 1} of 4`;
}
function validStep() {
  const required = [...panels[currentStep].querySelectorAll("[required]")];
  for (const field of required) {
    if (!field.value.trim()) {
      field.focus();
      field.reportValidity();
      return false;
    }
  }
  return true;
}
document.getElementById("nextBtn").addEventListener("click", () => {
  if (validStep()) showStep(Math.min(3, currentStep + 1));
});
document.getElementById("backBtn").addEventListener("click", () => showStep(Math.max(0, currentStep - 1)));
sideSteps.forEach((step, i) => step.addEventListener("click", () => {
  if (i <= currentStep || validStep()) showStep(i);
}));
document.getElementById("documents").addEventListener("change", e => {
  const files = [...e.target.files];
  document.getElementById("fileNames").textContent = files.length
    ? files.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(" · ")
    : "PDF, DOC, DOCX, JPG or PNG · Up to 10 MB per file";
});

function makeTasks(profile) {
  const goal = (profile.goal || "").toLowerCase();
  const level = profile.level || "Intermediate";
  const hours = Number(profile.hoursPerDay || 2);
  const timeFactor = hours >= 4 ? "60–90 minutes" : hours >= 2 ? "30–45 minutes" : "20–30 minutes";
  let focus = [];
  if (goal.includes("government") || goal.includes("competitive")) {
    focus = [
      ["Understand the exam pattern", "Review the official syllabus, stages, marking scheme and eligibility for your target exam."],
      ["Build core subject knowledge", "Choose one high-priority subject and study a small set of concepts with notes."],
      ["Practice quantitative aptitude", "Solve a focused set of arithmetic and reasoning questions; review every mistake."],
      ["Improve language and comprehension", "Practice reading comprehension, vocabulary and grammar based on your exam."],
      ["Take a diagnostic mock test", "Attempt a timed sectional test and record accuracy, speed and weak areas."],
      ["Revise and plan next week", "Revise your notes, revisit difficult questions and set next week's priorities."]
    ];
  } else if (goal.includes("placement") || goal.includes("internship")) {
    focus = [
      ["Strengthen programming fundamentals", "Revise one core programming concept and solve beginner-to-intermediate problems."],
      ["Practice data structures and algorithms", "Work on arrays, strings or linked lists and explain your approach."],
      ["Build aptitude and reasoning", "Practice quantitative aptitude, logical reasoning and timed questions."],
      ["Develop a project", "Choose a small project, define its features and implement one working part."],
      ["Prepare your resume and profile", "Update project descriptions, skills and professional profile with truthful details."],
      ["Mock interview and review", "Practice explaining your project and solve a timed coding or aptitude set."]
    ];
  } else if (goal.includes("higher")) {
    focus = [
      ["Research target programs", "List suitable universities, eligibility, application windows and required tests."],
      ["Build subject foundations", "Study one core subject related to your intended program."],
      ["Prepare for required tests", "Identify test sections and practice a short diagnostic set."],
      ["Develop your academic profile", "Document projects, achievements and relevant learning experiences."],
      ["Draft application materials", "Create an initial statement of purpose or academic goals outline."],
      ["Review requirements and progress", "Check deadlines, identify gaps and plan the next preparation cycle."]
    ];
  } else if (goal.includes("skill")) {
    focus = [
      ["Choose one priority skill", "Break your target skill into beginner topics and define a small learning outcome."],
      ["Learn the fundamentals", "Use your preferred learning format and make concise notes."],
      ["Practice with guided exercises", "Complete practical exercises and save your work."],
      ["Build a mini project", "Apply the concepts by creating a small, demonstrable project."],
      ["Review and improve", "Identify errors, revisit weak topics and improve your project."],
      ["Share your work and plan next steps", "Document what you built and choose the next skill milestone."]
    ];
  } else {
    focus = [
      ["Clarify your target outcome", "Break your goal into measurable milestones and list the knowledge it requires."],
      ["Build the foundations", "Study the most important beginner concepts for your chosen target."],
      ["Practice consistently", "Complete exercises that apply what you learned."],
      ["Work on a practical activity", "Create a small project or task that demonstrates your learning."],
      ["Review your progress", "Check what is working, what is difficult and what needs more time."],
      ["Set next week's priorities", "Choose the next topics and adjust your schedule realistically."]
    ];
  }
  return focus.map((item, i) => ({
    title: item[0],
    description: `${item[1]} Suggested daily focus: ${timeFactor}.`,
    tag: `WEEK ${i + 1}`,
    done: false
  }));
}

function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  document.getElementById("progressPercent").textContent = `${pct}%`;
  document.getElementById("progressBar").style.width = `${pct}%`;
  document.getElementById("progressCircle").style.background = `conic-gradient(#8b5cf6 ${pct * 3.6}deg,#29345b 0deg)`;
  document.getElementById("progressText").textContent = `${done} of ${tasks.length} weekly focus areas completed.`;
}
function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  tasks.forEach((task, index) => {
    const row = document.createElement("label");
    row.className = `task ${task.done ? "done" : ""}`;
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      tasks[index].done = checkbox.checked;
      row.classList.toggle("done", checkbox.checked);
      updateProgress();
    });
    const content = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = task.title;
    const desc = document.createElement("p");
    desc.textContent = task.description;
    content.append(title, desc);
    const tag = document.createElement("span");
    tag.className = "task-tag";
    tag.textContent = task.tag;
    row.append(checkbox, content, tag);
    list.appendChild(row);
  });
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!validStep()) return;
  const data = new FormData(form);
  currentProfile = Object.fromEntries(data.entries());
  const fileInput = document.getElementById("documents");
  try {
    const response = await fetch("/api/profile", {
      method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify(currentProfile)
    });
    if (!response.ok) throw new Error("Could not save profile");
    if (fileInput.files.length) {
      const uploads = new FormData();
      [...fileInput.files].forEach(file => uploads.append("documents", file));
      const uploadResponse = await fetch("/api/uploads", {method:"POST", body:uploads});
      if (!uploadResponse.ok) throw new Error("Profile saved, but document upload failed. Check file type and size.");
    }
  } catch (err) {
    alert(`${err.message}. Make sure the WayGoal server is running.`);
    return;
  }
  tasks = makeTasks(currentProfile);
  renderTasks();
  document.getElementById("welcomeTitle").textContent = `Your roadmap, ${currentProfile.name.split(" ")[0]}, starts here.`;
  document.getElementById("welcomeSub").textContent = `A starter plan for ${currentProfile.target || currentProfile.goal}. Adjust it as you make progress.`;
  document.getElementById("statHours").textContent = `${currentProfile.hoursPerDay} hrs/day`;
  document.getElementById("statDuration").textContent = currentProfile.duration || "3 months";
  document.getElementById("statGoal").textContent = currentProfile.goal;
  document.getElementById("heroGoal").textContent = currentProfile.target || currentProfile.goal;
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("dashboard").scrollIntoView({behavior:"smooth"});
  updateProgress();
});
document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("setup").scrollIntoView({behavior:"smooth"});
  showStep(0);
});
document.getElementById("resetProgress").addEventListener("click", () => {
  tasks.forEach(t => t.done = false);
  renderTasks(); updateProgress();
});
