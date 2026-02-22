const STARTED_TOPICS_KEY = "advanced-polynomial-forge-started-topics-v1";

const frameworkTopics = [
  "Difference of squares binomials (with common factors needing pulling out first)",
  "Easy trinomials with a = 1 (with common factors needing pulling out first)",
  "Harder trinomials with a not = 1 (with common factors needing pulling out first)",
  "Quartics trinomials in The Quadratic Form (e.g. 8x^4 -12x^2 - 80, with common factors needing pulling out first)"
];

const strandDefinitions = [
  {
    id: "strand-dos",
    title: "Strand 1: Difference of Squares",
    target: 10,
    prerequisite: null,
    topicIds: ["dos-gcf"]
  },
  {
    id: "strand-a1",
    title: "Strand 2: Easy Trinomials (a = 1)",
    target: 10,
    prerequisite: "strand-dos",
    topicIds: ["trinomial-a1-gcf"]
  },
  {
    id: "strand-anot1",
    title: "Strand 3: Harder Trinomials (a != 1)",
    target: 10,
    prerequisite: "strand-a1",
    topicIds: ["trinomial-anot1-gcf"]
  },
  {
    id: "strand-quartic",
    title: "Strand 4: Quartic Quadratic Form",
    target: 10,
    prerequisite: "strand-anot1",
    topicIds: ["quartic-quadratic-gcf"]
  }
];

const topicLibraryByFrameworkIndex = [
  {
    id: "dos-gcf",
    shortLabel: "Difference of squares + GCF",
    strandId: "strand-dos",
    sectionId: "section-foundations",
    strategy: {
      steps: [
        "Check for a numeric GCF in every term before anything else.",
        "After pulling out the GCF, confirm you have a binomial with two perfect squares.",
        "Apply a^2 - b^2 = (a + b)(a - b) and include the GCF out front."
      ],
      workedExampleLatex:
        "12x^2 - 75 = 3(4x^2 - 25) = 3(2x + 5)(2x - 5)"
    },
    formatHint: "Use x, parentheses, and ^ for powers. Example: 3*(2x+5)*(2x-5)",
    generator: generateDifferenceOfSquaresQuestion
  },
  {
    id: "trinomial-a1-gcf",
    shortLabel: "Easy trinomials (a=1) + GCF",
    strandId: "strand-a1",
    sectionId: "section-foundations",
    strategy: {
      steps: [
        "Pull out any GCF from all three terms first.",
        "Focus on the inside trinomial x^2 + bx + c.",
        "Find two integers that multiply to c and add to b, then build the two binomial factors."
      ],
      workedExampleLatex:
        "6x^2 + 33x + 45 = 3(2x^2 + 11x + 15) = 3(2x + 5)(x + 3)"
    },
    formatHint: "Typed form example: 4*(x+7)*(x-3)",
    generator: generateEasyTrinomialQuestion
  },
  {
    id: "trinomial-anot1-gcf",
    shortLabel: "Harder trinomials (a!=1) + GCF",
    strandId: "strand-anot1",
    sectionId: "section-advanced",
    strategy: {
      steps: [
        "Extract the GCF first so the inside trinomial is simpler.",
        "For ax^2 + bx + c, use ac to find two numbers that multiply to ac and add to b.",
        "Split the middle term, factor by grouping, then keep the GCF in front."
      ],
      workedExampleLatex:
        "8x^2 + 20x - 48 = 4(2x^2 + 5x - 12) = 4(2x - 3)(x + 4)"
    },
    formatHint: "Typed form example: 5*(3x-2)*(2x+7)",
    generator: generateHardTrinomialQuestion
  },
  {
    id: "quartic-quadratic-gcf",
    shortLabel: "Quartic quadratic form + GCF",
    strandId: "strand-quartic",
    sectionId: "section-advanced",
    strategy: {
      steps: [
        "Factor out the common numeric factor from all terms.",
        "Use substitution u = x^2 to rewrite as a trinomial in u.",
        "Factor in u, then substitute back x^2 and finish with polynomial factors."
      ],
      workedExampleLatex:
        "8x^4 - 12x^2 - 80 = 4(2x^4 - 3x^2 - 20) = 4(2x^2 + 5)(x^2 - 4) = 4(2x^2 + 5)(x + 2)(x - 2)"
    },
    formatHint: "Typed form example: 4*(2x^2+5)*(x^2-4)",
    generator: generateQuarticQuadraticFormQuestion
  }
];

