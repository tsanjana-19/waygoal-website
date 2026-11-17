
const API_URL = "https://waygoal-website.onrender.com";

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

document.getElementById("backBtn").addEventListener("click", () => {
  showStep(Math.max(0, currentStep - 1));
});

sideSteps.forEach((step, i) => {
  step.addEventListener("click", () => {
    if (i <= currentStep) {
      showStep(i);
    } else if (validStep()) {
      showStep(currentStep + 1);
    }
  });
});

document.getElementById("documents").addEventListener("change", e => {
  const files = [...e.target.files];

  document.getElementById("fileNames").textContent = files.length
    ? files.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`).join(" · ")
    : "PDF, DOC, DOCX, JPG or PNG · Up to 10 MB per file";
});

// DATE HELPERS

function localDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDate(value) {
  if (!value) return null;

  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function addDays(date, count) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}

function formatDate(value) {
  const date = parseDate(value);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

// SCHEDULE PERSONALIZATION

function weekendStudyHours(profile) {
  const choice = profile.weekendHours || "Same as weekdays";

  if (choice === "Same as weekdays") {
    return Number(profile.hoursPerDay || 2);
  }

  if (choice === "1–2 hours") return 1.5;
  if (choice === "3–4 hours") return 3.5;
  if (choice === "5+ hours") return 5;

  return 0;
}

function studyHoursOn(date, profile) {
  const day = date.getDay();
  const weekend = day === 0 || day === 6;

  if (weekend) {
    return weekendStudyHours(profile);
  }

  return Number(profile.hoursPerDay || 2);
}

function isStudyDay(date, profile) {
  const day = date.getDay();
  const choice = profile.availableDays || "Monday–Friday";

  if (choice === "Monday–Friday") return day >= 1 && day <= 5;
  if (choice === "Monday–Saturday") return day >= 1 && day <= 6;
  if (choice === "Weekends only") return day === 0 || day === 6;

  return true;
}

function getPlanEndDate(profile, start) {
  if (profile.targetDate) {
    const target = parseDate(profile.targetDate);

    if (target < start) {
      throw new Error("Your target date is in the past. Please choose a future date.");
    }

    return target;
  }

  const duration = profile.duration || "3 months";

  const days = {
    "1 month": 30,
    "3 months": 90,
    "6 months": 180,
    "Until target date": 90
  };

  return addDays(start, days[duration] || 90);
}

function getStudyDates(profile, start = todayDate(), requiredCount = null) {
  const dates = [];
  const end = requiredCount
    ? addDays(start, Math.max(30, requiredCount * 3))
    : getPlanEndDate(profile, start);

  for (let date = new Date(start); date <= end; date = addDays(date, 1)) {
    if (isStudyDay(date, profile) && studyHoursOn(date, profile) > 0) {
      dates.push(localDate(date));
    }

    if (requiredCount && dates.length >= requiredCount) break;
  }

  return dates;
}

// LEARNING STYLE

function learningInstructions(profile) {
  const style = profile.learningStyle || "Combination of all";

  if (style === "Video lessons") {
    return "Watch a focused video lesson, write down key points and complete a practical exercise.";
  }

  if (style === "Notes and reading") {
    return "Read the relevant material, prepare short notes and answer practice questions.";
  }

  if (style === "Hands-on practice") {
    return "Start with a practical exercise and learn the concepts while completing it.";
  }

  return "Combine a short lesson, concise notes and hands-on practice.";
}

function timePlan(hours) {
  const minutes = Math.round(hours * 60);
  const learning = Math.round(minutes * 0.3);
  const practice = Math.round(minutes * 0.55);
  const revision = minutes - learning - practice;

  return `${learning} min learning, ${practice} min practice and ${revision} min revision.`;
}

// GOAL-SPECIFIC TASKS

function getTaskLibrary(profile) {
  const goal = (profile.goal || "").toLowerCase();
  const target = profile.target || profile.exam || profile.goal;
  const exam = profile.exam || target;
  const organization = profile.targetOrganization || "your target organization";

  if (goal.includes("government") || goal.includes("competitive")) {
    return [
      ["Understand the exam pattern", `Study the syllabus, eligibility, exam stages and marking scheme for ${exam}.`],
      ["Build quantitative aptitude", "Study arithmetic fundamentals and solve topic-wise questions."],
      ["Improve logical reasoning", "Practice series, analogy, coding-decoding and other relevant reasoning topics."],
      ["Strengthen language skills", "Practice grammar, vocabulary and reading comprehension."],
      ["Study general awareness", "Learn important static GK topics and prepare current-affairs notes."],
      ["Practice your weakest subject", "Spend extra time on the subject in which you make the most mistakes."],
      ["Solve previous-year questions", `Attempt previous-year questions for ${exam} and analyse the answer patterns.`],
      ["Take a timed sectional test", "Attempt a timed test and record your accuracy and completion time."],
      ["Revise important concepts", "Revise your notes, formulas and frequently incorrect questions."],
      ["Improve speed and accuracy", "Solve a timed practice set and compare your performance with earlier attempts."],
      ["Attempt a full mock test", "Complete a mock test under realistic examination conditions."],
      ["Analyse mock-test performance", "Identify weak chapters and prepare a list of topics to improve."]
    ];
  }

  if (goal.includes("placement") || goal.includes("internship")) {
    return [
      ["Assess your existing technical skills", "List your programming languages, tools and concepts. Identify the gaps required for your target role."],
      ["Strengthen programming fundamentals", "Revise variables, loops, functions, arrays and basic problem-solving."],
      ["Practice data structures", "Study arrays, strings, linked lists, stacks or queues according to your level."],
      ["Solve coding problems", "Complete coding questions and explain your approach and time complexity."],
      ["Learn database concepts", "Practice SQL queries, joins, filtering and database fundamentals."],
      ["Revise computer science subjects", "Study operating systems, DBMS, computer networks and OOP concepts."],
      ["Build a practical project", "Implement a feature of a project related to your target role."],
      ["Improve aptitude and reasoning", "Practice quantitative aptitude, logical reasoning and timed questions."],
      ["Prepare your resume", "Improve your skills, project descriptions and achievements using accurate information."],
      ["Research target companies", `Study the job requirements and selection process at ${organization}.`],
      ["Practice technical interview questions", "Explain your projects and answer technical questions aloud."],
      ["Take a mock placement test", "Attempt a coding, aptitude and interview practice session."]
    ];
  }

  if (goal.includes("higher")) {
    return [
      ["Research target institutions", `Explore suitable courses, eligibility and admission requirements at ${organization}.`],
      ["Understand entrance examination requirements", "Identify required exams, syllabus, sections and important dates."],
      ["Strengthen subject fundamentals", "Study an important subject related to your intended higher-studies program."],
      ["Practice entrance questions", "Solve questions from the relevant entrance examination syllabus."],
      ["Explore academic resources", "Read recommended textbooks, research articles or subject-specific material."],
      ["Develop your academic profile", "Organise projects, certificates, achievements and academic work."],
      ["Prepare application materials", "Create an initial statement of purpose or academic goals outline."],
      ["Identify knowledge gaps", "Review your weak topics and prepare a focused improvement plan."],
      ["Attempt a practice test", "Take a timed test related to your target entrance examination."],
      ["Review application requirements", "Check eligibility, documents, recommendations and admission deadlines."]
    ];
  }

  if (goal.includes("skill")) {
    return [
      [`Understand ${target}`, "Identify the important concepts and skills required to reach your target."],
      ["Learn the fundamentals", "Start with the basic concepts and understand how they are used."],
      ["Complete guided exercises", "Follow a practical tutorial and reproduce the examples yourself."],
      ["Practice independently", "Complete exercises without relying entirely on tutorials."],
      ["Explore intermediate concepts", "Move beyond the basics and study more advanced features."],
      ["Build a mini project", "Create a small project that demonstrates what you have learned."],
      ["Review your mistakes", "Identify errors and revisit the concepts you find difficult."],
      ["Improve your project", "Add a feature and improve the quality of your work."],
      ["Test your knowledge", "Complete a practical assessment without referring to notes."],
      ["Document your learning", "Organise your work and identify the next skill milestone."]
    ];
  }

  if (goal.includes("entrepreneur")) {
    return [
      ["Define the problem", "Clearly identify the problem your venture wants to solve."],
      ["Understand your target users", "Identify your customer segment and prepare a user persona."],
      ["Research existing solutions", "Study competitors, alternatives and gaps in the market."],
      ["Validate your idea", "Speak to potential users and collect feedback about the problem."],
      ["Define your value proposition", "Explain why customers would choose your solution."],
      ["Plan your minimum viable product", "Choose the essential features for your first version."],
      ["Develop your prototype", "Build or improve one important feature of your solution."],
      ["Collect user feedback", "Show the prototype to potential users and record suggestions."],
      ["Plan your revenue model", "Evaluate pricing, costs and possible revenue sources."],
      ["Prepare your venture presentation", "Explain the problem, solution, market and business model."]
    ];
  }

  return [
    ["Clarify your target", `Define exactly what you want to achieve: ${target}.`],
    ["Identify the required knowledge", "List the concepts, skills and resources needed for your goal."],
    ["Build the foundations", "Study the most important beginner concepts for your target."],
    ["Complete practical exercises", "Apply what you learned through focused practice."],
    ["Work on a small milestone", "Complete one practical activity that moves you closer to your goal."],
    ["Review your difficult topics", "Spend additional time on the areas where you need support."],
    ["Apply your knowledge", "Complete a practical task using the concepts you have learned."],
    ["Measure your progress", "Compare your current performance with your starting point."],
    ["Improve your weak areas", "Revise concepts that are preventing you from progressing."],
    ["Complete a milestone assessment", "Test your knowledge and record what you still need to learn."]
  ];
}

// DAILY ROADMAP GENERATOR

function makeTasks(profile) {
  const start = todayDate();
  const dates = getStudyDates(profile, start);

  if (!dates.length) {
    throw new Error("No study days are available before your target date. Please check your schedule.");
  }

  const library = getTaskLibrary(profile);
  const skills = profile.skills || "";
  const difficulties = profile.difficulties || "";
  const studyTime = profile.studyTime || "Flexible";
  const level = profile.level || "Intermediate";
  const academicInfo = [
    profile.degree,
    profile.department,
    profile.year,
    profile.semester ? `Semester ${profile.semester}` : ""
  ].filter(Boolean).join(", ");

  return dates.map((date, index) => {
    const dayNumber = index + 1;
    const hours = studyHoursOn(parseDate(date), profile);

    let item;

    if (dayNumber % 14 === 0) {
      item = [
        "Progress assessment",
        "Complete a timed assessment, measure your improvement and identify the next areas to strengthen."
      ];
    } else if (dayNumber % 7 === 0) {
      item = [
        "Weekly revision and progress review",
        "Review the week's work, revise important concepts and adjust your next week's priorities."
      ];
    } else {
      item = library[(dayNumber - 1) % library.length];
    }

    const details = [
      item[1],
      `Learning approach: ${learningInstructions(profile)}`,
      `Suggested time: ${timePlan(hours)} Total: ${hours} hours.`,
      `Preferred study time: ${studyTime}.`
    ];

    if (profile.collegeHours) {
      details.push(`Plan around your college/work hours: ${profile.collegeHours}.`);
    }

    if (dayNumber === 1) {
      if (academicInfo) {
        details.push(`Academic context considered: ${academicInfo}.`);
      }

      if (profile.cgpa) {
        details.push(`Your current CGPA is ${profile.cgpa}; keep your semester academic work balanced with this preparation.`);
      }

      if (skills) {
        details.push(`Your existing skills (${skills}) should be used as a starting point. Focus on building from what you already know.`);
      }

      if (Number(profile.backlogs) > 0) {
        details.push(`You reported ${profile.backlogs} active backlog(s). Identify those subjects and reserve separate revision time for them.`);
      }

      if (profile.commitments) {
        details.push(`Other commitments to consider: ${profile.commitments}.`);
      }

      if (profile.uploadedDocuments?.length) {
        details.push("Academic documents were uploaded. This prototype stores them but does not yet extract exam dates or deadlines from their contents. Review them and add important dates to your calendar.");
      }

      if (profile.notes) {
        details.push(`Additional instructions: ${profile.notes}`);
      }
    }

    if (difficulties && dayNumber % 5 === 0) {
      details.push(`Give extra attention to your difficult topics: ${difficulties}.`);
    }

    if (dayNumber % 7 === 0 && profile.revision) {
      details.push(`Your revision preference is ${profile.revision}. Follow it while reviewing this week's progress.`);
    }

    if (dayNumber % 7 === 0 && profile.secondaryGoal) {
      details.push(`Also check your secondary goal: ${profile.secondaryGoal}.`);
    }

    return {
      title: item[0],
      description: details.join(" "),
      tag: `DAY ${dayNumber} · ${formatDate(date)}`,
      date,
      dayNumber,
      hours,
      done: false
    };
  });
}

