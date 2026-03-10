// brownSteps.js — Brown Executive Function/Attention Scales (Adult Self-Report)

export const OPTIONS = [
  { label: "N", full: "No Problem",     score: 0 },
  { label: "L", full: "Little Problem", score: 1 },
  { label: "M", full: "Medium Problem", score: 2 },
  { label: "B", full: "Big Problem",    score: 3 },
];

export const QUESTIONS = [
  { key: "q1",  text: "I have trouble getting started on projects, assignments, or other tasks." },
  { key: "q2",  text: "I get restless and fidgety when I have to sit still or wait in line." },
  { key: "q3",  text: "I need to be reminded to keep working or to pay attention." },
  { key: "q4",  text: "Unless I'm doing something I enjoy, I feel sleepy or tired during the day, even after a full night of sleep." },
  { key: "q5",  text: "I have a hard time following instructions, especially when I have more than one thing to do at the same time." },
  { key: "q6",  text: "I feel excessively stressed or anxious in situations that should be manageable for me." },
  { key: "q7",  text: "I have trouble switching from one activity to another." },
  { key: "q8",  text: "I am easily distracted by background noises or other things going on around me." },
  { key: "q9",  text: "It's difficult for me to take notes and keep listening to what else is being said." },
  { key: "q10", text: "I need extra time to finish my assignments or projects." },
  { key: "q11", text: "If I think of something to say during a conversation, I interrupt others to say it before I forget it." },
  { key: "q12", text: "I worry too much about things that could go wrong and what others might be thinking about me." },
  { key: "q13", text: "I remember some of the details in assigned reading but have trouble understanding the main points." },
  { key: "q14", text: "I don't notice when I may be boring, confusing, or irritating others." },
  { key: "q15", text: "I tend to forget to bring—or often misplace—things I need, such as phone, keys, wallet, or purse." },
  { key: "q16", text: "If I can't understand something right away, I stop trying." },
  { key: "q17", text: "I find it hard to focus on one thing for a long time unless it's something I'm really interested in." },
  { key: "q18", text: "It's difficult for me to wake up, get myself out of bed, and get started in the morning." },
  { key: "q19", text: "I get frustrated and irritable over little things." },
  { key: "q20", text: "I get restless and fidget with my fingers, hair, clothing, or jewelry too much." },
  { key: "q21", text: "My work is inconsistent; sometimes it's good, sometimes it's not." },
  { key: "q22", text: "When writing or talking, it's easy for me to wander off on some detail and forget the main thing I am trying to say." },
  { key: "q23", text: "I get overly sensitive or defensive when someone teases or criticizes me." },
  { key: "q24", text: "When working on projects or doing assignments, I tend to do them too quickly and make careless mistakes." },
  { key: "q25", text: "I have trouble organizing my work and doing the most important things first without wasting time." },
  { key: "q26", text: "I tend to forget a lot of what I have just heard in conversations." },
  { key: "q27", text: "I spend too much time on little details trying to make my work perfect." },
  { key: "q28", text: "I tend to be disorganized and forget due dates for projects, assignments, or bills." },
  { key: "q29", text: "I have trouble getting to sleep at night because I can't stop thinking about different things." },
  { key: "q30", text: "When writing, I put in—or leave out—letters or words without meaning to." },
  { key: "q31", text: "I do or say things without thinking and often regret my actions later." },
  { key: "q32", text: "I need to hear or read instructions several times before I understand them." },
  { key: "q33", text: "It's hard for me to wait to say, get, or do something." },
  { key: "q34", text: "It takes me a long time to answer questions." },
  { key: "q35", text: "I need to be reminded to get started or to keep working on tasks that need to be done." },
  { key: "q36", text: "I talk a lot and do not seem to know when to stop." },
  { key: "q37", text: "I overreact when I'm angry, even to small things." },
  { key: "q38", text: "I have trouble memorizing things like names and dates." },
  { key: "q39", text: "It's hard for me to focus on a task unless it's interesting or I'm working with someone else." },
  { key: "q40", text: "My work is rushed, incomplete, or late because I don't plan enough time to do things well." },
  { key: "q41", text: "I have a hard time understanding and remembering directions or instructions." },
  { key: "q42", text: "I lose focus easily when I have to listen to or read something that isn't very interesting." },
  { key: "q43", text: "I get so nervous in school or at work that I have trouble remembering things I thought I knew." },
  { key: "q44", text: "I wait until the last minute to do things." },
  { key: "q45", text: "I get stuck doing one thing and have a hard time switching to something else that is more important." },
  { key: "q46", text: "I have trouble finishing routine tasks that don't interest me." },
  { key: "q47", text: "Because I speak too quickly or keep changing topics while talking, others have trouble understanding me." },
  { key: "q48", text: "I feel sad or depressed and think that things may never get better." },
  { key: "q49", text: "It is hard for me to stop doing things I like to do, like watching TV or playing games, even when I know I should." },
  { key: "q50", text: "I try to pay attention in conversations, but my mind wanders and I miss out on important information." },
  { key: "q51", text: "I have a hard time controlling my temper." },
  { key: "q52", text: "When I'm writing, I may have good ideas, but it takes me a very long time to put them into sentences and paragraphs." },
  { key: "q53", text: "I have excessive difficulty starting tasks I should do, like running errands and paying bills, unless the task is interesting." },
  { key: "q54", text: "I am quick to jump to conclusions and interrupt others when they are in the middle of doing or saying something." },
  { key: "q55", text: "Soon after starting a project or assignment, I get bored and don't want to finish it." },
  { key: "q56", text: "When I'm reading something that isn't very interesting, I have to read it more than once to remember it." },
  { key: "q57", text: "I plan to do things but forget about them (like running errands or paying bills)." },
];

// Steps: info → Q1–Q57 (grouped 5 per page) → thankyou
// We'll do 6 questions per step for a reasonable UX (10 pages of ~6 = ~57)
export const QUESTIONS_PER_STEP = 6;

export function buildSteps() {
  const steps = [{ type: "info" }];
  for (let i = 0; i < QUESTIONS.length; i += QUESTIONS_PER_STEP) {
    steps.push({ type: "questions", questions: QUESTIONS.slice(i, i + QUESTIONS_PER_STEP), startIndex: i });
  }
  steps.push({ type: "thankyou" });
  return steps;
}

export const STEPS = buildSteps();
export const TOTAL_STEPS   = STEPS.length;
export const THANKYOU_STEP = STEPS.findIndex(s => s.type === "thankyou");