const sectionDefinitions = {
  "section-foundations": {
    id: "section-foundations",
    title: "Foundations: GCF + Core Patterns"
  },
  "section-advanced": {
    id: "section-advanced",
    title: "Advanced: a != 1 and Quadratic Form"
  }
};

const curriculum = buildCurriculumTree(frameworkTopics);
const topicsById = new Map(curriculum.units.flatMap((unit) => unit.sections.flatMap((section) => section.topics.map((topic) => [topic.id, topic]))));
const strandsById = new Map(curriculum.strands.map((strand) => [strand.id, strand]));

const state = {
  selectedTopicId: null,
  currentQuestion: null,
  startedTopics: loadStartedTopics(),
  attemptedTopics: new Set(),
  topicStats: createEmptyTopicStats(),
  overall: { attempts: 0, correct: 0 }
};

const curriculumTreeEl = document.getElementById("curriculum-tree");
const strandProgressEl = document.getElementById("strand-progress");
const workspaceEl = document.getElementById("workspace");
const topicScoreEl = document.getElementById("topic-score");
const topicScoreDetailEl = document.getElementById("topic-score-detail");
const overallScoreEl = document.getElementById("overall-score");
const overallScoreDetailEl = document.getElementById("overall-score-detail");
const coverageScoreEl = document.getElementById("coverage-score");
const coverageDetailEl = document.getElementById("coverage-detail");

initializeApp();

function initializeApp() {
  renderCurriculumTree();
  renderStrandProgress();
  renderEmptyState();
  updateScoreboard();
}

function buildCurriculumTree(topicTitles) {
  const unit = {
    id: "unit-forge",
    title: "Advanced Polynomial Factoring Forge",
    sections: [
      { ...sectionDefinitions["section-foundations"], topics: [] },
      { ...sectionDefinitions["section-advanced"], topics: [] }
    ]
  };

  topicTitles.forEach((frameworkTitle, index) => {
    const topicBlueprint = topicLibraryByFrameworkIndex[index];
    if (!topicBlueprint) {
      return;
    }

    const topicRecord = {
      id: topicBlueprint.id,
      title: frameworkTitle,
      shortLabel: topicBlueprint.shortLabel,
      sectionId: topicBlueprint.sectionId,
      strandId: topicBlueprint.strandId,
      strategy: topicBlueprint.strategy,
      formatHint: topicBlueprint.formatHint,
      generator: topicBlueprint.generator
    };

    const section = unit.sections.find((entry) => entry.id === topicBlueprint.sectionId);
    section.topics.push(topicRecord);
  });

  return {
    title: "Advanced Polynomial Factoring Forge",
    units: [unit],
    strands: strandDefinitions
  };
}

function createEmptyTopicStats() {
  const stats = {};
  topicsById.forEach((_, topicId) => {
    stats[topicId] = { attempts: 0, correct: 0 };
  });
  return stats;
}

