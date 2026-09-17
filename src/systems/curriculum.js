// The full-stack curriculum graph.
// Each lesson lists the lesson id(s) it requires to be completed before it unlocks.
// A lesson with an empty "requires" array is available from the start.

export const CURRICULUM = {
    "responsive-web-design": { track: "frontend", order: 1, requires: [] },
    "javascript": { track: "frontend", order: 2, requires: ["responsive-web-design"] },
    "frontend-libraries": { track: "frontend", order: 3, requires: ["javascript"] },

    "python": { track: "backend", order: 1, requires: [] },
    "relational-databases": { track: "backend", order: 2, requires: ["python"] },
    "backend-apis": { track: "backend", order: 3, requires: ["relational-databases"] },

    "fullstack-exam": {
        track: "capstone",
        order: 1,
        requires: ["frontend-libraries", "backend-apis"],
    },
};

export const TRACKS = [
    {
        id: "frontend",
        title: "Frontend Development",
        lessons: ["responsive-web-design", "javascript", "frontend-libraries"],
    },
    {
        id: "backend",
        title: "Backend Development",
        lessons: ["python", "relational-databases", "backend-apis"],
    },
];

export const CAPSTONE_LESSON = "fullstack-exam";

export const LESSON_DISPLAY_NAMES = {
    "responsive-web-design": "Responsive Web Design",
    "javascript": "JavaScript",
    "frontend-libraries": "Frontend Libraries",
    "python": "Python",
    "relational-databases": "Relational Databases",
    "backend-apis": "Backend & APIs",
    "fullstack-exam": "Full-Stack Exam",
};