// PROGRESS TRACKING

function updateProgress() {
  const done = tasks.filter(t => t.done).length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;

  document.getElementById("progressPercent").textContent = `${pct}%`;
  document.getElementById("progressBar").style.width = `${pct}%`;
  document.getElementById("progressCircle").style.background =
    `conic-gradient(#8b5cf6 ${pct * 3.6}deg,#29345b 0deg)`;

  document.getElementById("progressText").textContent =
    `${done} of ${tasks.length} daily tasks completed.`;
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

// RESCHEDULE UNFINISHED TASKS

function addRescheduleButton() {
  const heading = document.querySelector(".roadmap-title");

  if (!heading || document.getElementById("rescheduleBtn")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.id = "rescheduleBtn";
  button.className = "outline-btn";
  button.textContent = "Reschedule unfinished tasks";

  button.addEventListener("click", reschedulePendingTasks);
  heading.appendChild(button);
}

function reschedulePendingTasks() {
  const pending = tasks.filter(task => !task.done);

  if (!pending.length) {
    alert("All your tasks are completed!");
    return;
  }

  const dates = getStudyDates(currentProfile, todayDate(), pending.length);

  if (dates.length < pending.length) {
    alert("Could not find enough available study days to reschedule.");
    return;
  }

  pending.forEach((task, index) => {
    task.date = dates[index];
    task.tag = `DAY ${task.dayNumber} · ${formatDate(dates[index])}`;
  });

  renderTasks();
  updateProgress();

  alert("Your unfinished tasks have been rescheduled.");
}

// GENERATE ROADMAP AND SAVE PROFILE

form.addEventListener("submit", async e => {
  e.preventDefault();

  if (!validStep()) return;

  const data = new FormData(form);
  const fileInput = document.getElementById("documents");
  const files = [...fileInput.files];

  currentProfile = Object.fromEntries(
    [...data.entries()].filter(([key]) => key !== "documents")
  );

  currentProfile.uploadedDocuments = files.map(file => file.name);

  try {
    tasks = makeTasks(currentProfile);
  } catch (err) {
    alert(err.message);
    return;
  }

  const generateBtn = document.getElementById("generateBtn");
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating your roadmap...";

  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentProfile)
    });

    if (!response.ok) {
      throw new Error("Could not save your profile.");
    }

    if (files.length) {
      const uploads = new FormData();

      files.forEach(file => uploads.append("documents", file));

      const uploadResponse = await fetch(`${API_URL}/api/uploads`, {
        method: "POST",
        body: uploads
      });

      if (!uploadResponse.ok) {
        throw new Error("Profile saved, but document upload failed. Check file type and size.");
      }
    }

    renderTasks();
    addRescheduleButton();

    const firstName = (currentProfile.name || "there").trim().split(/\s+/)[0];

    document.getElementById("welcomeTitle").textContent =
      `Your roadmap, ${firstName}, starts here.`;

    const target = currentProfile.target || currentProfile.goal;
    const deadline = currentProfile.targetDate
      ? ` Your target date is ${formatDate(currentProfile.targetDate)}.`
      : "";

    document.getElementById("welcomeSub").textContent =
      `Your daily plan for ${target}, based on your skills, preparation level and available schedule.${deadline}`;

    document.getElementById("statHours").textContent =
      `${currentProfile.hoursPerDay} hrs/day`;

    document.getElementById("statDuration").textContent =
      currentProfile.targetDate
        ? `Until ${formatDate(currentProfile.targetDate)}`
        : currentProfile.duration;

    document.getElementById("statGoal").textContent = currentProfile.goal;
    document.getElementById("heroGoal").textContent = target;

    document.querySelector(".roadmap-title h3").textContent =
      "Your day-by-day roadmap";

    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("dashboard").scrollIntoView({ behavior: "smooth" });

    document.querySelector(".disclaimer").textContent =
      "This roadmap uses a personalized rule-based planning system. Uploaded academic documents are stored but their contents are not yet automatically extracted. Review the plan and adjust it as your progress or schedule changes.";

    updateProgress();

  } catch (err) {
    alert(`${err.message} Please check your internet connection and WayGoal server.`);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate my roadmap ✦";
  }
});

// EDIT INPUTS

document.getElementById("editBtn").addEventListener("click", () => {
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("setup").scrollIntoView({ behavior: "smooth" });
  showStep(0);
});

// RESET PROGRESS

document.getElementById("resetProgress").addEventListener("click", () => {
  tasks.forEach(task => task.done = false);
  renderTasks();
  updateProgress();
});