function renderCurriculumTree() {
  curriculumTreeEl.innerHTML = "";

  curriculum.units.forEach((unit) => {
    const unitWrap = document.createElement("section");

    const unitTitle = document.createElement("p");
    unitTitle.className = "unit-title";
    unitTitle.textContent = unit.title;
    unitWrap.append(unitTitle);

    unit.sections.forEach((section) => {
      const sectionTitle = document.createElement("p");
      sectionTitle.className = "section-title";
      sectionTitle.textContent = section.title;
      unitWrap.append(sectionTitle);

      const topicList = document.createElement("div");
      topicList.className = "topic-list";

      section.topics.forEach((topic, topicIndex) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "topic-button";
        button.dataset.topicId = topic.id;
        button.textContent = `${topicIndex + 1}. ${topic.shortLabel}`;

        const locked = !isStrandUnlocked(topic.strandId);
        if (locked) {
          button.classList.add("locked");
          button.title = "Sequence lock indicator: you can still practice this topic now.";
        }

        if (topic.id === state.selectedTopicId) {
          button.classList.add("active");
        }

        button.addEventListener("click", () => selectTopic(topic.id));
        topicList.append(button);
      });

      unitWrap.append(topicList);
    });

    curriculumTreeEl.append(unitWrap);
  });
}

function renderStrandProgress() {
  strandProgressEl.innerHTML = "";

  curriculum.strands.forEach((strand) => {
    const correct = getStrandCorrect(strand.id);
    const unlocked = isStrandUnlocked(strand.id);
    const prerequisite = strand.prerequisite ? strandsById.get(strand.prerequisite) : null;

    const card = document.createElement("article");
    card.className = "strand-card";

    const title = document.createElement("p");
    title.className = "strand-title";
    title.textContent = strand.title;

    const meta = document.createElement("p");
    meta.className = "strand-meta";
    meta.textContent = `${Math.min(correct, strand.target)} / ${strand.target} correct`;

    const lock = document.createElement("p");
    lock.className = `strand-lock ${unlocked ? "unlocked" : "locked"}`;
    lock.textContent = unlocked
      ? "Unlocked"
      : `Locked (need ${prerequisite.target} correct in ${prerequisite.title})`;

    const meter = document.createElement("progress");
    meter.max = strand.target;
    meter.value = Math.min(correct, strand.target);

    card.append(title, meta, lock, meter);
    strandProgressEl.append(card);
  });
}

function renderEmptyState() {
  workspaceEl.innerHTML = `
    <div class="empty-state">
      <div>
        <h2 class="card-title">Choose a topic to begin forging.</h2>
        <p class="card-subtitle">Your first visit to each topic opens a strategy refresher with a worked example.</p>
      </div>
    </div>
  `;
}

function selectTopic(topicId) {
  const topic = topicsById.get(topicId);
  if (!topic) {
    return;
  }

  state.selectedTopicId = topicId;
  renderCurriculumTree();
  updateScoreboard();

  if (!state.startedTopics.has(topicId)) {
    renderRefresher(topic);
    return;
  }

  launchQuestion(topic);
}

function renderRefresher(topic) {
  const strategyItems = topic.strategy.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("");

  workspaceEl.innerHTML = `
    <article>
      <h2 class="card-title">${escapeHtml(topic.shortLabel)}: Strategy Refresher</h2>
      <p class="card-subtitle">Follow this sequence, then start a randomized practice question.</p>

      <ol class="strategy-list">
        ${strategyItems}
      </ol>

      <div class="worked-example">
        <p class="card-subtitle"><strong>Worked example:</strong> \\(${topic.strategy.workedExampleLatex}\\)</p>
      </div>

      <div class="form-row">
        <button id="start-practice" class="primary-btn" type="button">Start Practicing</button>
      </div>
    </article>
  `;

  const startButton = document.getElementById("start-practice");
  startButton.addEventListener("click", () => {
    state.startedTopics.add(topic.id);
    saveStartedTopics(state.startedTopics);
    launchQuestion(topic);
  });

  typesetMath();
}

function launchQuestion(topic) {
  const generated = topic.generator();
  generated.expectedAst = parseExpression(generated.expectedExpr);

  state.currentQuestion = generated;
  renderQuestion(topic, generated);
}

