import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WebSchool API",
      version: "1.0.0",
      description: "API documentation for WebSchool backend",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "User's unique ID",
            },
            username: {
              type: "string",
              description: "User's username",
            },
            name: {
              type: "string",
              description: "User's first name",
            },
            surname: {
              type: "string",
              description: "User's last name",
            },
            roleId: {
              type: "integer",
              description: "User's role (1 = student, 2 = parent, 3 = teacher)",
            },
            classroomId: {
              type: "string",
              description: "ID of user's classroom (if any)",
            },
          },
        },
        Game: {
          type: "object",
          required: ["id", "name"],
          properties: {
            id: {
              type: "string",
              description: "The game's unique identifier",
            },
            name: {
              type: "string",
              description: "The name of the game",
            },
          },
        },
        TeacherInfo: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Info's unique ID",
            },
            userId: {
              type: "string",
              description: "Teacher's user ID",
            },
            tagsId: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of tag IDs",
            },
            aboutTeacher: {
              type: "string",
              description: "About the teacher",
            },
            canHelpWith: {
              type: "string",
              description: "What the teacher can help with",
            },
            resume: {
              type: "string",
              description: "Teacher's resume",
            },
          },
        },
        Tag: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Tag's unique ID",
            },
            name: {
              type: "string",
              description: "Tag name",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Auth",
        description: "Authentication endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Classrooms",
        description: "Classroom management endpoints",
      },
      {
        name: "Games",
        description: "Game management endpoints",
      },
      {
        name: "Leaderboard",
        description: "Leaderboard management endpoints",
      },
      {
        name: "Tags",
        description: "Tag management endpoints",
      },
      {
        name: "TeacherInfo",
        description: "Teacher information management endpoints",
      },
      {
        name: "Parent",
        description: "Parent-child relationship management endpoints",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);