function renderQuestion(topic, question) {
  workspaceEl.innerHTML = `
    <article>
      <h2 class="card-title">${escapeHtml(topic.shortLabel)}</h2>
      <p class="card-subtitle">Factor completely: \\(${question.promptLatex}\\)</p>

      <form id="answer-form" novalidate>
        <div class="form-row">
          <input
            id="typed-answer"
            type="text"
            autocomplete="off"
            spellcheck="false"
            aria-label="Type your factored form"
            placeholder="Type your fully factored expression"
          />
          <button class="primary-btn" id="submit-answer" type="submit">Check Answer</button>
        </div>

        <p class="format-hint">${escapeHtml(topic.formatHint)}</p>
        <div id="feedback-wrap"></div>
      </form>
    </article>
  `;

  const form = document.getElementById("answer-form");
  const input = document.getElementById("typed-answer");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = gradeTypedResponse(input.value, question);
    renderFeedback(result, question);

    if (!result.finalized) {
      return;
    }

    registerAttempt(topic.id, result.correct);

    input.disabled = true;
    document.getElementById("submit-answer").disabled = true;

    const actions = document.createElement("div");
    actions.className = "form-row";

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "secondary-btn";
    nextButton.textContent = "Next Question";
    nextButton.addEventListener("click", () => launchQuestion(topic));

    actions.append(nextButton);
    form.append(actions);

    renderStrandProgress();
    renderCurriculumTree();
    updateScoreboard();
  });

  input.focus();
  typesetMath();
}

function renderFeedback(result, question) {
  const wrap = document.getElementById("feedback-wrap");
  if (!wrap) {
    return;
  }

  const answerBlock = result.finalized
    ? `
      <p><strong>Accepted canonical form:</strong> \\(${question.canonicalLatex}\\)</p>
      <p><strong>Method note:</strong> ${escapeHtml(question.explanation)}</p>
    `
    : "";

  wrap.innerHTML = `
    <div class="feedback ${result.status}">
      <p><strong>${escapeHtml(result.headline)}</strong></p>
      <p>${escapeHtml(result.detail)}</p>
      ${answerBlock}
    </div>
  `;

  typesetMath();
}

function registerAttempt(topicId, isCorrect) {
  state.attemptedTopics.add(topicId);
  state.topicStats[topicId].attempts += 1;
  if (isCorrect) {
    state.topicStats[topicId].correct += 1;
  }

  state.overall.attempts += 1;
  if (isCorrect) {
    state.overall.correct += 1;
  }
}

function updateScoreboard() {
  if (state.selectedTopicId) {
    const selectedStats = state.topicStats[state.selectedTopicId];
    const pct = formatPercent(selectedStats.correct, selectedStats.attempts);

    topicScoreEl.textContent = `${selectedStats.correct} / ${selectedStats.attempts}`;
    topicScoreDetailEl.textContent = `${pct}% accuracy in this topic`;
  } else {
    topicScoreEl.textContent = "0 / 0";
    topicScoreDetailEl.textContent = "Pick a topic to begin.";
  }

  overallScoreEl.textContent = `${state.overall.correct} / ${state.overall.attempts}`;
  overallScoreDetailEl.textContent = `${formatPercent(state.overall.correct, state.overall.attempts)}% accuracy`;

  const totalTopics = topicsById.size;
  coverageScoreEl.textContent = `${state.attemptedTopics.size} / ${totalTopics} topics`;
  coverageDetailEl.textContent =
    state.attemptedTopics.size === totalTopics
      ? "All topics attempted."
      : "Attempt each topic at least once.";
}

function isStrandUnlocked(strandId) {
  const strand = strandsById.get(strandId);
  if (!strand) {
    return false;
  }

  if (!strand.prerequisite) {
    return true;
  }

  const prerequisite = strandsById.get(strand.prerequisite);
  const prerequisiteCorrect = getStrandCorrect(prerequisite.id);
  return prerequisiteCorrect >= prerequisite.target;
}

function getStrandCorrect(strandId) {
  const strand = strandsById.get(strandId);
  if (!strand) {
    return 0;
  }

  return strand.topicIds.reduce((sum, topicId) => sum + state.topicStats[topicId].correct, 0);
}

function generateDifferenceOfSquaresQuestion() {
  const g = pick([2, 3, 4, 5, 6, 8, 10, 12]);
  const a = pick([1, 2, 3, 4, 5, 6]);
  const b = randInt(2, 14);

  const terms = [
    { coef: g * a * a, power: 2 },
    { coef: -g * b * b, power: 0 }
  ];

  const factorA = polyExpr([
    { coef: a, power: 1 },
    { coef: b, power: 0 }
  ]);

  const factorB = polyExpr([
    { coef: a, power: 1 },
    { coef: -b, power: 0 }
  ]);

  return {
    promptLatex: polyLatex(terms),
    expectedExpr: `${g}*(${factorA})*(${factorB})`,
    canonicalLatex: `${g}\\left(${polyLatex([{ coef: a, power: 1 }, { coef: b, power: 0 }])}\\right)\\left(${polyLatex([{ coef: a, power: 1 }, { coef: -b, power: 0 }])}\\right)`,
    explanation:
      "Pull out the GCF first, then use the difference-of-squares identity a^2 - b^2 = (a+b)(a-b).",
    minFactorCount: 2
  };
}

function generateEasyTrinomialQuestion() {
  let m;
  let n;

  do {
    m = randInt(-9, 9);
    n = randInt(-9, 9);
  } while (m === 0 || n === 0 || m === -n);

  const g = pick([2, 3, 4, 5, 6, 7, 8]);
  const b = m + n;
  const c = m * n;

  const terms = [
    { coef: g, power: 2 },
    { coef: g * b, power: 1 },
    { coef: g * c, power: 0 }
  ];

  const factorA = polyExpr([
    { coef: 1, power: 1 },
    { coef: m, power: 0 }
  ]);
  const factorB = polyExpr([
    { coef: 1, power: 1 },
    { coef: n, power: 0 }
  ]);

  return {
    promptLatex: polyLatex(terms),
    expectedExpr: `${g}*(${factorA})*(${factorB})`,
    canonicalLatex: `${g}\\left(${polyLatex([{ coef: 1, power: 1 }, { coef: m, power: 0 }])}\\right)\\left(${polyLatex([{ coef: 1, power: 1 }, { coef: n, power: 0 }])}\\right)`,
    explanation:
      "After removing the GCF, find two numbers that multiply to the constant term and add to the x-coefficient.",
    minFactorCount: 2
  };
}

function generateHardTrinomialQuestion() {
  let p;
  let r;
  let q;
  let s;
  let attempts = 0;

  do {
    p = randInt(2, 6);
    r = randInt(2, 6);
    q = randInt(-9, 9);
    s = randInt(-9, 9);
    attempts += 1;
  } while (
    (q === 0 || s === 0 || gcd(p, Math.abs(q)) !== 1 || gcd(r, Math.abs(s)) !== 1 || p * s + q * r === 0) &&
    attempts < 200
  );

  const g = pick([2, 3, 4, 5, 6]);
  const terms = [
    { coef: g * p * r, power: 2 },
    { coef: g * (p * s + q * r), power: 1 },
    { coef: g * q * s, power: 0 }
  ];

  const factorA = polyExpr([
    { coef: p, power: 1 },
    { coef: q, power: 0 }
  ]);
  const factorB = polyExpr([
    { coef: r, power: 1 },
    { coef: s, power: 0 }
  ]);

  return {
    promptLatex: polyLatex(terms),
    expectedExpr: `${g}*(${factorA})*(${factorB})`,
    canonicalLatex: `${g}\\left(${polyLatex([{ coef: p, power: 1 }, { coef: q, power: 0 }])}\\right)\\left(${polyLatex([{ coef: r, power: 1 }, { coef: s, power: 0 }])}\\right)`,
    explanation:
      "Use the ac-method on the inside trinomial after extracting the GCF, then factor by grouping.",
    minFactorCount: 2
  };
}

function generateQuarticQuadraticFormQuestion() {
  let p;
  let r;
  let q;
  let s;

  do {
    p = randInt(1, 4);
    r = randInt(1, 4);
    q = randInt(-12, 12);
    s = randInt(-12, 12);
  } while (q === 0 || s === 0 || p * s + q * r === 0);

  const g = pick([2, 4, 5, 8]);

  const terms = [
    { coef: g * p * r, power: 4 },
    { coef: g * (p * s + q * r), power: 2 },
    { coef: g * q * s, power: 0 }
  ];

  const factorA = polyExpr([
    { coef: p, power: 2 },
    { coef: q, power: 0 }
  ]);
  const factorB = polyExpr([
    { coef: r, power: 2 },
    { coef: s, power: 0 }
  ]);

  return {
    promptLatex: polyLatex(terms),
    expectedExpr: `${g}*(${factorA})*(${factorB})`,
    canonicalLatex: `${g}\\left(${polyLatex([{ coef: p, power: 2 }, { coef: q, power: 0 }])}\\right)\\left(${polyLatex([{ coef: r, power: 2 }, { coef: s, power: 0 }])}\\right)`,
    explanation:
      "Let u = x^2, factor the trinomial in u after taking out the GCF, then substitute x^2 back in.",
    minFactorCount: 2
  };
}

function gradeTypedResponse(input, question) {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      status: "almost",
      headline: "No answer entered.",
      detail: "Type a complete factorization before checking.",
      finalized: false,
      correct: false
    };
  }

  let userAst;
  try {
    userAst = parseExpression(trimmed);
  } catch (error) {
    return {
      status: "almost",
      headline: "Could not parse that expression.",
      detail: "Use only numbers, x, parentheses, +, -, *, and ^ (example: 4*(x+5)*(x-3)).",
      finalized: false,
      correct: false
    };
  }

  if (!areEquivalent(userAst, question.expectedAst)) {
    return {
      status: "incorrect",
      headline: "Incorrect.",
      detail: "This does not expand to the given polynomial.",
      finalized: true,
      correct: false
    };
  }

  if (!isFactoredForm(userAst, question.minFactorCount)) {
    return {
      status: "almost",
      headline: "Equivalent, but not fully factored.",
      detail: "Rewrite your answer as a product of factors.",
      finalized: true,
      correct: false
    };
  }

  return {
    status: "correct",
    headline: "Correct.",
    detail: "Your factorization is algebraically equivalent and in factored form.",
    finalized: true,
    correct: true
  };
}

function parseExpression(input) {
  const tokens = tokenize(input);
  const rpn = toRpn(tokens);
  return rpnToAst(rpn);
}

function tokenize(input) {
  const compact = input.replace(/\s+/g, "").replace(/X/g, "x");
  if (!compact) {
    throw new Error("Empty expression");
  }

  const raw = [];
  let index = 0;

  while (index < compact.length) {
    const char = compact[index];

    if (/\d/.test(char)) {
      let digits = char;
      index += 1;
      while (index < compact.length && /\d/.test(compact[index])) {
        digits += compact[index];
        index += 1;
      }
      raw.push({ type: "number", value: Number(digits) });
      continue;
    }

    if (char === "x") {
      raw.push({ type: "var" });
      index += 1;
      continue;
    }

    if ("+-*^".includes(char)) {
      raw.push({ type: "op", value: char });
      index += 1;
      continue;
    }

    if (char === "(") {
      raw.push({ type: "lparen" });
      index += 1;
      continue;
    }

    if (char === ")") {
      raw.push({ type: "rparen" });
      index += 1;
      continue;
    }

    throw new Error(`Invalid token: ${char}`);
  }

  return insertImplicitMultiplication(raw);
}

function insertImplicitMultiplication(tokens) {
  const output = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (i > 0 && needsImplicitMultiply(tokens[i - 1], token)) {
      output.push({ type: "op", value: "*" });
    }
    output.push(token);
  }

  return output;
}

function needsImplicitMultiply(prev, next) {
  const prevCanEnd = prev.type === "number" || prev.type === "var" || prev.type === "rparen";
  const nextCanStart = next.type === "number" || next.type === "var" || next.type === "lparen";
  return prevCanEnd && nextCanStart;
}

function toRpn(tokens) {
  const output = [];
  const opStack = [];
  let previousType = "start";

  for (const token of tokens) {
    if (token.type === "number" || token.type === "var") {
      output.push(token);
      previousType = "operand";
      continue;
    }

    if (token.type === "lparen") {
      opStack.push(token);
      previousType = "lparen";
      continue;
    }

    if (token.type === "rparen") {
      while (opStack.length > 0 && opStack[opStack.length - 1].type !== "lparen") {
        output.push(opStack.pop());
      }

      if (!opStack.length || opStack[opStack.length - 1].type !== "lparen") {
        throw new Error("Mismatched parentheses");
      }

      opStack.pop();
      previousType = "operand";
      continue;
    }

    if (token.type === "op") {
      const isUnary =
        token.value === "-" &&
        (previousType === "start" || previousType === "op" || previousType === "lparen");
      const operatorToken = isUnary ? { type: "op", value: "u-" } : token;

      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1].type === "op" &&
        shouldPopOperator(opStack[opStack.length - 1].value, operatorToken.value)
      ) {
        output.push(opStack.pop());
      }

      opStack.push(operatorToken);
      previousType = "op";
      continue;
    }

    throw new Error("Unexpected token while parsing");
  }

  while (opStack.length > 0) {
    const top = opStack.pop();
    if (top.type === "lparen") {
      throw new Error("Mismatched parentheses");
    }
    output.push(top);
  }

  return output;
}

function shouldPopOperator(stackOp, incomingOp) {
  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "u-": 3,
    "^": 4
  };

  const rightAssociative = new Set(["^", "u-"]);
  if (rightAssociative.has(incomingOp)) {
    return precedence[stackOp] > precedence[incomingOp];
  }
  return precedence[stackOp] >= precedence[incomingOp];
}

function rpnToAst(rpn) {
  const stack = [];

  for (const token of rpn) {
    if (token.type === "number") {
      stack.push({ type: "num", value: token.value });
      continue;
    }

    if (token.type === "var") {
      stack.push({ type: "var" });
      continue;
    }

    if (token.type === "op" && token.value === "u-") {
      const arg = stack.pop();
      if (!arg) {
        throw new Error("Invalid unary minus usage");
      }
      stack.push({ type: "unary", op: "-", arg });
      continue;
    }

    if (token.type === "op") {
      const right = stack.pop();
      const left = stack.pop();
      if (!left || !right) {
        throw new Error("Operator missing operands");
      }

      stack.push({
        type: "bin",
        op: token.value,
        left,
        right
      });
      continue;
    }

    throw new Error("Unexpected RPN token");
  }

  if (stack.length !== 1) {
    throw new Error("Expression could not be resolved");
  }

  return stack[0];
}

function areEquivalent(leftAst, rightAst) {
  const testPoints = [-9, -7, -5, -3, -2, -1, 0, 1, 2, 3, 5, 7, 9];
  let successfulChecks = 0;

  for (const xValue of testPoints) {
    try {
      const leftValue = evaluateAst(leftAst, xValue);
      const rightValue = evaluateAst(rightAst, xValue);

      if (!Number.isFinite(leftValue) || !Number.isFinite(rightValue)) {
        continue;
      }

      if (Math.abs(leftValue - rightValue) > 1e-7) {
        return false;
      }

      successfulChecks += 1;
    } catch (error) {
      continue;
    }
  }

  return successfulChecks >= 7;
}

function evaluateAst(node, xValue) {
  if (node.type === "num") {
    return node.value;
  }

  if (node.type === "var") {
    return xValue;
  }

  if (node.type === "unary") {
    if (node.op === "-") {
      return -evaluateAst(node.arg, xValue);
    }
    throw new Error("Unknown unary operator");
  }

  if (node.type === "bin") {
    const left = evaluateAst(node.left, xValue);
    const right = evaluateAst(node.right, xValue);

    switch (node.op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "^": {
        if (!Number.isInteger(right) || right < 0 || right > 8) {
          throw new Error("Unsupported exponent");
        }
        return left ** right;
      }
      default:
        throw new Error("Unknown operator");
    }
  }

  throw new Error("Unknown node type");
}

function isFactoredForm(ast, minFactorCount) {
  const normalized = normalizeUnary(ast);
  const factors = flattenMultiplication(normalized);
  const nonConstantFactorCount = factors.filter((factor) => containsVariable(factor)).length;

  return factors.length >= minFactorCount && nonConstantFactorCount >= 2;
}

function normalizeUnary(node) {
  if (node.type === "unary" && node.op === "-") {
    return {
      type: "bin",
      op: "*",
      left: { type: "num", value: -1 },
      right: normalizeUnary(node.arg)
    };
  }

  if (node.type === "bin") {
    return {
      type: "bin",
      op: node.op,
      left: normalizeUnary(node.left),
      right: normalizeUnary(node.right)
    };
  }

  return node;
}

function flattenMultiplication(node) {
  if (node.type === "bin" && node.op === "*") {
    return [...flattenMultiplication(node.left), ...flattenMultiplication(node.right)];
  }

  return [node];
}

function containsVariable(node) {
  if (node.type === "var") {
    return true;
  }

  if (node.type === "num") {
    return false;
  }

  if (node.type === "unary") {
    return containsVariable(node.arg);
  }

  if (node.type === "bin") {
    return containsVariable(node.left) || containsVariable(node.right);
  }

  return false;
}

function polyExpr(terms) {
  const ordered = terms.filter((term) => term.coef !== 0).sort((a, b) => b.power - a.power);

  if (!ordered.length) {
    return "0";
  }

  return ordered
    .map((term, index) => {
      const sign = term.coef < 0 ? "-" : index === 0 ? "" : "+";
      const absCoef = Math.abs(term.coef);

      if (term.power === 0) {
        return `${sign}${absCoef}`;
      }

      const coefPart = absCoef === 1 ? "" : `${absCoef}*`;
      const xPart = term.power === 1 ? "x" : `x^${term.power}`;
      return `${sign}${coefPart}${xPart}`;
    })
    .join("");
}

function polyLatex(terms) {
  const ordered = terms.filter((term) => term.coef !== 0).sort((a, b) => b.power - a.power);

  if (!ordered.length) {
    return "0";
  }

  return ordered
    .map((term, index) => {
      const sign = term.coef < 0 ? (index === 0 ? "-" : " - ") : index === 0 ? "" : " + ";
      const absCoef = Math.abs(term.coef);

      let core;
      if (term.power === 0) {
        core = `${absCoef}`;
      } else {
        const coefPart = absCoef === 1 ? "" : `${absCoef}`;
        const xPart = term.power === 1 ? "x" : `x^{${term.power}}`;
        core = `${coefPart}${xPart}`;
      }

      return `${sign}${core}`;
    })
    .join("");
}

function formatPercent(correct, attempts) {
  if (!attempts) {
    return 0;
  }

  return Math.round((correct / attempts) * 100);
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);

  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
}

function pick(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadStartedTopics() {
  try {
    const raw = sessionStorage.getItem(STARTED_TOPICS_KEY);
    if (!raw) {
      return new Set();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed);
  } catch (error) {
    return new Set();
  }
}

function saveStartedTopics(startedTopics) {
  try {
    sessionStorage.setItem(STARTED_TOPICS_KEY, JSON.stringify([...startedTopics]));
  } catch (error) {
    // Storage can fail in privacy-restricted contexts; practice still works in-memory.
  }
}

function typesetMath() {
  if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
    window.MathJax.typesetPromise();
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
